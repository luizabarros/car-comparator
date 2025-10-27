import { Builder, By, until, WebDriver, Key } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { RobotsChecker } from './robots-checker';
import { RateLimiter } from './rate-limiter';
import { Anonymizer } from '../utils/anonymizer';
import { ProxyManager, ProxyConfig } from './proxy-manager';

const SELENIUM_URL = process.env.SELENIUM_URL || 'http://selenium:4444/wd/hub';

export class SeleniumScraper {
  private driver: WebDriver;
  private proxyManager: ProxyManager;
  private proxyUrl?: string;

  constructor(proxyConfig?: ProxyConfig) {
    const defaultConfig: ProxyConfig = {
      proxies: [],
      rotationStrategy: 'round-robin',
      maxRetries: 3,
      timeout: 20000,
      pageLoadTimeout: 25000,
      navigationWait: 'networkidle2',
      healthCheck: true,
    };

    this.proxyManager = new ProxyManager(proxyConfig ?? defaultConfig);
    this.proxyUrl = this.proxyManager.getCurrentProxy() || undefined;

    this.driver = this.createDriver();
  }

  private createDriver(): WebDriver {
    const options = new chrome.Options();

    options.addArguments('--headless=new');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--disable-extensions');
    options.addArguments('--lang=pt-BR');
    options.addArguments('--window-size=1366,768');
    options.addArguments('--disable-blink-features=AutomationControlled');

    options.addArguments(
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    if (this.proxyUrl) {
      console.log(`Using proxy: ${this.proxyUrl}`);
      options.addArguments(`--proxy-server=${this.proxyUrl}`);
    }

    const driver = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .usingServer(SELENIUM_URL)
      .build();

    driver.manage().setTimeouts({
      pageLoad: 25000,
      implicit: 6000
    });

    // full stealth patch
    driver.executeScript(`
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt'] });
      Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
    `);

    return driver;
  }

  private async sessionWarmup(searchTerm: string) {
    try {
      console.log('🔥 Session warming via Google...');
      await this.driver.get('https://www.google.com.br');
      await this.driver.wait(until.elementLocated(By.name('q')), 8000);

      const searchBox = await this.driver.findElement(By.name('q'));
      await searchBox.sendKeys(`${searchTerm} ficha técnica`, Key.ENTER);

      await this.delay(2000 + Math.random() * 2000);

      const links = await this.driver.findElements(By.css('a'));
      const validLinks = await Promise.all(links.map(async (l: any) => {
        try {
          const href = await l.getAttribute('href');
          return href && href.startsWith('http') ? l : null;
        } catch { return null; }
      }));

      const filtered = validLinks.filter(Boolean);
      if (filtered.length > 0) {
        const link = filtered[Math.floor(Math.random() * filtered.length)]!;
        await link.click();
        await this.delay(2000 + Math.random() * 3000);
        console.log('✅ Session warm!');
      }
    } catch (err) {
      console.warn('⚠️ Warmup falhou, mas seguindo...');
    }
  }

  private async humanScroll() {
    const height: any = await this.driver.executeScript('return document.body.scrollHeight;');
    const steps = 4 + Math.floor(Math.random() * 6);

    for (let i = 1; i <= steps; i++) {
      const pos = Math.floor((height / steps) * i);
      await this.driver.executeScript(`window.scrollTo(0, ${pos})`);
      await this.delay(500 + Math.random() * 600);
    }
  }

  async scrapeUrl(url: string): Promise<{ content: string; anonymized: string; proxyUsed: string }> {
    let attempts = this.proxyManager.getHealthyProxies().length || 1;

    while (attempts > 0) {
      try {
        await this.sessionWarmup(new URL(url).hostname);

        const allowed = await RobotsChecker.isAllowed(url);
        if (!allowed) throw new Error(`Blocked by robots.txt → ${url}`);

        await RateLimiter.consume(url);

        await this.delay(await RobotsChecker.getCrawlDelay(url));

        await this.driver.get(url);

        await this.driver.wait(until.elementLocated(By.tagName('body')), 15000);
        await this.humanScroll();

        await this.delay(2000 + Math.random() * 3000);

        const html = await this.driver.getPageSource();
        const anonymized = Anonymizer.anonymizeHtml(html);

        const proxyUsed = this.proxyUrl ?? 'direct';
        if (this.proxyUrl) this.proxyManager.markProxySuccess(proxyUsed);

        return { content: html, anonymized, proxyUsed };

      } catch (error) {
        const proxyUsed = this.proxyUrl ?? 'direct';
        console.error(`Error scraping ${url} using ${proxyUsed}:`, error);

        attempts--;
        if (this.proxyUrl) this.proxyManager.markProxyFailed(proxyUsed);

        if (attempts > 0) {
          await this.rotateProxy();
          await this.delay(5000);
        }
      }
    }

    throw new Error(`All proxy attempts failed for ${url}`);
  }

  private async rotateProxy() {
    await this.quit();
    this.proxyManager.rotateProxy();
    this.proxyUrl = this.proxyManager.getCurrentProxy() || undefined;
    this.driver = this.createDriver();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async quit(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
    }
  }
}

import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { RobotsChecker } from './robots-checker';
import { RateLimiter } from './rate-limiter';
import { Anonymizer } from '../utils/anonymizer';
import { ProxyManager, ProxyConfig } from './proxy-manager';

export class SeleniumScraper {
  private driver: WebDriver;
  private proxyManager: ProxyManager;

  constructor(proxyConfig?: ProxyConfig) {
    // Se nenhum proxyConfig for fornecido, usamos um padrão vazio
    const defaultConfig: ProxyConfig = {
      proxies: [],
      rotationStrategy: 'round-robin',
      maxRetries: 3,
      timeout: 10000,
      healthCheck: true
    };

    this.proxyManager = new ProxyManager(proxyConfig ?? defaultConfig);
    this.driver = this.createDriver();
  }

  private createDriver(): WebDriver {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    options.excludeSwitches('enable-automation');

    // Adiciona proxy, se houver
    const proxyUrl = this.proxyManager.getCurrentProxy();
    if (proxyUrl) {
      console.log(`Using proxy: ${proxyUrl}`);
      options.addArguments(`--proxy-server=${proxyUrl}`);
    }

    return new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  }

  async scrapeUrl(url: string): Promise<{ content: string; anonymized: string; proxyUsed: string }> {
    let retries = this.proxyManager.getHealthyProxies().length || 1;

    while (retries > 0) {
      try {
        // Checa robots.txt
        const isAllowed = await RobotsChecker.isAllowed(url);
        if (!isAllowed) throw new Error(`Scraping not allowed by robots.txt: ${url}`);

        // Rate limiting
        await RateLimiter.consume(url);

        // Crawl delay
        const crawlDelay = await RobotsChecker.getCrawlDelay(url);
        await this.delay(crawlDelay);

        // Navega para a página
        await this.driver.get(url);
        await this.driver.wait(until.elementLocated(By.tagName('body')), 15000);

        // Delay adicional para conteúdos dinâmicos
        await this.delay(2000 + Math.random() * 3000);

        const pageSource = await this.driver.getPageSource();
        const anonymizedContent = Anonymizer.anonymizeHtml(pageSource);

        // Marca proxy como sucesso
        const proxyUsed = this.proxyManager.getCurrentProxy() || 'direct';
        if (proxyUsed !== 'direct') this.proxyManager.markProxySuccess(proxyUsed);

        return {
          content: pageSource,
          anonymized: anonymizedContent,
          proxyUsed
        };
      } catch (error) {
        retries--;
        const proxyUsed = this.proxyManager.getCurrentProxy() || 'direct';
        console.error(`Error scraping ${url} with proxy ${proxyUsed}:`, error);

        if (proxyUsed !== 'direct') this.proxyManager.markProxyFailed(proxyUsed);

        if (retries > 0) {
          console.log(`Retrying with new proxy... (${retries} attempts left)`);
          await this.rotateProxy();
          await this.delay(5000);
        } else {
          throw error;
        }
      }
    }

    throw new Error('All proxy attempts failed');
  }

  private async rotateProxy(): Promise<void> {
    await this.quit();
    this.proxyManager.rotateProxy();
    this.driver = this.createDriver();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async quit(): Promise<void> {
    if (this.driver) await this.driver.quit();
  }
}

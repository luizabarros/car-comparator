import { SeleniumScraper } from './scraper';
import { ProxyPoolService, DefaultProxyPoolService, StaticProxyListService } from './proxy-pool-service';
import { ProxyConfig } from './proxy-manager';

export class AdvancedScraper {
  private proxyPool: ProxyPoolService;
  private scraper: SeleniumScraper | null = null;

  constructor() {
    // Escolhe a estratégia de proxy
    if (process.env.PROXY_POOL_URL) {
      this.proxyPool = new DefaultProxyPoolService(process.env.PROXY_POOL_URL);
    } else if (process.env.PROXY_LIST) {
      const proxies = process.env.PROXY_LIST.split(',').map(p => p.trim());
      this.proxyPool = new StaticProxyListService(proxies);
    } else {
      throw new Error('No proxy configuration found');
    }
  }

  // Cria um ProxyConfig completo para o SeleniumScraper
  private createProxyConfig(proxy: string): ProxyConfig {
    return {
      proxies: [proxy],
      rotationStrategy: 'round-robin',
      maxRetries: 3,
      timeout: 20000, // Antes era 10000
      healthCheck: true,
      pageLoadTimeout: 25000, // Recomendado para Webmotors
      navigationWait: 'networkidle2'
    };
  }

  async scrapeWithProxyRotation(url: string, maxAttempts: number = 3) {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const proxy = await this.proxyPool.getProxy();
        console.log(`Attempt ${attempts + 1} with proxy: ${proxy}`);

        // Cria o SeleniumScraper com ProxyConfig completo
        this.scraper = new SeleniumScraper(this.createProxyConfig(proxy));
        const result = await this.scraper.scrapeUrl(url);

        await this.proxyPool.reportSuccess(proxy);
        return result;
      } catch (error) {
        attempts++;
        console.error(`Attempt ${attempts} failed:`, error);

        if (this.scraper) {
          await this.scraper.quit();
          this.scraper = null;
        }

        if (attempts < maxAttempts) {
          console.log(`Waiting before retry...`);
          await this.delay(5000 * attempts); // backoff exponencial
        }
      }
    }

    throw new Error(`All ${maxAttempts} proxy attempts failed for URL: ${url}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async quit(): Promise<void> {
    if (this.scraper) {
      await this.scraper.quit();
      this.scraper = null;
    }
  }
}

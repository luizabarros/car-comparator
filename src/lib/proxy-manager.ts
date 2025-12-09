export interface ProxyConfig {
  proxies: string[];
  rotationStrategy: 'round-robin' | 'random' | 'failover';
  maxRetries: number;
  timeout: number;
  healthCheck: boolean;
  pageLoadTimeout: number;
  navigationWait: string;
}

export class ProxyManager {
  private proxies: string[];
  private currentIndex: number;
  private rotationStrategy: string;
  private failedProxies: Set<string>;
  private proxyStats: Map<string, { success: number; failures: number }>;

  constructor(config: ProxyConfig) {
    this.proxies = config.proxies || [];
    this.currentIndex = 0;
    this.rotationStrategy = config.rotationStrategy || 'round-robin';
    this.failedProxies = new Set();
    this.proxyStats = new Map();
    
    this.proxies.forEach(proxy => {
      this.proxyStats.set(proxy, { success: 0, failures: 0 });
    });
  }

  getCurrentProxy(): string | null {
    if (this.proxies.length === 0) {
      return null;
    }

    switch (this.rotationStrategy) {
      case 'random':
        const availableProxies = this.proxies.filter(proxy => !this.failedProxies.has(proxy));
        if (availableProxies.length === 0) {
          this.failedProxies.clear();
          return this.proxies[Math.floor(Math.random() * this.proxies.length)];
        }
        return availableProxies[Math.floor(Math.random() * availableProxies.length)];

      case 'failover':
        const healthyProxy = this.proxies.find(proxy => !this.failedProxies.has(proxy));
        return healthyProxy || this.proxies[0];

      case 'round-robin':
      default:
        let proxy = this.proxies[this.currentIndex];
        let attempts = 0;
        
        while (this.failedProxies.has(proxy) && attempts < this.proxies.length) {
          this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
          proxy = this.proxies[this.currentIndex];
          attempts++;
        }
        
        return proxy;
    }
  }

  rotateProxy(): void {
    if (this.proxies.length === 0) return;

    switch (this.rotationStrategy) {
      case 'round-robin':
        this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
        break;
    }
  }

  markProxySuccess(proxy: string): void {
    const stats = this.proxyStats.get(proxy);
    if (stats) {
      stats.success++;
      this.failedProxies.delete(proxy);
    }
  }

  markProxyFailed(proxy: string): void {
    const stats = this.proxyStats.get(proxy);
    if (stats) {
      stats.failures++;
      this.failedProxies.add(proxy);
    }
  }

  getProxyStats(): Map<string, { success: number; failures: number }> {
    return new Map(this.proxyStats);
  }

  addProxies(newProxies: string[]): void {
    newProxies.forEach(proxy => {
      if (!this.proxies.includes(proxy)) {
        this.proxies.push(proxy);
        this.proxyStats.set(proxy, { success: 0, failures: 0 });
      }
    });
  }

  removeProxy(proxy: string): void {
    const index = this.proxies.indexOf(proxy);
    if (index > -1) {
      this.proxies.splice(index, 1);
      this.proxyStats.delete(proxy);
      this.failedProxies.delete(proxy);
    }
  }

  getHealthyProxies(): string[] {
    return this.proxies.filter(proxy => !this.failedProxies.has(proxy));
  }

  getFailedProxies(): string[] {
    return Array.from(this.failedProxies);
  }
}
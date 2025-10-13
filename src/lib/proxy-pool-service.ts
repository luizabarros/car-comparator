import axios from 'axios';

export interface ProxyPoolService {
  getProxy(): Promise<string>;
  reportSuccess(proxy: string): Promise<void>;
  reportError(proxy: string): Promise<void>;
}

export class DefaultProxyPoolService implements ProxyPoolService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://proxy-pool:5010') {
    this.baseUrl = baseUrl;
  }

  async getProxy(): Promise<string> {
    try {
      const response: any = await axios.get(`${this.baseUrl}/get`);
      return `http://${response.data.proxy}`;
    } catch (error) {
      console.error('Error getting proxy from pool:', error);
      throw new Error('Failed to get proxy from pool');
    }
  }

  async reportSuccess(proxy: string): Promise<void> {
    try {
      const proxyWithoutProtocol = proxy.replace('http://', '');
      await axios.get(`${this.baseUrl}/delete?proxy=${proxyWithoutProtocol}`);
    } catch (error) {
      console.error('Error reporting proxy success:', error);
    }
  }

  async reportError(proxy: string): Promise<void> {
    try {
      const proxyWithoutProtocol = proxy.replace('http://', '');
      // The pool will automatically remove bad proxies
      console.log(`Reported bad proxy: ${proxyWithoutProtocol}`);
    } catch (error) {
      console.error('Error reporting proxy error:', error);
    }
  }
}

export class StaticProxyListService implements ProxyPoolService {
  private proxies: string[];
  private currentIndex: number;

  constructor(proxies: string[]) {
    this.proxies = proxies;
    this.currentIndex = 0;
  }

  async getProxy(): Promise<string> {
    if (this.proxies.length === 0) {
      throw new Error('No proxies available');
    }

    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    return proxy;
  }

  async reportSuccess(proxy: string): Promise<void> {
    console.log(`Proxy ${proxy} worked successfully`);
  }

  async reportError(proxy: string): Promise<void> {
    console.log(`Proxy ${proxy} failed, consider removing from list`);
    // Optional: Remove bad proxy from list
    const index = this.proxies.indexOf(proxy);
    if (index > -1) {
      this.proxies.splice(index, 1);
      console.log(`Removed bad proxy: ${proxy}`);
    }
  }
}
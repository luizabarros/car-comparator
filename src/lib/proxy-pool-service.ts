import axios from 'axios';

export interface ProxyPoolService {
  getProxy(): Promise<string>;
  reportSuccess(proxy: string): Promise<void>;
  reportError(proxy: string): Promise<void>;
  ensureHealthy?(): Promise<void>;
}

export class DefaultProxyPoolService implements ProxyPoolService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://proxy-pool:5010') {
    this.baseUrl = baseUrl;
  }

  async getProxy(): Promise<string> {
    try {
      const response: any = await axios.get(`${this.baseUrl}/get/`);
      const rawProxy = response.data?.proxy;

      if (!rawProxy) {
        console.warn('⚠️ Nenhum proxy retornado, usando fallback local');
        return 'http://localhost';
      }

      const proxy = rawProxy.startsWith('http') ? rawProxy : `http://${rawProxy}`;
      console.log('Using proxy:', proxy);
      return proxy;
    } catch (error) {
      console.error('Error getting proxy from pool:', error);
      throw new Error('Failed to get proxy from pool');
    }
  }

  async reportSuccess(proxy: string): Promise<void> {
    try {
      const proxyWithoutProtocol = proxy.replace('http://', '');
      await axios.get(`${this.baseUrl}/delete?proxy=${proxyWithoutProtocol}`);
      console.log(`✅ Proxy ${proxy} removido do pool após sucesso`);
    } catch (error) {
      console.error('Error reporting proxy success:', error);
    }
  }

  async reportError(proxy: string): Promise<void> {
    try {
      const proxyWithoutProtocol = proxy.replace('http://', '');
      console.warn(`⚠️ Proxy reportado como ruim: ${proxyWithoutProtocol}`);
    } catch (error) {
      console.error('Error reporting proxy error:', error);
    }
  }

  async ensureHealthy(): Promise<void> {
    try {
      const response: any = await axios.get(`${this.baseUrl}/count`);
      const count = response.data?.count ?? 0;

      if (count > 0) {
        console.log(`✅ Proxy pool pronto (${count} proxies disponíveis)`);
      } else {
        console.warn('⚠️ Proxy pool vazio ou lento para iniciar');
      }
    } catch (error) {
      console.error('❌ Proxy pool inacessível:', error);
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
    console.log(`Using static proxy: ${proxy}`);
    return proxy;
  }

  async reportSuccess(proxy: string): Promise<void> {
    console.log(`✅ Proxy ${proxy} funcionou com sucesso`);
  }

  async reportError(proxy: string): Promise<void> {
    console.warn(`⚠️ Proxy ${proxy} falhou — removendo da lista`);
    const index = this.proxies.indexOf(proxy);
    if (index > -1) {
      this.proxies.splice(index, 1);
    }
  }
}

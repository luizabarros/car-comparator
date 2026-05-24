import axios from 'axios';
import { redisClient } from './rate-limiter';
import { ONE_YEAR_IN_SECONDS } from './tcc-config';

interface SearchResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  imageUrl?: string;
  source?: string;
  date?: string;
  type?: string;
  rating?: number;
  phone?: string;
  address?: string;
  hours?: string;
}

interface SerpApiSearchParams {
  engine: 'google' | 'google_images' | 'google_local';
  q: string;
  location?: string;
  google_domain?: string;
  gl?: string;
  hl?: string;
  safe?: 'active' | 'off';
  device?: 'desktop' | 'mobile';
  num?: number;
  start?: number;
  tbm?: 'lcl' | 'isch';
}

export class SearchAPI {
  private static readonly API_KEY = process.env.SERPAPI_API_KEY;
  private static readonly SERPAPI_RETRY_DELAYS_MS = [500, 1500];
  private static readonly PRIORITY_SITES = [
    'fichacompleta.com.br',
    'instacarro.com',
    'magodoscarros.com',
    'shopcar.com.br',
    'autopapo.com.br',
    'canalve.com.br',
    'mundodoautomovelparapcd.com.br',
    'mercadolivre.com.br',
  ];

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private static isEmptyGoogleResponse(data: any, params: SerpApiSearchParams): boolean {
    if (params.engine !== 'google') {
      return false;
    }

    const organicResults = Array.isArray(data?.organic_results) ? data.organic_results : [];
    const organicState = data?.search_information?.organic_results_state;
    const errorMessage = typeof data?.error === 'string' ? data.error : '';

    return (
      organicResults.length === 0 &&
      (organicState === 'Fully empty' ||
        errorMessage.includes("Google hasn't returned any results"))
    );
  }

  private static parseSerpApiResults(data: any, engine: SerpApiSearchParams['engine']): SearchResult[] {
    switch (engine) {
      case 'google_images': {
        const imageResults = data.images_results || [];
        return imageResults.slice(0, 2).map((item: any) => ({
          position: item.position || 0,
          title: item.title || '',
          link: item.link || '',
          snippet: '',
          imageUrl: item.original || item.thumbnail,
          source: item.source,
          type: 'image',
        }));
      }

      case 'google_local': {
        const localResults = data.local_results || [];
        return localResults.slice(0, 5).map((item: any) => ({
          position: item.position || 0,
          title: item.title || '',
          link: item.links?.website || '',
          snippet: item.description || '',
          source: item.type,
          phone: item.phone,
          address: item.address,
          hours: item.hours,
          type: 'local',
        }));
      }

      case 'google':
      default: {
        const organicResults = data.organic_results || [];
        return organicResults.map((item: any) => ({
          position: item.position || 0,
          title: item.title || '',
          link: item.link || '',
          snippet: item.snippet || '',
          date: item.date,
          source: item.source,
          type: 'organic',
        }));
      }
    }
  }

  private static async searchSerpAPI(params: SerpApiSearchParams): Promise<SearchResult[]> {
    const maxAttempts = this.SERPAPI_RETRY_DELAYS_MS.length + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await axios.get('https://serpapi.com/search.json', {
          params: {
            api_key: this.API_KEY,
            engine: params.engine,
            q: params.q,
            location: params.location || 'Brazil',
            google_domain: params.google_domain || 'google.com.br',
            gl: params.gl || 'br',
            hl: params.hl || 'pt',
            safe: params.safe || 'active',
            device: params.device || 'desktop',
            tbm: params.tbm,
            num: params.num ?? (params.engine === 'google' ? 10 : undefined),
            start: params.start,
          },
          timeout: 20000,
        });

        const data = response.data as any;

        if (this.isEmptyGoogleResponse(data, params)) {
          if (attempt < maxAttempts) {
            console.warn(
              `SERPAPI empty google response (attempt ${attempt}/${maxAttempts}) for query: ${params.q}`,
            );
            await this.sleep(this.SERPAPI_RETRY_DELAYS_MS[attempt - 1]);
            continue;
          }

          console.warn(`SERPAPI returned empty google results after retries for query: ${params.q}`);
          return [];
        }

        return this.parseSerpApiResults(data, params.engine);
      } catch (error) {
        if (attempt < maxAttempts) {
          console.warn(
            `SERPAPI request failed (attempt ${attempt}/${maxAttempts}) for query: ${params.q}`,
            error,
          );
          await this.sleep(this.SERPAPI_RETRY_DELAYS_MS[attempt - 1]);
          continue;
        }

        console.error('SERPAPI error:', error);
        return [];
      }
    }

    return [];
  }

  private static buildTechnicalSearchQueries(searchTerm: string): string[] {
    const prioritySitesQuery = this.PRIORITY_SITES.map((site) => `site:${site}`).join(' OR ');
    const loosePrioritySitesQuery = this.PRIORITY_SITES.slice(0, 5)
      .map((site) => `site:${site}`)
      .join(' OR ');
    const excludeSites = [
      '-site:carrosnaweb.com.br',
      '-site:byd.com',
      '-site:youtube.com',
      '-site:webmotors.com.br',
      '-filetype:pdf',
    ].join(' ');

    return [
      `${searchTerm} ficha tecnica (${prioritySitesQuery}) ${excludeSites}`,
      `${searchTerm} ficha tecnica (${loosePrioritySitesQuery}) ${excludeSites}`,
      `${searchTerm} ficha tecnica ${excludeSites}`,
      `${searchTerm} especificacoes ${excludeSites}`,
    ];
  }

  static async searchCarSites(carModel: string, year?: number): Promise<SearchResult[]> {
    const searchTerm = `${carModel}${year ? ` ${year}` : ''}`;
    const cacheKey = `serpapi_search:${carModel}:${year}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    let technicalResults: SearchResult[] = [];
    for (const query of this.buildTechnicalSearchQueries(searchTerm)) {
      technicalResults = await this.searchSerpAPI({
        engine: 'google',
        q: query,
      });

      if (technicalResults.length > 0) {
        break;
      }
    }

    const [reclameAquiResults, dealershipResults, imageResults] = await Promise.all([
      this.searchSerpAPI({
        engine: 'google',
        q: `${searchTerm} site:reclameaqui.com.br`,
      }),
      this.searchSerpAPI({
        engine: 'google_local',
        q: `${searchTerm} concessionaria`,
        tbm: 'lcl',
      }),
      this.searchSerpAPI({
        engine: 'google_images',
        q: searchTerm,
        tbm: 'isch',
      }),
    ]);

    const finalResults = [
      ...technicalResults,
      ...reclameAquiResults,
      ...dealershipResults,
      ...imageResults,
    ].slice(0, 50);

    await redisClient.set(cacheKey, JSON.stringify(finalResults), {
      EX: ONE_YEAR_IN_SECONDS,
    });

    return finalResults;
  }

  static async searchCarImages(carModel: string, year?: number): Promise<SearchResult[]> {
    const searchTerm = `${carModel}${year ? ` ${year}` : ''}`;
    const cacheKey = `serpapi_images:${carModel}:${year}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const results = await this.searchSerpAPI({
      engine: 'google_images',
      q: searchTerm,
      tbm: 'isch',
    });

    await redisClient.set(cacheKey, JSON.stringify(results), {
      EX: ONE_YEAR_IN_SECONDS,
    });

    return results;
  }

  static async searchDealerships(carModel: string, location = 'Brazil'): Promise<SearchResult[]> {
    const searchTerm = `${carModel} concessionaria`;
    const cacheKey = `serpapi_dealers:${carModel}:${location}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const results = await this.searchSerpAPI({
      engine: 'google_local',
      q: searchTerm,
      location,
      tbm: 'lcl',
    });

    await redisClient.set(cacheKey, JSON.stringify(results), {
      EX: ONE_YEAR_IN_SECONDS,
    });

    return results;
  }

  static async searchInSpecificSite(
    carModel: string,
    site: string,
    year?: number,
  ): Promise<SearchResult[]> {
    const searchTerm = `${carModel}${year ? ` ${year}` : ''} site:${site}`;
    const cacheKey = `serpapi_site:${carModel}:${year}:${site}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const results = await this.searchSerpAPI({
      engine: 'google',
      q: searchTerm,
    });

    await redisClient.set(cacheKey, JSON.stringify(results), {
      EX: ONE_YEAR_IN_SECONDS,
    });

    return results;
  }
}

import axios from 'axios';
import { redisClient } from './rate-limiter';

interface SearchResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  imageUrl?: string;
  source?: string;
  date?: string;
  type?: string; // 'image', 'local', 'organic', 'review'
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

  private static async searchSerpAPI(params: SerpApiSearchParams): Promise<SearchResult[]> {
    try {
      const allResults: SearchResult[] = [];

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
          num: params.engine === 'google' && 10,
        },
      });

      const data = response.data as any;

      switch (params.engine) {
        case 'google_images':
          const imageResults = data.images_results || [];
          allResults.push(
            ...imageResults.slice(0, 2).map((item: any) => ({
              link: item.link || '',
              imageUrl: item.original || item.thumbnail,
              source: item.source,
              type: 'image',
            })),
          );
          break;

        case 'google_local':
          const localResults = data.local_results || [];
          allResults.push(
            ...localResults.slice(0, 5).map((item: any) => ({
              title: item.title || '',
              link: item.links?.website || '',
              snippet: item.description || '',
              source: item.type,
              phone: item.phone,
              address: item.address,
              hours: item.hours,
              type: 'local',
            })),
          );
          break;

        case 'google':
        default:
          const organicResults = data.organic_results || [];
          allResults.push(
            ...organicResults.slice(0, 5).map((item: any) => ({
              title: item.title || '',
              link: item.link || '',
              snippet: item.snippet || '',
              date: item.date,
              source: item.source,
              type: 'organic',
            })),
          );
          break;
      }

      return allResults;
    } catch (error) {
      console.error('SERPAPI error:', error);
      return [];
    }
  }

  static async searchCarSites(carModel: string, year?: number): Promise<SearchResult[]> {
    const searchTerm = `${carModel}${year ? ` ${year}` : ''}`;
    const cacheKey = `serpapi_search:${carModel}:${year}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const searchPromises = [
      this.searchSerpAPI({
        engine: 'google',
        q: `${searchTerm} ficha técnica`,
      }),

      this.searchSerpAPI({
        engine: 'google',
        q: `${searchTerm} site:reclameaqui.com.br`,
      }),

      this.searchSerpAPI({
        engine: 'google_local',
        q: `${searchTerm} concessionária`,
        tbm: 'lcl',
      }),

      this.searchSerpAPI({
        engine: 'google_images',
        q: `${searchTerm}`,
        tbm: 'isch',
      }),
    ];

    const resultsArrays = await Promise.all(searchPromises);

    const allResults = resultsArrays.flat();

    const finalResults = allResults.slice(0, 50);

    await redisClient.set(cacheKey, JSON.stringify(finalResults), {
      EX: 60 * 60 * 24,
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
      EX: 60 * 60 * 12,
    });

    return results;
  }

  static async searchDealerships(carModel: string, location = 'Brazil'): Promise<SearchResult[]> {
    const searchTerm = `${carModel} concessionária`;
    const cacheKey = `serpapi_dealers:${carModel}:${location}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const results = await this.searchSerpAPI({
      engine: 'google_local',
      q: searchTerm,
      location: location,
      tbm: 'lcl',
    });

    await redisClient.set(cacheKey, JSON.stringify(results), {
      EX: 60 * 60 * 6,
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
      EX: 60 * 60 * 24,
    });

    return results;
  }
}

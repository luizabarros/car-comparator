import axios from 'axios';

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  imageUrl?: string; 
}

export class GoogleSearchAPI {
  private static readonly API_KEY = process.env.GOOGLE_API_KEY;
  private static readonly SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

  private static async search(query: string, num = 10): Promise<GoogleSearchResult[]> {
    try {
      const response: any = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: this.API_KEY,
          cx: this.SEARCH_ENGINE_ID,
          q: query,
          num
        }
      });

      return response.data.items?.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        imageUrl: item.pagemap?.cse_image?.[0]?.src || null
      })) || [];
    } catch (error) {
      console.error('Google Search API error:', error);
      return [];
    }
  }

  static async searchCarSites(carModel: string, year?: number): Promise<GoogleSearchResult[]> {
    const queries = [
      `${carModel}${year ? ` ${year}` : ''} site:carrosnaweb.com.br OR site:olhonocarro.com.br OR site:shopcar.com.br OR site:carrodegaragem.com OR site:carroclub.com OR site:quatrorodas.com.br`,
      `${carModel}${year ? ` ${year}` : ''} site:reclameaqui.com.br`,
      `${carModel}${year ? ` ${year}` : ''} concessionaria`
    ];

    const resultsArrays = await Promise.all(queries.map(q => this.search(q, 10)));

    return resultsArrays.flat();
  }
}

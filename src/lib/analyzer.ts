import OpenAI from 'openai';
import crypto from 'crypto';
import { CarData } from '../types/car';
import { redisClient } from './rate-limiter';
import { 
  SYSTEM_PROMPT_CHUNK_TECNICO,
  SYSTEM_PROMPT_CHUNK_FEATURES, 
  SYSTEM_PROMPT_CHUNK_ANALISE 
} from '@/prompts';
import { 
  schemaTecnico,
  schemaFeatures,
  schemaAnalise 
} from '@/types/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SearchResult {
  link: string;
  title?: string;
  snippet?: string;
  type?: string;
  imageUrl?: string;
  phone?: string;
  address?: string;
}

interface CategorizedSearchResults {
  organic: SearchResult[];
  reclameaqui: SearchResult[];
  images: SearchResult[];
  dealerships: SearchResult[];
}

export class Analyzer {
  static async extractCarDataFromURLs(
    urls: string[],
    carModel: string,
    year?: number,
    categorizedResults?: CategorizedSearchResults,
  ): Promise<CarData> {
    const cacheKey = `openai_extract:${carModel}:${year}:${crypto
      .createHash('sha256')
      .update(urls.join('|'))
      .digest('hex')
      .substring(0, 16)}`;

    if (redisClient.isReady) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`📦 Cache hit: ${carModel}`);
        return JSON.parse(cached);
      }
    }

    try {
      const carInfo = year ? `${carModel} ${year}` : carModel;

      const basePrompt = `
        Analise as seguintes informações sobre o **${carInfo}**:

        **URLs de Fichas Técnicas:**
        ${urls.map((url, i) => `${i + 1}. ${url}`).join('\n')}
      `;

      const promptTecnico = basePrompt;
      
      const promptFeatures = basePrompt;
      
      const promptAnalise = `
        ${basePrompt}

        ${
          categorizedResults?.reclameaqui && categorizedResults.reclameaqui.length > 0
            ? `
        **Reclamações do Reclame Aqui:**
        ${categorizedResults.reclameaqui.map((r, i) => `${i + 1}. ${r.link}\n   Título: ${r.title}\n   Resumo: ${r.snippet}`).join('\n')}
        `
            : ''
        }

        ${
          categorizedResults?.images && categorizedResults.images.length > 0
            ? `
        **Imagens Disponíveis:**
        ${categorizedResults.images.map((img, i) => `${i + 1}. ${img.imageUrl}`).join('\n')}
        `
            : ''
        }

        ${
          categorizedResults?.dealerships && categorizedResults.dealerships.length > 0
            ? `
        **Concessionárias:**
        ${categorizedResults.dealerships.map((d, i) => `${i + 1}. ${d.title}\n   Endereço: ${d.address}\n   Telefone: ${d.phone}\n   Site: ${d.link}`).join('\n')}
        `
            : ''
        }

        Extraia informações de análise, reclamações e concessionárias.
      `;

      const [tecnicoData, featuresData, analiseData] = await Promise.all([
        openai.responses.create({
          model: 'gpt-4.1',
          instructions: SYSTEM_PROMPT_CHUNK_TECNICO,
          input: promptTecnico,
          tools: [{ type: 'web_search' }],
          text: {
            format: {
              type: 'json_schema',
              name: 'car_data_tecnico',
              strict: true,
              schema: schemaTecnico,
            },
          },
          temperature: 0.1,
        }),

        openai.responses.create({
          model: 'gpt-4.1',
          instructions: SYSTEM_PROMPT_CHUNK_FEATURES,
          input: promptFeatures,
          tools: [{ type: 'web_search' }],
          text: {
            format: {
              type: 'json_schema',
              name: 'car_data_features',
              strict: true,
              schema: schemaFeatures,
            },
          },
          temperature: 0.1,
        }),

        openai.responses.create({
          model: 'gpt-4.1',
          instructions: SYSTEM_PROMPT_CHUNK_ANALISE,
          input: promptAnalise,
          tools: [{ type: 'web_search' }],
          text: {
            format: {
              type: 'json_schema',
              name: 'car_data_analise',
              strict: true,
              schema: schemaAnalise,
            },
          },
          temperature: 0.2,
        }),
      ]);

      const tecnico = JSON.parse(tecnicoData.output_text || '{}');
      const features = JSON.parse(featuresData.output_text || '{}');
      const analise = JSON.parse(analiseData.output_text || '{}');

      const carData: CarData = {
        ...tecnico,
        ...features,
        ...analise,
        metadata: {
          sources: urls,
          extractedAt: new Date().toISOString(),
          model: 'gpt-4.1',
        },
      };

      if (redisClient.isReady) {
        await redisClient.set(cacheKey, JSON.stringify(carData), {
          EX: 60 * 60 * 24,
        });
        console.log(`💾 Cache saved: ${carModel}`);
      }

      return carData;
    } catch (error: any) {
      console.error('❌ OpenAI extraction error:', error.message);

      return {
        informacoes_gerais: {
          fabricante: null,
          modelo: carModel,
          ano: year || null,
          versao: null,
          preco: null,
          garantia: null,
          ipva: null,
          seguro: null,
        },
        error: error.message,
        metadata: {
          sources: urls,
          extractedAt: new Date().toISOString(),
          model: 'gpt-4.1',
          failed: true,
        },
      } as any;
    }
  }
}
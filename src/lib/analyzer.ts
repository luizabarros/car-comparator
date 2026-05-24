import OpenAI from 'openai';
import crypto from 'crypto';
import { CarData } from '../types/car';
import { redisClient } from './rate-limiter';
import { ONE_YEAR_IN_SECONDS } from './tcc-config';
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

const schemaGeneralInfoRecovery = {
  type: 'object',
  additionalProperties: false,
  properties: {
    informacoes_gerais: {
      type: 'object',
      additionalProperties: false,
      properties: {
        fabricante: { type: ['string', 'null'] },
        modelo: { type: 'string' },
        ano: { type: ['number', 'null'] },
        versao: { type: ['string', 'null'] },
        preco: { type: ['number', 'null'] },
        garantia: { type: ['string', 'null'] },
        ipva: { type: ['number', 'null'] },
        seguro: { type: ['number', 'null'] },
      },
      required: ['fabricante', 'modelo', 'ano', 'versao', 'preco', 'garantia', 'ipva', 'seguro'],
    },
  },
  required: ['informacoes_gerais'],
} as const;

type GeneralInfoFields = CarData['informacoes_gerais'];
type EssentialGeneralField = 'preco' | 'garantia' | 'ipva' | 'seguro';

const ESSENTIAL_GENERAL_FIELDS: EssentialGeneralField[] = ['preco', 'garantia', 'ipva', 'seguro'];

export class Analyzer {
  private static getMissingEssentialGeneralFields(
    info: Partial<GeneralInfoFields> | undefined,
  ): EssentialGeneralField[] {
    return ESSENTIAL_GENERAL_FIELDS.filter((field) => info?.[field] == null);
  }

  private static buildBasePrompt(urls: string[], carInfo: string): string {
    return `
        Analise as seguintes informações sobre o **${carInfo}**:

        **URLs de Fichas Técnicas:**
        ${urls.map((url, i) => `${i + 1}. ${url}`).join('\n')}
      `;
  }

  private static async recoverMissingGeneralInfo(
    urls: string[],
    carModel: string,
    year: number | undefined,
    tecnico: Partial<CarData>,
  ): Promise<Partial<GeneralInfoFields> | null> {
    const missingFields = Analyzer.getMissingEssentialGeneralFields(tecnico.informacoes_gerais);

    if (missingFields.length === 0) {
      return null;
    }

    const carInfo = year ? `${carModel} ${year}` : carModel;
    const recoveryPrompt = `
      Revise somente os campos ausentes de informações gerais do veículo **${carInfo}**.

      Campos ausentes que precisam de nova tentativa:
      ${missingFields.map((field) => `- ${field}`).join('\n')}

      Regras obrigatórias:
      - Use as URLs fornecidas primeiro.
      - Se algum desses campos não estiver nas URLs, use web_search obrigatoriamente.
      - Não invente valores.
      - Retorne todas as chaves de informacoes_gerais.
      - Preserve os dados já encontrados quando eles aparecerem abaixo.

      Valores já extraídos:
      ${JSON.stringify(tecnico.informacoes_gerais ?? {}, null, 2)}

      **URLs de referência:**
      ${urls.map((url, i) => `${i + 1}. ${url}`).join('\n')}
    `;

    const recoveryResponse = await openai.responses.create({
      model: 'gpt-4.1',
      instructions:
        'Você é um especialista em análise automotiva. Recupere apenas informações gerais essenciais. Retorne apenas JSON válido e nunca omita chaves.',
      input: recoveryPrompt,
      tools: [{ type: 'web_search' }],
      text: {
        format: {
          type: 'json_schema',
          name: 'car_data_general_info_recovery',
          strict: true,
          schema: schemaGeneralInfoRecovery,
        },
      },
      temperature: 0,
    });

    const recovered = JSON.parse(recoveryResponse.output_text || '{}');
    return recovered.informacoes_gerais ?? null;
  }

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

      const promptTecnico = Analyzer.buildBasePrompt(urls, carInfo);
      
      const promptFeatures = Analyzer.buildBasePrompt(urls, carInfo);
      
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

      const recoveredGeneralInfo = await Analyzer.recoverMissingGeneralInfo(
        urls,
        carModel,
        year,
        tecnico,
      );

      if (recoveredGeneralInfo) {
        tecnico.informacoes_gerais = {
          ...tecnico.informacoes_gerais,
          ...Object.fromEntries(
            Object.entries(recoveredGeneralInfo).filter(([, value]) => value != null),
          ),
        };
      }

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
          EX: ONE_YEAR_IN_SECONDS,
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

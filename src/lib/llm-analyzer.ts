import axios from 'axios';
import crypto from 'crypto';
import { CarData } from '../types/car';
import { redisClient } from './rate-limiter';

const OLLAMA_BASE_URL = process.env.OLLAMA_HOST || 'http://localhost:11434';

// Log de erro do Redis
redisClient.on('error', (err) => console.error('Redis Client Error:', err));

export class LLMAnalyzer {
  private static readonly SYSTEM_PROMPT = `
    Você é um especialista em análise de veículos. Sua tarefa é extrair informações estruturadas de páginas de carros e gerar insights inteligentes.

    INSTRUÇÕES:
    1. Extraia TODAS as informações disponíveis seguindo EXATAMENTE a estrutura JSON fornecida
    2. Para campos não encontrados, retorne null ou omita
    3. Converta todos os valores para tipos apropriados
    4. Padronize unidades (km/l, R$, mm, etc.)
    5. Gere insights baseados nos dados extraídos

    FORMATO DE RESPOSTA JSON:
    {
      "informacoes_gerais": { ... },
      "motor": { ... },
      "transmissao": { ... },
      "suspensao": { ... },
      "freios": { ... },
      "direcao": { ... },
      "pneus": { ... },
      "dimensoes": { ... },
      "desempenho": { ... },
      "consumo": { ... },
      "autonomia": { ... },
      "analise_ia": {
        "custo_total_propriedade": number,
        "liquidez": "alta" | "media" | "baixa",
        "risco_manutencao": string,
        "match_estilo_vida": string[],
        "comparacao_preditiva": string
      }
    }
  `;

  static async analyzeCarContent(content: string, carModel: string): Promise<CarData> {
    // Cleanup antes do hashing e do prompt
    const cleanedContent = content
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const hash = crypto.createHash('sha1').update(cleanedContent).digest('hex');
    const cacheKey = `llm:${carModel}:${hash}`;

    if (!redisClient.isReady) {
      await redisClient.connect();
    }

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit: ${carModel}`);
      return JSON.parse(cached);
    }

    const contentSnippet = cleanedContent.substring(0, 8000);

    const userPrompt = `
      Analise o seguinte conteúdo sobre o veículo ${carModel}:

      ${contentSnippet}

      Gere insights adicionais conforme instruções do sistema.
    `;

    try {
      const response: any = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
        model: 'mistral',
        prompt: `${this.SYSTEM_PROMPT}\n\n${userPrompt}`,
        stream: false,
        format: 'json'
      });

      let parsedData: any;

      try {
        parsedData = JSON.parse(response.data.response);
      } catch {
        console.warn('⚠️ JSON mal formatado. Tentando recuperar...');

        const cleanedJSON = response.data.response
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim()
          .replace(/,(\s*[}\]])/g, '$1');

        parsedData = JSON.parse(cleanedJSON);
      }

      const validated = this.validateAndCleanCarData(parsedData);

      await redisClient.set(cacheKey, JSON.stringify(validated), { EX: 60 * 60 * 24 }); // TTL 24h

      return validated;
    } catch (error: any) {
      console.error('❌ LLM Analysis error:', error.message);
      throw new Error('Failed to analyze car data');
    }
  }

  private static validateAndCleanCarData(data: any): CarData {
    const cleanData = { ...data };

    if (cleanData.informacoes_gerais) {
      cleanData.informacoes_gerais.preco =
        this.safeParseNumber(cleanData.informacoes_gerais.preco);

      cleanData.informacoes_gerais.ano =
        this.safeParseNumber(cleanData.informacoes_gerais.ano);
    }

    return cleanData as CarData;
  }

  private static safeParseNumber(value: any): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
      return isNaN(num) ? null : num;
    }
    return null;
  }
}

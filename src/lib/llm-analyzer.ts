import axios from 'axios';
import { CarData } from '../types/car';
import { redisClient } from './rate-limiter';

const OLLAMA_BASE_URL = process.env.OLLAMA_HOST || 'http://localhost:11434';

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.connect?.(); // compatível com redis >= 4

export class LLMAnalyzer {
  private static readonly CACHE_TTL = 7 * 24 * 60 * 60;

  private static readonly SYSTEM_PROMPT = `
    Você é um especialista em análise de veículos. Sua tarefa é extrair informações estruturadas de páginas de carros e gerar insights inteligentes.

    INSTRUÇÕES:
    1. Extraia TODAS as informações disponíveis seguindo EXATAMENTE a estrutura JSON fornecida
    2. Para campos não encontrados, retorne null ou omita
    3. Converta todos os valores para os tipos apropriados (number, string, boolean)
    4. Padronize unidades (km/l, R$, mm, etc.)
    5. Gere insights baseados nos dados extraídos

    FORMATO DE RESPOSTA REQUERIDO:
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
    const cacheKey = `llm:${carModel}:${Buffer.from(content).toString('base64').substring(0, 50)}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit for ${carModel}`);
      return JSON.parse(cached);
    }

    const userPrompt = `Analise o seguinte conteúdo sobre o veículo ${carModel} e retorne no formato JSON especificado:

      ${content.substring(0, 8000)} // Limit content length

      Baseado nos dados, gere também:
      - Custo total de propriedade (TCO) anual estimado
      - Indicador de liquidez no mercado
      - Principais riscos de manutenção
      - Match com estilos de vida (cidade, estrada, família, etc.)
      - Previsão de desvalorização
    `;

    try {
      const response: any = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
        model: 'mistral',
        prompt: `${this.SYSTEM_PROMPT}\n\n${userPrompt}`,
        stream: false,
        format: 'json'
      });

      const parsedData = JSON.parse(response.data.response);
      return this.validateAndCleanCarData(parsedData);
    } catch (error) {
      console.error('LLM Analysis error:', error);
      throw new Error('Failed to analyze car data');
    }
  }

  private static validateAndCleanCarData(data: any): CarData {
    // Remove any personal data that might have been extracted
    const cleanData = { ...data };
    
    // Ensure all numeric fields are properly converted
    if (cleanData.informacoes_gerais) {
      cleanData.informacoes_gerais.preco = this.safeParseNumber(cleanData.informacoes_gerais.preco);
      cleanData.informacoes_gerais.ano = this.safeParseNumber(cleanData.informacoes_gerais.ano);
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
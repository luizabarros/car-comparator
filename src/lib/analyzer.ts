import OpenAI from 'openai';
import crypto from 'crypto';
import { CarData } from '../types/car';
import { redisClient } from './rate-limiter';
import { SYSTEM_PROMPT_EXTRACTOR } from '@/prompts';
import { carDataSchema } from '@/types/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));

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

      const userPrompt = `
      Analise as seguintes informações sobre o **${carInfo}** e extraia TODAS as informações disponíveis:

      **URLs de Fichas Técnicas:**
      ${urls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

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
      **INSTRUÇÕES IMPORTANTES:**

      1. **Visite e analise cada URL de ficha técnica** usando web search para obter informações reais e atualizadas

      2. **Analise as reclamações do Reclame Aqui**:
        - Acesse cada link fornecido
        - Faça um resumo geral das principais reclamações
        - Identifique os problemas mais recorrentes
        - Salve os links das reclamações mais relevantes (até 5) para referência

      3. **Salve as URLs das imagens** fornecidas para uso posterior no HTML

      4. **Salve os dados das concessionárias** com nome, endereço, telefone e site

      5. **Preencha TODOS os campos** do JSON de resposta

      6. **CAMPOS QUE REQUEREM BUSCA NA INTERNET SE NÃO ENCONTRADOS NAS URLs:**
        - Se **custo_total_propriedade** não for encontrado nas URLs, busque na internet: "custo total propriedade ${carModel} ${year}"
        - Se **ipva** não for encontrado nas URLs, busque na internet: "IPVA ${carModel} ${year} valor"
        - Se **seguro** não for encontrado nas URLs, busque na internet: "seguro ${carModel} ${year} preço médio"
        - Se **protecao_adultos, protecao_criancas, protecao_pedestres ou assistencia** não forem encontrados nas URLs, busque na internet: "crash test ${carModel} ${year} Latin NCAP" ou "avaliação segurança ${carModel} ${year} estrelas"
        
      7. **IMPORTANTE:** Para os campos acima (custo_total_propriedade, ipva, seguro, e as avaliações de proteção):
        - Primeiro tente extrair das URLs fornecidas
        - Se não encontrar, **OBRIGATORIAMENTE use web_search** para buscar essas informações
        - Para avaliações de segurança, procure por: Latin NCAP, Euro NCAP, ou avaliações de crash test
        - As notas de proteção são geralmente de 0 a 5 estrelas ou 0 a 100%
        - Nunca deixe esses campos como null sem antes tentar buscar na internet
        - Use dados reais e atualizados da busca web

      8. Para outros campos não encontrados, use \`null\`

      9. **Nunca invente dados** - se não encontrar mesmo após buscar na web, deixe \`null\`

      10. Padronize unidades: km/l, R$, mm, cv, kgfm, kWh, km/h

      **Use web search** para complementar informações que não estiverem nas URLs fornecidas.

      Retorne APENAS o JSON no formato especificado, sem markdown ou explicações adicionais.
    `;

      console.log(`🔄 Chamando OpenAI GPT-5.2 para: ${carInfo}`);

      const response = await openai.responses.create({
        model: 'gpt-5.2-2025-12-11',
        instructions: SYSTEM_PROMPT_EXTRACTOR,
        input: userPrompt,
        tools: [{ type: 'web_search' }],
        text: {
          format: {
            type: 'json_schema',
            name: 'car_data',
            strict: true,
            schema: carDataSchema,
          },
        },
        temperature: 0.3,
      });

      const responseText = response.output_text || '{}';

      let carData: CarData;
      try {
        carData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erro ao parsear JSON da OpenAI:', parseError);
        throw new Error('Failed to parse AI response as JSON');
      }

      carData.metadata = {
        sources: urls,
        extractedAt: new Date().toISOString(),
        model: 'gpt-5.2-2025-12-11',
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
          model: 'gpt-5.2-2025-12-11',
          failed: true,
        },
      } as any;
    }
  }
}

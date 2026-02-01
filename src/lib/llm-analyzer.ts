import OpenAI from 'openai';
import crypto from "crypto";
import { CarData } from "../types/car";
import { redisClient } from "./rate-limiter";
import { SYSTEM_PROMPT_EXTRACTOR, SYSTEM_PROMPT_COMPARATOR } from "@/prompts";
import { carDataSchema } from '@/types/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

redisClient.on("error", (err) => console.error("Redis Client Error:", err));

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

export class LLMAnalyzer {
  static async extractCarDataFromURLs(
    urls: string[],
    carModel: string,
    year?: number,
    categorizedResults?: CategorizedSearchResults
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

      ${categorizedResults?.reclameaqui && categorizedResults.reclameaqui.length > 0 ? `
      **Reclamações do Reclame Aqui:**
      ${categorizedResults.reclameaqui.map((r, i) => `${i + 1}. ${r.link}\n   Título: ${r.title}\n   Resumo: ${r.snippet}`).join('\n')}
      ` : ''}

      ${categorizedResults?.images && categorizedResults.images.length > 0 ? `
      **Imagens Disponíveis:**
      ${categorizedResults.images.map((img, i) => `${i + 1}. ${img.imageUrl}`).join('\n')}
      ` : ''}

      ${categorizedResults?.dealerships && categorizedResults.dealerships.length > 0 ? `
      **Concessionárias:**
      ${categorizedResults.dealerships.map((d, i) => `${i + 1}. ${d.title}\n   Endereço: ${d.address}\n   Telefone: ${d.phone}\n   Site: ${d.link}`).join('\n')}
      ` : ''}

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
      6. Para campos não encontrados, use \`null\`
      7. **Nunca invente dados** - se não encontrar, deixe \`null\`
      8. Padronize unidades: km/l, R$, mm, cv, kgfm, kWh, km/h

      **Use web search** para complementar informações que não estiverem nas URLs fornecidas.

      Retorne APENAS o JSON no formato especificado, sem markdown ou explicações adicionais.
    `;

      console.log(`🔄 Chamando OpenAI GPT-5.2 para: ${carInfo}`);

      const response = await openai.responses.create({
        model: "gpt-5.2-2025-12-11",
        instructions: SYSTEM_PROMPT_EXTRACTOR,
        input: userPrompt,
        tools: [{ type: "web_search" }],
        text: {
          format: {
            type: "json_schema",
            name: "car_data",
            strict: true,
            schema: carDataSchema
          }
        },
        temperature: 0.3,
      });

      const responseText = response.output_text || "{}";
      
      let carData: CarData;
      try {
        carData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Erro ao parsear JSON da OpenAI:", parseError);
        throw new Error("Failed to parse AI response as JSON");
      }

      carData.metadata = {
        sources: urls,
        extractedAt: new Date().toISOString(),
        model: "gpt-5.2-2025-12-11"
      };

      if (redisClient.isReady) {
        await redisClient.set(cacheKey, JSON.stringify(carData), { 
          EX: 60 * 60 * 24 
        });
        console.log(`💾 Cache saved: ${carModel}`);
      }

      return carData;

    } catch (error: any) {
      console.error("❌ OpenAI extraction error:", error.message);
      
      return {
        informacoes_gerais: {
          fabricante: null,
          modelo: carModel,
          ano: year || null,
          versao: null,
          preco: null,
          garantia: null,
          ipva: null,
          seguro: null
        },
        error: error.message,
        metadata: {
          sources: urls,
          extractedAt: new Date().toISOString(),
          model: "gpt-5.2-2025-12-11",
          failed: true
        }
      } as any;
    }
  }

  static async generateComparisonHTML(carsData: Record<string, CarData>): Promise<string> {
    
    const cacheKey = `openai_compare:${crypto
      .createHash('sha256')
      .update(JSON.stringify(carsData))
      .digest('hex')
      .substring(0, 16)}`;

    if (redisClient.isReady) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`📦 Cache hit: comparison HTML`);
        return cached;
      }
    }

    try {
      const carNames = Object.keys(carsData).join(', ');
      console.log(`🎨 Gerando HTML comparativo para: ${carNames}`);

      const carsJSON = Object.entries(carsData)
        .map(([name, data]) => `### ${name}\n${JSON.stringify(data, null, 2)}`)
        .join('\n\n---\n\n');

      const userPrompt = `
        Compare os seguintes veículos e gere um **relatório HTML completo, responsivo e visualmente atraente**:

        ${carsJSON}

        **INSTRUÇÕES DETALHADAS:**

        1. **Estrutura HTML Completa**:
          - Inclua <!DOCTYPE html>, <html>, <head> e <body>
          - Use Tailwind CSS via CDN para estilização
          - Responsivo para mobile e desktop
          - Paleta de cores moderna e profissional

        2. **Seções do Relatório**:
          
          **A) Header com Imagens**
          - Mostre imagens dos carros lado a lado no topo (use as URLs das imagens dos dados fornecidos)
          - Cards visuais com nome, ano e preço de cada carro
          
          **B) Tabelas Comparativas** (use cores para destacar)
          - 🟢 Verde: melhor valor
          - 🔴 Vermelho: pior valor
          - 🟡 Amarelo: neutro/empate
          
          Categorias:
          - Informações Gerais (preço, garantia, IPVA, seguro)
          - Motor e Desempenho
          - Consumo e Autonomia
          - Dimensões
          - Segurança (NCAP)
          - Avaliação de Proprietários
          
          **C) Reclamações (Reclame Aqui)**
          - Resumo do veredito geral das reclamações
          - Lista de até 5 principais reclamações em cards
          - Links clicáveis para cada reclamação (use os links fornecidos nos dados)
          - Adicione badge "Fonte: Reclame Aqui" para credibilidade
          
          **D) Concessionárias Próximas**
          - Cards com nome, cidade, endereço, telefone e site
          - Ícones de telefone/localização
          - Links clicáveis para os sites das concessionárias
          
          **E) Gráficos** (use Chart.js via CDN)
          - Gráfico de barras: Comparação de preços
          - Gráfico de radar: Performance geral (consumo, potência, segurança)
          - Gráfico de linha: Histórico de depreciação
          
          **F) Recomendação Final**
          - Box destacado com melhor custo-benefício
          - Justificativa clara e didática
          - Considere: preço, desempenho, consumo, segurança, satisfação

        3. **Design e UX**:
          - Use ícones do Font Awesome ou similar
          - Animações suaves (hover effects)
          - Layout limpo e organizado
          - Textos explicativos simples (para leigos)
          - Mobile-first

        4. **Observações**:
          - Se algum dado estiver \`null\`, mostre "N/D" ou "Não disponível"
          - Use \`<small>\` para notas técnicas
          - Evite jargões técnicos sem explicação
          - **IMPORTANTE**: Mantenha TODOS os links de fontes clicáveis para aumentar credibilidade

        Retorne APENAS o HTML completo, pronto para uso.
      `;

      const response = await openai.responses.create({
        model: "gpt-5.2-2025-12-11",
        instructions: SYSTEM_PROMPT_COMPARATOR,
        input: userPrompt,
        tools: [{ type: "web_search" }],
        temperature: 0.7,
      });

      const htmlContent = response.output_text || "";

      let cleanHTML = htmlContent
        .replace(/```html\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      if (!cleanHTML.includes('<!DOCTYPE')) {
        cleanHTML = `<!DOCTYPE html>\n${cleanHTML}`;
      }

      if (redisClient.isReady) {
        await redisClient.set(cacheKey, cleanHTML, { 
          EX: 60 * 60 * 24 
        });
        console.log(`💾 Cache saved: comparison HTML`);
      }

      return cleanHTML;

    } catch (error: any) {
      console.error("❌ OpenAI comparison error:", error.message);
      
      return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Erro na Comparação</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-100 p-8">
          <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <h1 class="text-2xl font-bold text-red-600 mb-4">❌ Erro ao Gerar Comparação</h1>
            <p class="text-gray-700">${error.message}</p>
            <pre class="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto">${JSON.stringify(carsData, null, 2)}</pre>
          </div>
        </body>
        </html>
      `.trim();
    }
  }
}
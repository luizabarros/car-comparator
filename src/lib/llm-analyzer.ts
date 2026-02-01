import OpenAI from 'openai';
import crypto from "crypto";
import { CarData } from "../types/car";
import { redisClient } from "./rate-limiter";
import { SYSTEM_PROMPT_EXTRACTOR, SYSTEM_PROMPT_COMPARATOR } from "@/prompts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

redisClient.on("error", (err) => console.error("Redis Client Error:", err));

interface SearchResult {
  link: string;
  title?: string;
  snippet?: string;
  type?: string;
}

export class LLMAnalyzer {
  
  /**
   * Extrai dados estruturados do carro a partir de URLs usando GPT-4 com web search
   */
  static async extractCarDataFromURLs(
    urls: string[],
    carModel: string,
    year?: number,
    searchResults?: SearchResult[]
  ): Promise<CarData> {
    
    // Gera hash para cache
    const cacheKey = `openai_extract:${carModel}:${year}:${crypto
      .createHash('sha256')
      .update(urls.join('|'))
      .digest('hex')
      .substring(0, 16)}`;

    // Verifica cache
    if (redisClient.isReady) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`📦 Cache hit: ${carModel}`);
        return JSON.parse(cached);
      }
    }

    try {
      const carInfo = year ? `${carModel} ${year}` : carModel;
      
      // Monta o prompt com as URLs e contexto
      const userPrompt = `
Analise as seguintes URLs sobre o **${carInfo}** e extraia TODAS as informações disponíveis:

**URLs para análise:**
${urls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

${searchResults ? `\n**Contexto adicional dos resultados de busca:**\n${searchResults.map(r => `- ${r.title}: ${r.snippet}`).slice(0, 5).join('\n')}` : ''}

**INSTRUÇÕES IMPORTANTES:**

1. **Visite e analise cada URL** usando web search para obter informações reais e atualizadas
2. **Preencha TODOS os campos** do JSON de resposta
3. Para campos não encontrados, use \`null\`
4. **Nunca invente dados** - se não encontrar, deixe \`null\`
5. Padronize unidades: km/l, R$, mm, cv, kgfm, kWh, km/h
6. Para **reclamações do Reclame Aqui**, faça um **resumo geral do veredito** e liste até 5 reclamações principais
7. Para **concessionárias**, liste apenas as mais relevantes da região

**Use web search** para complementar informações que não estiverem nas URLs fornecidas.

Retorne APENAS o JSON no formato especificado, sem markdown ou explicações adicionais.
`;

      console.log(`🔄 Chamando OpenAI GPT-4 para: ${carInfo}`);

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview", // ou "gpt-4" se preferir
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT_EXTRACTOR
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Mais determinístico para extração de dados
        max_tokens: 4096,
      });

      const responseText = completion.choices[0].message.content || "{}";
      
      // Parse do JSON
      let carData: CarData;
      try {
        carData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Erro ao parsear JSON da OpenAI:", parseError);
        throw new Error("Failed to parse AI response as JSON");
      }

      // Enriquece com metadados
      carData.metadata = {
        sources: urls,
        extractedAt: new Date().toISOString(),
        model: "gpt-4-turbo-preview"
      };

      // Salva no cache (24 horas)
      if (redisClient.isReady) {
        await redisClient.set(cacheKey, JSON.stringify(carData), { 
          EX: 60 * 60 * 24 
        });
        console.log(`💾 Cache saved: ${carModel}`);
      }

      return carData;

    } catch (error: any) {
      console.error("❌ OpenAI extraction error:", error.message);
      
      // Retorna estrutura vazia em caso de erro
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
          model: "gpt-4-turbo-preview",
          failed: true
        }
      } as any;
    }
  }

  /**
   * Gera HTML comparativo usando GPT-4
   */
  static async generateComparisonHTML(carsData: Record<string, CarData>): Promise<string> {
    
    const cacheKey = `openai_compare:${crypto
      .createHash('sha256')
      .update(JSON.stringify(carsData))
      .digest('hex')
      .substring(0, 16)}`;

    // Verifica cache
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

      // Prepara dados dos carros de forma legível
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
          - Mostre imagens dos carros lado a lado no topo (use as URLs das imagens dos dados, se disponíveis)
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
          - Resumo do veredito geral
          - Lista de até 5 principais reclamações em cards
          - Links clicáveis para cada reclamação
          
          **D) Concessionárias Próximas**
          - Cards com nome, cidade, site e contato
          - Ícones de telefone/localização
          
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

        Retorne APENAS o HTML completo, pronto para uso.
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT_COMPARATOR
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.7, // Mais criativo para HTML
        max_tokens: 8000,
      });

      const htmlContent = completion.choices[0].message.content || "";

      // Limpa possíveis markdown wrappers
      let cleanHTML = htmlContent
        .replace(/```html\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Garante que tem DOCTYPE
      if (!cleanHTML.includes('<!DOCTYPE')) {
        cleanHTML = `<!DOCTYPE html>\n${cleanHTML}`;
      }

      // Salva no cache (24 horas)
      if (redisClient.isReady) {
        await redisClient.set(cacheKey, cleanHTML, { 
          EX: 60 * 60 * 24 
        });
        console.log(`💾 Cache saved: comparison HTML`);
      }

      return cleanHTML;

    } catch (error: any) {
      console.error("❌ OpenAI comparison error:", error.message);
      
      // HTML de fallback em caso de erro
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
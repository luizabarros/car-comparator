import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { toUtf8 } from "@aws-sdk/util-utf8-node";

import crypto from "crypto";
import { CarData } from "../types/car";
import { redisClient } from "./rate-limiter";

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

redisClient.on("error", (err) => console.error("Redis Client Error:", err));

export class AWSLLMAnalyzer {
  private static readonly SYSTEM_PROMPT = `
    Você é um especialista em análise de veículos, capaz de interpretar HTML, comparativos e reviews de carros.

    INSTRUÇÕES:
    1. Extraia TODAS as informações disponíveis do HTML, comparativos e opiniões do usuário.
    2. Campos não encontrados: null ou omitido.
    3. Converta todos os valores para tipos corretos.
    4. Padronize unidades: km/l, R$, mm, cv, kgfm, kWh, km/h.
    5. Gere insights amigáveis para o usuário final.
    6. Inclua novos campos para diferenciação acadêmica:
      - índice de segurança NCAP
      - índice de roubo
      - histórico de depreciação
      - pós-venda e atendimento das concessionárias

    FORMATO DE RESPOSTA JSON:
    {
      "informacoes_gerais": { "fabricante": string, "modelo": string, "ano": number, "versao": string, "preco": number, "garantia": string, "ipva": number, "seguro": number },
      "motor": { "propulsao": string, "combustivel": string, "cilindros": string, "cilindrada": string, "potencia_maxima": number, "torque_maximo": number },
      "transmissao": { "cambio": string, "marchas": string, "tracao": string, "acoplamento": string },
      "suspensao": { "dianteira": string, "traseira": string, "elemento_elastico": string },
      "freios": { "dianteiros": string, "traseiros": string },
      "direcao": { "tipo": string },
      "pneus": { "dianteiros": string, "traseiros": string, "estepe": string },
      "dimensoes": { "comprimento": number, "largura": number, "altura": number, "dist_entre_eixos": number, "porta_malas": number, "peso": number },
      "desempenho": { "velocidade_max": number, "aceleracao_0_100": number, "frenagem_100_0": number },
      "consumo": { "urbano": number, "rodoviario": number, "eletrico": number | null },
      "autonomia": { "urbana": number, "rodoviaria": number, "eletrica": number | null },
      "avaliacao": { "ncap": number, "protecao_adultos": number, "protecao_criancas": number, "protecao_pedestres": number, "assistencia": number, "concessionarias": number },
      "historico_depreciacao": [{ "ano": number, "preco": number }],
      "analise_ia": {
        "custo_total_propriedade": number,
        "liquidez": "alta" | "media" | "baixa",
        "risco_manutencao": string,
        "comparacao_preditiva": string
      },
      "reclamacoes": string[],
      "concessionarias_proximas": string[],
    }
  `;

  static async analyzeCarHTML(htmlContent: string, carModel: string): Promise<CarData> {
    const cleanedContent = htmlContent.replace(/[“”]/g, '"').trim();
    const hash = crypto.createHash("sha1").update(cleanedContent).digest("hex");
    const cacheKey = `aws_llm:${carModel}:${hash}`;

    if (!redisClient.isReady) console.warn("Redis not ready, skipping cache...");

    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const command = new InvokeModelCommand({
        modelId: "amazon.titan-text",
        contentType: "application/json",
        accept: "application/json",
        input: JSON.stringify({
          prompt: `${this.SYSTEM_PROMPT}\nAnalise o HTML do veículo ${carModel}:\n${cleanedContent.substring(0, 10000)}`
        })
      });

      const response = await client.send(command);
      const rawText = response?.body ? toUtf8(response.body as Uint8Array) : "";
      const data = JSON.parse(rawText);

      await redisClient.set(cacheKey, JSON.stringify(data), { EX: 60 * 60 * 24 });

      return data;
    } catch (error: any) {
      console.error("❌ AWS Bedrock LLM error:", error.message);
      throw new Error("Failed to analyze car HTML via Bedrock");
    }
  }
}

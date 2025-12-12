import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { toUtf8 } from "@aws-sdk/util-utf8-node";

import crypto from "crypto";
import { CarData } from "../types/car";
import { redisClient } from "./rate-limiter";
import { SYSTEM_PROMPT_ANALYZER } from "@/prompts";

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

redisClient.on("error", (err) => console.error("Redis Client Error:", err));

export class LLMAnalyzer {
  private static readonly SYSTEM_PROMPT = SYSTEM_PROMPT_ANALYZER;

  static async analyzeCarContent(htmlContent: string, carModel: string): Promise<CarData> {
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
        body: JSON.stringify({
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

  static async compareCars(carsData: Record<string, CarData>): Promise<string> {
    try {
      const comparisonPrompt = `
        Você é um especialista em análise de veículos.
        Compare os seguintes carros entre si por todos os itens técnicos, financeiros e de desempenho:

        ${JSON.stringify(carsData)}

        Gere um HTML responsivo e organizado por modelo, destacando com cores ou <small> como cada carro é melhor ou pior que outro em cada ponto.
        Utilize tabelas, cores e textos explicativos para facilitar a leitura.
      `;

      const command = new InvokeModelCommand({
        modelId: "amazon.titan-text",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({ prompt: comparisonPrompt })
      });

      const response = await client.send(command);
      const rawText = response?.body ? toUtf8(response.body as Uint8Array) : "";
      return rawText;
    } catch (error: any) {
      console.error("❌ AWS Bedrock LLM comparison error:", error.message);
      throw new Error("Failed to generate car comparison HTML via Bedrock");
    }
  }
}

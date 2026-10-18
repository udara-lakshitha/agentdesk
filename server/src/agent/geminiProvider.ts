import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";
import type { LlmProvider } from "./llm";

export function createGeminiProvider(): LlmProvider {
  if (!env.geminiApiKey) throw new Error("GEMINI_API_KEY is not set");
  if (!env.geminiModel) throw new Error("GEMINI_MODEL is not set");

  const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
  const model = env.geminiModel;

  return {
    async generateText(prompt) {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      return response.text ?? "";
    },
  };
}
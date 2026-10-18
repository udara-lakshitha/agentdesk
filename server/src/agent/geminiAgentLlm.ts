import { GoogleGenAI, type FunctionDeclaration } from "@google/genai";
import { env } from "../config/env";
import type { AgentLlm } from "./llm";
import { toContents } from "./geminiMapping";

export function createGeminiAgentLlm(): AgentLlm {
  if (!env.geminiApiKey) throw new Error("GEMINI_API_KEY is not set");
  if (!env.geminiModel) throw new Error("GEMINI_MODEL is not set");

  const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
  const model = env.geminiModel;

  return {
    async chat({ system, messages, tools }) {
      const response = await ai.models.generateContent({
        model,
        contents: toContents(messages),
        config: {
          systemInstruction: system,
          temperature: 0, // the docs recommend low temperature for reliable tool calls
          tools: [
            {
              functionDeclarations: tools.map(
                (t) =>
                  ({
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters,
                  }) as FunctionDeclaration
              ),
            },
          ],
        },
      });

      const toolCalls = (response.functionCalls ?? []).map((c, i) => ({
        id: c.id ?? `call_${i}`,
        name: c.name ?? "",
        args: (c.args ?? {}) as Record<string, unknown>,
      }));

      return {
        text: response.text,
        toolCalls,
        raw: response.candidates?.[0]?.content,
      };
    },
  };
}
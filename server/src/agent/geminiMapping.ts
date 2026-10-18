import type { Content, Part } from "@google/genai";
import type { ChatMessage } from "./llm";

export function toContents(messages: ChatMessage[]): Content[] {
  const contents: Content[] = [];

  for (const m of messages) {
    if (m.role === "user") {
      contents.push({ role: "user", parts: [{ text: m.text }] });
    } else if (m.role === "assistant") {
      if (m.raw) {
        // Send Gemini's own message back untouched (keeps thought signatures)
        contents.push(m.raw as Content);
      } else {
        const parts: Part[] = [];
        if (m.text) parts.push({ text: m.text });
        for (const c of m.toolCalls ?? []) {
          parts.push({ functionCall: { id: c.id, name: c.name, args: c.args } });
        }
        contents.push({ role: "model", parts });
      }
    } else {
      const part: Part = {
        functionResponse: {
          id: m.toolCallId,
          name: m.name,
          response: { result: m.result },
        },
      };
      const last = contents[contents.length - 1];
      if (last?.role === "user" && last.parts?.every((p) => p.functionResponse)) {
        last.parts.push(part); // parallel tool results share one message
      } else {
        contents.push({ role: "user", parts: [part] });
      }
    }
  }

  return contents;
}
export interface LlmProvider {
  generateText(prompt: string): Promise<string>;
}

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
};

export type ToolCall = {
  id: string;
  name: string;
  args: Record<string, unknown>;
};

export type ChatMessage =
  | { role: "user"; text: string }
  | { role: "assistant"; text?: string; toolCalls?: ToolCall[], raw?: unknown }
  | { role: "tool"; toolCallId: string; name: string; result: unknown };

export type LlmResponse = {
  text?: string;
  toolCalls: ToolCall[];
  raw?: unknown;
};

export interface AgentLlm {
  chat(input: {
    system: string;
    messages: ChatMessage[];
    tools: ToolDefinition[];
  }): Promise<LlmResponse>;
}
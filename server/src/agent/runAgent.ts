import type { AgentLlm, ChatMessage, ToolCall } from "./llm";
import { tools } from "./tools";

const MAX_STEPS = 5;

const SYSTEM_PROMPT =
  "You are a customer support assistant for a small business. " +
  "Use the available tools to look up real information. " +
  "Never invent order details. If a tool says nothing was found, say so. " +
  "Write a short, polite reply the business can send to the customer.";

export type AgentStep = {
  tool: string;
  args: unknown;
  result: unknown;
};

export type AgentResult = {
  reply: string;
  steps: AgentStep[];
};

async function executeTool(call: ToolCall): Promise<unknown> {
  const tool = tools.find((t) => t.definition.name === call.name);
  if (!tool) return { error: `Unknown tool: ${call.name}` };
  try {
    return await tool.execute(call.args);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Tool failed" };
  }
}

export async function runAgent(llm: AgentLlm, userMessage: string): Promise<AgentResult> {
  const messages: ChatMessage[] = [{ role: "user", text: userMessage }];
  const steps: AgentStep[] = [];

  for (let i = 0; i < MAX_STEPS; i++) {
    const response = await llm.chat({
      system: SYSTEM_PROMPT,
      messages,
      tools: tools.map((t) => t.definition),
    });

    if (response.toolCalls.length === 0) {
      return { reply: response.text ?? "", steps };
    }

    messages.push({
      role: "assistant",
      text: response.text,
      toolCalls: response.toolCalls,
      raw: response.raw,
    });

    for (const call of response.toolCalls) {
      const result = await executeTool(call);
      steps.push({ tool: call.name, args: call.args, result });
      messages.push({ role: "tool", toolCallId: call.id, name: call.name, result });
    }
  }

  throw new Error("Agent exceeded the maximum number of steps");
}
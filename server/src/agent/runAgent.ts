import type { AgentLlm, ChatMessage, ToolCall } from "./llm";
import { tools, type ToolContext } from "./tools";

const MAX_STEPS = 5;

const SYSTEM_PROMPT =
   "Never invent order details." + 
   "If a tool says nothing was found," + 
   "say you could not find that order on the customer's account and ask them to double-check the order number.";

export type AgentStep = {
  tool: string;
  args: unknown;
  result: unknown;
};

export type AgentResult = {
  reply: string;
  steps: AgentStep[];
};

async function executeTool(call: ToolCall, ctx: ToolContext): Promise<unknown> {
  const tool = tools.find((t) => t.definition.name === call.name);
  if (!tool) return { error: `Unknown tool: ${call.name}` };
  try {
    return await tool.execute(call.args, ctx);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Tool failed" };
  }
}

export async function runAgent(llm: AgentLlm,
  userMessage: string, ctx: ToolContext): Promise<AgentResult> {
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
      const result = await executeTool(call, ctx);
      steps.push({ tool: call.name, args: call.args, result });
      messages.push({ role: "tool", toolCallId: call.id, name: call.name, result });
    }
  }

  throw new Error("Agent exceeded the maximum number of steps");
}
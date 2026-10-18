import { describe, it, expect } from "vitest";
import { runAgent } from "./runAgent";
import type { AgentLlm, LlmResponse } from "./llm";

function fakeLlm(responses: LlmResponse[]): AgentLlm {
  let i = 0;
  return {
    async chat() {
      const next = responses[i++];
      if (!next) throw new Error("fake LLM ran out of responses");
      return next;
    },
  };
}

describe("runAgent", () => {
  it("returns a direct answer when no tool is needed", async () => {
    const llm = fakeLlm([{ text: "Hello! How can I help?", toolCalls: [] }]);
    const result = await runAgent(llm, "Hi");
    expect(result.reply).toBe("Hello! How can I help?");
    expect(result.steps).toHaveLength(0);
  });

  it("runs a tool and then answers", async () => {
    const llm = fakeLlm([
      { toolCalls: [{ id: "c1", name: "get_order_status", args: { orderId: "1001" } }] },
      { text: "Your order 1001 has shipped.", toolCalls: [] },
    ]);
    const result = await runAgent(llm, "Where is order 1001?");
    expect(result.reply).toBe("Your order 1001 has shipped.");
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].tool).toBe("get_order_status");
    expect(result.steps[0].result).toMatchObject({ found: true, status: "shipped" });
  });

  it("feeds tool errors back instead of crashing", async () => {
    const llm = fakeLlm([
      { toolCalls: [{ id: "c1", name: "delete_everything", args: {} }] },
      { text: "Sorry, I could not do that.", toolCalls: [] },
    ]);
    const result = await runAgent(llm, "Do something odd");
    expect(result.steps[0].result).toMatchObject({ error: "Unknown tool: delete_everything" });
    expect(result.reply).toBe("Sorry, I could not do that.");
  });

  it("rejects invalid tool arguments", async () => {
    const llm = fakeLlm([
      { toolCalls: [{ id: "c1", name: "get_order_status", args: { orderId: "" } }] },
      { text: "I need a valid order ID.", toolCalls: [] },
    ]);
    const result = await runAgent(llm, "Check my order");
    expect(result.steps[0].result).toHaveProperty("error");
  });

  it("stops after too many steps", async () => {
    const looping: LlmResponse = {
      toolCalls: [{ id: "c", name: "get_order_status", args: { orderId: "1001" } }],
    };
    const llm = fakeLlm(Array(10).fill(looping));
    await expect(runAgent(llm, "loop forever")).rejects.toThrow("maximum number of steps");
  });
});
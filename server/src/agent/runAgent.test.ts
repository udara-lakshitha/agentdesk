import { describe, it, expect, vi, beforeEach } from "vitest";
import { runAgent } from "./runAgent";
import type { AgentLlm, LlmResponse } from "./llm";
import * as orders from "../repositories/orderRepository";

vi.mock("../repositories/orderRepository");

const ctx = { customerId: 1 };

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

const lookup = (orderNumber: string): LlmResponse => ({
  toolCalls: [{ id: "c1", name: "get_order_status", args: { orderNumber } }],
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(orders.findOrderForCustomer).mockImplementation(async (number, customerId) =>
    number === "1001" && customerId === 1
      ? { orderNumber: "1001", status: "shipped", eta: "2026-10-22" }
      : null
  );
});

describe("runAgent", () => {
  it("returns a direct answer when no tool is needed", async () => {
    const llm = fakeLlm([{ text: "Hello! How can I help?", toolCalls: [] }]);
    const result = await runAgent(llm, "Hi", ctx);
    expect(result.reply).toBe("Hello! How can I help?");
    expect(result.steps).toHaveLength(0);
  });

  it("runs a tool and then answers", async () => {
    const llm = fakeLlm([lookup("1001"), { text: "Your order has shipped.", toolCalls: [] }]);
    const result = await runAgent(llm, "Where is order 1001?", ctx);
    expect(result.steps[0].result).toMatchObject({ found: true, status: "shipped" });
    expect(result.reply).toBe("Your order has shipped.");
  });

  it("only searches the sender's own orders", async () => {
    const llm = fakeLlm([lookup("1002"), { text: "I couldn't find that order.", toolCalls: [] }]);
    const result = await runAgent(llm, "Status of 1002?", ctx);
    expect(orders.findOrderForCustomer).toHaveBeenCalledWith("1002", 1);
    expect(result.steps[0].result).toEqual({ found: false, orderNumber: "1002" });
  });

  it("does not search at all for an unknown sender", async () => {
    const llm = fakeLlm([lookup("1001"), { text: "I couldn't find that order.", toolCalls: [] }]);
    const result = await runAgent(llm, "Status of 1001?", { customerId: null });
    expect(orders.findOrderForCustomer).not.toHaveBeenCalled();
    expect(result.steps[0].result).toMatchObject({ found: false });
  });

  it("feeds unknown tool errors back instead of crashing", async () => {
    const llm = fakeLlm([
      { toolCalls: [{ id: "c1", name: "delete_everything", args: {} }] },
      { text: "Sorry, I could not do that.", toolCalls: [] },
    ]);
    const result = await runAgent(llm, "Do something odd", ctx);
    expect(result.steps[0].result).toMatchObject({ error: "Unknown tool: delete_everything" });
  });

  it("rejects invalid tool arguments", async () => {
    const llm = fakeLlm([lookup(""), { text: "I need a valid order number.", toolCalls: [] }]);
    const result = await runAgent(llm, "Check my order", ctx);
    expect(result.steps[0].result).toHaveProperty("error");
    expect(orders.findOrderForCustomer).not.toHaveBeenCalled();
  });

  it("stops after too many steps", async () => {
    const llm = fakeLlm(Array(10).fill(lookup("1001")));
    await expect(runAgent(llm, "loop forever", ctx)).rejects.toThrow("maximum number of steps");
  });
});
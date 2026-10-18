import { z } from "zod";
import type { ToolDefinition } from "./llm";

export type Tool = {
  definition: ToolDefinition;
  execute(args: unknown): Promise<unknown>;
};

// Fake data for now. A real database table comes later.
const orders: Record<string, { status: string; eta: string }> = {
  "1001": { status: "shipped", eta: "2026-10-22" },
  "1002": { status: "processing", eta: "2026-10-25" },
};

const getOrderStatusArgs = z.object({
  orderId: z.string().trim().min(1),
});

export const getOrderStatus: Tool = {
  definition: {
    name: "get_order_status",
    description: "Look up the current status and delivery estimate of an order by its ID.",
    parameters: {
      type: "object",
      properties: {
        orderId: { type: "string", description: "The order ID, for example 1001" },
      },
      required: ["orderId"],
    },
  },
  async execute(args) {
    const { orderId } = getOrderStatusArgs.parse(args);
    const order = orders[orderId];
    if (!order) return { found: false, orderId };
    return { found: true, orderId, ...order };
  },
};

export const tools: Tool[] = [getOrderStatus];
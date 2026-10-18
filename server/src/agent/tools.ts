import { z } from "zod";
import type { ToolDefinition } from "./llm";
import { findOrderForCustomer } from "../repositories/orderRepository";

// Set by OUR code from the message record. The model never controls this.
export type ToolContext = { customerId: number | null };

export type Tool = {
  definition: ToolDefinition;
  execute(args: unknown, ctx: ToolContext): Promise<unknown>;
};

const getOrderStatusArgs = z.object({
  orderNumber: z.string().trim().min(1),
});

export const getOrderStatus: Tool = {
  definition: {
    name: "get_order_status",
    description:
      "Look up the status and delivery estimate of one of THIS customer's orders by order number.",
    parameters: {
      type: "object",
      properties: {
        orderNumber: { type: "string", description: "The order number, for example 1001" },
      },
      required: ["orderNumber"],
    },
  },
  async execute(args, ctx) {
    const { orderNumber } = getOrderStatusArgs.parse(args);

    // Unknown sender: we cannot tell whose orders to search
    if (ctx.customerId === null) return { found: false, orderNumber };

    const order = await findOrderForCustomer(orderNumber, ctx.customerId);

    // Same answer for "doesn't exist" and "belongs to someone else",
    // so the reply never reveals that another customer's order exists.
    if (!order) return { found: false, orderNumber };

    return { found: true, ...order };
  },
};

export const tools: Tool[] = [getOrderStatus];
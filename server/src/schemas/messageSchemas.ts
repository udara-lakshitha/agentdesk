import { z } from "zod";

export const createMessageSchema = z.object({
  from: z.string().trim().min(1).max(100),
  body: z.string().trim().min(1).max(5000),
});
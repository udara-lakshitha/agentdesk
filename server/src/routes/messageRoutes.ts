import { Router } from "express";
import * as messageService from "../services/messageService";
import { createMessageSchema } from "../schemas/messageSchemas";

export const messageRoutes = Router();

messageRoutes.get("/", async (_req, res) => {
  res.json(await messageService.getMessages());
});

messageRoutes.post("/", async (req, res) => {
  const { from, body } = createMessageSchema.parse(req.body);
  res.status(201).json(await messageService.createMessage(from, body));
});
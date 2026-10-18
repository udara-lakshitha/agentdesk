import { Router } from "express";
import { z } from "zod";
import * as agentService from "../services/agentService";
import rateLimit from "express-rate-limit";

export const agentRoutes = Router();

const idParams = z.object({ id: z.coerce.number().int().positive() });
const approveBody = z.object({
  reply: z.string().trim().min(1).max(5000).optional(),
});

const runLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many agent runs. Slow down." },
});

agentRoutes.post("/messages/:id/run", runLimiter, async (req, res) => {
  const { id } = idParams.parse(req.params);
  res.status(201).json(await agentService.runForMessage(id));
});

agentRoutes.get("/runs", async (_req, res) => {
  res.json(await agentService.listRuns());
});

agentRoutes.get("/runs/:id", async (req, res) => {
  const { id } = idParams.parse(req.params);
  res.json(await agentService.getRun(id));
});

agentRoutes.post("/runs/:id/approve", async (req, res) => {
  const { id } = idParams.parse(req.params);
  const { reply } = approveBody.parse(req.body ?? {});
  res.json(await agentService.approveRun(id, reply));
});

agentRoutes.post("/runs/:id/reject", async (req, res) => {
  const { id } = idParams.parse(req.params);
  res.json(await agentService.rejectRun(id));
});
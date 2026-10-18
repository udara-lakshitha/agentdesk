import { Router } from "express";
import * as messageService from "../services/messageService";

export const messageRoutes = Router();

messageRoutes.get("/", async (_req, res) => {
    res.json(await messageService.getMessages());
});

messageRoutes.post("/", async (req, res) => {
    const { from, body } = req.body;
    if (!from || !body) {
        return res.status(400).json({ error: "from and body are required" });
    }
    res.status(201).json(await messageService.createMessage(from, body));
});
import express from "express";
import cors from "cors";
import { messageRoutes } from "./routes/messageRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { agentRoutes } from "./routes/agentRoutes";

export const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/messages", messageRoutes);
app.use("/api", agentRoutes);
app.use(errorHandler);
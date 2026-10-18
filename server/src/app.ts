import express, { Router } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { authRoutes } from "./routes/authRoutes";
import { messageRoutes } from "./routes/messageRoutes";
import { agentRoutes } from "./routes/agentRoutes";
import { requireAuth } from "./middleware/requireAuth";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

// Everything below requires a signed-in user
const protectedApi = Router();
protectedApi.use(requireAuth);
protectedApi.use("/messages", messageRoutes);
protectedApi.use(agentRoutes);
app.use("/api", protectedApi);

app.use(errorHandler);
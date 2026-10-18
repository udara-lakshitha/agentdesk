import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { COOKIE_NAME } from "../config/auth";
import { env } from "../config/env";
import { requireAuth } from "../middleware/requireAuth";
import * as authService from "../services/authService";

export const authRoutes = Router();

const loginBody = z.object({
  email: z.string().trim().min(1).max(200),
  password: z.string().min(1).max(200),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

authRoutes.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = loginBody.parse(req.body);
  const { token, expiresAt, user } = await authService.login(email, password);

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    expires: expiresAt,
    path: "/",
  });
  res.json(user);
});

authRoutes.post("/logout", async (req, res) => {
  const token: unknown = req.cookies?.[COOKIE_NAME];
  if (typeof token === "string" && token) await authService.logout(token);
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

authRoutes.get("/me", requireAuth, (_req, res) => {
  res.json(res.locals.user);
});
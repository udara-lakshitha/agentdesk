import type { NextFunction, Request, Response } from "express";
import { COOKIE_NAME } from "../config/auth";
import { HttpError } from "./errorHandler";
import * as authService from "../services/authService";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token: unknown = req.cookies?.[COOKIE_NAME];
  if (typeof token !== "string" || !token) throw new HttpError(401, "Not signed in");

  const user = await authService.getUserBySession(token);
  if (!user) throw new HttpError(401, "Not signed in");

  res.locals.user = user;
  next();
}
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  // malformed JSON in the request body
  if (typeof err === "object" && err !== null && "type" in err && err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  console.error(err); // real details go to the log, never to the client
  res.status(500).json({ error: "Internal server error" });
}
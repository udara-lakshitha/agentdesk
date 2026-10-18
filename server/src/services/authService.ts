import { createHash, randomBytes } from "node:crypto";
import { SESSION_MS } from "../config/auth";
import { hashPassword, verifyPassword } from "../auth/password";
import { HttpError } from "../middleware/errorHandler";
import * as users from "../repositories/userRepository";
import * as sessions from "../repositories/sessionRepository";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function login(email: string, password: string) {
  const user = await users.findByEmail(email);

  let valid = false;
  if (user) {
    valid = await verifyPassword(password, user.passwordHash);
  } else {
    await hashPassword(password); // spend similar time, so timing doesn't reveal unknown emails
  }

  if (!user || !valid) throw new HttpError(401, "Invalid email or password");

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MS);
  await sessions.create(user.id, hashToken(token), expiresAt);

  return { token, expiresAt, user: { id: user.id, email: user.email } };
}

export function getUserBySession(token: string) {
  return sessions.findValidUser(hashToken(token));
}

export async function logout(token: string) {
  await sessions.remove(hashToken(token));
}
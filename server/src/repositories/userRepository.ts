import { pool } from "../db/pool";

export type UserRecord = { id: number; email: string; passwordHash: string };

export async function findByEmail(email: string): Promise<UserRecord | null> {
  const { rows } = await pool.query(
    `SELECT id, email, password_hash AS "passwordHash"
     FROM users WHERE lower(email) = lower($1)`,
    [email]
  );
  return rows[0] ?? null;
}

export async function upsertUser(email: string, passwordHash: string): Promise<void> {
  await pool.query(
    `INSERT INTO users (email, password_hash) VALUES (lower($1), $2)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [email, passwordHash]
  );
}
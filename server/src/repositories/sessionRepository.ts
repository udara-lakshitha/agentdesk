import { pool } from "../db/pool";

export type SessionUser = { id: number; email: string };

export async function create(userId: number, tokenHash: string, expiresAt: Date): Promise<void> {
  await pool.query(
    `INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)`,
    [tokenHash, userId, expiresAt]
  );
}

export async function findValidUser(tokenHash: string): Promise<SessionUser | null> {
  const { rows } = await pool.query(
    `SELECT u.id, u.email
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [tokenHash]
  );
  return rows[0] ?? null;
}

export async function remove(tokenHash: string): Promise<void> {
  await pool.query(`DELETE FROM sessions WHERE token_hash = $1`, [tokenHash]);
}
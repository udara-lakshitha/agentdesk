import { pool } from "../db/pool";

export type Customer = { id: number; name: string; email: string };

export async function findByEmail(email: string): Promise<Customer | null> {
  const { rows } = await pool.query(
    `SELECT id, name, email FROM customers WHERE lower(email) = lower($1)`,
    [email]
  );
  return rows[0] ?? null;
}
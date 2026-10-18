import { pool } from "../db/pool";

export type Message = {
  id: number;
  from: string;
  body: string;
  createdAt: string;
  customerId: number | null;
};

const columns = `id, sender AS "from", body, created_at AS "createdAt", customer_id AS "customerId"`;

export async function listMessages(): Promise<Message[]> {
  const { rows } = await pool.query(`SELECT ${columns} FROM messages ORDER BY id`);
  return rows;
}

export async function getMessage(id: number): Promise<Message | null> {
  const { rows } = await pool.query(
    `SELECT ${columns} FROM messages WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function insertMessage(
  from: string,
  body: string,
  customerId: number | null
): Promise<Message> {
  const { rows } = await pool.query(
    `INSERT INTO messages (sender, body, customer_id)
     VALUES ($1, $2, $3)
     RETURNING ${columns}`,
    [from, body, customerId]
  );
  return rows[0];
}
import { pool } from "../db/pool";

export type Message = {
    id: number;
    from: string;
    body: string;
    createdAt: string;
};

const columns = `id, sender AS "from", body, created_at AS "createdAt"`;

export async function listMessages(): Promise<Message[]> {
    const { rows } = await pool.query(`SELECT ${columns} FROM messages ORDER BY id`);
    return rows;
}

export async function insertMessage(from: string, body: string): Promise<Message> {
    const { rows } = await pool.query(
        `INSERT INTO messages (sender, body) VALUES ($1, $2) RETURNING ${columns}`,
        [from, body]
    );
    return rows[0];
}

export async function getMessage(id: number): Promise<Message | null> {
  const { rows } = await pool.query(
    `SELECT ${columns} FROM messages WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}
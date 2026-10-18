import { pool } from "./pool";

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS agent_runs (
      id SERIAL PRIMARY KEY,
      message_id INTEGER NOT NULL REFERENCES messages(id),
      status TEXT NOT NULL
        CHECK (status IN ('pending_approval', 'approved', 'rejected', 'failed')),
      draft_reply TEXT,
      final_reply TEXT,
      steps JSONB NOT NULL DEFAULT '[]',
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      reviewed_at TIMESTAMPTZ
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      status TEXT NOT NULL
        CHECK (status IN ('processing', 'shipped', 'delivered', 'cancelled')),
      eta DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id)
  `);
  console.log("Migration complete");
  await pool.end();
}

migrate().catch((err) => {
    console.error(err);
    process.exit(1);
});
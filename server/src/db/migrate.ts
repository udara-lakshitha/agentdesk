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
  console.log("Migration complete");
  await pool.end();
}

migrate().catch((err) => {
    console.error(err);
    process.exit(1);
});
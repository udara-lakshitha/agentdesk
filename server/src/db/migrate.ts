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
    console.log("Migration complete");
    await pool.end();
}

migrate().catch((err) => {
    console.error(err);
    process.exit(1);
});
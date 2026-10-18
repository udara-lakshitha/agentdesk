import { z } from "zod";
import { pool } from "../db/pool";
import { hashPassword } from "../auth/password";
import { upsertUser } from "../repositories/userRepository";

const args = z.object({
  email: z.string().email(),
  password: z.string().min(10, "Use at least 10 characters"),
});

async function main() {
  const [email, password] = process.argv.slice(2);
  const parsed = args.parse({ email, password });
  await upsertUser(parsed.email, await hashPassword(parsed.password));
  console.log(`User ready: ${parsed.email}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
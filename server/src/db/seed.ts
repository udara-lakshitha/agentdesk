import { pool } from "./pool";

async function seed() {
  const customers = [
    { name: "Nimal Perera", email: "nimal@example.com" },
    { name: "Kasuni Silva", email: "kasuni@example.com" },
  ];

  for (const c of customers) {
    await pool.query(
      `INSERT INTO customers (name, email) VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING`,
      [c.name, c.email]
    );
  }

  const orders = [
    { orderNumber: "1001", email: "nimal@example.com", status: "shipped", eta: "2026-10-22" },
    { orderNumber: "1002", email: "kasuni@example.com", status: "processing", eta: "2026-10-25" },
    { orderNumber: "1003", email: "nimal@example.com", status: "cancelled", eta: null },
  ];

  for (const o of orders) {
    await pool.query(
      `INSERT INTO orders (order_number, customer_id, status, eta)
       SELECT $1::text, id, $3::text, $4::date FROM customers WHERE email = $2::text
       ON CONFLICT (order_number) DO NOTHING`,
      [o.orderNumber, o.email, o.status, o.eta]
    );
  }

  console.log("Seed complete");
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
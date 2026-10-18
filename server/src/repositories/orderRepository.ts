import { pool } from "../db/pool";

export type OrderSummary = {
  orderNumber: string;
  status: string;
  eta: string | null;
};

// The customer_id condition is the security rule: you can only ever
// find an order that belongs to this customer.
export async function findOrderForCustomer(
  orderNumber: string,
  customerId: number
): Promise<OrderSummary | null> {
  const { rows } = await pool.query(
    `SELECT order_number AS "orderNumber",
            status,
            to_char(eta, 'YYYY-MM-DD') AS eta
     FROM orders
     WHERE order_number = $1 AND customer_id = $2`,
    [orderNumber, customerId]
  );
  return rows[0] ?? null;
}
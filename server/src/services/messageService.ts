import * as repo from "../repositories/messageRepository";
import * as customers from "../repositories/customerRepository";

export function getMessages() {
  return repo.listMessages();
}

export async function createMessage(from: string, body: string) {
  const sender = from.trim();
  // The sender is treated as the customer's email. Unknown senders get no customer.
  const customer = await customers.findByEmail(sender);
  return repo.insertMessage(sender, body.trim(), customer?.id ?? null);
}
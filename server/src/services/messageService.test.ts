import { describe, it, expect, vi, beforeEach } from "vitest";
import * as service from "./messageService";
import * as messages from "../repositories/messageRepository";
import * as customers from "../repositories/customerRepository";

vi.mock("../repositories/messageRepository");
vi.mock("../repositories/customerRepository");

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(messages.insertMessage).mockResolvedValue({} as messages.Message);
});

describe("createMessage", () => {
  it("links the message to a known customer", async () => {
    vi.mocked(customers.findByEmail).mockResolvedValue({
      id: 7, name: "Nimal", email: "nimal@example.com",
    });
    await service.createMessage("  nimal@example.com ", " hello ");
    expect(messages.insertMessage).toHaveBeenCalledWith("nimal@example.com", "hello", 7);
  });

  it("stores no customer for an unknown sender", async () => {
    vi.mocked(customers.findByEmail).mockResolvedValue(null);
    await service.createMessage("stranger@example.com", "hello");
    expect(messages.insertMessage).toHaveBeenCalledWith("stranger@example.com", "hello", null);
  });
});
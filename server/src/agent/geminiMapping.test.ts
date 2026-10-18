import { describe, it, expect } from "vitest";
import { toContents } from "./geminiMapping";

describe("toContents", () => {
  it("maps a user message", () => {
    expect(toContents([{ role: "user", text: "hi" }])).toEqual([
      { role: "user", parts: [{ text: "hi" }] },
    ]);
  });

  it("groups parallel tool results into one user message", () => {
    const contents = toContents([
      { role: "user", text: "hi" },
      {
        role: "assistant",
        toolCalls: [
          { id: "a", name: "t", args: {} },
          { id: "b", name: "t", args: {} },
        ],
      },
      { role: "tool", toolCallId: "a", name: "t", result: { x: 1 } },
      { role: "tool", toolCallId: "b", name: "t", result: { x: 2 } },
    ]);
    expect(contents).toHaveLength(3);
    expect(contents[2].parts).toHaveLength(2);
  });

  it("sends the original model message back untouched", () => {
    const raw = {
      role: "model",
      parts: [{ functionCall: { name: "t", args: {} }, thoughtSignature: "sig" }],
    };
    const contents = toContents([
      { role: "user", text: "hi" },
      { role: "assistant", raw, toolCalls: [{ id: "a", name: "t", args: {} }] },
    ]);
    expect(contents[1]).toBe(raw);
  });
});
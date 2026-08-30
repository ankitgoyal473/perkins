import { describe, it, expect, vi, beforeEach } from "vitest";

const { executePayByDepartment } = vi.hoisted(() => ({
  executePayByDepartment: vi.fn().mockResolvedValue([
    { group: "Engineering", headcount: 2, avgTotal: 100000, medianTotal: 100000 },
  ]),
}));

vi.mock("@/lib/ai/templates", () => ({
  REPORT_TOOLS: {
    payByDepartment: { execute: executePayByDepartment },
  },
}));

vi.mock("ai", () => ({
  generateText: vi.fn(async ({ tools }: { tools: Record<string, { execute: (args: object) => Promise<unknown> }> }) => {
    // Simulate the model choosing to call payByDepartment — the AI SDK
    // itself is not exercised here, only that ask.ts wires REPORT_TOOLS
    // through as `tools` and returns whatever text comes back.
    const data = await tools.payByDepartment.execute({});
    return { text: `Engineering averages ${(data as { avgTotal: number }[])[0].avgTotal}.` };
  }),
  stepCountIs: vi.fn(),
}));

import { answerQuestion } from "@/lib/ai/ask";
import { generateText } from "ai";

describe("answerQuestion", () => {
  beforeEach(() => {
    executePayByDepartment.mockClear();
  });

  it("passes the fixed report tools through and returns the model's summary", async () => {
    const answer = await answerQuestion("what's the average pay by department?");
    expect(executePayByDepartment).toHaveBeenCalled();
    expect(answer).toContain("100000");
  });

  it("falls back to a default message when the model produces no text", async () => {
    vi.mocked(generateText).mockResolvedValueOnce({ text: "" } as never);
    const answer = await answerQuestion("irrelevant question");
    expect(answer).toBe("I couldn't produce an answer for that question.");
  });
});

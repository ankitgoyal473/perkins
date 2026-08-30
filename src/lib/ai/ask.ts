import { generateText, stepCountIs } from "ai";
import { REPORT_TOOLS } from "./templates";

const MODEL = "openai/gpt-5.4-mini";

export async function answerQuestion(question: string): Promise<string> {
  const result = await generateText({
    model: MODEL,
    system:
      "You answer an HR manager's questions about employee pay by calling " +
      "the provided tools. Never invent numbers yourself — every figure in " +
      "your answer must come from a tool result. If no tool covers the " +
      "question, say so and suggest what is available (pay by department, " +
      "country, or level; and the compensation trend over time).",
    prompt: question,
    tools: REPORT_TOOLS,
    stopWhen: stepCountIs(3),
  });

  return result.text || "I couldn't produce an answer for that question.";
}

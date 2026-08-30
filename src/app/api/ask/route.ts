import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { answerQuestion } from "@/lib/ai/ask";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { question } = await req.json();
  if (typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "Missing question" }, { status: 400 });
  }

  const answer = await answerQuestion(question);
  return NextResponse.json({ answer });
}

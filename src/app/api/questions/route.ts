import { NextResponse } from "next/server";
import { getLessonBySlug } from "@/lib/content";
import { addLessonQuestion } from "@/lib/questions-store";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to post a question." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }
  if (!json || typeof json !== "object") {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }
  const row = json as Record<string, unknown>;
  const lessonSlug = typeof row.lessonSlug === "string" ? row.lessonSlug : "";
  const question = typeof row.question === "string" ? row.question.trim() : "";
  if (!getLessonBySlug(lessonSlug)) {
    return NextResponse.json({ error: "Unknown lesson." }, { status: 404 });
  }
  if (question.length < 2 || question.length > 400) {
    return NextResponse.json({ error: "Question must be between 2 and 400 characters." }, { status: 400 });
  }
  if (!user.email) {
    return NextResponse.json({ error: "This session has no email to show as the author." }, { status: 400 });
  }

  try {
    const saved = await addLessonQuestion({
      lessonSlug,
      userId: user.id,
      author: user.email,
      question,
    });
    return NextResponse.json({ question: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the question.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

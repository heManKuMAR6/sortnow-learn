import { NextResponse } from "next/server";
import { getLessonBySlug } from "@/lib/content";
import { isOpenAIConfigured } from "@/lib/env";
import { answerFromLesson } from "@/lib/lesson-answer";
import { rateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";

type CoachSource = "lesson" | "model";

async function askModel(lessonTitle: string, keyPoints: string[], question: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("OPENAI_API_KEY is not set.");
  const notes = keyPoints.map((point) => `- ${point}`).join("\n");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: [
            "You are the lesson coach for Sortnow Learn.",
            "Answer only from the key points below. The title is a label, not extra fact.",
            "If the key points do not cover the question, say the lesson does not cover it.",
            "Do not invent citations, quotes, numbers, or sources that are not written in the key points.",
            "Plain sentences. No slogans.",
            "",
            `Lesson: ${lessonTitle}`,
            "Key points:",
            notes,
          ].join("\n"),
        },
        { role: "user", content: question },
      ],
    }),
  });
  const body = (await response.json()) as {
    error?: { message?: string };
    choices?: { message?: { content?: string | null } }[];
  };
  if (!response.ok) {
    throw new Error(body.error?.message ?? "The model request failed.");
  }
  const text = body.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("The model returned an empty answer.");
  return text;
}

export async function POST(request: Request) {
  // The coach can call a paid model, so it is for signed-in people only, and rate limited.
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to use the coach." }, { status: 401 });
  }
  const limit = rateLimit(`coach:${user.id}`, 20, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `You have asked a lot just now. Try again in ${Math.ceil(limit.retryAfterSec / 60)} minutes.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
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
  const lesson = getLessonBySlug(lessonSlug);
  if (!lesson) {
    return NextResponse.json({ error: "Unknown lesson." }, { status: 404 });
  }
  if (question.length < 2 || question.length > 400) {
    return NextResponse.json({ error: "Ask a shorter question, at least a couple of words." }, { status: 400 });
  }

  if (!isOpenAIConfigured()) {
    return NextResponse.json({
      answer: answerFromLesson(lesson, question),
      source: "lesson" satisfies CoachSource,
    });
  }

  try {
    const answer = await askModel(lesson.title, lesson.keyPoints, question);
    return NextResponse.json({ answer, source: "model" satisfies CoachSource });
  } catch {
    return NextResponse.json({
      answer: answerFromLesson(lesson, question),
      source: "lesson" satisfies CoachSource,
    });
  }
}

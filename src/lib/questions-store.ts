import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type LessonQuestion = {
  id: string;
  lessonSlug: string;
  userId: string;
  author: string;
  question: string;
  createdAt: string;
};

const filePath = path.join(process.cwd(), "data", "questions.json");
const recent: LessonQuestion[] = [];
const MAX_RECENT = 200;

function remember(row: LessonQuestion) {
  recent.unshift(row);
  if (recent.length > MAX_RECENT) recent.length = MAX_RECENT;
}

function isRow(value: unknown): value is LessonQuestion {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.lessonSlug === "string" &&
    typeof row.userId === "string" &&
    typeof row.author === "string" &&
    typeof row.question === "string" &&
    typeof row.createdAt === "string"
  );
}

async function readAll(): Promise<LessonQuestion[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRow);
  } catch {
    return [];
  }
}

function byNewest(rows: LessonQuestion[], lessonSlug: string): LessonQuestion[] {
  return rows
    .filter((row) => row.lessonSlug === lessonSlug)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

async function localQuestionsFor(lessonSlug: string): Promise<LessonQuestion[]> {
  const fromFile = await readAll();
  const merged = new Map<string, LessonQuestion>();
  for (const row of fromFile) merged.set(row.id, row);
  for (const row of recent) merged.set(row.id, row);
  return byNewest([...merged.values()], lessonSlug).slice(0, 40);
}

async function appendLocal(row: LessonQuestion): Promise<LessonQuestion> {
  remember(row);
  const all = await readAll();
  all.push(row);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(all, null, 2));
  return row;
}

export async function listLessonQuestions(
  lessonSlug: string,
): Promise<{ questions: LessonQuestion[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { questions: await localQuestionsFor(lessonSlug), error: null };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lesson_questions")
    .select("id, lesson_slug, user_id, author, question, created_at")
    .eq("lesson_slug", lessonSlug)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) return { questions: [], error: error.message };
  const questions = (data ?? []).map((row) => {
    const item = row as {
      id: string;
      lesson_slug: string;
      user_id: string;
      author: string;
      question: string;
      created_at: string;
    };
    return {
      id: item.id,
      lessonSlug: item.lesson_slug,
      userId: item.user_id,
      author: item.author,
      question: item.question,
      createdAt: item.created_at,
    };
  });
  return { questions, error: null };
}

export async function addLessonQuestion(input: {
  lessonSlug: string;
  userId: string;
  author: string;
  question: string;
}): Promise<LessonQuestion> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("lesson_questions")
      .insert({
        lesson_slug: input.lessonSlug,
        user_id: input.userId,
        author: input.author,
        question: input.question,
      })
      .select("id, lesson_slug, user_id, author, question, created_at")
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "Could not save the question.");
    }
    const item = data as {
      id: string;
      lesson_slug: string;
      user_id: string;
      author: string;
      question: string;
      created_at: string;
    };
    return {
      id: item.id,
      lessonSlug: item.lesson_slug,
      userId: item.user_id,
      author: item.author,
      question: item.question,
      createdAt: item.created_at,
    };
  }

  return appendLocal({
    id: randomUUID(),
    lessonSlug: input.lessonSlug,
    userId: input.userId,
    author: input.author,
    question: input.question,
    createdAt: new Date().toISOString(),
  });
}

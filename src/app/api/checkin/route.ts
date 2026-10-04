import { NextResponse } from "next/server";
import { bad, fromError, readJson, requireUser } from "@/lib/api";
import { getLessonBySlug } from "@/lib/content";
import { getCurrentProfile } from "@/lib/current-profile";
import { resolveDay } from "@/lib/platform/dates";
import { getStore } from "@/lib/platform/store";
import { LESSON_POINTS } from "@/lib/points";

// Once per visitor day: +1 point and the streak moves. Also settles any lessons
// finished while signed out (kept in the browser), each paying once.
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const body = await readJson(request);
  if (!body) return bad("Expected JSON.");

  try {
    if (!(await getCurrentProfile(auth.user))) return bad("No profile yet.", 404);
    const store = getStore();
    const day = resolveDay(body.day);
    const checkin = await store.checkIn(auth.user.id, day);

    let lessonPoints = 0;
    const lessons = Array.isArray(body.lessons) ? body.lessons.slice(0, 20) : [];
    for (const slug of lessons) {
      if (typeof slug !== "string" || !getLessonBySlug(slug)) continue;
      const r = await store.award(auth.user.id, "lesson", slug, LESSON_POINTS, day);
      if (r.awarded) lessonPoints += LESSON_POINTS;
    }
    return NextResponse.json({ checkin, lessonPoints });
  } catch (error) {
    return fromError(error);
  }
}

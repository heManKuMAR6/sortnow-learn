import { NextResponse } from "next/server";
import { bad, fromError, readJson, requireUser } from "@/lib/api";
import { getLessonBySlug } from "@/lib/content";
import { getCurrentProfile } from "@/lib/current-profile";
import { isValidTimezone } from "@/lib/platform/dates";
import { getStore } from "@/lib/platform/store";

// Once per local calendar day: +1 point and the streak moves. The browser sends only
// its timezone (the day is worked out here, from the server clock) and any lessons it
// finished as a guest, which are checked against the catalog and paid once.
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const body = await readJson(request);
  if (!body) return bad("Expected JSON.");

  try {
    if (!(await getCurrentProfile(auth.user))) return bad("No profile yet.", 404);
    const store = getStore();
    if (isValidTimezone(body.tz)) await store.setTimezone(auth.user.id, body.tz).catch(() => undefined);
    const checkin = await store.checkIn(auth.user.id);

    let lessonPoints = 0;
    const lessons = Array.isArray(body.lessons) ? body.lessons.slice(0, 20) : [];
    for (const slug of lessons) {
      if (typeof slug !== "string" || !getLessonBySlug(slug)) continue;
      const r = await store.completeLesson(auth.user.id, slug).catch(() => null);
      if (r?.awarded) lessonPoints += r.gained;
    }
    const done = (await store.completed(auth.user.id)).lessons;
    return NextResponse.json({ checkin, lessonPoints, lessons: done });
  } catch (error) {
    return fromError(error);
  }
}

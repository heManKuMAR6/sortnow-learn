import { NextResponse } from "next/server";
import { bad, fromError, readJson, requireUser } from "@/lib/api";
import { getLessonBySlug } from "@/lib/content";
import { getCurrentProfile } from "@/lib/current-profile";
import { resolveDay } from "@/lib/platform/dates";
import { getStore } from "@/lib/platform/store";
import { LESSON_POINTS } from "@/lib/points";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const body = await readJson(request);
  const slug = typeof body?.slug === "string" ? body.slug : "";
  if (!getLessonBySlug(slug)) return bad("Unknown lesson.", 404);
  try {
    if (!(await getCurrentProfile(auth.user))) return bad("No profile yet.", 404);
    const result = await getStore().award(auth.user.id, "lesson", slug, LESSON_POINTS, resolveDay(body?.day));
    return NextResponse.json({ ...result, gained: result.awarded ? LESSON_POINTS : 0 });
  } catch (error) {
    return fromError(error);
  }
}

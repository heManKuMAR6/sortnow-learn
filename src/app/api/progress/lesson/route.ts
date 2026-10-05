import { NextResponse } from "next/server";
import { bad, fromError, readJson, requireUser } from "@/lib/api";
import { getLessonBySlug } from "@/lib/content";
import { getCurrentProfile } from "@/lib/current-profile";
import { getStore } from "@/lib/platform/store";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const body = await readJson(request);
  const slug = typeof body?.slug === "string" ? body.slug : "";
  if (!getLessonBySlug(slug)) return bad("Unknown lesson.", 404);
  try {
    if (!(await getCurrentProfile(auth.user))) return bad("No profile yet.", 404);
    const result = await getStore().completeLesson(auth.user.id, slug);
    return NextResponse.json(result);
  } catch (error) {
    return fromError(error);
  }
}

import { NextResponse } from "next/server";
import { bad, fromError, readJson, requireUser, str } from "@/lib/api";
import { loadJob } from "@/lib/jobs-data";
import { getStore } from "@/lib/platform/store";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  if (!(await loadJob(slug))) return bad("That role is not open any more.", 404);
  const body = await readJson(request);
  const note = str(body?.note ?? "", 800);
  if (note === null) return bad("Keep the note under 800 characters.");
  try {
    const result = await getStore().applyToJob(auth.user.id, slug, note);
    return NextResponse.json(result);
  } catch (error) {
    return fromError(error);
  }
}

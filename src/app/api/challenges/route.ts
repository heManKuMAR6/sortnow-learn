import { NextResponse } from "next/server";
import { completeChallenge } from "@/lib/practice";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to save a day." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a response." }, { status: 400 });
  }
  const row = body && typeof body === "object" ? (body as { challengeId?: unknown; response?: unknown }) : {};
  const result = await completeChallenge(user, row.challengeId, row.response);
  if ("error" in result) {
    const status = result.error === "Sign in to save a day." ? 401 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { saveDisplayName } from "@/lib/practice";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to save your name." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a name." }, { status: 400 });
  }
  const displayName =
    body && typeof body === "object" ? (body as { displayName?: unknown }).displayName : undefined;
  const result = await saveDisplayName(user, displayName);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, displayName: result.name });
}

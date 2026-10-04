import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DEMO_COOKIE, demoCookieOptions } from "@/lib/demo-session";
import { signInDemo, signUpDemo } from "@/lib/demo-users";
import { isSupabaseConfigured } from "@/lib/env";

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200;
}

export async function POST(request: Request) {
  if (isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Use email and password on the sign-in page." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }
  const row = body as Record<string, unknown>;
  const intent = row.intent;
  const email = typeof row.email === "string" ? row.email.trim().toLowerCase() : "";
  const password = typeof row.password === "string" ? row.password : "";
  if (intent !== "signup" && intent !== "signin") {
    return NextResponse.json({ error: "intent must be signup or signin." }, { status: 400 });
  }
  if (!validEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (password.length < 6 || password.length > 200) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  try {
    const user = intent === "signup" ? await signUpDemo(email, password) : await signInDemo(email, password);
    const jar = await cookies();
    jar.set(DEMO_COOKIE, JSON.stringify({ id: user.id, email: user.email }), demoCookieOptions());
    return NextResponse.json({
      user: { id: user.id, email: user.email },
      mode: "demo",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not sign in.";
    const status = message.includes("already") ? 409 : 401;
    return NextResponse.json({ error: message }, { status: intent === "signup" && status === 401 ? 400 : status });
  }
}

export async function DELETE() {
  const jar = await cookies();
  jar.set(DEMO_COOKIE, "", { ...demoCookieOptions(), maxAge: 0 });
  return NextResponse.json({ ok: true });
}

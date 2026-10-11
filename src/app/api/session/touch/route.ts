import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { IDLE_COOKIE, idleCookieOptions, signActive } from "@/lib/idle";
import { cookies } from "next/headers";

// The browser calls this while the person is genuinely using the site (clicks, typing, scrolling),
// so the idle clock only runs while they are away. Background calls do not use it, so an
// abandoned open tab cannot keep a session alive.
export async function POST() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const jar = await cookies();
  jar.set(IDLE_COOKIE, await signActive(Date.now()), idleCookieOptions());
  return NextResponse.json({ ok: true });
}

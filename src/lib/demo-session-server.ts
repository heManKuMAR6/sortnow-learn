import { sign, verify } from "@/lib/secret";
import type { DemoSession } from "@/lib/demo-session";

export function demoCookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  };
}

/** The cookie value for a signed-in demo user. It is signed, so it cannot be forged. */
export function serializeDemoSession(session: DemoSession): string {
  return sign(JSON.stringify(session));
}

export function parseDemoSession(raw: string | undefined): DemoSession | null {
  const json = verify(raw);
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as Partial<DemoSession>;
    if (typeof parsed.id !== "string" || typeof parsed.email !== "string") return null;
    return { id: parsed.id, email: parsed.email, name: typeof parsed.name === "string" ? parsed.name : undefined };
  } catch {
    return null;
  }
}

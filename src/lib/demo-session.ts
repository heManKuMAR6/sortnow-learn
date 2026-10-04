export const DEMO_COOKIE = "sortnow_learn_demo";
export const DEMO_STORAGE_KEY = "sortnow-learn-demo-session";

export type DemoSession = {
  id: string;
  email: string;
  name?: string;
};

export function demoCookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  };
}

export function parseDemoSession(raw: string | undefined): DemoSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DemoSession>;
    if (!parsed.id || !parsed.email) return null;
    if (typeof parsed.id !== "string" || typeof parsed.email !== "string") return null;
    return { id: parsed.id, email: parsed.email, name: typeof parsed.name === "string" ? parsed.name : undefined };
  } catch {
    return null;
  }
}

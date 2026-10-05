import { sign, verify } from "@/lib/secret";

export const LEAD_COOKIE = "sortnow_learn_lead";

export function leadCookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  };
}

/** The value stored after someone leaves their details. Signed, so "1" no longer unlocks anything. */
export function leadCookieValue(): string {
  return sign("lead:v1");
}

export function isLeadUnlocked(value: string | undefined): boolean {
  return verify(value) === "lead:v1";
}

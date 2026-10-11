// Idle sign-out. A signed "last active" cookie says when the person last really did something.
// The middleware refuses a session whose last activity is older than the limit (3 hours unless
// NEXT_PUBLIC_SESSION_IDLE_MINUTES says otherwise), and the browser guard (IdleGuard) warns first.
// Written to run on the edge as well as in Node, so it uses Web Crypto only.

export const IDLE_COOKIE = "sortnow_active";
export const IDLE_DEFAULT_MINUTES = 180;
/** How long before the cutoff the browser warns. */
export const IDLE_WARN_MS = 5 * 60_000;
/** A full page load refreshes the cookie at most this often. */
export const IDLE_REFRESH_MS = 60_000;

export function idleMinutes(): number {
  const n = Number(process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES);
  return Number.isFinite(n) && n >= 1 && n <= 24 * 60 ? Math.floor(n) : IDLE_DEFAULT_MINUTES;
}

export const idleMs = () => idleMinutes() * 60_000;

function secret(): string {
  const configured = process.env.APP_SECRET?.trim();
  if (configured && configured.length >= 32) return configured;
  // Same weaker fallback the other signed cookies use when APP_SECRET is not set (see /status).
  return `sortnow-learn|${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "local"}|${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""}`;
}

const enc = new TextEncoder();

async function mac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
  let s = "";
  for (const b of sig) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** The cookie value for "active at this moment". */
export async function signActive(at: number): Promise<string> {
  return `${at}.${await mac(`idle:${at}`)}`;
}

/** The verified time of last activity, or null if the cookie is missing, malformed or forged. */
export async function readActive(raw: string | undefined | null): Promise<number | null> {
  if (!raw) return null;
  const dot = raw.indexOf(".");
  if (dot < 1) return null;
  const at = Number(raw.slice(0, dot));
  if (!Number.isInteger(at) || at <= 0 || at > Date.now() + 5 * 60_000) return null;
  return same(raw.slice(dot + 1), await mac(`idle:${at}`)) ? at : null;
}

export function idleCookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  };
}

/** True when the session has gone quiet for longer than the limit. */
export function isIdle(lastActive: number, now = Date.now(), limitMs = idleMs()): boolean {
  return now - lastActive > limitMs;
}

/**
 * Pages that make sense without an account. A stale session landing on one of these is signed out
 * quietly; anywhere else it is sent to the sign-in page.
 */
const OPEN_PREFIXES = ["/login", "/signup", "/forgot-password", "/reset-password", "/auth", "/privacy", "/unsubscribe", "/newsletter", "/ig", "/u/", "/notes", "/posts", "/week", "/status"];

export function isOpenPath(pathname: string): boolean {
  return pathname === "/" || OPEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p.endsWith("/") ? p : `${p}/`));
}

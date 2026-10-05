import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { isSupabaseConfigured } from "@/lib/env";

// Signs small cookie values so they cannot be forged. Set APP_SECRET (32+ random
// characters) in the environment. Without it:
//   - with Supabase configured, a key derived from public values is used (weak: it
//     only stops casual forgery, and /status says so);
//   - with no Supabase (preview mode), a random per-process key is used.
const g = globalThis as unknown as { __snRandomKey?: string; __snWarned?: boolean };

export function hasStrongSecret(): boolean {
  return (process.env.APP_SECRET?.trim().length ?? 0) >= 32;
}

function key(): string {
  const configured = process.env.APP_SECRET?.trim();
  if (configured && configured.length >= 32) return configured;
  if (!g.__snWarned) {
    g.__snWarned = true;
    console.warn("[secret] APP_SECRET is not set (32+ characters). Signed cookies use a weaker fallback key.");
  }
  if (isSupabaseConfigured()) {
    return createHash("sha256")
      .update(`sortnow-learn|${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}|${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""}`)
      .digest("hex");
  }
  g.__snRandomKey ??= randomBytes(32).toString("hex");
  return g.__snRandomKey;
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url").toString("utf8");
const mac = (body: string) => createHmac("sha256", key()).update(body).digest("base64url");

/** `value` becomes `<base64url>.<signature>`. */
export function sign(value: string): string {
  const body = b64(value);
  return `${body}.${mac(body)}`;
}

/** Returns the original value if the signature is valid, otherwise null. */
export function verify(signed: string | undefined | null): string | null {
  if (!signed) return null;
  const dot = signed.indexOf(".");
  if (dot < 1) return null;
  const body = signed.slice(0, dot);
  const given = Buffer.from(signed.slice(dot + 1));
  const expected = Buffer.from(mac(body));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    return unb64(body);
  } catch {
    return null;
  }
}

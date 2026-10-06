import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

/** Best guess at the caller, from the proxy header Vercel sets. Used only to count requests, never stored. */
export function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for") ?? "";
  return fwd.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

/** A 429 response when this caller has used up `max` requests in `windowMs`, otherwise null. */
export function tooMany(request: Request, bucket: string, max: number, windowMs: number): NextResponse | null {
  const r = rateLimit(`${bucket}:${clientKey(request)}`, max, windowMs);
  if (r.ok) return null;
  return NextResponse.json(
    { error: "Too many tries just now. Please wait a few minutes and try again." },
    { status: 429, headers: { "Retry-After": String(r.retryAfterSec) } },
  );
}

/** Real people never see the hidden "website" field, so a filled one means a script. */
export function isBot(body: Record<string, unknown>): boolean {
  return typeof body.website === "string" && body.website.trim().length > 0;
}

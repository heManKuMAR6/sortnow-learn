import { NextResponse } from "next/server";
import { isBot, tooMany } from "@/lib/abuse";
import { bad, fromError, readJson, str } from "@/lib/api";
import { NEWSLETTER_CONSENT_TEXT, stamp } from "@/lib/consent";
import { getStore } from "@/lib/platform/store";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const limited = tooMany(request, "newsletter", 8, 10 * 60_000);
  if (limited) return limited;
  const body = await readJson(request);
  if (!body) return bad("Expected JSON.");
  if (isBot(body)) return NextResponse.json({ ok: true });
  if (body.consent !== true) return bad("Please tick the box to say you agree, then try again.");
  const user = await getCurrentUser();
  const typed = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const email = typed || user?.email.toLowerCase() || "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return bad("That email doesn't look quite right.");
  }
  const name = str(body.name ?? "", 80) || user?.name || null;
  try {
    await getStore().subscribe(email, name, user ? "member" : "site", stamp(NEWSLETTER_CONSENT_TEXT));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fromError(error);
  }
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isBot, tooMany } from "@/lib/abuse";
import { SRC_RE } from "@/lib/campaign";
import { cleanPhone } from "@/lib/phone";
import { LEAD_CONSENT_TEXT, stamp } from "@/lib/consent";
import { isSupabaseConfigured } from "@/lib/env";
import { LEAD_COOKIE, leadCookieOptions, leadCookieValue } from "@/lib/lead-cookie";
import { appendLocalLead } from "@/lib/leads-store";
import { getStore } from "@/lib/platform/store";
import { createClient } from "@/lib/supabase/server";

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200;
}

function cleanPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value.slice(0, 300);
}

export async function POST(request: Request) {
  const limited = tooMany(request, "leads", 15, 10 * 60_000);
  if (limited) return limited;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }
  if (!json || typeof json !== "object") {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }
  const row = json as Record<string, unknown>;
  const name = typeof row.name === "string" ? row.name.trim() : "";
  const email = typeof row.email === "string" ? row.email.trim().toLowerCase() : "";
  const phoneRaw = typeof row.phone === "string" ? row.phone.trim() : "";
  const phone = phoneRaw.length > 0 ? phoneRaw.slice(0, 40) : null;
  const path = cleanPath(row.path);
  const source = path.startsWith("/ig") ? "instagram" : "site";
  const campaign = typeof row.campaign === "string" && SRC_RE.test(row.campaign) ? row.campaign.toLowerCase() : null;
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 300) || null;

  // A script filled the hidden field: look successful, keep nothing, unlock nothing.
  if (isBot(row)) return NextResponse.json({ ok: true });

  if (row.consent !== true) {
    return NextResponse.json({ error: "Please tick the box to say you agree. We only keep your details with your permission." }, { status: 400 });
  }

  if (name.length < 1 || name.length > 80) {
    return NextResponse.json({ error: "Add your name so we know who stopped by." }, { status: 400 });
  }
  if (!validEmail(email)) {
    return NextResponse.json({ error: "That email doesn't look quite right." }, { status: 400 });
  }
  // Name, email and phone are all needed to unlock anything.
  if (!phone) {
    return NextResponse.json({ error: "Add your phone number to unlock this." }, { status: 400 });
  }
  if (phone && cleanPhone(phone) === undefined) {
    return NextResponse.json({ error: "That phone number doesn't look right. Use digits and an optional +." }, { status: 400 });
  }

  const consentText = stamp(LEAD_CONSENT_TEXT);
  const lead = { name, email, phone, source, path, campaign };

  let saved = false;
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.from("leads").insert({
        name,
        email,
        phone,
        source,
        path,
        consent: true,
        consent_at: new Date().toISOString(),
        consent_text: consentText,
        campaign,
        user_agent: userAgent,
      });
      if (error) throw new Error(error.message);
      saved = true;
    } catch (error) {
      console.error("[leads] database insert failed:", error instanceof Error ? error.message : error);
    }
  }
  if (!saved) {
    try {
      await appendLocalLead(lead);
      saved = true;
    } catch (error) {
      console.error("[leads] local fallback failed:", error instanceof Error ? error.message : error);
    }
  }
  if (!saved) {
    // Do not unlock and do not say it worked: the details were not kept.
    return NextResponse.json({ error: "We could not save that just now. Please try again in a minute." }, { status: 503 });
  }

  // They agreed to the weekly newsletter in the same breath. Failure here must not block the unlock.
  try {
    await getStore().subscribe(email, name, source, consentText);
  } catch (error) {
    console.error("[leads] newsletter subscribe failed:", error instanceof Error ? error.message : error);
  }

  const jar = await cookies();
  jar.set(LEAD_COOKIE, leadCookieValue(), leadCookieOptions());
  return NextResponse.json({ ok: true });
}

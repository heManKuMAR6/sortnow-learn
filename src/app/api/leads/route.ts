import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { LEAD_COOKIE, leadCookieOptions } from "@/lib/lead-cookie";
import { appendLocalLead } from "@/lib/leads-store";
import { createClient } from "@/lib/supabase/server";

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200;
}

function cleanPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value.slice(0, 300);
}

export async function POST(request: Request) {
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

  if (name.length < 1 || name.length > 80) {
    return NextResponse.json({ error: "Add your name so we know who stopped by." }, { status: 400 });
  }
  if (!validEmail(email)) {
    return NextResponse.json({ error: "That email doesn't look quite right." }, { status: 400 });
  }
  if (phone && !/^[0-9+()\-.\s]{3,40}$/.test(phone)) {
    return NextResponse.json({ error: "Phone can be blank, or digits and a plus sign." }, { status: 400 });
  }

  const lead = { name, email, phone, source, path };

  const saveLocal = async () => {
    await appendLocalLead(lead);
  };

  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { error } = await supabase.from("leads").insert({
        name,
        email,
        phone,
        source,
        path,
      });
      if (error) throw new Error(error.message);
    } else {
      await saveLocal();
    }
  } catch {
    try {
      await saveLocal();
    } catch {
      // Still let them read. Do not describe where a lead is kept.
    }
  }

  const jar = await cookies();
  jar.set(LEAD_COOKIE, "1", leadCookieOptions());
  return NextResponse.json({ ok: true });
}

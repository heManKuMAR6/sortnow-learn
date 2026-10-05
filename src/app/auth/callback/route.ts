import { NextResponse } from "next/server";
import { NEWSLETTER_CONSENT_TEXT, stamp } from "@/lib/consent";
import { isSupabaseConfigured } from "@/lib/env";
import { getStore } from "@/lib/platform/store";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

// Landing point for "Continue with Google" and email links.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (code && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // They ticked the newsletter box at sign-up but had to confirm their email first.
      try {
        const { data } = await supabase.auth.getUser();
        const meta = data.user?.user_metadata as Record<string, unknown> | undefined;
        if (data.user?.email && meta?.newsletter_opt_in === true) {
          const raw = meta.full_name ?? meta.name;
          await getStore().subscribe(data.user.email.toLowerCase(), typeof raw === "string" ? raw.slice(0, 80) : null, "member", stamp(NEWSLETTER_CONSENT_TEXT));
        }
      } catch {
        // Never block sign-in on the newsletter.
      }
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}

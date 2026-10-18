import { NextResponse } from "next/server";
import { GOOGLE_LEAD_CONSENT_TEXT, NEWSLETTER_CONSENT_TEXT, stamp } from "@/lib/consent";
import { cleanPhone } from "@/lib/phone";
import { isSupabaseConfigured } from "@/lib/env";
import { LEAD_COOKIE, leadCookieOptions, leadCookieValue } from "@/lib/lead-cookie";
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
        const phone = cleanPhone(meta?.phone);
        if (phone) await getStore().setPhone(data.user?.id ?? "", phone);
      } catch {
        // Never block sign-in on the newsletter or the optional phone.
      }
      const response = NextResponse.redirect(new URL(next, url.origin));
      // Unlocked a reel drop with Google (and ticked the box first): keep them as a lead too,
      // and set the drop cookie so signing out later does not lock the page again.
      if (next.startsWith("/ig/") && url.searchParams.get("lead") === "1") {
        try {
          const { data } = await supabase.auth.getUser();
          const email = data.user?.email?.toLowerCase();
          if (email) {
            const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
            const raw = meta.full_name ?? meta.name;
            const name = (typeof raw === "string" && raw.trim() ? raw.trim() : email.split("@")[0]).slice(0, 80);
            const consentText = stamp(GOOGLE_LEAD_CONSENT_TEXT);
            const { error: leadError } = await supabase.from("leads").insert({
              name,
              email,
              source: "instagram-google",
              path: next.slice(0, 300),
              consent: true,
              consent_at: new Date().toISOString(),
              consent_text: consentText,
              user_agent: (request.headers.get("user-agent") ?? "").slice(0, 300) || null,
            });
            if (leadError && leadError.code !== "23505") console.error("[auth] google lead insert failed:", leadError.message);
            await getStore().subscribe(email, name, "instagram-google", consentText);
          }
        } catch (caught) {
          console.error("[auth] google lead failed:", caught instanceof Error ? caught.message : caught);
        }
        response.cookies.set(LEAD_COOKIE, leadCookieValue(), leadCookieOptions());
      }
      return response;
    }
  }
  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}

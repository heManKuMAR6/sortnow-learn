import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
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
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}

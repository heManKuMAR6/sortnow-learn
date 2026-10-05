import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { bad, fromError, readJson, requireUser } from "@/lib/api";
import { DEMO_COOKIE } from "@/lib/demo-session";
import { demoCookieOptions } from "@/lib/demo-session-server";
import { isSupabaseConfigured } from "@/lib/env";
import { getStore } from "@/lib/platform/store";
import { createClient } from "@/lib/supabase/server";

// Deletes the signed-in person's account and everything of theirs. They must type DELETE.
export async function DELETE(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const body = await readJson(request);
  if (body?.confirm !== "DELETE") return bad('Type DELETE to confirm.');
  try {
    await getStore().deleteAccount(auth.user.id);
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      await supabase.auth.signOut().catch(() => undefined);
    } else {
      (await cookies()).set(DEMO_COOKIE, "", { ...demoCookieOptions(), maxAge: 0 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fromError(error);
  }
}

import { cookies } from "next/headers";
import { cache } from "react";
import { DEMO_COOKIE } from "@/lib/demo-session";
import { parseDemoSession } from "@/lib/demo-session-server";
import { isDemoEnabled, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AppUser = {
  id: string;
  email: string;
  /** Name given at sign-up or by the identity provider. Never the email. */
  name: string | null;
  mode: "supabase" | "demo";
};

export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const meta = data.user.user_metadata as Record<string, unknown> | undefined;
    const raw = meta?.full_name ?? meta?.name;
    return {
      id: data.user.id,
      email: data.user.email ?? "",
      name: typeof raw === "string" && raw.trim() ? raw.trim().slice(0, 80) : null,
      mode: "supabase",
    };
  }

  if (!isDemoEnabled()) return null;
  const jar = await cookies();
  const demo = parseDemoSession(jar.get(DEMO_COOKIE)?.value);
  if (!demo) return null;
  return { id: demo.id, email: demo.email, name: demo.name ?? null, mode: "demo" };
});

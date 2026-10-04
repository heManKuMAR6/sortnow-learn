import { cookies } from "next/headers";
import { DEMO_COOKIE, parseDemoSession } from "@/lib/demo-session";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AppUser = {
  id: string;
  email: string;
  mode: "supabase" | "demo";
};

export async function getCurrentUser(): Promise<AppUser | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return {
      id: data.user.id,
      email: data.user.email ?? "",
      mode: "supabase",
    };
  }

  const jar = await cookies();
  const demo = parseDemoSession(jar.get(DEMO_COOKIE)?.value);
  if (!demo) return null;
  return { id: demo.id, email: demo.email, mode: "demo" };
}

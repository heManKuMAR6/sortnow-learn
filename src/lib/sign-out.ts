"use client";

import { DEMO_STORAGE_KEY } from "@/lib/demo-session";
import { createClient } from "@/lib/supabase/client";

/** Ends this browser's session, for a real account or the local preview login. */
export async function endSession(mode: "supabase" | "demo"): Promise<void> {
  if (mode === "supabase") {
    await createClient().auth.signOut({ scope: "local" }).catch(() => undefined);
  } else {
    await fetch("/api/auth/demo", { method: "DELETE" }).catch(() => undefined);
    try {
      window.localStorage.removeItem(DEMO_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

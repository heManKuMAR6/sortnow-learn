"use client";

import { useRouter } from "next/navigation";
import { DEMO_STORAGE_KEY } from "@/lib/demo-session";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ mode }: { mode: "supabase" | "demo" }) {
  const router = useRouter();

  async function signOut() {
    if (mode === "supabase") {
      const supabase = createClient();
      await supabase.auth.signOut();
    } else {
      await fetch("/api/auth/demo", { method: "DELETE" });
      window.localStorage.removeItem(DEMO_STORAGE_KEY);
    }
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" data-track="sign-out" onClick={() => void signOut()} className="pill-white text-sm">
      Sign out
    </button>
  );
}

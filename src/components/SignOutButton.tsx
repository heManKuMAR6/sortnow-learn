"use client";

import { useRouter } from "next/navigation";
import { endSession } from "@/lib/sign-out";

export function SignOutButton({ mode }: { mode: "supabase" | "demo" }) {
  const router = useRouter();

  async function signOut() {
    await endSession(mode);
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" data-track="sign-out" onClick={() => void signOut()} className="pill-white text-sm">
      Sign out
    </button>
  );
}

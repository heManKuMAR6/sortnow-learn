import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";
import { redirect } from "next/navigation";
import { isDemoEnabled, isSupabaseConfigured } from "@/lib/env";
import { safeNext } from "@/lib/safe-next";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  const target = safeNext(next);
  if (await getCurrentUser()) redirect(target);
  return (
    <AuthShell
      title="Join sortNow Learn"
      subtitle="Free. Learn AI in small steps and keep a streak."
      footer={
        <>
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(target)}`} data-track="go-sign-in" className="text-link">
            Sign in
          </Link>
        </>
      }
    >
      <AuthForm mode="signup" demoMode={!isSupabaseConfigured()} unavailable={!isSupabaseConfigured() && !isDemoEnabled()} next={target} />
    </AuthShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
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
      <AuthForm mode="signup" demoMode={!isSupabaseConfigured()} next={target} />
    </AuthShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

function safeNext(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.startsWith("/") && !v.startsWith("//") ? v : "/dashboard";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const target = safeNext(next);
  if (!error && (await getCurrentUser())) redirect(target);
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Pick up your streak where you left it."
      footer={
        <>
          New here?{" "}
          <Link href={`/signup?next=${encodeURIComponent(target)}`} data-track="go-sign-up" className="text-link">
            Create a free account
          </Link>
        </>
      }
    >
      {error ? <p className="mb-4 text-sm text-coral">Sign-in did not complete. Please try again.</p> : null}
      <AuthForm mode="signin" demoMode={!isSupabaseConfigured()} next={target} />
    </AuthShell>
  );
}

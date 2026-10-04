import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const demoMode = !isSupabaseConfigured();
  const params = await searchParams;
  const initialError =
    params.error === "auth" ? "That sign-in did not finish. Try again, or use email and password." : null;
  return (
    <div className="max-w-lg">
      <h1 className="text-4xl font-semibold">Sign in</h1>
      <p className="mt-3 text-secondary">Email and password, or continue with Google or GitHub.</p>
      <div className="glass mt-6 p-6">
        <AuthForm mode="signin" demoMode={demoMode} initialError={initialError} />
      </div>
      <p className="mt-6 text-sm">
        No account yet?{" "}
        <Link href="/signup" data-track="go-sign-up" className="text-link">
          Create one
        </Link>
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  const demoMode = !isSupabaseConfigured();
  return (
    <div className="max-w-lg">
      <h1 className="text-4xl">Create an account</h1>
      <p className="mt-3 text-secondary">Email and password.</p>
      <div className="glass mt-6 p-6">
        <AuthForm mode="signup" demoMode={demoMode} />
      </div>
      <p className="mt-6 text-sm">
        Already have an account?{" "}
        <Link href="/login" data-track="go-sign-in" className="text-link">
          Sign in
        </Link>
      </p>
    </div>
  );
}

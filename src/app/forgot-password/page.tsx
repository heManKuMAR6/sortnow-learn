import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ForgotPasswordForm } from "@/components/PasswordForms";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Tell us your email and we will send a link to choose a new one."
      footer={
        <Link href="/login" className="text-link">
          Back to sign in
        </Link>
      }
    >
      {isSupabaseConfigured() ? (
        <ForgotPasswordForm />
      ) : (
        <p className="rounded-2xl bg-sun/30 p-4 text-sm">Password reset needs the live account system, which is not connected on this site yet.</p>
      )}
    </AuthShell>
  );
}

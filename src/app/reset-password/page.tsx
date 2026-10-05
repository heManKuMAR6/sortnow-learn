import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ResetPasswordForm } from "@/components/PasswordForms";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage() {
  // The reset email signs the person in for this one step; without that there is nothing to change.
  const user = await getCurrentUser();
  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Pick something you have not used elsewhere."
      footer={
        <Link href="/login" className="text-link">
          Back to sign in
        </Link>
      }
    >
      {user ? (
        <ResetPasswordForm />
      ) : (
        <p className="rounded-2xl bg-sun/30 p-4 text-sm">
          This reset link has expired or was already used.{" "}
          <Link href="/forgot-password" className="text-link">
            Send a new one
          </Link>
          .
        </p>
      )}
    </AuthShell>
  );
}

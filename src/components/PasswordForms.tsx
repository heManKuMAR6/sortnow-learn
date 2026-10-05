"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "pending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setState("pending");
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
      });
      if (resetError && /rate limit/i.test(resetError.message)) {
        setError("Too many emails were sent just now. Wait a few minutes and try again.");
        setState("idle");
        return;
      }
      // Same message whether or not the address has an account, so it cannot be used to look people up.
      setState("sent");
    } catch {
      setError("Something went wrong. Please try again.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return <p className="rounded-2xl bg-mint/30 p-4">If that email has an account, a reset link is on its way. It can take a minute.</p>;
  }
  return (
    <form onSubmit={(e) => void submit(e)} className="grid gap-4">
      <label className="grid gap-1 text-sm">
        Email
        <input type="email" required autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      {error ? <p className="text-sm text-coral">{error}</p> : null}
      <button type="submit" className="pill-teal pill-lg w-full" disabled={state === "pending"}>
        {state === "pending" ? "Sending…" : "Send me a reset link"}
      </button>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 6) return setError("Choose a password with at least 6 characters.");
    if (password !== again) return setError("The two passwords do not match.");
    setPending(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="grid gap-4">
      <label className="grid gap-1 text-sm">
        New password
        <input type="password" required minLength={6} autoComplete="new-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <label className="grid gap-1 text-sm">
        Type it again
        <input type="password" required minLength={6} autoComplete="new-password" className="field" value={again} onChange={(e) => setAgain(e.target.value)} />
      </label>
      {error ? <p className="text-sm text-coral">{error}</p> : null}
      <button type="submit" className="pill-teal pill-lg w-full" disabled={pending}>
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_STORAGE_KEY } from "@/lib/demo-session";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({
  mode,
  demoMode,
}: {
  mode: "signin" | "signup";
  demoMode: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);
    try {
      if (demoMode) {
        const response = await fetch("/api/auth/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intent: mode === "signup" ? "signup" : "signin",
            email,
            password,
          }),
        });
        const body = (await response.json()) as {
          error?: string;
          user?: { id: string; email: string };
        };
        if (!response.ok || !body.user) {
          setError(body.error ?? "Could not sign in.");
          return;
        }
        window.localStorage.setItem(
          DEMO_STORAGE_KEY,
          JSON.stringify({
            id: body.user.id,
            email: body.user.email,
          }),
        );
        router.push("/activity");
        router.refresh();
        return;
      }

      const supabase = createClient();
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        if (!data.session) {
          setNotice("Account created. Check your email to confirm it, then sign in.");
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message);
          return;
        }
      }
      router.push("/");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="grid max-w-sm gap-4">
      <label className="grid gap-1 text-sm">
        Email
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field"
        />
      </label>
      <label className="grid gap-1 text-sm">
        Password
        <input
          type="password"
          name="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="field"
        />
      </label>
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      {notice ? <p className="text-sm">{notice}</p> : null}
      <button
        type="submit"
        data-track={mode === "signup" ? "submit-sign-up" : "submit-sign-in"}
        disabled={pending}
        className="pill-teal w-fit text-sm"
      >
        {pending ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}

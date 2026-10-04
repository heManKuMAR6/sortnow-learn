"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_STORAGE_KEY } from "@/lib/demo-session";
import { createClient } from "@/lib/supabase/client";

const oauthProviders = [
  { id: "google", label: "Continue with Google" },
  { id: "github", label: "Continue with GitHub" },
] as const;

export function AuthForm({
  mode,
  demoMode,
  initialError = null,
}: {
  mode: "signin" | "signup";
  demoMode: boolean;
  initialError?: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
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
      const redirectTo = `${window.location.origin}/auth/callback`;
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        });
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

  async function startOAuth(provider: (typeof oauthProviders)[number]["id"]) {
    setError(null);
    setNotice(null);
    const label = provider === "google" ? "Google" : "GitHub";
    if (demoMode) {
      setError(`${label} sign-in is not available yet. Use email and password.`);
      return;
    }
    setPending(true);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) {
        setError(calmOAuthError(label, oauthError.message));
        setPending(false);
      }
    } catch {
      setError(`Could not start ${label} sign-in. Use email and password.`);
      setPending(false);
    }
  }

  return (
    <div className="grid max-w-sm gap-4">
      <div className="grid gap-2">
        {oauthProviders.map((provider) => (
          <button
            key={provider.id}
            type="button"
            data-track={`oauth-${provider.id}`}
            disabled={pending}
            onClick={() => void startOAuth(provider.id)}
            className="pill-white w-full text-sm"
          >
            {provider.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">or use email</p>
      <form onSubmit={(event) => void onSubmit(event)} className="grid gap-4">
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
    </div>
  );
}

function calmOAuthError(label: "Google" | "GitHub", message: string): string {
  if (/not enabled|unsupported provider|validation_failed|provider is not enabled/i.test(message)) {
    return `${label} sign-in is not available yet. Use email and password.`;
  }
  return `Could not start ${label} sign-in. Use email and password.`;
}

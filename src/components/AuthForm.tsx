"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_STORAGE_KEY } from "@/lib/demo-session";
import { createClient } from "@/lib/supabase/client";

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3A12 12 0 1112 24a12 12 0 018.1 3.1l5.7-5.7A20 20 0 1024 44c11 0 20-8 20-20 0-1.300-.1-2.700-.4-3.900z" />
      <path fill="#FF3D00" d="M6.300 14.700l6.600 4.800A12 12 0 0124 12c3.100 0 5.800 1.100 8 3.100l5.700-5.700A20 20 0 006.300 14.700z" />
      <path fill="#4CAF50" d="M24 44c5.200 0 9.900-2 13.400-5.200l-6.200-5.200A12 12 0 0112.700 28l-6.500 5C9.500 39.600 16.200 44 24 44z" />
      <path fill="#1976D2" d="M43.600 20.100H42V20H24v8h11.300a12 12 0 01-4.100 5.600l6.200 5.200C37 39.200 44 34 44 24c0-1.300-.1-2.700-.4-3.900z" />
    </svg>
  );
}

export function AuthForm({
  mode,
  demoMode,
  next = "/dashboard",
}: {
  mode: "signin" | "signup";
  demoMode: boolean;
  next?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function google() {
    setError(null);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (oauthError) setError(oauthError.message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start Google sign-in.");
    }
  }

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
            name,
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
          JSON.stringify({ id: body.user.id, email: body.user.email }),
        );
        router.push(next);
        router.refresh();
        return;
      }

      const supabase = createClient();
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        if (!data.session) {
          setNotice("Almost there. Check your email and tap the link to confirm, then you are in.");
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message);
          return;
        }
      }
      router.push(next);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-4">
      {demoMode ? null : (
        <>
          <button type="button" className="google-btn" data-track="auth-google" onClick={() => void google()}>
            <GoogleG /> Continue with Google
          </button>
          <p className="divider-text">
            <span>or with email</span>
          </p>
        </>
      )}
      <form onSubmit={(event) => void onSubmit(event)} className="grid gap-4">
        {mode === "signup" ? (
          <label className="grid gap-1 text-sm">
            Your name
            <input
              name="name"
              autoComplete="name"
              required
              maxLength={80}
              placeholder="Hemanth Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field"
            />
            <span className="text-xs text-muted">This is what other people see. Your email stays private.</span>
          </label>
        ) : null}
        <label className="grid gap-1 text-sm">
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
        </label>
        {error ? <p className="text-sm text-coral">{error}</p> : null}
        {notice ? <p className="rounded-2xl bg-mint/30 p-3 text-sm">{notice}</p> : null}
        <button
          type="submit"
          data-track={mode === "signup" ? "submit-sign-up" : "submit-sign-in"}
          disabled={pending}
          className="pill-teal pill-lg w-full"
        >
          {pending ? "Working…" : mode === "signup" ? "Create my account" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

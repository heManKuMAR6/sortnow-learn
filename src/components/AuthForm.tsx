"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_STORAGE_KEY } from "@/lib/demo-session";
import { safeNext } from "@/lib/safe-next";
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

function GitHubMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 .5a11.5 11.5 0 00-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 015.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0012 .5z" />
    </svg>
  );
}

// Show a social button only when it has been switched on in Supabase AND listed here,
// so nobody clicks a button that cannot work. Example: NEXT_PUBLIC_AUTH_PROVIDERS=google,github
const PROVIDERS = (process.env.NEXT_PUBLIC_AUTH_PROVIDERS ?? "")
  .split(",")
  .map((p) => p.trim().toLowerCase())
  .filter(Boolean);

/** Turn raw auth errors into something a person can act on. */
function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("provider is not enabled") || m.includes("unsupported provider"))
    return "That sign-in option is not switched on yet. Please use email for now.";
  if (m.includes("rate limit")) return "Too many emails were sent just now. Wait a few minutes and try again.";
  if (m.includes("not confirmed")) return "Please confirm your email first. Check your inbox for the link.";
  if (m.includes("invalid login")) return "That email and password do not match.";
  if (m.includes("already registered")) return "That email already has an account. Try signing in.";
  if (m.includes("password should be")) return "Choose a password with at least 6 characters.";
  return message;
}

export function AuthForm({
  mode,
  demoMode,
  unavailable = false,
  next: nextRaw = "/dashboard",
}: {
  mode: "signin" | "signup";
  demoMode: boolean;
  /** No Supabase and demo mode is off: there is nothing to sign in to. */
  unavailable?: boolean;
  next?: string;
}) {
  const router = useRouter();
  const next = safeNext(nextRaw);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [canResend, setCanResend] = useState(false);

  async function resend() {
    setError(null);
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (resendError) setError(friendly(resendError.message));
      else setNotice("Sent. Check your inbox (and spam) for the confirmation link.");
    } catch (caught) {
      setError(caught instanceof Error ? friendly(caught.message) : "Could not resend the email.");
    }
  }

  async function oauth(provider: "google" | "github") {
    setError(null);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (oauthError) setError(friendly(oauthError.message));
    } catch (caught) {
      setError(caught instanceof Error ? friendly(caught.message) : "Could not start sign-in.");
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
          setError(friendly(signUpError.message));
          return;
        }
        if (!data.session) {
          setNotice("Almost there. Check your email and tap the link to confirm, then you are in.");
          setCanResend(true);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setCanResend(/not confirmed/i.test(signInError.message));
          setError(friendly(signInError.message));
          return;
        }
      }
      router.push(next);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? friendly(caught.message) : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  if (unavailable) {
    return <p className="rounded-2xl bg-sun/30 p-4 text-sm">Sign-in is not set up on this site yet. Please check back soon.</p>;
  }

  return (
    <div className="grid gap-4">
      {demoMode || PROVIDERS.length === 0 ? null : (
        <>
          {PROVIDERS.includes("google") ? (
            <button type="button" className="google-btn" data-track="auth-google" onClick={() => void oauth("google")}>
              <GoogleG /> Continue with Google
            </button>
          ) : null}
          {PROVIDERS.includes("github") ? (
            <button type="button" className="google-btn" data-track="auth-github" onClick={() => void oauth("github")}>
              <GitHubMark /> Continue with GitHub
            </button>
          ) : null}
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
              placeholder="Your full name"
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
        {canResend ? (
          <button type="button" className="text-link text-left text-sm" onClick={() => void resend()}>
            Resend the confirmation email
          </button>
        ) : null}
        {mode === "signin" && !demoMode ? (
          <a href="/forgot-password" className="text-link text-sm" data-track="forgot-password">
            Forgot your password?
          </a>
        ) : null}
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

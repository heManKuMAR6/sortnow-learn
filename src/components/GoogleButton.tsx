"use client";

import { useState } from "react";
import { ConsentCheck } from "@/components/ConsentCheck";
import { AUTH_PROVIDERS, startOAuth } from "@/lib/oauth";

export function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3A12 12 0 1112 24a12 12 0 018.1 3.1l5.7-5.7A20 20 0 1024 44c11 0 20-8 20-20 0-1.300-.1-2.700-.4-3.900z" />
      <path fill="#FF3D00" d="M6.300 14.700l6.600 4.800A12 12 0 0124 12c3.100 0 5.800 1.100 8 3.100l5.700-5.700A20 20 0 006.300 14.700z" />
      <path fill="#4CAF50" d="M24 44c5.200 0 9.900-2 13.400-5.200l-6.200-5.200A12 12 0 0112.700 28l-6.500 5C9.500 39.600 16.200 44 24 44z" />
      <path fill="#1976D2" d="M43.600 20.100H42V20H24v8h11.300a12 12 0 01-4.100 5.600l6.200 5.200C37 39.200 44 34 44 24c0-1.300-.1-2.700-.4-3.900z" />
    </svg>
  );
}

/** True when the Google button can work here (listed in NEXT_PUBLIC_AUTH_PROVIDERS). */
export const googleEnabled = AUTH_PROVIDERS.includes("google");

/**
 * "Continue with Google", returning to `next`. With `consentText`, an agreement box must be
 * ticked first. With `asLead`, the callback also records the visitor as a lead (`lead=1`).
 * Renders nothing when Google sign-in is not switched on.
 */
export function GoogleButton({
  next,
  track,
  consentText,
  asLead = false,
}: {
  next: string;
  track: string;
  consentText?: string;
  asLead?: boolean;
}) {
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  if (!googleEnabled) return null;

  async function go() {
    setError(null);
    if (consentText && !agreed) {
      setError("Please tick the box to agree first.");
      return;
    }
    setPending(true);
    // Carry the current ?utm_… tags back with the visitor so the lead row keeps them.
    const target = next + (next.includes("?") ? "" : window.location.search);
    const message = await startOAuth("google", target, asLead ? { lead: "1" } : {});
    if (message) {
      setError(message);
      setPending(false);
    }
  }

  return (
    <div className="grid gap-3">
      {consentText ? <ConsentCheck checked={agreed} onChange={setAgreed} text={consentText} /> : null}
      <button type="button" className="google-btn" data-track={track} disabled={pending} onClick={() => void go()}>
        <GoogleG /> {pending ? "Opening Google…" : "Continue with Google"}
      </button>
      {error ? (
        <p className="text-sm text-coral" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

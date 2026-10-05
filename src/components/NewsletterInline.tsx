"use client";

import { FormEvent, useState } from "react";
import { ConsentCheck } from "@/components/ConsentCheck";
import { NEWSLETTER_CONSENT_TEXT } from "@/lib/consent";

export function NewsletterInline({ signedIn }: { signedIn: boolean }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "pending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setState("pending");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signedIn ? { consent } : { email, consent }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Try that once more.");
        setState("idle");
        return;
      }
      try {
        window.localStorage.setItem("sn_newsletter", JSON.stringify({ state: "subscribed", at: Date.now() }));
      } catch {
        // ignore
      }
      setState("done");
    } catch {
      setError("The line hiccuped. Try once more.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <p className="rounded-2xl bg-mint/30 p-4">
        You&apos;re in<span className="dot">.</span> The next issue will find you.
      </p>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-wrap gap-3">
      {signedIn ? null : (
        <input
          className="field min-w-0 flex-1"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email address"
        />
      )}
      <div className="w-full">
        <ConsentCheck checked={consent} onChange={setConsent} text={NEWSLETTER_CONSENT_TEXT} />
      </div>
      <button type="submit" className="pill-teal" disabled={state === "pending"} data-track="newsletter-inline">
        {state === "pending" ? "One moment…" : signedIn ? "Send it to me" : "Subscribe free"}
      </button>
      {error ? <p className="w-full text-sm text-coral">{error}</p> : null}
    </form>
  );
}

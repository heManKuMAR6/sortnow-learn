"use client";

import { useState } from "react";

/** A deliberate click, so an email scanner that opens the link cannot unsubscribe anyone by accident. */
export function UnsubscribeButton({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "pending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setState("pending");
    setError(null);
    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Try that once more.");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("The line hiccuped. Try once more.");
      setState("idle");
    }
  }

  if (state === "done") {
    return <p className="rounded-2xl bg-mint/30 p-4">You&apos;re unsubscribed. We won&apos;t email you the newsletter again.</p>;
  }
  return (
    <div className="grid gap-3">
      <button type="button" className="pill-coral" onClick={() => void go()} disabled={state === "pending"}>
        {state === "pending" ? "One moment…" : "Yes, unsubscribe me"}
      </button>
      {error ? <p className="text-sm text-coral" role="alert">{error}</p> : null}
    </div>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function LeadGate() {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, path: pathname, source: pathname.startsWith("/ig") ? "instagram" : "site" }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string; warning?: string | null };
      if (!response.ok || !body.ok) {
        setError(body.error ?? "Try that once more.");
        return;
      }
      setOpen(false);
      if (body.warning) setNote(body.warning);
      router.refresh();
    } catch {
      setError("The line hiccuped. Try Continue once more.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    if (!note) return null;
    return (
      <p className="lead-note" role="status">
        {note}
      </p>
    );
  }

  return (
    <div className="lead-gate" role="presentation">
      <div
        className="lead-card glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") event.preventDefault();
        }}
      >
        <p className="eyebrow">sortNow Learn</p>
        <h2 id="lead-title" className="mt-1 text-2xl">
          Join the short list
        </h2>
        <p className="mt-2 text-sm text-secondary">
          A short newsletter, so you can read this week&apos;s note. Name and email. Phone if you
          want. We ask once on this browser.
        </p>
        <form onSubmit={(event) => void onSubmit(event)} className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">
            Name
            <input
              className="field"
              name="name"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Email
            <input
              className="field"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Phone <span className="text-muted">(optional)</span>
            <input
              className="field"
              type="tel"
              name="phone"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-coral">{error}</p> : null}
          <button type="submit" className="pill-teal mt-1 w-full" data-track="lead-continue" disabled={pending}>
            {pending ? "One moment…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

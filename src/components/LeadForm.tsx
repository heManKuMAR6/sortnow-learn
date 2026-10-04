"use client";

import { FormEvent, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Name, email and an optional phone. Submitting unlocks the page for this browser. */
export function LeadForm({ cta = "Unlock this drop" }: { cta?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, path: pathname }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !body.ok) {
        setError(body.error ?? "Try that once more.");
        return;
      }
      router.refresh();
    } catch {
      setError("The line hiccuped. Try once more.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="grid gap-3">
      <label className="grid gap-1 text-sm">
        Name
        <input className="field" name="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="grid gap-1 text-sm">
        Email
        <input className="field" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="grid gap-1 text-sm">
        <span>Phone <span className="text-muted">(optional)</span></span>
        <input className="field" type="tel" name="phone" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      {error ? <p className="text-sm text-coral">{error}</p> : null}
      <button type="submit" className="pill-teal pill-lg mt-1 w-full" data-track="lead-continue" disabled={pending}>
        {pending ? "One moment…" : cta}
      </button>
      <p className="text-xs text-muted">We keep this to send you the drop and the occasional update. No spam.</p>
    </form>
  );
}

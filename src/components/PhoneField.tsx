"use client";

import { FormEvent, useState } from "react";
import { toast } from "@/lib/toast";

/** Optional, private phone number. Blank removes it. */
export function PhoneField({ initial }: { initial: string | null }) {
  const [phone, setPhone] = useState(initial ?? "");
  const [saved, setSaved] = useState(initial ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/profile/phone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const body = (await response.json()) as { error?: string; phone?: string | null };
      if (!response.ok) {
        setError(body.error ?? "Could not save that.");
        return;
      }
      setSaved(body.phone ?? "");
      setPhone(body.phone ?? "");
      toast({ title: body.phone ? "Phone saved" : "Phone removed", icon: "spark" });
    } catch {
      setError("The line hiccuped. Try once more.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="glass mt-8 grid gap-3 p-5 sm:p-6" aria-labelledby="phone-title">
      <h2 id="phone-title" className="text-2xl">Phone number <span className="text-base text-muted">(optional)</span></h2>
      <p className="text-sm text-secondary">
        Private. It is never shown on your profile; only sortNow can see it, to reach you about roles you ask about. Leave it blank
        if you would rather not share one.
      </p>
      <div className="flex flex-wrap gap-3">
        <input
          className="field min-w-0 flex-1"
          type="tel"
          name="phone"
          autoComplete="tel"
          placeholder="+1 214 555 0100"
          aria-label="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button type="submit" className="pill-teal" disabled={pending || phone.trim() === saved.trim()} data-track="save-phone">
          {pending ? "Saving…" : phone.trim() ? "Save phone" : saved ? "Remove phone" : "Save"}
        </button>
      </div>
      {error ? <p className="text-sm text-coral" role="alert">{error}</p> : null}
    </form>
  );
}

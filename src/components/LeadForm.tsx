"use client";

import { FormEvent, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ConsentCheck } from "@/components/ConsentCheck";
import { readCampaign } from "@/lib/campaign";
import { LEAD_CONSENT_TEXT } from "@/lib/consent";

/** Name, email and phone, plus an agreement box. Submitting unlocks the page for this browser. */
export function LeadForm({ cta = "Unlock this drop" }: { cta?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // hidden trap for scripts
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
        body: JSON.stringify({ name, email, phone, consent, path: pathname, campaign: readCampaign(), website }),
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
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>
      <label className="grid gap-1 text-sm">
        Name
        <input className="field" name="name" autoComplete="name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="grid gap-1 text-sm">
        Email
        <input className="field" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="grid gap-1 text-sm">
        Phone
        <input className="field" type="tel" name="phone" autoComplete="tel" required minLength={7} placeholder="+1 214 555 0100" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <ConsentCheck checked={consent} onChange={setConsent} text={LEAD_CONSENT_TEXT} />
      {error ? <p className="text-sm text-coral" role="alert">{error}</p> : null}
      <button type="submit" className="pill-teal pill-lg mt-1 w-full" data-track="lead-continue" disabled={pending}>
        {pending ? "One moment…" : cta}
      </button>
    </form>
  );
}

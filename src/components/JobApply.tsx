"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/toast";

export function JobApply({
  slug,
  signedIn,
  applied: initiallyApplied,
  applyUrl,
}: {
  slug: string;
  signedIn: boolean;
  applied: boolean;
  applyUrl?: string;
}) {
  const router = useRouter();
  const [applied, setApplied] = useState(initiallyApplied);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!signedIn) {
    return (
      <div className="glass p-6">
        <h2 className="text-2xl">Interested?</h2>
        <p className="mt-1 text-secondary">Sign in so we can share your profile with the hiring contact.</p>
        <Link href={`/login?next=/jobs/${slug}`} className="pill-teal mt-4" data-track="job-signin">
          Sign in to apply
        </Link>
      </div>
    );
  }

  async function apply() {
    setError(null);
    setPending(true);
    try {
      const response = await fetch(`/api/jobs/${slug}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Could not send that.");
        return;
      }
      setApplied(true);
      toast({ title: "Interest sent", body: "We will pass your profile along.", icon: "spark" });
      router.refresh();
    } catch {
      setError("The line hiccuped. Try once more.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="glass p-6">
      {applied ? (
        <>
          <h2 className="text-2xl">You are on the list ✓</h2>
          <p className="mt-1 text-secondary">We will pass your profile to the hiring contact.</p>
        </>
      ) : (
        <>
          <h2 className="text-2xl">Apply for this role</h2>
          <p className="mt-1 text-secondary">Your public profile is shared with the hiring contact. Add a note if you like.</p>
          <textarea
            className="field mt-4 min-h-24"
            maxLength={800}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why this role? (optional)"
          />
          {error ? <p className="mt-2 text-sm text-coral">{error}</p> : null}
          <button type="button" className="pill-teal pill-lg mt-4" disabled={pending} onClick={() => void apply()} data-track="job-apply">
            {pending ? "Sending…" : "I'm interested"}
          </button>
        </>
      )}
      {applyUrl ? (
        <p className="mt-4 text-sm">
          <a href={applyUrl} target="_blank" rel="noopener noreferrer" className="text-link" data-track="job-external">
            Finish on the company site ↗
          </a>
        </p>
      ) : null}
    </div>
  );
}

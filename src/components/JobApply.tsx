"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/toast";

export function JobApply({
  slug,
  signedIn,
  applied: initiallyApplied,
}: {
  slug: string;
  signedIn: boolean;
  applied: boolean;
}) {
  const router = useRouter();
  const [applied, setApplied] = useState(initiallyApplied);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!signedIn) {
    return (
      <div className="glass p-6">
        <h2 className="text-2xl">Want us to see your profile too?</h2>
        <p className="mt-1 text-secondary">Sign in and tap &ldquo;I&apos;m interested&rdquo; so sortNow can look at your profile, streak and portfolio.</p>
        <Link href={`/login?next=/jobs/${slug}`} className="pill-teal mt-4" data-track="job-signin">
          Sign in
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
      toast({ title: "Interest noted", body: "Email us too so we know who to reply to.", icon: "spark" });
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
          <h2 className="text-2xl">Noted ✓</h2>
          <p className="mt-1 text-secondary">sortNow can see your interest and your profile. Email us too, so we know who to reply to.</p>
        </>
      ) : (
        <>
          <h2 className="text-2xl">Share your profile with sortNow</h2>
          <p className="mt-1 text-secondary">Optional. Lets us see your public profile. You still need to email us.</p>
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
    </div>
  );
}

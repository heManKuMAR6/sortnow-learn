"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { DayStatus } from "@/lib/challenges";

export function ChallengePanel({
  challengeId,
  status,
  savedResponse,
  signedIn,
}: {
  challengeId: string;
  status: DayStatus;
  savedResponse: string | null;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, response }),
      });
      const body = (await result.json()) as { error?: string };
      if (!result.ok) {
        setError(body.error ?? "That day could not be saved just now.");
        return;
      }
      setResponse("");
      router.refresh();
    } catch {
      setError("That day could not be saved just now.");
    } finally {
      setPending(false);
    }
  }

  if (status === "done") {
    return (
      <div className="mt-4">
        <span className="chip chip-mint">Saved</span>
        {savedResponse ? <p className="mt-3 text-sm text-secondary">{savedResponse}</p> : null}
      </div>
    );
  }

  if (!signedIn) {
    return <p className="mt-4 text-sm text-secondary">Sign in to save this day.</p>;
  }

  if (status === "locked") {
    return <p className="mt-4 text-sm text-secondary">Finish the earlier day on this track first.</p>;
  }

  if (status === "wait") {
    return (
      <p className="mt-4 text-sm text-secondary">
        You already did this track today. This one waits until tomorrow.
      </p>
    );
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mt-4 grid gap-3">
      <label className="grid gap-1 text-sm" htmlFor={`response-${challengeId}`}>
        Your answer
        <textarea
          id={`response-${challengeId}`}
          name="response"
          required
          minLength={20}
          maxLength={800}
          rows={4}
          value={response}
          onChange={(event) => setResponse(event.target.value)}
          className="field"
        />
      </label>
      {error ? <p className="text-sm text-coral">{error}</p> : null}
      <button
        type="submit"
        data-track={`save-challenge-${challengeId}`}
        disabled={pending}
        className="pill-coral w-fit text-sm"
      >
        {pending ? "Saving…" : "Save this day"}
      </button>
    </form>
  );
}

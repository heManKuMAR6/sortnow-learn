"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileNameForm({ initialName }: { initialName: string | null }) {
  const router = useRouter();
  const [name, setName] = useState(initialName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Your name could not be saved just now.");
        return;
      }
      router.refresh();
    } catch {
      setError("Your name could not be saved just now.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="grid max-w-md gap-3">
      <label className="grid gap-1 text-sm" htmlFor="display-name">
        Display name
        <input
          id="display-name"
          name="displayName"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="First and last name"
          className="field"
        />
      </label>
      <p className="text-sm text-secondary">
        A first and last name shows two initials. Hemanth Kumar becomes HK. Leave it blank to use a
        temporary initial from your email.
      </p>
      {error ? <p className="text-sm text-coral">{error}</p> : null}
      <button type="submit" data-track="save-display-name" disabled={pending} className="pill-teal w-fit text-sm">
        {pending ? "Saving…" : "Save name"}
      </button>
    </form>
  );
}

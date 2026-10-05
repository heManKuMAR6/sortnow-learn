"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Could not delete the account.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("The line hiccuped. Try once more.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="glass p-6" aria-labelledby="danger-h">
      <h2 id="danger-h" className="text-3xl">
        Delete my account
      </h2>
      <p className="mt-1 text-secondary">
        This removes your profile, portfolio, points and streak for good. It cannot be undone.
      </p>
      {open ? (
        <form onSubmit={(e) => void submit(e)} className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">
            Type <strong>DELETE</strong> to confirm
            <input className="field" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
          </label>
          {error ? <p className="text-sm text-coral">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="pill-coral" disabled={pending || confirm !== "DELETE"}>
              {pending ? "Deleting…" : "Delete everything"}
            </button>
            <button type="button" className="pill-white" onClick={() => setOpen(false)}>
              Keep my account
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="pill-white mt-4" onClick={() => setOpen(true)}>
          I want to delete my account
        </button>
      )}
    </section>
  );
}

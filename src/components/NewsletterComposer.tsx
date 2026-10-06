"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Issue = { id: string; subject: string; recipients: number; sent: number; failed: number; completedAt: string | null };

async function call(body: unknown) {
  const response = await fetch("/api/admin/newsletter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as { error?: string; issue?: Issue; remaining?: number; done?: boolean; stopped?: boolean; to?: string };
  return { ok: response.ok, json };
}

export function NewsletterComposer({ configured, audience }: { configured: boolean; audience: number }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [more, setMore] = useState(false);

  async function run(payload: Record<string, unknown>, label: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const { ok, json } = await call(payload);
      if (!ok) {
        setError(json.error ?? "That did not work.");
        return;
      }
      if (json.to) {
        setMessage(`Test sent to ${json.to}. Check your inbox (and spam) before sending to everyone.`);
        return;
      }
      if (json.issue) {
        router.refresh(); // the "Sent" list below is server-rendered
        setIssue(json.issue);
        setMore(!json.done);
        setMessage(
          json.done
            ? `${label} finished: ${json.issue.sent} sent.`
            : json.stopped
              ? `Stopped after a sending error (${json.issue.failed} failed). Check the Resend key and domain, then retry.`
              : `${json.issue.sent} sent, ${json.issue.failed} failed, ${json.remaining ?? 0} still to go. Click continue.`,
        );
      }
    } catch {
      setError("The line hiccuped. Try once more.");
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <div className="glass mt-6 p-5">
        <h2 className="text-2xl">Sending is not set up yet</h2>
        <p className="mt-2 text-secondary">
          Create a free account at resend.com, verify your sending domain, then add these in Vercel (Project settings, Environment
          variables) and redeploy: <code>RESEND_API_KEY</code> and <code>NEWSLETTER_FROM</code> (for example{" "}
          <code>sortNow Learn &lt;news@learn.sortnow.co&gt;</code>). Optionally add <code>NEWSLETTER_FOOTER_ADDRESS</code> with a postal address.
        </p>
      </div>
    );
  }

  return (
    <div className="glass mt-6 grid gap-4 p-5">
      <label className="grid gap-1 text-sm">
        Subject
        <input className="field" maxLength={150} value={subject} onChange={(e) => setSubject(e.target.value)} />
      </label>
      <label className="grid gap-1 text-sm">
        Message <span className="text-xs text-muted">(plain text; a blank line starts a new paragraph; links become clickable)</span>
        <textarea className="field min-h-64" value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <p className="text-xs text-muted">Each email starts with “Hi &lt;first name&gt;,” and ends with a one-click unsubscribe link. You do not need to add either.</p>
      {error ? <p className="text-sm text-coral" role="alert">{error}</p> : null}
      {message ? <p className="rounded-2xl bg-mint/30 p-3 text-sm" role="status">{message}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="button" className="pill-white" disabled={busy || !subject.trim() || !body.trim()} onClick={() => void run({ mode: "test", subject, body }, "Test")} data-track="newsletter-test">
          {busy ? "Working…" : "Send me a test"}
        </button>
      </div>
      <div className="grid gap-2 rounded-2xl bg-white/50 p-4">
        <p className="text-sm">
          This will email <strong>{audience}</strong> {audience === 1 ? "person" : "people"}: everyone who agreed to the newsletter and has not unsubscribed.
        </p>
        <label className="grid gap-1 text-sm">
          Type SEND to confirm
          <input className="field max-w-xs" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="pill-coral"
            disabled={busy || confirm !== "SEND" || !subject.trim() || !body.trim() || audience === 0 || Boolean(issue)}
            onClick={() => void run({ mode: "send", subject, body, confirm }, "Send")}
            data-track="newsletter-send"
          >
            {busy ? "Sending…" : `Send to ${audience}`}
          </button>
          {issue && more ? (
            <button type="button" className="pill-teal" disabled={busy} onClick={() => void run({ mode: "send", issueId: issue.id, confirm: "SEND" }, "Send")} data-track="newsletter-continue">
              Continue or retry failed
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

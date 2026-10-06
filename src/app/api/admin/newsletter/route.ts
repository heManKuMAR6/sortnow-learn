import { NextResponse } from "next/server";
import { bad, fromError, readJson } from "@/lib/api";
import { newsletterConfig, sendBatch, type Recipient } from "@/lib/newsletter-send";
import { getStore } from "@/lib/platform/store";
import { getCurrentUser } from "@/lib/session";

export const maxDuration = 60;

const BATCH = 50;
const BUDGET_MS = 40_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// POST { subject, body, mode: "test" }                  -> one email, to the admin only
// POST { subject, body, mode: "send", confirm: "SEND" } -> everyone who agreed and has not unsubscribed
// POST { issueId, mode: "send", confirm: "SEND" }       -> carry on with, or retry, an earlier send
export async function POST(request: Request) {
  const user = await getCurrentUser();
  const store = getStore();
  if (!user || !(await store.isAdmin(user).catch(() => false))) return new NextResponse("Not found", { status: 404 });

  const cfg = newsletterConfig();
  if (!cfg) {
    return bad("Sending is not set up yet. Add RESEND_API_KEY and NEWSLETTER_FROM in Vercel (see the README), then try again.", 503);
  }
  const input = await readJson(request);
  if (!input) return bad("Expected JSON.");
  const mode = input.mode;
  if (mode !== "test" && mode !== "send") return bad("Unknown mode.");

  try {
    if (mode === "test") {
      const subject = typeof input.subject === "string" ? input.subject.trim() : "";
      const body = typeof input.body === "string" ? input.body.trim() : "";
      if (!subject || subject.length > 150) return bad("Add a subject (up to 150 characters).");
      if (!body || body.length > 20000) return bad("Write the newsletter (up to 20,000 characters).");
      const result = await sendBatch(cfg, `[Test] ${subject}`, body, [
        { email: user.email, name: user.name, token: "0".repeat(32) },
      ]);
      if (!result.ok) return bad(`The test did not send: ${result.error}`, 502);
      return NextResponse.json({ ok: true, to: user.email });
    }

    if (input.confirm !== "SEND") return bad('Type SEND to confirm.');
    const everyone = await store.mailableSubscribers();

    let issue;
    if (typeof input.issueId === "string") {
      issue = await store.getIssue(input.issueId);
      if (!issue) return bad("No such issue.", 404);
    } else {
      const subject = typeof input.subject === "string" ? input.subject.trim() : "";
      const body = typeof input.body === "string" ? input.body.trim() : "";
      if (!subject || subject.length > 150) return bad("Add a subject (up to 150 characters).");
      if (!body || body.length > 20000) return bad("Write the newsletter (up to 20,000 characters).");
      if (everyone.length === 0) return bad("Nobody can be emailed yet: no one has agreed to the newsletter.");
      issue = await store.createIssue(subject, body, user.id, everyone.length);
    }

    const already = new Set((await store.sentEmails(issue.id)).map((e) => e.toLowerCase()));
    const pending: Recipient[] = everyone.filter((p) => !already.has(p.email.toLowerCase()));
    const started = Date.now();
    let processed = 0;
    let stopped = false;
    for (let i = 0; i < pending.length; i += BATCH) {
      if (Date.now() - started > BUDGET_MS) break;
      const chunk = pending.slice(i, i + BATCH);
      const result = await sendBatch(cfg, issue.subject, issue.body, chunk);
      issue = await store.recordSends(
        issue.id,
        chunk.map((p) => (result.ok ? { email: p.email, status: "sent" as const } : { email: p.email, status: "failed" as const, error: result.error })),
      );
      processed += chunk.length;
      if (!result.ok && (result.status === 401 || result.status === 403)) {
        stopped = true; // wrong key or unverified domain: every further batch would fail the same way
        break;
      }
      if (i + BATCH < pending.length) await sleep(600);
    }
    const remaining = pending.length - processed;
    const done = remaining === 0 && !stopped && issue.failed === 0;
    if (done) await store.completeIssue(issue.id);
    return NextResponse.json({ ok: true, issue, remaining, done, stopped });
  } catch (error) {
    return fromError(error);
  }
}

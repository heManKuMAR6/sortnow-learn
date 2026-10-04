import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterInline } from "@/components/NewsletterInline";
import { PuzzleMark } from "@/components/PuzzleMark";
import { Reveal } from "@/components/Reveal";
import { formatDay } from "@/lib/format";
import { latestIssue } from "@/lib/newsletter";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "The weekly email",
  description: "A short weekly email on AI: what changed, what to learn next, and one thing to try.",
};

export default async function NewsletterPage() {
  const issue = latestIssue();
  const user = await getCurrentUser();
  if (!issue) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal>
        <p className="eyebrow">The weekly email</p>
        <h1 className="mt-3 text-5xl">
          Stay a step ahead<span className="dot">.</span>
        </h1>
        <p className="mt-3 text-lg text-secondary">
          One short email a week: what changed in AI, what to learn next, and one thing to try. Here is what an issue
          looks like.
        </p>
        <div className="glass mt-6 p-5">
          <NewsletterInline signedIn={Boolean(user)} />
        </div>
      </Reveal>

      <Reveal className="mt-10">
        <p className="eyebrow mb-3">Sample issue</p>
        <article className="email-card">
          <header className="email-head">
            <PuzzleMark size={36} animate={false} />
            <span>
              <strong>sortNow Learn</strong>
              <small>
                Issue {issue.number} · {formatDay(issue.date)}
              </small>
            </span>
          </header>
          <div className="email-body">
            <h2 className="text-3xl">{issue.title}</h2>
            <p className="mt-2 text-secondary">{issue.intro}</p>

            <h3 className="mt-7 text-xl">One idea: {issue.idea.title}</h3>
            {issue.idea.body.map((p) => (
              <p key={p} className="mt-2">
                {p}
              </p>
            ))}

            <h3 className="mt-7 text-xl">Try this: {issue.tryThis.title}</h3>
            <ol className="mt-2 grid list-decimal gap-1 pl-5">
              {issue.tryThis.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>

            <h3 className="mt-7 text-xl">Go next</h3>
            <ul className="mt-2 grid gap-2">
              {issue.picks.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className="text-link" data-track="newsletter-pick">
                    {p.label}
                  </Link>
                  <span className="text-sm text-muted"> · {p.note}</span>
                </li>
              ))}
            </ul>
          </div>
          <footer className="email-foot">You are reading a sample. Subscribers get this in their inbox.</footer>
        </article>
      </Reveal>
    </div>
  );
}

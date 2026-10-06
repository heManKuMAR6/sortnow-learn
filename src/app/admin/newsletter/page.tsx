import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterComposer } from "@/components/NewsletterComposer";
import { requireAdmin } from "@/lib/gate";
import { newsletterConfig } from "@/lib/newsletter-send";
import { getStore } from "@/lib/platform/store";
import { safely } from "@/lib/safe";

export const metadata: Metadata = { title: "Newsletter", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  await requireAdmin();
  const store = getStore();
  const [mailable, issues] = await Promise.all([
    safely(store.mailableSubscribers(), [], "mailable"),
    safely(store.listIssues(15), [], "issues"),
  ]);
  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow">Admin</p>
      <h1 className="mt-2 text-5xl">
        Newsletter<span className="dot">.</span>
      </h1>
      <p className="mt-3 text-secondary">
        Only people who agreed and have not unsubscribed are emailed. <Link href="/admin" className="text-link">Back to audience</Link>
      </p>
      <NewsletterComposer configured={newsletterConfig() !== null} audience={mailable.length} />
      <section className="glass mt-6 p-5">
        <h2 className="text-2xl">Sent</h2>
        {issues.length === 0 ? (
          <p className="mt-2 text-sm text-secondary">Nothing sent yet.</p>
        ) : (
          <ul className="mt-3 grid gap-2 text-sm">
            {issues.map((i) => (
              <li key={i.id} className="flex flex-wrap justify-between gap-2 border-t border-black/5 pt-2">
                <span className="font-semibold">{i.subject}</span>
                <span className="text-secondary">
                  {new Date(i.createdAt).toISOString().slice(0, 10)} · {i.sent} sent
                  {i.failed ? ` · ${i.failed} failed` : ""} of {i.recipients}
                  {i.completedAt ? "" : " · not finished"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

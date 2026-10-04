import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Status", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const TABLES: { table: string; probe: string }[] = [
  { table: "profiles", probe: "id, handle, points, streak" },
  { table: "daily_activity", probe: "user_id" },
  { table: "awards", probe: "user_id" },
  { table: "portfolio_items", probe: "id" },
  { table: "job_applications", probe: "id" },
  { table: "newsletter_subscribers", probe: "id" },
  { table: "leads", probe: "id" },
  { table: "lesson_questions", probe: "id" },
];

export default async function StatusPage() {
  const connected = isSupabaseConfigured();
  const rows: { table: string; ok: boolean }[] = [];
  if (connected) {
    const supabase = await createClient();
    for (const { table, probe } of TABLES) {
      // A real read, not HEAD: HEAD hides the error body and can report a missing table as fine.
      const { error, status } = await supabase.from(table).select(probe).limit(1);
      rows.push({ table, ok: !error && status < 400 });
    }
  }
  const missing = rows.filter((r) => !r.ok);

  return (
    <div className="mx-auto max-w-xl">
      <p className="eyebrow">Status</p>
      <h1 className="mt-2 text-4xl">Setup check</h1>
      <div className="glass mt-6 grid gap-3 p-6">
        <p>
          <strong>Database:</strong> {connected ? "connected" : "not connected (preview mode, data is temporary)"}
        </p>
        {connected ? (
          <>
            <ul className="grid gap-1 text-sm">
              {rows.map((r) => (
                <li key={r.table} className="flex items-center gap-2">
                  <span className={r.ok ? "text-[#2e9e6b]" : "text-coral"}>{r.ok ? "✓" : "✗"}</span>
                  <code>{r.table}</code>
                  {r.ok ? null : <span className="text-muted">missing or outdated</span>}
                </li>
              ))}
            </ul>
            {missing.length ? (
              <p className="rounded-2xl bg-sun/40 p-3 text-sm">
                Open the Supabase SQL editor, paste the whole of <code>supabase/schema.sql</code> from the repo, and
                run it. It is safe to run again. Then reload this page.
              </p>
            ) : (
              <p className="rounded-2xl bg-mint/30 p-3 text-sm">All tables are in place.</p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

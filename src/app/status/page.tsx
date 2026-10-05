import type { Metadata } from "next";
import { hasStrongSecret } from "@/lib/secret";
import { isDemoEnabled, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Status", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type State = "ok" | "private" | "missing" | "error";

// "private" means the table exists and the public key is correctly refused. That is the
// intended state for tables like awards, so it must not be reported as missing.
function classify(error: { code?: string; message?: string } | null, status: number): State {
  if (!error && status < 400) return "ok";
  if (error?.code === "PGRST205" || error?.code === "42P01" || error?.code === "PGRST202" || error?.code === "42883" || status === 404) return "missing";
  if (error?.code === "42501" || status === 401 || status === 403) return "private";
  return "error";
}

const TABLES: { table: string; probe: string }[] = [
  { table: "profiles", probe: "id, handle, points, streak" },
  { table: "profile_private", probe: "user_id" },
  { table: "daily_activity", probe: "user_id" },
  { table: "awards", probe: "user_id" },
  { table: "award_catalog", probe: "kind" },
  { table: "challenge_answers", probe: "slug" },
  { table: "portfolio_items", probe: "id" },
  { table: "job_applications", probe: "id" },
  { table: "jobs", probe: "slug, status" },
  { table: "admins", probe: "user_id" },
  { table: "newsletter_subscribers", probe: "id" },
  { table: "leads", probe: "id" },
  { table: "lesson_questions", probe: "id" },
];

const FUNCTIONS: { fn: string; args?: Record<string, unknown> }[] = [
  { fn: "checkin" },
  { fn: "complete_lesson", args: { p_slug: "x" } },
  { fn: "submit_challenge", args: { p_slug: "x", p_answers: [] } },
  { fn: "set_timezone", args: { p_tz: "UTC" } },
  { fn: "delete_my_account" },
  { fn: "is_admin" },
];

const label: Record<State, string> = {
  ok: "ready",
  private: "ready (private, as intended)",
  missing: "missing or outdated: run supabase/schema.sql",
  error: "unexpected error",
};

export default async function StatusPage() {
  const connected = isSupabaseConfigured();
  const rows: { name: string; kind: string; state: State }[] = [];
  if (connected) {
    const supabase = await createClient();
    for (const { table, probe } of TABLES) {
      const { error, status } = await supabase.from(table).select(probe).limit(1);
      rows.push({ name: table, kind: "table", state: classify(error, status) });
    }
    for (const { fn, args } of FUNCTIONS) {
      const { error, status } = await supabase.rpc(fn, args ?? {});
      rows.push({ name: `${fn}()`, kind: "function", state: classify(error, status) });
    }
  }
  const bad = rows.filter((r) => r.state === "missing" || r.state === "error");

  return (
    <div className="mx-auto max-w-xl">
      <p className="eyebrow">Status</p>
      <h1 className="mt-2 text-4xl">Setup check</h1>
      <div className="glass mt-6 grid gap-4 p-6">
        <ul className="grid gap-1 text-sm">
          <li>
            <strong>Database:</strong> {connected ? "connected" : "not connected"}
          </li>
          <li>
            <strong>Demo login:</strong> {isDemoEnabled() ? "ON (preview mode, data is temporary)" : "off"}
          </li>
          <li className={hasStrongSecret() ? "" : "text-coral"}>
            <strong>APP_SECRET:</strong> {hasStrongSecret() ? "set" : "NOT set. Add a 32+ character random value so signed cookies cannot be forged."}
          </li>
          <li>
            <strong>Social sign-in buttons:</strong> {process.env.NEXT_PUBLIC_AUTH_PROVIDERS?.trim() || "none (email only)"}
          </li>
        </ul>
        {connected ? (
          <>
            <ul className="grid gap-1 text-sm">
              {rows.map((r) => (
                <li key={`${r.kind}-${r.name}`} className="flex flex-wrap items-center gap-2">
                  <span className={r.state === "ok" || r.state === "private" ? "text-[#2e9e6b]" : "text-coral"}>
                    {r.state === "ok" || r.state === "private" ? "✓" : "✗"}
                  </span>
                  <code>{r.name}</code>
                  <span className="text-muted">{label[r.state]}</span>
                </li>
              ))}
            </ul>
            {bad.length ? (
              <p className="rounded-2xl bg-sun/40 p-3 text-sm">
                Open the Supabase SQL editor, paste the whole of <code>supabase/schema.sql</code> from the repo, and run it.
                It is safe to run again. Then reload this page.
              </p>
            ) : (
              <p className="rounded-2xl bg-mint/30 p-3 text-sm">Everything the app needs is in place.</p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

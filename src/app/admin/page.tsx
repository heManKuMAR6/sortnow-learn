import type { Metadata } from "next";
import Link from "next/link";
import { loadAdminData, summarize } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/gate";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const when = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16).replace("T", " ") : "");

function Table({ head, rows, empty }: { head: string[]; rows: (string | number | null)[][]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-secondary">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-2 py-2 font-semibold text-secondary">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-black/5">
              {r.map((c, j) => (
                <td key={j} className="px-2 py-2 align-top">
                  {c ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminPage() {
  await requireAdmin();
  const data = await loadAdminData();
  const { pages, activeMembers7d, sessions } = summarize(data.events);
  const names = new Map(data.members.map((m) => [m.id, m.display_name ?? m.email]));
  const mailable = data.subscribers.filter((s) => s.consent && !s.unsubscribed_at).length;
  const exp = (kind: string, label: string) => (
    <a className="pill-white" href={`/api/admin/export?kind=${kind}`} data-track={`export-${kind}`}>
      {label}
    </a>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <p className="eyebrow">Admin</p>
      <h1 className="mt-2 text-5xl">
        Audience<span className="dot">.</span>
      </h1>
      <p className="mt-3 text-secondary">
        Only admins see this page. <Link href="/admin/jobs" className="text-link">Manage jobs</Link>
      </p>
      {data.mode === "demo" ? <p className="mt-4 rounded-2xl bg-sun/30 p-3 text-sm">Preview mode: only leads saved to this machine are shown.</p> : null}
      {data.errors.length ? (
        <p className="mt-4 rounded-2xl bg-coral/20 p-3 text-sm" role="alert">Some data could not be read: {data.errors.join("; ")}</p>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Leads", data.leads.length],
          ["Subscribers you can email", mailable],
          ["Members", data.members.length],
          ["Active members, 7 days", activeMembers7d],
          ["Visits tracked", sessions],
        ].map(([label, n]) => (
          <div key={label} className="card p-4">
            <p className="text-3xl font-semibold">{n}</p>
            <p className="text-sm text-secondary">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {exp("newsletter", "Newsletter list (CSV)")}
        {exp("leads", "Leads (CSV)")}
        {exp("subscribers", "Subscribers (CSV)")}
        {exp("members", "Members (CSV)")}
        {exp("events", "Activity (CSV)")}
      </div>

      <section className="glass mt-8 p-5">
        <h2 className="text-2xl">Where people go</h2>
        <p className="mb-3 text-sm text-secondary">From the latest {data.events.length} recorded events.</p>
        <Table
          head={["Page", "Views", "People", "Avg time (s)", "Avg scroll %"]}
          rows={pages.slice(0, 25).map((p) => [p.path, p.views, p.people, p.avgSeconds, p.avgDepth])}
          empty="No activity recorded yet."
        />
      </section>

      <section className="glass mt-6 p-5">
        <h2 className="text-2xl">Leads</h2>
        <p className="mb-3 text-sm text-secondary">People who left their details on a reel drop or the notes.</p>
        <Table
          head={["When", "Name", "Email", "Phone", "From", "Agreed", "Unsubscribed"]}
          rows={data.leads.slice(0, 200).map((l) => [when(l.created_at), l.name, l.email, l.phone, l.path ?? l.source, l.consent ? when(l.consent_at) : "No (older entry, do not email)", when(l.unsubscribed_at)])}
          empty="No leads yet."
        />
      </section>

      <section className="glass mt-6 p-5">
        <h2 className="text-2xl">Newsletter subscribers</h2>
        <Table
          head={["When", "Email", "Name", "Source", "Agreed", "Unsubscribed"]}
          rows={data.subscribers.slice(0, 200).map((s) => [when(s.created_at), s.email, s.name, s.source, s.consent ? when(s.consent_at) : "No (older entry)", when(s.unsubscribed_at)])}
          empty="No subscribers yet."
        />
      </section>

      <section className="glass mt-6 p-5">
        <h2 className="text-2xl">Members</h2>
        <Table
          head={["Joined", "Name", "Email", "Points", "Streak", "Last sign-in"]}
          rows={data.members.slice(0, 200).map((m) => [when(m.created_at), m.display_name, m.email, m.points, m.streak, when(m.last_sign_in_at)])}
          empty="No members yet."
        />
      </section>

      <section className="glass mt-6 p-5">
        <h2 className="text-2xl">Latest movements</h2>
        <Table
          head={["When", "Who", "What", "Page", "From", "Seconds"]}
          rows={data.events
            .filter((e) => e.type === "view" || e.type === "dwell" || e.type === "session")
            .slice(0, 60)
            .map((e) => [when(e.created_at), e.user_id ? (names.get(e.user_id) ?? "member") : `visitor ${e.session_id?.slice(0, 6) ?? ""}`, e.type, e.path, e.referrer, e.seconds])}
          empty="Nothing yet."
        />
      </section>
    </div>
  );
}

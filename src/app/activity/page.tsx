import type { Metadata } from "next";
import Link from "next/link";
import { formatWhen } from "@/lib/format";
import { localEventsFor } from "@/lib/events-store";
import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { StoredEvent } from "@/lib/event-types";

export const metadata: Metadata = { title: "Activity" };

type Row = {
  id: string;
  type: string;
  path: string;
  target: string | null;
  depth: number | null;
  createdAt: string;
};

export default async function ActivityPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div>
        <h1 className="text-4xl">Activity</h1>
        <p className="mt-4 max-w-xl">Sign in to see your recent visits.</p>
        <p className="mt-4">
          <Link href="/login" data-track="activity-sign-in" className="pill-teal text-sm">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  let rows: Row[] = [];
  let readError: string | null = null;

  if (user.mode === "supabase") {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("id, type, path, target, depth, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      readError = error.message;
    } else {
      rows = (data ?? []).map((row) => {
        const event = row as {
          id: string;
          type: string;
          path: string;
          target: string | null;
          depth: number | null;
          created_at: string;
        };
        return {
          id: event.id,
          type: event.type,
          path: event.path,
          target: event.target,
          depth: event.depth,
          createdAt: event.created_at,
        };
      });
    }
  } else {
    const events: StoredEvent[] = await localEventsFor(user.id);
    rows = events.slice(0, 100).map((event) => ({
      id: event.id,
      type: event.type,
      path: event.path,
      target: event.target,
      depth: event.depth,
      createdAt: event.createdAt,
    }));
  }

  return (
    <div>
      <h1 className="text-4xl">Activity</h1>
      <p className="mt-3 max-w-xl text-secondary">Recent visits on this account.</p>
      {readError ? (
        <p className="mt-4 max-w-xl text-sm text-coral">Could not load activity just now.</p>
      ) : null}
      {rows.length === 0 && !readError ? (
        <p className="mt-6 max-w-xl">
          No events yet. Open a lesson and scroll, or click a note. Scroll depth and click targets
          show up here.
        </p>
      ) : null}
      {rows.length > 0 ? (
        <div className="glass mt-6 overflow-x-auto p-4">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/70 text-muted">
                <th className="py-2 pr-4 font-medium">When</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Path</th>
                <th className="py-2 pr-4 font-medium">Target</th>
                <th className="py-2 font-medium">Depth</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-white/60">
                  <td className="py-2 pr-4 whitespace-nowrap">{formatWhen(row.createdAt)}</td>
                  <td className="py-2 pr-4">{row.type}</td>
                  <td className="py-2 pr-4">{row.path}</td>
                  <td className="py-2 pr-4">{row.target ?? "—"}</td>
                  <td className="py-2">{row.depth === null ? "—" : `${row.depth}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

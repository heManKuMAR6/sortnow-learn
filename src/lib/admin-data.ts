import { readFile } from "fs/promises";
import path from "path";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type LeadRow = {
  name: string;
  email: string;
  phone: string | null;
  source: string;
  path: string | null;
  campaign: string | null;
  consent: boolean;
  consent_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
};
export type SubscriberRow = {
  email: string;
  name: string | null;
  source: string;
  consent: boolean;
  consent_at: string | null;
  unsub_token: string;
  unsubscribed_at: string | null;
  created_at: string;
};
export type MemberRow = {
  id: string;
  email: string;
  display_name: string | null;
  handle: string | null;
  points: number;
  streak: number;
  created_at: string;
  last_sign_in_at: string | null;
  phone?: string | null;
};
export type EventRow = {
  user_id: string | null;
  type: string;
  path: string;
  session_id: string | null;
  referrer: string | null;
  seconds: number | null;
  depth: number | null;
  created_at: string;
};

export type AdminData = {
  mode: "supabase" | "demo";
  leads: LeadRow[];
  subscribers: SubscriberRow[];
  members: MemberRow[];
  events: EventRow[];
  errors: string[];
};

const EVENT_LIMIT = 5000;

export async function loadAdminData(): Promise<AdminData> {
  const out: AdminData = { mode: "supabase", leads: [], subscribers: [], members: [], events: [], errors: [] };
  if (!isSupabaseConfigured()) {
    out.mode = "demo";
    try {
      const raw = JSON.parse(await readFile(path.join(process.cwd(), "data", "leads.json"), "utf8")) as { name: string; email: string; phone: string | null; source: string; path: string; campaign?: string | null; createdAt: string }[];
      out.leads = raw.map((l) => ({ name: l.name, email: l.email, phone: l.phone, source: l.source, path: l.path, campaign: (l as { campaign?: string | null }).campaign ?? null, consent: true, consent_at: l.createdAt, unsubscribed_at: null, created_at: l.createdAt })).reverse();
    } catch {
      // No local leads yet.
    }
    return out;
  }
  const supabase = await createClient();
  const [leads, subs, members, events, privateRows] = await Promise.all([
    supabase.from("leads").select("name, email, phone, source, path, campaign, consent, consent_at, unsubscribed_at, created_at").order("created_at", { ascending: false }).limit(2000),
    supabase.from("newsletter_subscribers").select("email, name, source, consent, consent_at, unsub_token, unsubscribed_at, created_at").order("created_at", { ascending: false }).limit(2000),
    supabase.rpc("admin_members"),
    supabase.from("events").select("user_id, type, path, session_id, referrer, seconds, depth, created_at").order("created_at", { ascending: false }).limit(EVENT_LIMIT),
    supabase.from("profile_private").select("user_id, phone").not("phone", "is", null),
  ]);
  if (leads.error) out.errors.push(`leads: ${leads.error.message}`);
  else out.leads = (leads.data ?? []) as LeadRow[];
  if (subs.error) out.errors.push(`subscribers: ${subs.error.message}`);
  else out.subscribers = (subs.data ?? []) as SubscriberRow[];
  if (members.error) out.errors.push(`members: ${members.error.message}`);
  else {
    const phones = new Map(((privateRows.data ?? []) as { user_id: string; phone: string | null }[]).map((r) => [r.user_id, r.phone]));
    out.members = ((members.data ?? []) as MemberRow[]).map((m) => ({ ...m, phone: phones.get(m.id) ?? null }));
  }
  if (events.error) out.errors.push(`events: ${events.error.message}`);
  else out.events = (events.data ?? []) as EventRow[];
  return out;
}

/** CSV with spreadsheet formula injection neutralised (a cell starting with = + - @ is quoted as text). */
export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const cell = (v: unknown) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.join(","), ...rows.map((r) => columns.map((c) => cell(r[c])).join(","))].join("\r\n") + "\r\n";
}

export type PageStat = { path: string; views: number; people: number; avgSeconds: number | null; avgDepth: number | null };

export function summarize(events: EventRow[]) {
  const byPath = new Map<string, { views: number; sessions: Set<string>; secs: number[]; depth: number[] }>();
  const get = (p: string) => {
    let v = byPath.get(p);
    if (!v) byPath.set(p, (v = { views: 0, sessions: new Set(), secs: [], depth: [] }));
    return v;
  };
  const weekAgo = Date.now() - 7 * 86_400_000;
  const activeMembers = new Set<string>();
  const sessions = new Set<string>();
  for (const e of events) {
    const who = e.user_id ?? e.session_id ?? "anon";
    if (e.session_id) sessions.add(e.session_id);
    if (e.user_id && Date.parse(e.created_at) >= weekAgo) activeMembers.add(e.user_id);
    const p = get(e.path.replace(/\?.*$/, ""));
    if (e.type === "view") {
      p.views += 1;
      p.sessions.add(who);
    } else if (e.type === "dwell" && e.seconds !== null) p.secs.push(e.seconds);
    else if (e.type === "scroll" && e.depth !== null) p.depth.push(e.depth);
  }
  const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null);
  const pages: PageStat[] = [...byPath.entries()]
    .filter(([, v]) => v.views > 0)
    .map(([p, v]) => ({ path: p, views: v.views, people: v.sessions.size, avgSeconds: avg(v.secs), avgDepth: avg(v.depth) }))
    .sort((a, b) => b.views - a.views);
  return { pages, activeMembers7d: activeMembers.size, sessions: sessions.size };
}

import { JOB_LEVELS, JOB_MODES, JOB_TYPES, jobSlug, type JobInput } from "@/lib/jobs";

const has = <T extends readonly string[]>(list: T, v: unknown): v is T[number] =>
  typeof v === "string" && (list as readonly string[]).includes(v);

const text = (v: unknown, max: number) => (typeof v === "string" && v.trim().length <= max ? v.trim() : null);

const list = (v: unknown, maxItems: number, maxLen: number): string[] | null => {
  const raw = Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : [];
  const items = [...new Set(raw.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean))];
  return items.length <= maxItems && items.every((x) => x.length <= maxLen) ? items : null;
};

/** Validates what an admin typed. Returns the clean job or a message to show. */
export function parseJobInput(body: Record<string, unknown>): JobInput | string {
  const title = text(body.title, 120);
  if (!title) return "Give the role a title.";
  const location = text(body.location, 80);
  if (!location) return "Add a location (or Remote).";
  const company = text(body.company ?? "", 80);
  if (company === null) return "Company can be up to 80 characters.";
  if (!has(JOB_MODES, body.mode)) return "Choose Remote, Hybrid or On-site.";
  if (!has(JOB_LEVELS, body.level)) return "Choose a level.";
  const type = body.type === "" || body.type === undefined || body.type === null ? undefined : body.type;
  if (type !== undefined && !has(JOB_TYPES, type)) return "That job type is not valid.";
  const summary = text(body.summary ?? "", 300);
  if (summary === null) return "Summary can be up to 300 characters.";
  const aboutRaw = typeof body.about === "string" ? body.about.split(/\n\s*\n/) : Array.isArray(body.about) ? body.about : [];
  const about = aboutRaw.map((p) => (typeof p === "string" ? p.trim() : "")).filter(Boolean);
  if (about.length > 12 || about.some((p) => p.length > 1500)) return "Keep the description to 12 paragraphs of 1500 characters.";
  const skills = list(body.skills, 20, 60);
  if (!skills) return "Up to 20 skills, 60 characters each.";
  const posted = typeof body.posted === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.posted) ? body.posted : new Date().toISOString().slice(0, 10);
  const slugIn = typeof body.slug === "string" ? body.slug.trim() : "";
  const slug = /^[a-z0-9][a-z0-9-]{1,80}$/.test(slugIn) ? slugIn : `${jobSlug(title, company || undefined)}-${Math.random().toString(36).slice(2, 6)}`;
  const status = body.status === "closed" ? "closed" : body.status === "open" ? "open" : undefined;
  return {
    slug,
    title,
    ...(company ? { company } : {}),
    location,
    mode: body.mode,
    level: body.level,
    ...(type ? { type: type as JobInput["type"] } : {}),
    posted,
    summary,
    about,
    skills,
    ...(status ? { status } : {}),
  };
}

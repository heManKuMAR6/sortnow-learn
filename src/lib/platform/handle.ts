export const HANDLE_RE = /^[a-z0-9][a-z0-9-]{2,29}$/;

export function slugify(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20)
    .replace(/-+$/g, "");
  return base.length >= 3 ? base : "learner";
}

export function suggestHandle(name: string, attempt = 0): string {
  const digits = String(Math.floor(100 + Math.random() * 900));
  const extra = attempt > 2 ? String(Math.floor(Math.random() * 90)) : "";
  return `${slugify(name)}-${digits}${extra}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** A friendly default name when the account has none: never the raw email. */
export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const words = local.replace(/[0-9_.+-]+/g, " ").trim();
  if (words.length < 2) return "New learner";
  return words.replace(/\b\w/g, (c) => c.toUpperCase());
}

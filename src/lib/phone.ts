// One rule for phone numbers everywhere (lead form, member settings, sign-up): digits with an
// optional leading +, spaces, dots, dashes and brackets; at least 7 digits; at most 40 characters.
export const PHONE_RE = /^[0-9+()\-.\s]{7,40}$/;

/** The cleaned number, null for blank (phone is optional for members), or undefined when it is invalid. */
export function cleanPhone(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  if (!v) return null;
  return PHONE_RE.test(v) && v.replace(/\D/g, "").length >= 7 ? v : undefined;
}

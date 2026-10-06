// A short tag on the link you share (for example /week?src=ig-week-41) so each lead can be
// traced to the post or newsletter that brought them. Kept for the visit, sent with the form.

const KEY = "sn_src";
export const SRC_RE = /^[a-z0-9][a-z0-9_-]{0,39}$/i;

export function captureCampaign(): void {
  try {
    const raw = new URLSearchParams(window.location.search).get("src");
    if (raw && SRC_RE.test(raw)) window.sessionStorage.setItem(KEY, raw.toLowerCase());
  } catch {
    // Storage blocked: the tag is simply not kept.
  }
}

export function readCampaign(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

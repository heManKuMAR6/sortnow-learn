// What people agree to, word for word. The server saves this exact text next to the
// person's details (not whatever the browser sent), so there is always a record of what
// they were shown. Change the wording => bump CONSENT_VERSION.

export const CONSENT_VERSION = "2026-10-v1";

export const LEAD_CONSENT_TEXT =
  "I agree that sortNow can store my name, email and phone number, send me this drop and a weekly newsletter, and record which pages I view to improve the site. I can unsubscribe in one click or ask for my data to be deleted at any time.";

export const NEWSLETTER_CONSENT_TEXT =
  "I agree that sortNow can store my email and send me the weekly newsletter. I can unsubscribe in one click at any time.";

export const SIGNUP_CONSENT_TEXT =
  "I agree to sortNow storing my name and email to run my account, and to the privacy notice. I understand my activity on the site (pages, clicks, time spent) is recorded to improve it and to show my progress.";

/** Stored as `consent_text`, e.g. "2026-10-v1: I agree that…". */
export const stamp = (text: string) => `${CONSENT_VERSION}: ${text}`;

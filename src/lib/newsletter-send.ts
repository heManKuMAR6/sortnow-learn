// Sending goes through Resend (resend.com, free tier 100 emails a day). Set these in Vercel:
//   RESEND_API_KEY            the API key (server-side only, never NEXT_PUBLIC_)
//   NEWSLETTER_FROM           e.g. "sortNow Learn <news@learn.sortnow.co>" (the domain must be verified in Resend)
//   NEWSLETTER_FOOTER_ADDRESS optional postal address line for the email footer (many countries require one)
//   RESEND_API_URL            optional, only for tests (points at a stand-in server)
import { oneClickUrl, renderEmail } from "@/lib/newsletter-email";
import { SITE_URL } from "@/lib/site";

export type NewsletterConfig = { key: string; from: string; apiUrl: string; footerAddress: string };

export function newsletterConfig(): NewsletterConfig | null {
  const key = process.env.RESEND_API_KEY?.trim() ?? "";
  const from = process.env.NEWSLETTER_FROM?.trim() ?? "";
  if (key.length < 8 || !from.includes("@")) return null;
  return {
    key,
    from,
    apiUrl: (process.env.RESEND_API_URL?.trim() || "https://api.resend.com").replace(/\/$/, ""),
    footerAddress: process.env.NEWSLETTER_FOOTER_ADDRESS?.trim() ?? "",
  };
}

export type Recipient = { email: string; name: string | null; token: string };

/** One batch request. A failure fails the whole batch (the API is all-or-nothing per request). */
export async function sendBatch(
  cfg: NewsletterConfig,
  subject: string,
  body: string,
  people: Recipient[],
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const messages = people.map((p) => {
    const { html, text } = renderEmail({ body, token: p.token, name: p.name, siteUrl: SITE_URL, footerAddress: cfg.footerAddress });
    return {
      from: cfg.from,
      to: [p.email],
      subject,
      html,
      text,
      headers: {
        "List-Unsubscribe": `<${oneClickUrl(SITE_URL, p.token)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };
  });
  try {
    const response = await fetch(`${cfg.apiUrl}/emails/batch`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });
    if (response.ok) return { ok: true };
    let detail = "";
    try {
      const j = (await response.json()) as { message?: string };
      detail = j.message ?? "";
    } catch {
      // not JSON
    }
    return { ok: false, status: response.status, error: `${response.status} ${detail}`.trim().slice(0, 250) };
  } catch (error) {
    return { ok: false, status: 0, error: error instanceof Error ? error.message.slice(0, 250) : "network error" };
  }
}

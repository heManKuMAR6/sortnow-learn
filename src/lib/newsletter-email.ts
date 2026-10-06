// Turns what you type in /admin/newsletter into an email. Plain text in, safe HTML out:
// blank lines make paragraphs, bare links become clickable, nothing you type can inject markup.
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function linkify(escaped: string): string {
  return escaped.replace(/\bhttps?:\/\/[^\s<]+/g, (url) => {
    const clean = url.replace(/[.,;:!?)]+$/, "");
    const tail = url.slice(clean.length);
    return `<a href="${clean}" style="color:#1F6F8B">${clean}</a>${tail}`;
  });
}

export const unsubscribeUrl = (siteUrl: string, token: string) => `${siteUrl}/unsubscribe?t=${token}`;
export const oneClickUrl = (siteUrl: string, token: string) => `${siteUrl}/api/unsubscribe?t=${token}`;

export function renderEmail(opts: { body: string; token: string; name: string | null; siteUrl: string; footerAddress?: string }) {
  const paragraphs = opts.body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const hello = opts.name ? `Hi ${opts.name.split(/\s+/)[0]},` : "Hi,";
  const unsub = unsubscribeUrl(opts.siteUrl, opts.token);
  const address = opts.footerAddress?.trim();

  const html = [
    '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#16313a;line-height:1.55">',
    `<p>${esc(hello)}</p>`,
    ...paragraphs.map((p) => `<p>${linkify(esc(p)).replace(/\n/g, "<br>")}</p>`),
    '<hr style="border:none;border-top:1px solid #e3eef0;margin:28px 0 12px">',
    '<p style="font-size:12px;color:#5b7480">You are getting this because you agreed to the sortNow Learn weekly newsletter.',
    ` <a href="${unsub}" style="color:#5b7480">Unsubscribe in one click</a>.`,
    address ? `<br>${esc(address)}` : "",
    "</p></div>",
  ].join("");

  const text = [
    hello,
    "",
    ...paragraphs.flatMap((p) => [p, ""]),
    "--",
    "You are getting this because you agreed to the sortNow Learn weekly newsletter.",
    `Unsubscribe in one click: ${unsub}`,
    ...(address ? [address] : []),
  ].join("\n");

  return { html, text };
}

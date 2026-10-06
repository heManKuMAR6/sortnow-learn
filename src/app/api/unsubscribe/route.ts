import { NextResponse } from "next/server";
import { tooMany } from "@/lib/abuse";
import { bad, fromError } from "@/lib/api";
import { getStore } from "@/lib/platform/store";

// Two ways in: the /unsubscribe page posts JSON { token }, and a mail app's one-click button posts
// to /api/unsubscribe?t=<token> (RFC 8058). Both land here.
export async function POST(request: Request) {
  const limited = tooMany(request, "unsub", 20, 10 * 60_000);
  if (limited) return limited;
  let token = new URL(request.url).searchParams.get("t")?.trim() ?? "";
  if (!token) {
    try {
      const body: unknown = await request.json();
      if (body && typeof body === "object" && typeof (body as { token?: unknown }).token === "string") {
        token = (body as { token: string }).token.trim();
      }
    } catch {
      // Not JSON: leave the token empty.
    }
  }
  if (token.length < 16 || token.length > 64) return bad("That link is not valid.");
  try {
    const found = await getStore().unsubscribe(token);
    if (!found) return bad("We could not find that subscription. It may already be removed.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fromError(error);
  }
}

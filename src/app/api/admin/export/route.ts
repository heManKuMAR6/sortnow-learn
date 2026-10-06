import { NextResponse } from "next/server";
import { loadAdminData, toCsv } from "@/lib/admin-data";
import { bad } from "@/lib/api";
import { getStore } from "@/lib/platform/store";
import { getCurrentUser } from "@/lib/session";
import { SITE_URL } from "@/lib/site";

// Admin-only CSV downloads. A non-admin gets a plain 404.
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !(await getStore().isAdmin(user).catch(() => false))) return new NextResponse("Not found", { status: 404 });

  const kind = new URL(request.url).searchParams.get("kind");
  const data = await loadAdminData();
  let csv: string;
  switch (kind) {
    case "leads":
      csv = toCsv(data.leads, ["name", "email", "phone", "source", "path", "campaign", "consent", "consent_at", "unsubscribed_at", "created_at"]);
      break;
    case "subscribers":
      csv = toCsv(data.subscribers, ["email", "name", "source", "consent", "consent_at", "unsubscribed_at", "created_at"]);
      break;
    case "newsletter": {
      // Everyone we may email: they agreed, and have not unsubscribed. Each row has its own unsubscribe link.
      const rows = data.subscribers
        .filter((s) => s.consent && !s.unsubscribed_at)
        .map((s) => ({ email: s.email, name: s.name, unsubscribe_url: `${SITE_URL}/unsubscribe?t=${s.unsub_token}` }));
      csv = toCsv(rows, ["email", "name", "unsubscribe_url"]);
      break;
    }
    case "members":
      csv = toCsv(data.members, ["email", "display_name", "handle", "points", "streak", "created_at", "last_sign_in_at"]);
      break;
    case "events":
      csv = toCsv(data.events, ["created_at", "user_id", "session_id", "type", "path", "referrer", "seconds", "depth"]);
      break;
    default:
      return bad("Unknown export.");
  }
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sortnow-${kind}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

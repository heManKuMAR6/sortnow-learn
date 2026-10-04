import { NextResponse } from "next/server";
import { bad, fromError, readJson, str } from "@/lib/api";
import { getStore } from "@/lib/platform/store";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return bad("Expected JSON.");
  const user = await getCurrentUser();
  const typed = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const email = typed || user?.email.toLowerCase() || "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return bad("That email doesn't look quite right.");
  }
  const name = str(body.name ?? "", 80) || user?.name || null;
  try {
    await getStore().subscribe(email, name, user ? "member" : "site");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fromError(error);
  }
}

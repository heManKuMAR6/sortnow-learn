import { NextResponse } from "next/server";
import { bad, fromError, readJson } from "@/lib/api";
import { getStore } from "@/lib/platform/store";

export async function POST(request: Request) {
  const body = await readJson(request);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (token.length < 16 || token.length > 64) return bad("That link is not valid.");
  try {
    const found = await getStore().unsubscribe(token);
    if (!found) return bad("We could not find that subscription. It may already be removed.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fromError(error);
  }
}

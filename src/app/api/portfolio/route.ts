import { NextResponse } from "next/server";
import { bad, fromError, httpUrl, readJson, requireUser, str } from "@/lib/api";
import { getStore } from "@/lib/platform/store";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const body = await readJson(request);
  if (!body) return bad("Expected JSON.");

  const title = str(body.title, 100);
  if (!title) return bad("Give the piece a title (up to 100 characters).");
  const description = str(body.description ?? "", 600);
  if (description === null) return bad("Description can be up to 600 characters.");
  const url = httpUrl(body.url);
  if (url === undefined) return bad("The link must start with http:// or https://.");
  const tagsIn = Array.isArray(body.tags) ? body.tags : [];
  const tags = [...new Set(tagsIn.map((t) => (typeof t === "string" ? t.trim() : "")).filter(Boolean))];
  if (tags.length > 8 || tags.some((t) => t.length > 24)) return bad("Up to 8 tags, 24 characters each.");

  try {
    const item = await getStore().addPortfolio(auth.user.id, { title, description, url, tags });
    return NextResponse.json({ item });
  } catch (error) {
    return fromError(error);
  }
}

export async function DELETE(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const body = await readJson(request);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return bad("Missing id.");
  try {
    await getStore().deletePortfolio(auth.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fromError(error);
  }
}

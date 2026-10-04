import { NextResponse } from "next/server";
import { bad, fromError, readJson, requireAdmin } from "@/lib/api";
import { parseJobInput } from "@/lib/jobs-input";
import { getStore } from "@/lib/platform/store";

// Create or update a role (the slug identifies it). Admins only.
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const body = await readJson(request);
  if (!body) return bad("Expected JSON.");
  const parsed = parseJobInput(body);
  if (typeof parsed === "string") return bad(parsed);
  try {
    return NextResponse.json({ job: await getStore().saveJob(parsed) });
  } catch (error) {
    return fromError(error);
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const body = await readJson(request);
  const slug = typeof body?.slug === "string" ? body.slug : "";
  const status = body?.status;
  if (!slug || (status !== "open" && status !== "closed")) return bad("Send a slug and a status.");
  try {
    await getStore().setJobStatus(slug, status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fromError(error);
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const body = await readJson(request);
  const slug = typeof body?.slug === "string" ? body.slug : "";
  if (!slug) return bad("Send a slug.");
  try {
    await getStore().deleteJob(slug);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fromError(error);
  }
}

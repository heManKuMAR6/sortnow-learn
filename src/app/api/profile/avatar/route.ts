import { NextResponse } from "next/server";
import { bad, fromError, readJson, requireUser } from "@/lib/api";
import { getCurrentProfile } from "@/lib/current-profile";
import { getStore } from "@/lib/platform/store";

const MAX_BYTES = 200_000;

// The browser resizes to a small square JPEG before sending, so this stays tiny.
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const body = await readJson(request);
  const dataUrl = typeof body?.dataUrl === "string" ? body.dataUrl : "";
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) return bad("Choose a JPEG, PNG or WebP picture.");
  const bytes = Buffer.from(match[2] as string, "base64");
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return bad("That picture is too large.");

  try {
    if (!(await getCurrentProfile(auth.user))) return bad("No profile yet.", 404);
    const profile = await getStore().setAvatar(auth.user.id, bytes, match[1] as string);
    return NextResponse.json({ profile });
  } catch (error) {
    return fromError(error);
  }
}

export async function DELETE() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  try {
    const profile = await getStore().updateProfile(auth.user.id, { avatarUrl: null });
    return NextResponse.json({ profile });
  } catch (error) {
    return fromError(error);
  }
}

import { NextResponse } from "next/server";
import { bad, fromError, readJson, requireUser } from "@/lib/api";
import { getCurrentProfile } from "@/lib/current-profile";
import { cleanPhone } from "@/lib/phone";
import { getStore } from "@/lib/platform/store";

// A member's phone number is optional and private (never on the public profile).
// Send { phone: "..." } to save it, or a blank value to remove it.
export async function PATCH(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const body = await readJson(request);
  if (!body) return bad("Expected JSON.");
  const phone = cleanPhone(body.phone);
  if (phone === undefined) return bad("That phone number does not look right. Use digits and an optional +, at least 7 digits.");
  try {
    if (!(await getCurrentProfile(auth.user))) return bad("No profile yet.", 404);
    const saved = await getStore().setPhone(auth.user.id, phone);
    return NextResponse.json({ ok: true, phone: saved });
  } catch (error) {
    return fromError(error);
  }
}

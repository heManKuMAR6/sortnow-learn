import { NextResponse } from "next/server";
import { bad, fromError, httpUrl, readJson, requireUser, str } from "@/lib/api";
import { getCurrentProfile } from "@/lib/current-profile";
import { HANDLE_RE } from "@/lib/platform/handle";
import { getStore } from "@/lib/platform/store";
import type { ProfileLinks, ProfilePatch } from "@/lib/platform/types";

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const body = await readJson(request);
  if (!body) return bad("Expected JSON.");

  const patch: ProfilePatch = {};
  if ("displayName" in body) {
    const v = str(body.displayName, 80);
    if (!v) return bad("Add the name you want shown (up to 80 characters).");
    patch.displayName = v;
  }
  if ("handle" in body) {
    const v = typeof body.handle === "string" ? body.handle.trim().toLowerCase() : "";
    if (!HANDLE_RE.test(v)) return bad("Handle is 3 to 30 letters, numbers or dashes.");
    patch.handle = v;
  }
  if ("headline" in body) {
    const v = str(body.headline, 120);
    if (v === null) return bad("Headline can be up to 120 characters.");
    patch.headline = v;
  }
  if ("bio" in body) {
    const v = str(body.bio, 1200);
    if (v === null) return bad("About you can be up to 1200 characters.");
    patch.bio = v;
  }
  if ("location" in body) {
    const v = str(body.location, 80);
    if (v === null) return bad("Location can be up to 80 characters.");
    patch.location = v;
  }
  if ("skills" in body) {
    if (!Array.isArray(body.skills)) return bad("Skills must be a list.");
    const skills = [...new Set(body.skills.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean))];
    if (skills.length > 20 || skills.some((s) => s.length > 30)) return bad("Up to 20 skills, 30 characters each.");
    patch.skills = skills;
  }
  if ("links" in body) {
    const raw = body.links && typeof body.links === "object" ? (body.links as Record<string, unknown>) : {};
    const links: ProfileLinks = {};
    for (const key of ["linkedin", "github", "website"] as const) {
      const url = httpUrl(raw[key]);
      if (url === undefined) return bad(`The ${key} link must start with http:// or https://.`);
      if (url) links[key] = url;
    }
    patch.links = links;
  }

  try {
    if (!(await getCurrentProfile(auth.user))) return bad("No profile yet.", 404);
    const profile = await getStore().updateProfile(auth.user.id, patch);
    return NextResponse.json({ profile });
  } catch (error) {
    return fromError(error);
  }
}

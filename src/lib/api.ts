import { NextResponse } from "next/server";
import { StoreError } from "@/lib/platform/types";
import { getStore } from "@/lib/platform/store";
import { getCurrentUser, type AppUser } from "@/lib/session";

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireUser(): Promise<{ user: AppUser } | { response: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) return { response: bad("Sign in first.", 401) };
  return { user };
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const json: unknown = await request.json();
    return json && typeof json === "object" && !Array.isArray(json) ? (json as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function fromError(error: unknown) {
  if (error instanceof StoreError) return bad(error.message, error.status);
  return bad("Something went wrong. Try again.", 500);
}

export function str(value: unknown, max: number): string | null {
  return typeof value === "string" && value.trim().length <= max ? value.trim() : null;
}

export function httpUrl(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 300) return undefined;
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Admin-only routes answer 404 to everyone else, so they do not advertise themselves. */
export async function requireAdmin(): Promise<{ user: AppUser } | { response: NextResponse }> {
  const user = await getCurrentUser();
  if (!user || !(await getStore().isAdmin(user).catch(() => false))) {
    return { response: bad("Not found.", 404) };
  }
  return { user };
}

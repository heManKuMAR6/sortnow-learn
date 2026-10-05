import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { isLeadUnlocked, LEAD_COOKIE } from "@/lib/lead-cookie";
import { getStore } from "@/lib/platform/store";
import { getCurrentUser, type AppUser } from "@/lib/session";

/**
 * Most of sortNow Learn is for members: lessons, challenges, jobs, the weekly note,
 * the dashboard. Call this first thing in such a page. Visitors are sent to sign in and
 * come straight back afterwards. (Checked on every request, so it also holds for soft navigation.)
 */
export async function requireMember(next: string): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}&why=members`);
  return user;
}

/**
 * The notes are open to two kinds of people: members, and anyone who left their name,
 * email and phone (the reel-drop form). Returns who has access; false means show the gate.
 */
export async function hasNotesAccess(): Promise<boolean> {
  if (await getCurrentUser()) return true;
  return isLeadUnlocked((await cookies()).get(LEAD_COOKIE)?.value);
}

/** Admin-only pages and routes. Anyone else gets the ordinary "not found", so the URL reveals nothing. */
export async function requireAdmin(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user || !(await getStore().isAdmin(user).catch(() => false))) notFound();
  return user;
}

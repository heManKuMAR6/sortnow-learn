import { cache } from "react";
import { nameFromEmail } from "@/lib/platform/handle";
import { todayIn, utcToday } from "@/lib/platform/dates";
import { getStore } from "@/lib/platform/store";
import type { Profile } from "@/lib/platform/types";
import { getCurrentUser, type AppUser } from "@/lib/session";

/** The signed-in person's profile (created on first visit), with their private timezone. Null when signed out. */
export const getCurrentProfile = cache(async (user?: AppUser | null): Promise<Profile | null> => {
  const who = user === undefined ? await getCurrentUser() : user;
  if (!who) return null;
  try {
    const store = getStore();
    const profile = await store.ensureProfile(who.id, who.name ?? nameFromEmail(who.email));
    const timezone = await store.getTimezone(who.id).catch(() => "UTC");
    return { ...profile, timezone };
  } catch (error) {
    console.error("[current-profile]", error instanceof Error ? error.message : error);
    return null;
  }
});

/** "Today" for this viewer: in their own timezone when signed in, UTC for guests. */
export function todayFor(profile: Profile | null): string {
  return profile?.timezone ? todayIn(profile.timezone) : utcToday();
}

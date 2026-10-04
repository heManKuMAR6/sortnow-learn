import { cache } from "react";
import { nameFromEmail } from "@/lib/platform/handle";
import { getStore } from "@/lib/platform/store";
import type { Profile } from "@/lib/platform/types";
import { getCurrentUser, type AppUser } from "@/lib/session";

/** The signed-in person's profile, created on first visit. Null when signed out. */
export const getCurrentProfile = cache(async (user?: AppUser | null): Promise<Profile | null> => {
  const who = user === undefined ? await getCurrentUser() : user;
  if (!who) return null;
  try {
    return await getStore().ensureProfile(who.id, who.name ?? nameFromEmail(who.email));
  } catch (error) {
    console.error("[current-profile]", error instanceof Error ? error.message : error);
    return null;
  }
});

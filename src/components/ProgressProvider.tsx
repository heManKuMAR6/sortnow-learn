"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { dropLegacyProgress, GUEST, replaceScope, type Scope } from "@/lib/progress";

const ScopeContext = createContext<Scope>(GUEST);

/** Which ticks to show: the guest's, or the signed-in person's (loaded from the server). */
export function useScope(): Scope {
  return useContext(ScopeContext);
}

export function ProgressProvider({
  userId,
  serverLessons,
  children,
}: {
  userId: string | null;
  serverLessons: string[] | null;
  children: ReactNode;
}) {
  const scope = userId ?? GUEST;
  const signature = serverLessons ? serverLessons.join("|") : null;

  useEffect(() => {
    dropLegacyProgress();
  }, []);

  useEffect(() => {
    // For a signed-in person the server list replaces the cache, so ticks agree across devices.
    if (userId && serverLessons) replaceScope(userId, serverLessons);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, signature]);

  return <ScopeContext.Provider value={scope}>{children}</ScopeContext.Provider>;
}

"use client";

import { useSyncExternalStore } from "react";

// Lesson ticks are kept per browser AND per account: "guest" for someone signed out,
// otherwise the user id. A second account on the same browser never sees the first one's
// ticks. For a signed-in person the server is the source of truth and this is a cache.
const PREFIX = "sortnow_learn_progress";
const LEGACY_KEY = PREFIX; // old unscoped key, which leaked between accounts

export type Scope = string;
export const GUEST: Scope = "guest";

const listeners = new Set<() => void>();
const EMPTY: readonly string[] = [];
const cache = new Map<string, { raw: string | null; list: readonly string[] }>();

const keyOf = (scope: Scope) => `${PREFIX}:${scope}`;

export function readScope(scope: Scope): readonly string[] {
  try {
    const raw = window.localStorage.getItem(keyOf(scope));
    const hit = cache.get(scope);
    if (hit && hit.raw === raw) return hit.list;
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : EMPTY;
    cache.set(scope, { raw, list });
    return list;
  } catch {
    return EMPTY;
  }
}

function write(scope: Scope, slugs: Iterable<string>) {
  try {
    const list = [...new Set(slugs)];
    if (list.length) window.localStorage.setItem(keyOf(scope), JSON.stringify(list));
    else window.localStorage.removeItem(keyOf(scope));
  } catch {
    // Private mode: it just will not persist.
  }
  listeners.forEach((l) => l());
}

export function setLessonDone(scope: Scope, slug: string, done: boolean) {
  const current = new Set(readScope(scope));
  if (done) current.add(slug);
  else current.delete(slug);
  write(scope, current);
}

export function replaceScope(scope: Scope, slugs: readonly string[]) {
  write(scope, slugs);
}

export function clearScope(scope: Scope) {
  write(scope, []);
}

/** The old shared key could hold someone else's ticks, so it is dropped, not adopted. */
export function dropLegacyProgress() {
  try {
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Slugs of lessons marked complete in this scope. Empty on the server. */
export function useCompleted(scope: Scope): readonly string[] {
  return useSyncExternalStore(
    subscribe,
    () => readScope(scope),
    () => EMPTY,
  );
}

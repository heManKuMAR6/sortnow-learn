"use client";

import { useSyncExternalStore } from "react";

const KEY = "sortnow_learn_progress";
const listeners = new Set<() => void>();
const EMPTY: readonly string[] = [];
let cache: readonly string[] = EMPTY;
let cacheRaw: string | null = null;

function read(): readonly string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === cacheRaw) return cache;
    cacheRaw = raw;
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Slugs of lessons this browser has marked complete. Empty on the server. */
export function useCompleted(): readonly string[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function setLessonDone(slug: string, done: boolean) {
  const current = new Set(read());
  if (done) current.add(slug);
  else current.delete(slug);
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...current]));
  } catch {
    // Private mode: progress just will not persist.
  }
  listeners.forEach((l) => l());
}

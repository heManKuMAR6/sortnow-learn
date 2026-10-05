"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { EventInput } from "@/lib/event-types";

function scrollDepth(): number {
  const el = document.documentElement;
  const scrollable = el.scrollHeight - el.clientHeight;
  if (scrollable <= 0) return 100;
  return Math.min(100, Math.round((el.scrollTop / scrollable) * 100));
}

function targetOf(node: EventTarget | null): string {
  if (!(node instanceof Element)) return "unknown";
  const tracked = node.closest("[data-track]");
  if (tracked instanceof HTMLElement && tracked.dataset.track) {
    return tracked.dataset.track;
  }
  const withRole = node.closest("[role]");
  const role = withRole?.getAttribute("role");
  if (role) return role;
  const interactive = node.closest("a, button, input, textarea, select");
  if (interactive) return interactive.tagName.toLowerCase();
  return node.tagName.toLowerCase();
}

async function postEvent(body: EventInput) {
  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // Tracking must not break the page.
  }
}

const SESSION_KEY = "sn_session";
const LAST_PATH_KEY = "sn_last_path";

function sessionId(): string | null {
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? `${Date.now()}${Math.random()}`).replace(/-/g, "").slice(0, 32);
      window.sessionStorage.setItem(SESSION_KEY, id);
      return id;
    }
    return id;
  } catch {
    return null;
  }
}

/** The id the lead form sends along, so a reel visit and the details left afterwards can be tied together. */
export function currentSessionId(): string | null {
  return typeof window === "undefined" ? null : sessionId();
}

/**
 * Records where people go: every page view, scroll depth, clicks and time on page. It runs
 * for signed-in members everywhere, and for anyone on a reel drop (/ig). The privacy notice
 * says so, and the sign-up and lead forms ask for agreement first.
 */
export function Tracker({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!signedIn && !pathname.startsWith("/ig")) return;

    let maxDepth = 0;
    let highestSent = 0;
    const sid = sessionId();
    const startedAt = Date.now();
    let dwellSent = false;

    let previous: string | null = null;
    try {
      previous = window.sessionStorage.getItem(LAST_PATH_KEY);
      window.sessionStorage.setItem(LAST_PATH_KEY, pathname);
    } catch {
      // ignore
    }

    const send = (
      type: EventInput["type"],
      target: string | null,
      depth: number | null,
      more: Pick<EventInput, "referrer" | "seconds"> = {},
    ) => {
      void postEvent({
        type,
        path: pathname,
        target,
        depth,
        createdAt: new Date().toISOString(),
        sessionId: sid,
        ...more,
      });
    };

    const sendDwell = () => {
      if (dwellSent) return;
      const seconds = Math.round((Date.now() - startedAt) / 1000);
      if (seconds < 1) return;
      dwellSent = true;
      send("dwell", null, maxDepth, { seconds });
    };

    if (previous === null) {
      // First page of this visit: note how they arrived.
      send("session", null, null, { referrer: document.referrer ? document.referrer.slice(0, 300) : "direct" });
    }
    send("view", null, null, { referrer: previous ?? (document.referrer ? document.referrer.slice(0, 300) : "direct") });

    const noteDepth = (forceExact: boolean) => {
      const depth = scrollDepth();
      if (depth > maxDepth) maxDepth = depth;
      if (forceExact && maxDepth > highestSent) {
        highestSent = maxDepth;
        send("scroll", null, maxDepth);
        return;
      }
      const marks = [25, 50, 75, 100].filter((mark) => maxDepth >= mark);
      const mark = marks.length ? marks[marks.length - 1] : 0;
      if (mark > highestSent) {
        highestSent = mark;
        send("scroll", null, mark);
      }
    };

    const onScroll = () => noteDepth(false);
    const onPointerUp = (event: PointerEvent) => {
      const depth = scrollDepth();
      if (depth > maxDepth) maxDepth = depth;
      send("click", targetOf(event.target), depth);
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        noteDepth(true);
        sendDwell();
      }
    };

    noteDepth(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("visibilitychange", onHide);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("visibilitychange", onHide);
      sendDwell();
    };
  }, [pathname, signedIn]);

  return null;
}

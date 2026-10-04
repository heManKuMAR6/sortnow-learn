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

export function Tracker({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!signedIn) return;

    let maxDepth = 0;
    let highestSent = 0;

    const send = (type: EventInput["type"], target: string | null, depth: number | null) => {
      void postEvent({
        type,
        path: pathname,
        target,
        depth,
        createdAt: new Date().toISOString(),
      });
    };

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
      if (document.visibilityState === "hidden") noteDepth(true);
    };

    noteDepth(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("visibilitychange", onHide);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [pathname, signedIn]);

  return null;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { IDLE_WARN_MS } from "@/lib/idle";
import { endSession } from "@/lib/sign-out";

const ACTIVE_KEY = "sn_last_active";
const LOGOUT_KEY = "sn_idle_logout";
const HEARTBEAT_MS = 4 * 60_000;
const CHECK_MS = 15_000;

function readShared(fallback: number): number {
  try {
    const n = Number(window.localStorage.getItem(ACTIVE_KEY));
    return Number.isFinite(n) && n > 0 ? n : fallback;
  } catch {
    return fallback;
  }
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/**
 * Watches for real use (clicks, keys, scrolling, touch) and signs the person out after `minutes`
 * of none. The server enforces the same limit (see middleware.ts), so closing this tab or editing
 * the page does not get around it; this guard is what makes the experience calm: a warning five
 * minutes before, one click to stay, and a clear message afterwards. Several tabs share one clock.
 */
export function IdleGuard({ mode, minutes }: { mode: "supabase" | "demo"; minutes: number }) {
  const limit = minutes * 60_000;
  const [remaining, setRemaining] = useState<number | null>(null);
  const [ending, setEnding] = useState(false);
  const mem = useRef(Date.now());
  const lastWrite = useRef(0);
  const lastTouch = useRef(Date.now());

  useEffect(() => {
    const now = () => Date.now();
    const mark = () => {
      const t = now();
      mem.current = t;
      if (t - lastWrite.current > 5000) {
        lastWrite.current = t;
        try {
          window.localStorage.setItem(ACTIVE_KEY, String(t));
        } catch {
          // Storage blocked: this tab keeps its own clock.
        }
      }
    };
    const touch = () => {
      lastTouch.current = now();
      void fetch("/api/session/touch", { method: "POST", keepalive: true }).catch(() => undefined);
    };
    const leave = async () => {
      setEnding(true);
      try {
        window.localStorage.setItem(LOGOUT_KEY, String(now()));
      } catch {
        // ignore
      }
      await endSession(mode);
      window.location.assign(`/login?reason=idle&next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    };
    const check = () => {
      const idleFor = now() - Math.max(mem.current, readShared(0));
      if (idleFor >= limit) {
        void leave();
        return;
      }
      if (idleFor >= limit - IDLE_WARN_MS) {
        setRemaining(limit - idleFor);
        return;
      }
      setRemaining(null);
      // Active recently and the server has not heard for a while: tell it, so its clock matches ours.
      if (mem.current > lastTouch.current && now() - lastTouch.current >= HEARTBEAT_MS) touch();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOGOUT_KEY && e.newValue) window.location.assign("/login?reason=idle");
    };

    mark();
    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, mark, { passive: true, capture: true }));
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    const timer = window.setInterval(check, CHECK_MS);
    check();
    return () => {
      events.forEach((e) => window.removeEventListener(e, mark, { capture: true }));
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
      window.clearInterval(timer);
    };
  }, [limit, mode]);

  if (remaining === null && !ending) return null;

  return (
    <div className="idle-banner glass" role="alertdialog" aria-live="assertive" aria-labelledby="idle-title" aria-describedby="idle-body">
      {ending ? (
        <p id="idle-title" className="font-semibold">Signing you out…</p>
      ) : (
        <>
          <p id="idle-title" className="font-semibold">Still there?</p>
          <p id="idle-body" className="mt-1 text-sm text-secondary">
            You have been quiet for a while. To keep your account safe you will be signed out in{" "}
            <strong className="tabular-nums" data-testid="idle-countdown">{mmss(remaining ?? 0)}</strong>.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="pill-teal"
              data-track="idle-stay"
              onClick={() => {
                const t = Date.now();
                mem.current = t;
                lastTouch.current = t;
                try {
                  window.localStorage.setItem(ACTIVE_KEY, String(t));
                } catch {
                  // ignore
                }
                void fetch("/api/session/touch", { method: "POST", keepalive: true }).catch(() => undefined);
                setRemaining(null);
              }}
            >
              Stay signed in
            </button>
            <button type="button" className="pill-white" data-track="idle-leave" onClick={async () => { await endSession(mode); window.location.assign("/"); }}>
              Sign out now
            </button>
          </div>
        </>
      )}
    </div>
  );
}

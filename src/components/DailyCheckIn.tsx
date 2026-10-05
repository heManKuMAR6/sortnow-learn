"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { clearScope, GUEST, readScope, replaceScope } from "@/lib/progress";
import { localDay, toast } from "@/lib/toast";

type CheckInResponse = {
  checkin?: { awarded: boolean; points: number; streak: number };
  lessonPoints?: number;
  lessons?: string[];
};

/**
 * Once per local day per signed-in visitor: +1 point and a popup. The streak does not move here: it moves when today's featured challenge is passed.
 * The browser sends only its timezone; the server decides the day. It re-checks when the
 * tab becomes visible again, on navigation, and every few minutes, so a page left open
 * across midnight still counts the new day.
 */
export function DailyCheckIn({ userId }: { userId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const busy = useRef(false);

  useEffect(() => {
    const key = `sn_checkin_${userId}`;

    async function run() {
      if (busy.current) return;
      const day = localDay();
      try {
        if (window.localStorage.getItem(key) === day) return;
      } catch {
        // Storage blocked: the server still only awards once a day.
      }
      busy.current = true;
      try {
        const lessons = [...readScope(GUEST)];
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tz, lessons }),
        });
        if (!response.ok) return;
        const body = (await response.json()) as CheckInResponse;
        try {
          window.localStorage.setItem(key, day);
        } catch {
          // ignore
        }
        // The server list is the truth for this account; the guest ticks have been merged into it.
        if (body.lessons) replaceScope(userId, body.lessons);
        if (lessons.length) clearScope(GUEST);

        let changed = false;
        if (body.checkin?.awarded) {
          changed = true;
          const n = body.checkin.streak;
          toast({
            badge: "+1",
            title: "Checked in",
            body: n > 0 ? `You are on a ${n}-day streak. Pass today's puzzle to keep it.` : "Pass today's featured challenge to start a streak.",
            icon: "flame",
            tone: "points",
          });
        }
        if (body.lessonPoints) {
          changed = true;
          window.setTimeout(
            () =>
              toast({
                badge: `+${body.lessonPoints}`,
                title: "Lessons counted",
                body: "Your earlier progress now earns points.",
                icon: "bulb",
              }),
            body.checkin?.awarded ? 900 : 0,
          );
        }
        if (changed) router.refresh();
      } catch {
        // Try again at the next trigger.
      } finally {
        busy.current = false;
      }
    }

    void run();
    const onVisible = () => document.visibilityState === "visible" && void run();
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(() => void run(), 5 * 60 * 1000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [userId, router, pathname]);

  return null;
}

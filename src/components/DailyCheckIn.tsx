"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { localDay, toast } from "@/lib/toast";

type CheckInResponse = {
  checkin?: { awarded: boolean; points: number; streak: number };
  lessonPoints?: number;
};

/** Once per day per signed-in visitor: +1 point, streak moves, a popup says so. */
export function DailyCheckIn({ userId }: { userId: string }) {
  const router = useRouter();

  useEffect(() => {
    const key = `sn_checkin_${userId}`;
    const day = localDay();
    try {
      if (window.localStorage.getItem(key) === day) return;
    } catch {
      // Storage blocked: the server still only awards once a day.
    }

    let lessons: string[] = [];
    try {
      const raw = JSON.parse(window.localStorage.getItem("sortnow_learn_progress") ?? "[]") as unknown;
      if (Array.isArray(raw)) lessons = raw.filter((v): v is string => typeof v === "string");
    } catch {
      lessons = [];
    }

    void fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, lessons }),
    })
      .then(async (response) => {
        if (!response.ok) return;
        const body = (await response.json()) as CheckInResponse;
        try {
          window.localStorage.setItem(key, day);
        } catch {
          // ignore
        }
        let changed = false;
        if (body.checkin?.awarded) {
          changed = true;
          const n = body.checkin.streak;
          toast({
            badge: "+1",
            title: n > 1 ? `${n}-day streak` : "Day one. Streak started",
            body: n > 1 ? "You showed up again. Keep it going." : "Come back tomorrow to grow it.",
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
      })
      .catch(() => undefined);
  }, [userId, router]);

  return null;
}

"use client";

import { useRouter } from "next/navigation";
import { setLessonDone, useCompleted } from "@/lib/progress";
import { localDay, toast } from "@/lib/toast";

export function DoneBadge({ slug }: { slug: string }) {
  const done = useCompleted().includes(slug);
  if (!done) return null;
  return (
    <span className="chip chip-teal" title="You marked this lesson complete">
      ✓ Done
    </span>
  );
}

export function TrackProgress({ slugs, label }: { slugs: string[]; label: string }) {
  const completed = useCompleted();
  const count = slugs.filter((slug) => completed.includes(slug)).length;
  const pct = slugs.length ? Math.round((count / slugs.length) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold text-secondary">
        <span>{label}</span>
        <span>
          {count} of {slugs.length} done
        </span>
      </div>
      <div
        className="progress-track mt-2"
        role="progressbar"
        aria-label={`${label} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CompleteButton({ slug, signedIn }: { slug: string; signedIn: boolean }) {
  const done = useCompleted().includes(slug);
  const router = useRouter();

  async function toggle() {
    setLessonDone(slug, !done);
    if (done || !signedIn) return;
    try {
      const response = await fetch("/api/progress/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, day: localDay() }),
      });
      const body = (await response.json()) as { gained?: number };
      if (response.ok && body.gained) {
        toast({ badge: `+${body.gained}`, title: "Lesson complete", body: "Nice. That is one more piece in place.", icon: "bulb", tone: "points" });
        router.refresh();
      }
    } catch {
      // The tick is saved on this device either way.
    }
  }

  return (
    <button
      type="button"
      data-track={`complete-${slug}`}
      aria-pressed={done}
      onClick={() => void toggle()}
      className={done ? "pill-white" : "pill-teal"}
    >
      {done ? "✓ Completed · undo" : "Mark as complete"}
    </button>
  );
}

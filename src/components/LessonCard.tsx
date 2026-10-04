import Link from "next/link";
import { DoneBadge } from "@/components/ProgressUI";
import type { Lesson } from "@/lib/content";

export function LessonCard({ lesson, index }: { lesson: Lesson; index: number }) {
  const accent = lesson.track === "beginner" ? "var(--color-soft-mint)" : "var(--color-warm-coral)";
  return (
    <div className="card card-accent p-5" style={{ ["--accent" as string]: accent }}>
      <div className="flex items-center gap-3">
        <span className="step-num">{index + 1}</span>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{lesson.channel}</p>
        <span className="ml-auto">
          <DoneBadge slug={lesson.slug} />
        </span>
      </div>
      <h3 className="mt-3 text-2xl">
        <Link
          href={`/learn/${lesson.track}/${lesson.slug}`}
          data-track={`lesson-${lesson.track}-${lesson.slug}`}
          className="card-link"
        >
          {lesson.title}
        </Link>
      </h3>
      <p className="mt-2 text-sm text-secondary">{lesson.summary}</p>
      <p className="mt-4 flex items-center justify-between text-xs text-muted">
        <span>Video · {lesson.keyPoints.length} key points</span>
        <span className="arrow-link">
          Watch <span>→</span>
        </span>
      </p>
    </div>
  );
}

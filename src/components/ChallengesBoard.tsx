"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AiIcon } from "@/components/AiIcon";
import { ChallengeCard } from "@/components/ChallengeCard";
import { KIND_LABEL } from "@/components/questions/state";
import type { ChallengeSummary } from "@/lib/challenges";

type Done = Record<string, { score: number; total: number }>;

function untilMidnight(): string {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const s = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

/** Today's streak puzzle, with a live countdown to the next one. */
export function DailyHero({
  challenge,
  doneToday,
  streak,
  tomorrow,
}: {
  challenge: ChallengeSummary;
  doneToday: boolean;
  streak: number;
  tomorrow: string;
}) {
  const [left, setLeft] = useState("");
  useEffect(() => {
    setLeft(untilMidnight());
    const t = window.setInterval(() => setLeft(untilMidnight()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div className="daily-hero">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="streak-flame">
          <AiIcon name="flame" size={18} /> {streak > 0 ? `${streak}-day streak` : "Start a streak"}
        </span>
        <span className="text-sm font-semibold text-secondary" aria-live="off">
          {left ? `New puzzle in ${left}` : "\u00a0"}
        </span>
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-wider text-teal">Today&apos;s streak puzzle</p>
      <h2 className="mt-1 text-4xl sm:text-5xl">{challenge.title}</h2>
      <p className="mt-3 max-w-xl text-lg text-secondary">{challenge.hook}</p>
      <p className="mt-4 flex flex-wrap gap-1.5">
        {challenge.kinds.map((k) => (
          <span key={k} className="fmt-chip">{KIND_LABEL[k].label}</span>
        ))}
        <span className="fmt-chip">+{challenge.points} points</span>
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        {doneToday ? (
          <span className="chip chip-teal text-sm">✓ Today&apos;s streak is counted</span>
        ) : (
          <Link href={`/challenges/${challenge.slug}`} className="pill-coral pill-lg" data-track="daily-hero-play">
            Play today&apos;s puzzle
          </Link>
        )}
        <span className="text-sm text-muted">Tomorrow: {tomorrow}</span>
      </div>
    </div>
  );
}

const FILTERS = ["All", "Everyone", "Beginner", "Manager", "Unsolved"] as const;

export function ChallengesBoard({ items, done }: { items: ChallengeSummary[]; done: Done }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const shown = items.filter((c) => (filter === "All" ? true : filter === "Unsolved" ? !done[c.slug] : c.level === filter));
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter challenges">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`filter-chip${filter === f ? " on" : ""}`}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            data-track={`challenge-filter-${f.toLowerCase()}`}
          >
            {f}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-secondary" aria-live="polite">
        {shown.length} {shown.length === 1 ? "challenge" : "challenges"}
      </p>
      {shown.length ? (
        <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => (
            <ChallengeCard key={c.slug} challenge={c} result={done[c.slug]} />
          ))}
        </div>
      ) : (
        <p className="lock-card mt-4 text-center text-secondary">Nothing here. You have solved them all, or try another filter.</p>
      )}
    </div>
  );
}

import Link from "next/link";
import { AiIcon } from "@/components/AiIcon";
import type { Challenge } from "@/lib/challenges";

export function ChallengeCard({
  challenge,
  result,
  featured = false,
}: {
  challenge: Challenge;
  result?: { score: number; total: number };
  featured?: boolean;
}) {
  const done = Boolean(result);
  return (
    <div className={`card challenge-card flex-1 p-6${featured ? " featured" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="challenge-icon">
          <AiIcon name={challenge.icon} size={featured ? 28 : 24} />
        </span>
        <span className={done ? "chip chip-teal" : "chip chip-sun"}>
          {done ? `✓ ${result?.score}/${result?.total}` : `+${challenge.points} pts`}
        </span>
      </div>
      <h3 className={`mt-4 ${featured ? "text-4xl" : "text-2xl"}`}>
        <Link href={`/challenges/${challenge.slug}`} data-track={`challenge-${challenge.slug}`} className="card-link">
          {challenge.title}
        </Link>
      </h3>
      <p className="mt-2 text-sm text-secondary">{challenge.blurb}</p>
      <p className="mt-4 flex items-center justify-between text-xs text-muted">
        <span>
          {challenge.level} · {challenge.questions.length} questions · {challenge.minutes} min
        </span>
        <span className="arrow-link">
          {done ? "Replay" : "Start"} <span>→</span>
        </span>
      </p>
    </div>
  );
}

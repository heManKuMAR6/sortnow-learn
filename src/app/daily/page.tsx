import type { Metadata } from "next";
import Link from "next/link";
import { ChallengePanel } from "@/components/ChallengePanel";
import { challengesFor, dailyTracks, dayStatus, type ChallengeCompletion } from "@/lib/challenges";
import { listCompletions } from "@/lib/practice";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Daily",
  description: "A short daily practice for people starting now, and for managers who are not technical.",
};

export default async function DailyPage() {
  const user = await getCurrentUser();
  let completions: ChallengeCompletion[] = [];
  let loadError: string | null = null;
  if (user) {
    const practice = await listCompletions(user);
    completions = practice.completions;
    loadError = practice.error;
  }

  return (
    <div>
      <p className="font-heading text-sm font-semibold text-teal">Daily practice</p>
      <h1 className="mt-3 max-w-3xl text-5xl font-semibold leading-tight">One day. Two ways in.</h1>
      <p className="mt-4 max-w-xl text-secondary">
        One track if you are starting now. One track if you manage the work and you are not the
        technical person in the room. A few days are already written. Finish one day on a track, and
        the next day on that track opens tomorrow. Saving a day updates your streak.
      </p>
      {user ? null : (
        <p className="mt-6">
          <Link href="/login" data-track="daily-sign-in" className="pill-teal text-sm">
            Sign in to practice
          </Link>
        </p>
      )}
      {loadError ? <p className="mt-4 text-sm text-coral">{loadError}</p> : null}
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {dailyTracks.map((track) => (
          <section key={track.id} className="glass p-6">
            <span className={track.chip === "coral" ? "chip chip-coral" : "chip chip-mint"}>{track.title}</span>
            <h2 className="mt-4 text-3xl font-semibold">{track.title}</h2>
            <p className="mt-2 text-secondary">{track.description}</p>
            <ol className="mt-5 grid gap-3">
              {challengesFor(track.id).map((challenge) => {
                const status = dayStatus(challenge, completions);
                const saved = completions.find((row) => row.challengeId === challenge.id);
                return (
                  <li key={challenge.id} className="rounded-3xl bg-white/55 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Day {challenge.day}</p>
                    <h3 className="mt-1 text-xl font-semibold">{challenge.title}</h3>
                    <p className="mt-2 text-sm text-secondary">{challenge.prompt}</p>
                    <ChallengePanel
                      challengeId={challenge.id}
                      status={status}
                      savedResponse={saved?.response ?? null}
                      signedIn={Boolean(user)}
                    />
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

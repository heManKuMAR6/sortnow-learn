import type { Metadata } from "next";
import { ChallengesBoard, DailyHero } from "@/components/ChallengesBoard";
import { Reveal } from "@/components/Reveal";
import { challenges, dailyChallenge, summarize } from "@/lib/challenges";
import { getCurrentProfile, todayFor } from "@/lib/current-profile";
import { requireMember } from "@/lib/gate";
import { liveStreak, shiftDay } from "@/lib/platform/dates";
import { getStore } from "@/lib/platform/store";
import { safely } from "@/lib/safe";

export const metadata: Metadata = {
  title: "Challenges",
  description: "Short AI puzzles. No code. Solve them to earn points and build your streak.",
};

export default async function ChallengesPage() {
  const user = await requireMember("/challenges");
  const profile = await getCurrentProfile(user);
  const done = (await safely(getStore().completed(user.id), { challenges: {}, lessons: [] }, "challenges completed")).challenges;
  const today = todayFor(profile);
  const featured = dailyChallenge(today);
  const tomorrow = dailyChallenge(shiftDay(today, 1));
  const solved = challenges.filter((c) => done[c.slug]).length;
  const streak = profile ? liveStreak(profile, today) : 0;
  const doneToday = Boolean(profile?.lastActiveDay && profile.lastActiveDay >= today);

  return (
    <div>
      <Reveal>
        <p className="eyebrow">Challenges</p>
        <h1 className="mt-3 max-w-3xl text-5xl sm:text-6xl">
          Little puzzles, big upgrades<span className="dot">.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-secondary">
          Tap the odd line out, sort the cards, put the steps in order. A few minutes each. Pass with 3 of 4 to earn points.
        </p>
        <p className="mt-4 text-sm font-medium text-teal">
          {solved} of {challenges.length} solved
        </p>
      </Reveal>

      <Reveal className="mt-8">
        <DailyHero challenge={summarize(featured)} doneToday={doneToday} streak={streak} tomorrow={tomorrow.title} />
      </Reveal>

      <Reveal className="mt-10">
        <p className="eyebrow mb-3">All challenges</p>
        <ChallengesBoard items={challenges.filter((c) => c.slug !== featured.slug).map(summarize)} done={done} />
      </Reveal>
    </div>
  );
}

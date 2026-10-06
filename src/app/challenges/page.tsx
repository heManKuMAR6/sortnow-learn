import type { Metadata } from "next";
import { ChallengeCard } from "@/components/ChallengeCard";
import { Reveal } from "@/components/Reveal";
import { Stagger, StaggerItem } from "@/components/Stagger";
import { challenges, dailyChallenge } from "@/lib/challenges";
import { getCurrentProfile, todayFor } from "@/lib/current-profile";
import { safely } from "@/lib/safe";
import { getStore } from "@/lib/platform/store";
import { getCurrentUser } from "@/lib/session";
import { requireMember } from "@/lib/gate";

export const metadata: Metadata = {
  title: "Challenges",
  description: "Short AI puzzles. No code. Solve them to earn points and build your streak.",
};

export default async function ChallengesPage() {
  await requireMember("/challenges");
  const user = await getCurrentUser();
  const done = user
    ? (await safely(getStore().completed(user.id), { challenges: {}, lessons: [] }, "challenges completed")).challenges
    : {};
  const featured = dailyChallenge(todayFor(await getCurrentProfile(user)));
  const solved = challenges.filter((c) => done[c.slug]).length;

  return (
    <div>
      <Reveal>
        <p className="eyebrow">Challenges</p>
        <h1 className="mt-3 max-w-3xl text-5xl sm:text-6xl">
          Little puzzles, big upgrades<span className="dot">.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-secondary">
          Each one takes a few minutes and teaches a habit you will use at work. Pass with 3 of 4 to earn points.
        </p>
        <p className="mt-4 text-sm font-medium text-teal">
          {solved} of {challenges.length} solved
        </p>
      </Reveal>

      <Reveal className="mt-8">
        <p className="eyebrow mb-3">Today&apos;s streak puzzle: pass it to keep your streak</p>
        <ChallengeCard challenge={featured} result={done[featured.slug]} featured />
      </Reveal>

      <Reveal className="mt-10">
        <p className="eyebrow">All challenges</p>
      </Reveal>
      <Stagger className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {challenges
          .filter((c) => c.slug !== featured.slug)
          .map((c) => (
            <StaggerItem key={c.slug}>
              <ChallengeCard challenge={c} result={done[c.slug]} />
            </StaggerItem>
          ))}
      </Stagger>
    </div>
  );
}

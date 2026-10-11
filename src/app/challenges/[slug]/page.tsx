import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiIcon } from "@/components/AiIcon";
import { ChallengeRunner } from "@/components/ChallengeRunner";
import { challenges, dailyChallenge, getChallenge, publicChallenge } from "@/lib/challenges";
import { getCurrentProfile, todayFor } from "@/lib/current-profile";
import { requireMember } from "@/lib/gate";
import { liveStreak } from "@/lib/platform/dates";
import { getStore } from "@/lib/platform/store";
import { safely } from "@/lib/safe";

type Params = { slug: string };

export function generateStaticParams() {
  return challenges.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getChallenge(slug);
  return c ? { title: c.title, description: c.blurb } : { title: "Challenge" };
}

export default async function ChallengePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const challenge = getChallenge(slug);
  if (!challenge) notFound();
  const user = await requireMember(`/challenges/${slug}`);
  const profile = await getCurrentProfile(user);
  const today = todayFor(profile);
  const triesUsed = await safely(getStore().triesToday(user.id, slug), 0, "tries today");
  const index = challenges.findIndex((c) => c.slug === slug);
  const next = challenges[(index + 1) % challenges.length];

  return (
    <div className="mx-auto max-w-2xl">
      <nav aria-label="Breadcrumb" className="text-sm text-secondary">
        <Link href="/challenges" className="text-link" data-track="crumb-challenges">
          Challenges
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{challenge.level}</span>
      </nav>
      <div className="mt-4 flex items-center gap-4">
        <span className="challenge-icon h-14 w-14 shrink-0">
          <AiIcon name={challenge.icon} size={26} />
        </span>
        <div>
          <h1 className="text-3xl sm:text-5xl">{challenge.title}</h1>
          <p className="mt-1 hidden text-secondary sm:block">{challenge.blurb}</p>
        </div>
      </div>
      <div className="mt-8">
        <ChallengeRunner
          challenge={publicChallenge(challenge)}
          nextHref={next && next.slug !== slug ? `/challenges/${next.slug}` : null}
          nextTitle={next && next.slug !== slug ? next.title : null}
          triesUsed={triesUsed}
          daily={dailyChallenge(today).slug === slug}
          streak={profile ? liveStreak(profile, today) : 0}
        />
      </div>
    </div>
  );
}

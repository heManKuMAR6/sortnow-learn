import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeGrid } from "@/components/BadgeGrid";
import { ChallengeCard } from "@/components/ChallengeCard";
import { Heatmap } from "@/components/Heatmap";
import { Reveal } from "@/components/Reveal";
import { SetupNotice } from "@/components/SetupNotice";
import { Stagger, StaggerItem } from "@/components/Stagger";
import { StatCard } from "@/components/StatCard";
import { badgesFor } from "@/lib/badges";
import { challenges, dailyChallenge } from "@/lib/challenges";
import { lessons } from "@/lib/content";
import { getCurrentProfile, todayFor } from "@/lib/current-profile";
import { liveStreak } from "@/lib/platform/dates";
import { safely } from "@/lib/safe";
import { getStore } from "@/lib/platform/store";
import { nameFromEmail } from "@/lib/platform/handle";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  const profile = await getCurrentProfile(user);
  if (!profile) return <SetupNotice />;

  const store = getStore();
  const [done, activity, portfolio] = await Promise.all([
    safely(store.completed(user.id), { challenges: {}, lessons: [] }, "dashboard completed"),
    safely(store.activity(user.id), {} as Record<string, number>, "dashboard activity"),
    safely(store.portfolio(user.id), [], "dashboard portfolio"),
  ]);

  const today = todayFor(profile);
  const streak = liveStreak(profile, today);
  const checkedInToday = profile.lastActiveDay === today || (profile.lastActiveDay ?? "") > today;
  const featured = dailyChallenge(today);
  const nextLesson = lessons.find((l) => !done.lessons.includes(l.slug));
  const firstName = profile.displayName.split(/\s+/)[0] ?? profile.displayName;
  const badges = badgesFor({
    longestStreak: profile.longestStreak,
    challengesDone: profile.challengesDone,
    lessonsDone: profile.lessonsDone,
    portfolioCount: portfolio.length,
    hasBio: profile.bio.trim().length > 0,
  });
  const needsName = !user.name && profile.displayName === nameFromEmail(user.email);
  const profileIncomplete = !profile.headline || !profile.bio;

  return (
    <div>
      <Reveal>
        <p className="eyebrow">{greeting(new Date().getUTCHours())}</p>
        <h1 className="mt-2 text-5xl sm:text-6xl">
          {firstName}
          <span className="dot">.</span>
        </h1>
        <p className="mt-3 max-w-xl text-lg text-secondary">
          {streak > 1
            ? `You are on a ${streak}-day streak. ${checkedInToday ? "Today is counted." : "Check in today to keep it."}`
            : "Show up today and your streak starts. One small step is enough."}
        </p>
      </Reveal>

      {needsName ? (
        <Reveal className="mt-6">
          <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl">What should we call you?</h2>
              <p className="text-secondary">Add your full name so your profile shows it, like &ldquo;Alex Morgan&rdquo; instead of part of an email.</p>
            </div>
            <Link href="/settings" data-track="dash-add-name" className="pill-teal card-link shrink-0">
              Add my name
            </Link>
          </div>
        </Reveal>
      ) : null}

      <Stagger className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem>
          <StatCard icon="flame" tone="coral" label="Day streak" value={streak} hint={`Best: ${profile.longestStreak}`} />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon="spark" tone="sun" label="Points" value={profile.points} hint="1 a day, more for challenges" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon="puzzle" tone="teal" label="Challenges" value={`${profile.challengesDone}/${challenges.length}`} hint="solved" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon="bulb" tone="mint" label="Lessons" value={`${profile.lessonsDone}/${lessons.length}`} hint="finished" />
        </StaggerItem>
      </Stagger>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Reveal className="flex flex-col">
          <p className="eyebrow mb-3">Today&apos;s challenge</p>
          <ChallengeCard challenge={featured} result={done.challenges[featured.slug]} featured />
        </Reveal>
        <Reveal delay={0.06} className="flex flex-col">
          <p className="eyebrow mb-3">Keep learning</p>
          {nextLesson ? (
            <div className="card flex-1 p-6">
              <span className={nextLesson.track === "beginner" ? "chip chip-mint" : "chip chip-coral"}>
                {nextLesson.track === "beginner" ? "Beginner" : "Manager"}
              </span>
              <h3 className="mt-3 text-3xl">
                <Link href={`/learn/${nextLesson.track}/${nextLesson.slug}`} data-track="dash-next-lesson" className="card-link">
                  {nextLesson.title}
                </Link>
              </h3>
              <p className="mt-2 text-sm text-secondary">{nextLesson.summary}</p>
              <p className="mt-4 text-sm">
                <span className="arrow-link">
                  Watch now <span>→</span>
                </span>
              </p>
            </div>
          ) : (
            <div className="card p-6">
              <h3 className="text-3xl">All lessons done</h3>
              <p className="mt-2 text-secondary">New lessons land here as they are published.</p>
            </div>
          )}
        </Reveal>
      </div>

      <Reveal className="mt-10">
        <section className="glass p-6">
          <h2 className="text-3xl">Your activity</h2>
          <div className="mt-5">
            <Heatmap activity={activity} today={today} />
          </div>
        </section>
      </Reveal>

      <Reveal className="mt-6">
        <section className="glass p-6">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-3xl">Badges</h2>
            <span className="text-sm text-muted">
              {badges.filter((b) => b.earned).length} of {badges.length}
            </span>
          </div>
          <div className="mt-5">
            <BadgeGrid badges={badges} />
          </div>
        </section>
      </Reveal>

      {profileIncomplete ? (
        <Reveal className="mt-6">
          <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-2xl">Make your profile yours</h3>
              <p className="mt-1 text-secondary">Add a photo, a headline and a short bio so people know who you are.</p>
            </div>
            <Link href="/settings" data-track="dash-finish-profile" className="pill-teal card-link shrink-0">
              Edit profile
            </Link>
          </div>
        </Reveal>
      ) : null}
    </div>
  );
}

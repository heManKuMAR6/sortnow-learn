import type { Metadata } from "next";
import Link from "next/link";
import { AiIcon } from "@/components/AiIcon";
import { ChallengeCard } from "@/components/ChallengeCard";
import { PuzzleMark } from "@/components/PuzzleMark";
import { Reveal } from "@/components/Reveal";
import { Stagger, StaggerItem } from "@/components/Stagger";
import { challenges, dailyChallenge } from "@/lib/challenges";
import { lessonsFor, lessons, tracks, weeklyNotesNewestFirst } from "@/lib/content";
import { utcToday } from "@/lib/platform/dates";
import { safely } from "@/lib/safe";
import { getStore } from "@/lib/platform/store";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: { absolute: "sortNow Learn · Solve the puzzle. Get ahead." },
};

const steps = [
  { icon: "bulb", title: "Learn", body: "Short videos with the key points written down." },
  { icon: "puzzle", title: "Solve", body: "Quick AI challenges. Earn points, keep a daily streak." },
  { icon: "trophy", title: "Show", body: "A profile and portfolio that prove what you can do." },
] as const;

export default async function HomePage() {
  const user = await getCurrentUser();
  const today = utcToday();
  const featured = dailyChallenge(today);
  const done = user
    ? (await safely(getStore().completed(user.id), { challenges: {}, lessons: [] }, "home completed")).challenges
    : {};
  const week = weeklyNotesNewestFirst()[0];

  return (
    <div>
      <section className="relative grid items-center gap-10 pb-12 pt-2 lg:grid-cols-[1.2fr_1fr]">
        <div className="hero-glow" aria-hidden="true" />
        <div className="relative">
          <Reveal>
            <p className="eyebrow text-base">
              Are you sorted<span className="dot">?</span>
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="mt-4 max-w-3xl text-5xl sm:text-6xl lg:text-7xl">
              Solve the puzzle<span className="dot">.</span> Get ahead<span className="dot">.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.22}>
            <p className="mt-6 max-w-xl text-lg text-secondary">
              Learn AI in small steps. Short lessons, daily challenges, and a profile that shows how far you have
              come. Free, and no code.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <>
                  <Link href="/dashboard" data-track="hero-dashboard" className="pill-teal pill-lg">
                    Go to my dashboard →
                  </Link>
                  <Link href={`/challenges/${featured.slug}`} data-track="hero-challenge" className="pill-white pill-lg">
                    Today&apos;s challenge
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/signup" data-track="hero-join" className="pill-teal pill-lg">
                    Start free →
                  </Link>
                  <Link href="/challenges" data-track="hero-try" className="pill-white pill-lg">
                    Try a challenge
                  </Link>
                </>
              )}
            </div>
            {week ? (
              <p className="mt-6 text-sm text-secondary">
                <span className="chip chip-coral mr-2">This week</span>
                <Link href="/week" data-track="hero-week" className="text-link">
                  {week.title} →
                </Link>
              </p>
            ) : null}
          </Reveal>
        </div>
        <Reveal delay={0.2} className="relative">
          <div className="hero-art glass">
            <PuzzleMark size={190} />
            <span className="float-chip c1">
              <AiIcon name="flame" size={16} /> 7-day streak
            </span>
            <span className="float-chip c2">
              <AiIcon name="spark" size={16} /> +1 point
            </span>
            <span className="float-chip c3">
              <AiIcon name="trophy" size={16} /> Puzzle solved
            </span>
          </div>
        </Reveal>
      </section>

      <section className="section-gap">
        <Stagger className="grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <StaggerItem key={step.title}>
              <div className="flex gap-4">
                <span className="step-icon">
                  <AiIcon name={step.icon} size={22} />
                </span>
                <div>
                  <h2 className="text-2xl">
                    <span className="text-muted">{i + 1}.</span> {step.title}
                  </h2>
                  <p className="mt-1 text-secondary">{step.body}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="section-gap">
        <Reveal>
          <p className="eyebrow mb-3">Today&apos;s challenge</p>
          <ChallengeCard challenge={featured} result={done[featured.slug]} featured />
          <p className="mt-4 text-sm">
            <Link href="/challenges" data-track="home-all-challenges" className="text-link">
              See all {challenges.length} challenges →
            </Link>
          </p>
        </Reveal>
      </section>

      <section className="section-gap" aria-labelledby="tracks-h">
        <Reveal>
          <h2 id="tracks-h" className="text-4xl sm:text-5xl">
            Pick your track<span className="dot">.</span>
          </h2>
        </Reveal>
        <Stagger className="mt-6 grid gap-5 md:grid-cols-2">
          {tracks.map((track) => {
            const items = lessonsFor(track.id);
            return (
              <StaggerItem key={track.id}>
                <div className="card h-full p-6">
                  <span className={track.chip === "coral" ? "chip chip-coral" : "chip chip-mint"}>{track.title}</span>
                  <p className="mt-3 text-secondary">{track.description}</p>
                  <p className="mt-5 flex items-center justify-between text-sm">
                    <span className="text-muted">{items.length} lessons</span>
                    <Link href="/learn" data-track={`track-${track.id}`} className="arrow-link card-link">
                      Start <span>→</span>
                    </Link>
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
        <p className="mt-4 text-sm text-muted">
          {lessons.length} lessons so far, with more on the way.
        </p>
      </section>

      {user ? null : (
        <section className="section-gap">
          <Reveal>
            <div className="glass p-8 text-center sm:p-12">
              <h2 className="text-3xl sm:text-4xl">
                Start your streak today<span className="dot">.</span>
              </h2>
              <p className="mx-auto mt-3 max-w-md text-secondary">
                It takes a minute to join. Every day you show up is one more piece in place.
              </p>
              <Link href="/signup" data-track="home-cta-join" className="pill-coral pill-lg mt-6">
                Join free →
              </Link>
            </div>
          </Reveal>
        </section>
      )}
    </div>
  );
}

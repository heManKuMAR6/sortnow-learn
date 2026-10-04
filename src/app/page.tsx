import type { Metadata } from "next";
import Link from "next/link";
import { LessonCard } from "@/components/LessonCard";
import { Reveal } from "@/components/Reveal";
import { Stagger, StaggerItem } from "@/components/Stagger";
import { UntangleArt } from "@/components/UntangleArt";
import { lessonsFor, lessons, postsNewestFirst, tracks, weeklyNotesNewestFirst } from "@/lib/content";
import { formatDay } from "@/lib/format";

export const metadata: Metadata = {
  title: { absolute: "sortNow Learn · Short lessons that make AI stick" },
};

const steps = [
  { n: 1, title: "Watch", body: "A short video from someone who explains it well. No code, no jargon walls." },
  { n: 2, title: "Keep the points", body: "The few things that matter, written down, plus what the video does not cover." },
  { n: 3, title: "Ask while you watch", body: "Stuck on a word? Ask the lesson coach. Answers come from that lesson's notes." },
];

export default function HomePage() {
  const posts = postsNewestFirst().slice(0, 3);
  const week = weeklyNotesNewestFirst()[0];

  return (
    <div>
      <section className="relative grid items-center gap-10 pb-16 pt-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="hero-glow" aria-hidden="true" />
        <div className="relative">
          <Reveal>
            <p className="eyebrow text-base">
              Are you sorted<span className="dot">?</span>
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="mt-4 max-w-3xl text-5xl sm:text-6xl lg:text-7xl">
              We untangle the lesson and make it <span className="italic text-secondary">stick</span>
              <span className="dot">.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.25}>
            <p className="mt-6 max-w-xl text-lg text-secondary">
              Short videos, the points that matter, and a place to ask while you watch. Two tracks: one for
              people starting out, one for people who manage the work.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/learn" data-track="hero-lessons" className="pill-teal pill-lg">
                Start a lesson →
              </Link>
              <Link href="#how" data-track="hero-how" className="pill-white pill-lg">
                How it works
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted">
              {lessons.length} lessons · {tracks.length} tracks · free · no account needed to watch
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.2} className="relative">
          <div className="glass p-6 sm:p-8">
            <UntangleArt />
            <p className="mt-2 text-center text-xs uppercase tracking-[0.2em] text-muted">
              Tangled in, clear out
            </p>
          </div>
        </Reveal>
      </section>

      <section id="how" className="section-gap">
        <Reveal>
          <p className="eyebrow">How it works</p>
          <h2 className="mt-3 text-4xl sm:text-5xl">
            Three steps, about one coffee<span className="dot">.</span>
          </h2>
        </Reveal>
        <Stagger className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <StaggerItem key={step.n}>
              <div className="card h-full p-6">
                <span className="step-num">{step.n}</span>
                <h3 className="mt-4 text-2xl">{step.title}</h3>
                <p className="mt-2 text-secondary">{step.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="section-gap" aria-labelledby="tracks-h">
        <Reveal>
          <p className="eyebrow">Pick a track</p>
          <h2 id="tracks-h" className="mt-3 text-4xl sm:text-5xl">
            Where are you starting<span className="dot">?</span>
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {tracks.map((track) => {
            const items = lessonsFor(track.id);
            return (
              <Reveal key={track.id}>
                <div className="glass h-full p-6">
                  <span className={track.chip === "coral" ? "chip chip-coral" : "chip chip-mint"}>{track.title}</span>
                  <p className="mt-3 text-secondary">{track.description}</p>
                  <div className="mt-5 grid gap-4">
                    {items.map((lesson, i) => (
                      <LessonCard key={lesson.slug} lesson={lesson} index={i} />
                    ))}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {week ? (
        <section className="section-gap">
          <Reveal>
            <div className="card flex flex-col gap-4 p-7 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="eyebrow">This week · {formatDay(week.weekOf)}</p>
                <h2 className="mt-2 text-3xl sm:text-4xl">{week.title}</h2>
                <p className="mt-2 max-w-xl text-secondary">{week.intro}</p>
              </div>
              <Link href="/week" data-track="home-week" className="pill-coral card-link shrink-0">
                Read this week&apos;s note
              </Link>
            </div>
          </Reveal>
        </section>
      ) : null}

      <section id="notes" className="section-gap">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Latest notes</p>
              <h2 className="mt-3 text-4xl sm:text-5xl">
                Short, plain, useful<span className="dot">.</span>
              </h2>
            </div>
            <Link href="/notes" data-track="home-all-notes" className="text-link">
              All notes →
            </Link>
          </div>
        </Reveal>
        <Stagger className="mt-8 grid gap-5 md:grid-cols-3">
          {posts.map((post) => (
            <StaggerItem key={post.slug}>
              <article className="card h-full p-6">
                <p className="text-sm text-muted">{formatDay(post.date)}</p>
                <h3 className="mt-2 text-2xl">
                  <Link href={`/posts/${post.slug}`} data-track={`post-${post.slug}`} className="card-link">
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm text-secondary">{post.excerpt}</p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="section-gap">
        <Reveal>
          <div className="glass p-8 text-center sm:p-12">
            <h2 className="text-3xl sm:text-4xl">
              Need this for your team, not just you<span className="dot">?</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-secondary">
              sortNow &amp; Company builds the real thing: software, ML and cloud systems that work in production.
            </p>
            <a href="https://sortnow.co/contact" data-track="home-cta-company" className="pill-teal pill-lg mt-6">
              Start a conversation →
            </a>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

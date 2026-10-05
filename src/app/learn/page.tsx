import type { Metadata } from "next";
import { LessonCard } from "@/components/LessonCard";
import { TrackProgress } from "@/components/ProgressUI";
import { Reveal } from "@/components/Reveal";
import { Stagger, StaggerItem } from "@/components/Stagger";
import { lessonsFor, tracks } from "@/lib/content";
import { requireMember } from "@/lib/gate";

export const metadata: Metadata = {
  title: "Lessons",
  description: "Two short tracks: Beginner and Manager. Watch, read the key points, then ask.",
};

export default async function LearnPage() {
  await requireMember("/learn");
  return (
    <div>
      <Reveal>
        <p className="eyebrow">Lessons</p>
        <h1 className="mt-3 max-w-3xl text-5xl sm:text-6xl">
          Two tracks. Watch, then ask<span className="dot">.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-secondary">
          Each lesson is a short video, the notes that matter, and a place to ask while you watch. Pick the
          track that fits where you are. Your progress is saved on this device.
        </p>
      </Reveal>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {tracks.map((track) => {
          const items = lessonsFor(track.id);
          return (
            <Reveal key={track.id}>
              <section className="glass h-full p-6" aria-labelledby={`track-${track.id}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={track.chip === "coral" ? "chip chip-coral" : "chip chip-mint"}>
                    {track.id === "beginner" ? "Start here" : "For people who manage the work"}
                  </span>
                  <span className="chip chip-sun">{items.length} lessons</span>
                </div>
                <h2 id={`track-${track.id}`} className="mt-4 text-4xl">
                  {track.title}
                </h2>
                <p className="mt-2 text-secondary">{track.description}</p>
                <div className="mt-5">
                  <TrackProgress slugs={items.map((l) => l.slug)} label={`${track.title} track`} />
                </div>
                <Stagger className="mt-6 grid gap-4">
                  {items.map((lesson, index) => (
                    <StaggerItem key={lesson.slug}>
                      <LessonCard lesson={lesson} index={index} />
                    </StaggerItem>
                  ))}
                </Stagger>
              </section>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

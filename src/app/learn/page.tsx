import type { Metadata } from "next";
import Link from "next/link";
import { lessonsFor, tracks } from "@/lib/content";

export const metadata: Metadata = {
  title: "Lessons",
  description: "Two short tracks: Beginner and Manager.",
};

export default function LearnPage() {
  return (
    <div>
      <p className="font-heading text-sm font-semibold text-teal">Lessons</p>
      <h1 className="mt-3 max-w-3xl text-5xl font-semibold leading-tight">Two tracks. Watch, then ask.</h1>
      <p className="mt-4 max-w-xl text-secondary">
        Each lesson is a short video, the notes that matter, and a place to ask while you watch.
      </p>
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {tracks.map((track) => (
          <section key={track.id} className="glass p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className={track.chip === "coral" ? "chip chip-coral" : "chip chip-mint"}>{track.title}</span>
              <span className="chip chip-teal">YouTube</span>
            </div>
            <h2 className="mt-4 text-3xl font-semibold">{track.title}</h2>
            <p className="mt-2 text-secondary">{track.description}</p>
            <ol className="mt-5 grid gap-3">
              {lessonsFor(track.id).map((lesson, index) => (
                <li key={lesson.slug} className="rounded-3xl bg-white/55 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    {index + 1} · {lesson.channel}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">
                    <Link
                      href={`/learn/${track.id}/${lesson.slug}`}
                      data-track={`lesson-${track.id}-${lesson.slug}`}
                      className="text-link"
                    >
                      {lesson.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-secondary">{lesson.summary}</p>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { NotesGate } from "@/components/NotesGate";
import { hasNotesAccess } from "@/lib/gate";
import { PuzzleMark } from "@/components/PuzzleMark";
import { weeklyNotesNewestFirst } from "@/lib/content";
import { igPostsNewestFirst } from "@/lib/ig-posts";
import { formatDay } from "@/lib/format";

export const metadata: Metadata = {
  title: "This week",
  description: "A short weekly note on AI, for beginners and for people who manage the work.",
};

export default async function WeekPage() {
  if (!(await hasNotesAccess())) return <NotesGate next="/week" />;
  const [latest, ...older] = weeklyNotesNewestFirst();
  const currentReel = igPostsNewestFirst()[0];

  if (!latest) {
    return (
      <div>
        <h1 className="text-4xl">This week</h1>
        <p className="mt-3 text-secondary">No note yet.</p>
      </div>
    );
  }

  return (
    <article className="week-page">
      <PuzzleMark size={84} />
      <p className="mt-4 text-sm font-semibold text-teal">Week of {formatDay(latest.weekOf)}</p>
      <h1 className="mt-2 text-4xl leading-tight sm:text-5xl">{latest.title}</h1>
      <p className="mt-4 text-lg text-secondary">{latest.intro}</p>

      <section className="glass mt-6 p-5">
        <span className="chip chip-mint">Beginners</span>
        <h2 className="mt-3 text-2xl">{latest.beginnerTitle}</h2>
        {latest.beginner.map((paragraph) => (
          <p key={paragraph} className="mt-3">
            {paragraph}
          </p>
        ))}
        <p className="mt-4">
          <Link href={latest.beginnerLesson.href} data-track="week-beginner-lesson" className="pill-teal text-sm">
            {latest.beginnerLesson.label}
          </Link>
        </p>
      </section>

      <section className="glass mt-4 p-5">
        <span className="chip chip-coral">Managers</span>
        <h2 className="mt-3 text-2xl">{latest.managerTitle}</h2>
        {latest.manager.map((paragraph) => (
          <p key={paragraph} className="mt-3">
            {paragraph}
          </p>
        ))}
        <p className="mt-4">
          <Link href={latest.managerLesson.href} data-track="week-manager-lesson" className="pill-white text-sm">
            {latest.managerLesson.label}
          </Link>
        </p>
      </section>

      {older.length > 0 ? (
        <details className="glass mt-6 p-5">
          <summary className="cursor-pointer font-semibold">Earlier weeks</summary>
          <ul className="mt-4 grid gap-3">
            {older.map((week) => (
              <li key={week.weekOf}>
                <p className="text-sm text-muted">{formatDay(week.weekOf)}</p>
                <p className="font-heading text-lg font-semibold">{week.title}</p>
                <p className="text-sm text-secondary">{week.intro}</p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {currentReel ? (
        <p className="mt-8 text-sm text-secondary">
          <Link href={`/ig/${currentReel.slug}`} data-track="week-to-ig" className="text-link">
            This week on Instagram
          </Link>
          {" · "}
          <Link href="/ig" data-track="week-to-ig-index" className="text-link">
            All weeks
          </Link>
        </p>
      ) : null}
    </article>
  );
}

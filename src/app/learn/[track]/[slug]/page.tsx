import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonCoach } from "@/components/LessonCoach";
import { Reveal } from "@/components/Reveal";
import { getLesson, lessons, lessonsFor } from "@/lib/content";
import { listLessonQuestions } from "@/lib/questions-store";
import { LessonQuest } from "@/components/LessonQuest";
import { lessonQuests } from "@/lib/lesson-quests";
import { requireMember } from "@/lib/gate";

type Params = { track: string; slug: string };

export function generateStaticParams() {
  return lessons.map((lesson) => ({ track: lesson.track, slug: lesson.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { track, slug } = await params;
  const lesson = getLesson(track, slug);
  if (!lesson) return { title: "Lesson" };
  return { title: lesson.title, description: lesson.summary };
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { track, slug } = await params;
  const lesson = getLesson(track, slug);
  if (!lesson) notFound();

  const user = await requireMember(`/learn/${lesson.track}/${lesson.slug}`);
  const thread = await listLessonQuestions(lesson.slug);
  const siblings = lessonsFor(lesson.track);
  const position = siblings.findIndex((item) => item.slug === lesson.slug);
  const prev = position > 0 ? siblings[position - 1] : undefined;
  const next = position < siblings.length - 1 ? siblings[position + 1] : undefined;
  const trackLabel = lesson.track === "beginner" ? "Beginner" : "Manager";
  const quest = lessonQuests[lesson.slug];
  if (!quest) notFound();

  return (
    <article className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="text-sm text-secondary">
        <Link href="/learn" data-track="crumb-lessons" className="text-link">
          Lessons
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{trackLabel}</span>
        <span aria-hidden="true"> / </span>
        <span>
          {position + 1} of {siblings.length}
        </span>
      </nav>
      <Reveal>
        <p className="mt-4 flex flex-wrap items-center gap-2">
          <span className={lesson.track === "beginner" ? "chip chip-mint" : "chip chip-coral"}>{trackLabel}</span>
          <span className="chip chip-sun">{lesson.channel}</span>
        </p>
        <h1 className="mt-4 text-4xl sm:text-6xl">{lesson.title}</h1>
        <p className="mt-4 text-lg text-secondary">{lesson.summary}</p>
      </Reveal>
      <LessonQuest
        lessonSlug={lesson.slug}
        signedIn={Boolean(user)}
        hook={quest.hook}
        bites={quest.bites}
        checks={quest.checks}
        keyPoints={lesson.keyPoints}
      >
        <div className="glass overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
          <div className="aspect-video w-full bg-black">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${lesson.youtubeId}`}
              title={lesson.videoTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              data-track={`video-${lesson.youtubeId}`}
            />
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">{lesson.videoTitle}</p>
      </LessonQuest>

      <LessonCoach
        lessonSlug={lesson.slug}
        signedIn={Boolean(user)}
        initialQuestions={thread.questions.map((row) => ({
          id: row.id,
          author: row.author,
          question: row.question,
          createdAt: row.createdAt,
        }))}
        threadError={thread.error}
      />

      <nav aria-label="Lesson navigation" className="mt-10 grid gap-4 sm:grid-cols-2">
        {prev ? (
          <div className="card p-5" style={{ ["--accent" as string]: "var(--color-deep-teal)" }}>
            <p className="eyebrow">← Previous</p>
            <Link href={`/learn/${prev.track}/${prev.slug}`} data-track="lesson-prev" className="card-link mt-2 block font-heading text-xl text-teal">
              {prev.title}
            </Link>
          </div>
        ) : (
          <div />
        )}
        {next ? (
          <div className="card p-5 sm:text-right" style={{ ["--accent" as string]: "var(--color-deep-teal)" }}>
            <p className="eyebrow">Next →</p>
            <Link href={`/learn/${next.track}/${next.slug}`} data-track="lesson-next" className="card-link mt-2 block font-heading text-xl text-teal">
              {next.title}
            </Link>
          </div>
        ) : (
          <div className="card p-5 sm:text-right">
            <p className="eyebrow">Track finished</p>
            <Link href="/learn" data-track="lesson-all" className="card-link mt-2 block font-heading text-xl text-teal">
              Back to all lessons
            </Link>
          </div>
        )}
      </nav>
    </article>
  );
}

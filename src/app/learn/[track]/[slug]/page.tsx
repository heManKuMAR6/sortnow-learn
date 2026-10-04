import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonCoach } from "@/components/LessonCoach";
import { getLesson, lessons } from "@/lib/content";
import { listLessonQuestions } from "@/lib/questions-store";
import { getCurrentUser } from "@/lib/session";

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

  const user = await getCurrentUser();
  const thread = await listLessonQuestions(lesson.slug);

  return (
    <article className="max-w-3xl">
      <p className="flex flex-wrap items-center gap-2">
        <span className={lesson.track === "beginner" ? "chip chip-mint" : "chip chip-coral"}>
          {lesson.track === "beginner" ? "Beginner" : "Manager"}
        </span>
        <span className="chip chip-sun">{lesson.channel}</span>
      </p>
      <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">{lesson.title}</h1>
      <p className="mt-4 text-secondary">{lesson.summary}</p>
      <div className="glass mt-6 overflow-hidden">
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

      <section className="glass mt-6 p-5 sm:p-6">
        <h2 className="text-2xl font-semibold">Key points</h2>
        <ul className="mt-4 grid gap-3">
          {lesson.keyPoints.map((point) => (
            <li key={point} className="flex gap-3 text-[0.98rem]">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-mint" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </section>

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

      <p className="mt-8">
        <Link href="/learn" data-track="back-to-lessons" className="pill-white text-sm">
          All lessons
        </Link>
      </p>
    </article>
  );
}

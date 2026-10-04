"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { coachPrompts } from "@/lib/content";
import { formatWhen } from "@/lib/format";

type QuestionRow = {
  id: string;
  author: string;
  question: string;
  createdAt: string;
};

export function LessonCoach({
  lessonSlug,
  signedIn,
  initialQuestions,
  threadError,
}: {
  lessonSlug: string;
  signedIn: boolean;
  initialQuestions: QuestionRow[];
  threadError: string | null;
}) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [questions, setQuestions] = useState(initialQuestions);

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setError(null);
    setPending(true);
    try {
      const coachResponse = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonSlug, question: trimmed }),
      });
      const coachBody = (await coachResponse.json()) as {
        answer?: string;
        source?: "lesson" | "model";
        warning?: string;
        error?: string;
      };
      if (!coachResponse.ok || !coachBody.answer || !coachBody.source) {
        setError(coachBody.error ?? "Could not answer that.");
        return;
      }
      setAnswer(coachBody.answer);

      if (!signedIn) return;

      const postResponse = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonSlug, question: trimmed }),
      });
      const postBody = (await postResponse.json()) as {
        error?: string;
        question?: QuestionRow;
      };
      if (!postResponse.ok || !postBody.question) {
        setError(postBody.error ?? "The answer is above, but the question was not added to the thread.");
        return;
      }
      setQuestions((current) => [postBody.question as QuestionRow, ...current.filter((row) => row.id !== postBody.question?.id)]);
      setQuestion("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not reach the coach.");
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(question);
  }

  return (
    <div className="mt-8 grid gap-5">
      <section className="glass p-5 sm:p-6" aria-labelledby="coach-title">
        <h2 id="coach-title" className="text-2xl">
          Ask while you watch
        </h2>
        <p className="mt-2 max-w-xl text-sm text-secondary">
          The coach stays on this lesson’s notes. If the notes do not cover it, the answer says so.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {coachPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="pill-white text-sm"
              data-track={`coach-prompt-${prompt.slice(0, 24).toLowerCase().replace(/\s+/g, "-")}`}
              disabled={pending || !signedIn}
              onClick={() => {
                setQuestion(prompt);
                void ask(prompt);
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
        {signedIn ? (
          <form onSubmit={onSubmit} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm" htmlFor="coach-question">
              Your question
              <textarea
                id="coach-question"
                className="field min-h-24"
                value={question}
                maxLength={400}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask something this lesson can answer"
              />
            </label>
            <button type="submit" className="pill-teal w-fit text-sm" data-track="coach-submit" disabled={pending}>
              {pending ? "Working…" : "Ask"}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-secondary">
            Sign in to ask and add it to the thread.{" "}
            <Link href="/login" data-track="coach-sign-in" className="text-link">
              Sign in
            </Link>
          </p>
        )}
        {error ? <p className="mt-3 text-sm text-coral">{error}</p> : null}
        {answer ? (
          <div className="mt-5 rounded-3xl bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
              From this lesson
            </p>
            <p className="mt-3 whitespace-pre-wrap text-[0.98rem]">{answer}</p>
          </div>
        ) : null}
      </section>

      <section className="glass p-5 sm:p-6" aria-labelledby="thread-title">
        <h2 id="thread-title" className="text-2xl">
          Questions on this lesson
        </h2>
        <p className="mt-2 text-sm text-secondary">Anyone can read. Posting needs a session.</p>
        {threadError ? (
          <p className="mt-3 text-sm text-coral">Could not load questions just now.</p>
        ) : null}
        {questions.length === 0 && !threadError ? (
          <p className="mt-4 text-sm text-secondary">No questions yet. Be the first to ask.</p>
        ) : (
          <ol className="mt-4 grid gap-3">
            {questions.map((row) => (
              <li key={row.id} className="rounded-3xl bg-white/55 px-4 py-3">
                <p className="text-sm font-medium text-teal">{row.author}</p>
                <p className="mt-1">{row.question}</p>
                <p className="mt-1 text-xs text-muted">{formatWhen(row.createdAt)}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PublicChallenge } from "@/lib/challenges";
import { toast } from "@/lib/toast";

type Result = { correct: boolean; answer: number; why: string };
type Graded = {
  score: number;
  total: number;
  passed: boolean;
  gained: number;
  results: Result[];
  worth: number;
  streak: number;
  streakDay: boolean;
  attemptsLeft: number;
  daily: boolean;
};

const KEYS = ["A", "B", "C", "D", "E"];

export function ChallengeRunner({
  challenge,
  nextHref,
  nextTitle,
}: {
  challenge: PublicChallenge;
  nextHref: string | null;
  nextTitle: string | null;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const total = challenge.questions.length;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(total).fill(null));
  const [graded, setGraded] = useState<Graded | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = challenge.questions[step];
  const picked = answers[step];

  function pick(i: number) {
    setAnswers((a) => a.map((v, idx) => (idx === step ? i : v)));
  }

  async function submit(given: (number | null)[] = answers) {
    setError(null);
    setPending(true);
    try {
      const response = await fetch(`/api/challenges/${challenge.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: given }),
      });
      const body = (await response.json()) as Graded & { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Could not check your answers.");
        return;
      }
      setGraded(body);
      if (body.streakDay) {
        window.setTimeout(
          () =>
            toast({
              badge: `${body.streak}`,
              title: body.streak > 1 ? `${body.streak}-day streak` : "Streak started",
              body: "You solved today's puzzle. That is what moves it.",
              icon: "flame",
              tone: "points",
            }),
          body.gained > 0 ? 900 : 0,
        );
        router.refresh();
      }
      if (body.gained > 0) {
        toast({
          badge: `+${body.gained}`,
          title: "Challenge solved",
          body: `${body.score} of ${body.total} right. Nicely done.`,
          icon: "trophy",
          tone: "points",
        });
        router.refresh();
      }
    } catch {
      setError("The line hiccuped. Try once more.");
    } finally {
      setPending(false);
    }
  }

  function again() {
    setGraded(null);
    setAnswers(Array(total).fill(null));
    setStep(0);
  }

  if (graded) {
    const pct = Math.round((graded.score / graded.total) * 100);
    return (
      <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
        <div className="glass p-6 text-center sm:p-8">
          <div
            className="score-ring mx-auto"
            style={{ ["--pct" as string]: `${pct}%` }}
            role="img"
            aria-label={`${graded.score} of ${graded.total} correct`}
          >
            <span className="font-heading text-5xl font-light text-teal">
              {graded.score}/{graded.total}
            </span>
          </div>
          <h2 className="mt-5 text-4xl">{graded.passed ? "Solved" : "So close"}</h2>
          <p className="mt-2 text-secondary">
            {graded.passed
              ? graded.gained > 0
                ? `You earned ${graded.gained} points.`
                : "You already earned the points for this one. Replays are for fun."
              : graded.attemptsLeft > 0
                ? `You need 3 of 4 to pass. ${graded.attemptsLeft} ${graded.attemptsLeft === 1 ? "try" : "tries"} left today. The answers stay hidden until you pass or use your last try.`
                : "That was your last try today. The answers are below. Come back tomorrow."}
          </p>
          {graded.passed && graded.streakDay ? (
            <p className="mt-2 font-semibold text-teal">Streak day earned: {graded.streak}-day streak.</p>
          ) : graded.passed && graded.daily ? (
            <p className="mt-2 text-sm text-secondary">Today&apos;s streak day is already counted.</p>
          ) : graded.passed ? (
            <p className="mt-2 text-sm text-secondary">Your streak moves when you pass today&apos;s featured challenge.</p>
          ) : null}
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {graded.passed || graded.attemptsLeft > 0 ? (
              <button type="button" className="pill-white" onClick={again} data-track="challenge-retry">
                {graded.passed ? "Play again" : "Try again"}
              </button>
            ) : null}
            {nextHref ? (
              <Link href={nextHref} className="pill-teal" data-track="challenge-next">
                Next: {nextTitle} →
              </Link>
            ) : (
              <Link href="/challenges" className="pill-teal">
                All challenges
              </Link>
            )}
          </div>
        </div>

        <ol className="mt-6 grid gap-4">
          {challenge.questions.map((q, i) => {
            const r = graded.results[i];
            if (!r) return null;
            return (
              <li key={q.q} className="card p-5">
                <p className="flex items-start gap-2 text-sm font-semibold">
                  <span className={r.correct ? "text-[#2e9e6b]" : "text-coral"}>{r.correct ? "✓" : "✗"}</span>
                  <span>{q.q}</span>
                </p>
                <p className="mt-2 text-sm">
                  <span className="text-muted">Right answer: </span>
                  {q.options[r.answer]}
                </p>
                <p className="mt-1 text-sm text-secondary">{r.why}</p>
              </li>
            );
          })}
        </ol>
      </motion.div>
    );
  }

  if (!question) return null;
  const last = step === total - 1;

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold text-secondary">
        <span>
          Question {step + 1} of {total}
        </span>
        <span>+{challenge.points} points</span>
      </div>
      <div className="progress-track mt-2" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={step + 1}>
        <div className="progress-fill" style={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="glass mt-5 p-6 sm:p-7"
          initial={reduce ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-2xl leading-snug sm:text-3xl" aria-live="polite">{question.q}</h2>
          <fieldset className="mt-5 grid gap-3">
            <legend className="sr-only">Choose one answer</legend>
            {question.options.map((option, i) => (
              <label key={option} className={`opt${picked === i ? " picked" : ""}`}>
                <input
                  type="radio"
                  name={`q${step}`}
                  className="sr-only"
                  checked={picked === i}
                  onChange={() => pick(i)}
                />
                <span className="opt-key" aria-hidden="true">
                  {KEYS[i]}
                </span>
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
        </motion.div>
      </AnimatePresence>

      {error ? <p className="mt-3 text-sm text-coral">{error}</p> : null}
      <div className="mt-5 flex items-center justify-between">
        <button type="button" className="pill-white" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </button>
        {last ? (
          <button
            type="button"
            className="pill-coral"
            disabled={picked === null || picked === undefined || answers.includes(null) || pending}
            onClick={() => void submit()}
            data-track="challenge-submit"
          >
            {pending ? "Checking…" : "Check my answers"}
          </button>
        ) : (
          <button type="button" className="pill-teal" disabled={picked === null || picked === undefined} onClick={() => setStep((s) => s + 1)}>
            Next
          </button>
        )}
      </div>
    </div>
  );
}

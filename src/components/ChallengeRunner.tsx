"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AiIcon } from "@/components/AiIcon";
import { QuestionInput } from "@/components/questions/Inputs";
import { AnswerReview } from "@/components/questions/Review";
import { codeOf, initialState, KIND_LABEL, type QState } from "@/components/questions/state";
import type { PublicChallenge } from "@/lib/challenges";
import { confetti, haptic, play, setSound, soundOn } from "@/lib/fx";
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

const TRIES = 3;

function Heart({ lost, breaking }: { lost: boolean; breaking: boolean }) {
  return (
    <svg className={`heart${lost ? " lost" : ""}${breaking ? " breaking" : ""}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.2 2.8 4.5 6.4 4.5c2 0 3.5 1.1 4.3 2.6.3.5.9.5 1.2 0 .8-1.5 2.3-2.6 4.3-2.6 3.6 0 5.5 3.7 4 7.3C19.5 16.400 12 21 12 21z" />
    </svg>
  );
}

function Hearts({ left, breaking = -1 }: { left: number; breaking?: number }) {
  return (
    <span className="hearts" role="img" aria-label={`${left} of ${TRIES} tries left today`}>
      {Array.from({ length: TRIES }, (_, i) => (
        <Heart key={i} lost={i >= left} breaking={i === breaking} />
      ))}
    </span>
  );
}

function CountUp({ to, ms = 900, prefix = "" }: { to: number; ms?: number; prefix?: string }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? to : 0);
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      setN(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms, reduce]);
  return <>{prefix}{reduce ? to : n}</>;
}

export function ChallengeRunner({
  challenge,
  nextHref,
  nextTitle,
  triesUsed,
  daily,
  streak,
}: {
  challenge: PublicChallenge;
  nextHref: string | null;
  nextTitle: string | null;
  triesUsed: number;
  daily: boolean;
  streak: number;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const total = challenge.questions.length;
  const [phase, setPhase] = useState<"intro" | "play" | "result">("intro");
  const [step, setStep] = useState(0);
  const [states, setStates] = useState<QState[]>(() => challenge.questions.map(initialState));
  const [graded, setGraded] = useState<Graded | null>(null);
  const [sent, setSent] = useState<(number | null)[]>([]);
  const [left, setLeft] = useState(Math.max(0, TRIES - triesUsed));
  const [breaking, setBreaking] = useState(-1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sound, setSoundState] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => setSoundState(soundOn()), []);

  const question = challenge.questions[step];
  const state = states[step];
  const ready = question && state ? codeOf(question, state) !== null : false;
  const kinds = [...new Set(challenge.questions.map((q) => q.kind))];

  const setState = useCallback((i: number, next: QState) => setStates((all) => all.map((s, idx) => (idx === i ? next : s))), []);

  function toggleSound() {
    const next = !sound;
    setSound(next);
    setSoundState(next);
    if (next) play("lock");
  }

  function start() {
    play("lock");
    haptic(15);
    setPhase("play");
    setStep(0);
  }

  function goTo(i: number) {
    setStep(i);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  async function submit() {
    setError(null);
    setPending(true);
    play("lock");
    const codes = challenge.questions.map((q, i) => codeOf(q, states[i] as QState));
    try {
      const response = await fetch(`/api/challenges/${challenge.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: codes }),
      });
      const body = (await response.json()) as Graded & { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Could not check your answers.");
        return;
      }
      setSent(codes);
      setGraded(body);
      setPhase("result");
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      if (body.passed) {
        play("win");
        haptic(25);
        confetti(body.score === body.total ? 190 : 120);
      } else {
        play("miss");
        setBreaking(Math.max(0, body.attemptsLeft));
        window.setTimeout(() => setBreaking(-1), 700);
      }
      setLeft(Math.max(0, body.attemptsLeft));
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
    setSent([]);
    setStates(challenge.questions.map(initialState));
    setStep(0);
    setPhase("intro");
  }

  async function share() {
    if (!graded) return;
    const text = `I ${graded.score === graded.total ? "aced" : "solved"} “${challenge.title}” on sortNow Learn (${graded.score}/${graded.total})${graded.streak > 1 ? ` and I'm on a ${graded.streak}-day streak` : ""}. Solve the puzzle. Get ahead.`;
    const url = `${window.location.origin}/?src=share`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "sortNow Learn", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast({ title: "Copied", body: "Paste it anywhere to challenge a friend.", icon: "spark" });
    } catch {
      // The person closed the share sheet, or clipboard is blocked: nothing to do.
    }
  }

  // Keyboard: 1 to 4 pick on multiple choice, Enter moves on.
  useEffect(() => {
    if (phase !== "play" || !question || !state) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "SELECT" || t.tagName === "TEXTAREA" || t.tagName === "BUTTON" || (t.tagName === "INPUT" && (t as HTMLInputElement).type !== "radio"))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (question.kind === "choice" && /^[1-4]$/.test(e.key) && Number(e.key) <= question.options.length) {
        play("tap");
        setState(step, { kind: "choice", value: Number(e.key) - 1 });
      } else if (e.key === "Enter" && ready && !pending) {
        e.preventDefault();
        if (step < total - 1) {
          play("lock");
          goTo(step + 1);
        } else {
          void submit();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, step, ready, pending, states]);

  const fade = reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } };

  // ---------- Result ----------
  if (phase === "result" && graded) {
    const pct = Math.round((graded.score / graded.total) * 100);
    const flawless = graded.passed && graded.score === graded.total;
    return (
      <motion.div {...fade}>
        <div className="glass p-6 text-center sm:p-8">
          <div className="score-ring mx-auto" style={{ ["--pct" as string]: `${pct}%` }} role="img" aria-label={`${graded.score} of ${graded.total} correct`}>
            <span className="font-heading text-5xl font-light text-teal">
              <CountUp to={graded.score} ms={700} />/{graded.total}
            </span>
          </div>
          <h2 className="mt-5 text-4xl">{flawless ? "Flawless" : graded.passed ? "Solved" : "So close"}</h2>
          <p className="mt-2 text-secondary">
            {graded.passed
              ? graded.gained > 0
                ? "You earned the points for this one."
                : "You already earned the points for this one. Replays are for fun."
              : graded.attemptsLeft > 0
                ? `You need 3 of 4 to pass. You have ${graded.attemptsLeft} ${graded.attemptsLeft === 1 ? "try" : "tries"} left today.`
                : "That was your last try today. The answers are below. Come back tomorrow."}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
            {graded.gained > 0 ? (
              <span className="xp-pop" aria-label={`${graded.gained} points`}>
                <CountUp to={graded.gained} prefix="+" ms={800} /> <span className="text-base text-muted">points</span>
              </span>
            ) : null}
            {graded.streakDay ? (
              <span className="streak-flame">
                <AiIcon name="flame" size={20} /> {graded.streak}-day streak
              </span>
            ) : null}
            <Hearts left={left} breaking={breaking} />
          </div>
          {graded.passed && !graded.streakDay ? (
            <p className="mt-3 text-sm text-secondary">
              {graded.daily ? "Today's streak day is already counted." : "Your streak moves when you pass today's featured challenge."}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {graded.passed ? (
              <button type="button" className="pill-coral" onClick={() => void share()} data-track="challenge-share">
                Share my result
              </button>
            ) : null}
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

        {graded.results.length ? (
          <ol className="mt-6 grid gap-4">
            {challenge.questions.map((q, i) => {
              const r = graded.results[i];
              if (!r) return null;
              return (
                <motion.li
                  key={q.q}
                  className="card p-5"
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="flex items-start gap-2 text-sm font-semibold">
                    <span className={r.correct ? "text-[#2e9e6b]" : "text-coral"}>{r.correct ? "✓" : "✗"}</span>
                    <span>{q.q}</span>
                  </p>
                  <div className="mt-3">
                    <AnswerReview q={q} mine={sent[i] ?? null} right={r.answer} />
                  </div>
                  <p className="mt-3 text-sm text-secondary">{r.why}</p>
                </motion.li>
              );
            })}
          </ol>
        ) : (
          <div className="lock-card mt-6 text-center">
            <p className="font-semibold">The answers are locked for now</p>
            <p className="mt-1 text-sm text-secondary">They appear when you pass, or after your last try, so each try is a real attempt.</p>
          </div>
        )}
      </motion.div>
    );
  }

  // ---------- Intro ----------
  if (phase === "intro") {
    return (
      <motion.div {...fade} className="glass p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="chip chip-mint">{challenge.level}</span>
            <span className="chip chip-sun">+{challenge.points} points</span>
            <span className="text-muted">about {challenge.minutes} min</span>
          </p>
          <Hearts left={left} />
        </div>
        {daily ? (
          <p className="mt-4 rounded-2xl bg-sun/30 px-4 py-2 text-sm font-semibold">
            Today&apos;s streak puzzle. Pass it {streak > 0 ? `to keep your ${streak}-day streak.` : "to start a streak."}
          </p>
        ) : null}
        <p className="mt-5 font-heading text-2xl leading-snug sm:text-3xl">{challenge.hook}</p>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted">What you will do</p>
        <p className="mt-2 flex flex-wrap gap-2">
          {kinds.map((k) => (
            <span key={k} className="fmt-chip">{KIND_LABEL[k].label}</span>
          ))}
        </p>
        {left === 0 ? (
          <p className="mt-6 rounded-2xl bg-coral/15 px-4 py-3 text-sm" role="status">
            You have used all {TRIES} tries on this one today. It resets at midnight, and there are plenty of others to play.
          </p>
        ) : (
          <button type="button" className="pill-coral pill-lg mt-6" onClick={start} data-track="challenge-start">
            Start
          </button>
        )}
        <p className="mt-3 text-xs text-muted">{TRIES} tries a day. Answers stay hidden until you pass or use your last try.</p>
      </motion.div>
    );
  }

  // ---------- Play ----------
  if (!question || !state) return null;
  const last = step === total - 1;
  const meta = KIND_LABEL[question.kind];

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="segs" role="progressbar" aria-label="Question progress" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1}>
          {challenge.questions.map((q, i) => (
            <span key={q.q} className={`seg${i < step || (i !== step && codeOf(q, states[i] as QState) !== null) ? " done" : ""}${i === step ? " on" : ""}`} />
          ))}
        </div>
        <Hearts left={left} />
        <button type="button" className="sound-btn" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? "Turn sound off" : "Turn sound on"} title="Sound">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5L6 9H3v6h3l5 4V5z" />
            {sound ? <path d="M15.5 8.500a5 5 0 010 7M18.500 5.500a9 9 0 010 13" /> : <path d="M16 9l5 6M21 9l-5 6" />}
          </svg>
        </button>
      </div>
      <p className="mt-3 flex items-center justify-between text-xs font-semibold text-secondary">
        <span>
          Question {step + 1} of {total}
        </span>
        <span>+{challenge.points} points</span>
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="glass mt-3 p-6 sm:p-7"
          initial={reduce ? false : { opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -28 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="flex items-center gap-2">
            <span className="qz-kind">
              <AiIcon name={question.kind === "spot" ? "eye" : question.kind === "sort" ? "puzzle" : question.kind === "order" ? "target" : question.kind === "fill" ? "prompt" : "bulb"} size={14} />
              {meta.label}
            </span>
            <span className="text-xs text-muted">{meta.hint}</span>
          </p>
          <h2 ref={headingRef} tabIndex={-1} className="mt-3 mb-5 text-2xl leading-snug outline-none sm:text-3xl" aria-live="polite">
            {question.q}
          </h2>
          <QuestionInput q={question} state={state} onChange={(next) => setState(step, next)} name={`q${step}`} />
        </motion.div>
      </AnimatePresence>

      {error ? <p className="mt-3 text-sm text-coral" role="alert">{error}</p> : null}
      <div className="mt-5 flex items-center justify-between">
        <button type="button" className="pill-white" disabled={step === 0} onClick={() => goTo(step - 1)}>
          Back
        </button>
        {last ? (
          <button type="button" className="pill-coral" disabled={!ready || pending} onClick={() => void submit()} data-track="challenge-submit">
            {pending ? "Checking…" : "Check my answers"}
          </button>
        ) : (
          <button
            type="button"
            className="pill-teal"
            disabled={!ready}
            onClick={() => {
              play("lock");
              haptic(10);
              goTo(step + 1);
            }}
          >
            Lock in
          </button>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-muted">Tip: press 1 to 4 to pick, and Enter to move on.</p>
    </div>
  );
}

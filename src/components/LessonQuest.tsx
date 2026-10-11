"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { type ReactNode, useState } from "react";
import { AiIcon } from "@/components/AiIcon";
import { CompleteButton } from "@/components/ProgressUI";
import { useScope } from "@/components/ProgressProvider";
import { QuestionInput } from "@/components/questions/Inputs";
import { AnswerReview } from "@/components/questions/Review";
import { codeOf, initialState, KIND_LABEL, type QState } from "@/components/questions/state";
import { confetti, haptic, play } from "@/lib/fx";
import type { Bite } from "@/lib/lesson-quests";
import { publicQuestion, type Question } from "@/lib/question-types";
import { useCompleted } from "@/lib/progress";

const ease = [0.16, 1, 0.3, 1] as const;

function Step({ n, label, done, active }: { n: number; label: string; done: boolean; active: boolean }) {
  return (
    <li className={`quest-step${done ? " done" : ""}${active ? " active" : ""}`} aria-current={active ? "step" : undefined}>
      <span className="quest-dot" aria-hidden="true">{done ? "✓" : n}</span>
      <span>{label}</span>
      <span className="sr-only">{done ? " (done)" : ""}</span>
    </li>
  );
}

function BiteCard({ bite, flipped, onFlip }: { bite: Bite; flipped: boolean; onFlip: () => void }) {
  const reduce = useReducedMotion();
  return (
    <div className={`bite${flipped ? " flipped" : ""}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={flipped ? "back" : "front"}
          initial={reduce ? false : { rotateY: 80, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { rotateY: -80, opacity: 0 }}
          transition={{ duration: 0.28, ease }}
          style={{ transformPerspective: 700 }}
          className="grid gap-2"
        >
          <p className="flex items-center gap-2">
            <span className="bite-icon"><AiIcon name={flipped ? "bulb" : bite.icon} size={18} /></span>
            <span className="font-heading text-xl">{flipped ? "Think of it like this" : bite.title}</span>
          </p>
          <p className="text-[0.97rem] leading-relaxed text-secondary">{flipped ? bite.flip : bite.body}</p>
        </motion.div>
      </AnimatePresence>
      <button type="button" className="bite-flip" onClick={onFlip} aria-pressed={flipped} data-track="lesson-bite-flip">
        {flipped ? "Back to the idea" : "Flip for an analogy"} <span aria-hidden="true">↻</span>
      </button>
    </div>
  );
}

function QuickChecks({ checks, onDone }: { checks: Question[]; onDone: (score: number) => void }) {
  const reduce = useReducedMotion();
  const pub = checks.map(publicQuestion);
  const [i, setI] = useState(0);
  const [states, setStates] = useState<QState[]>(() => pub.map(initialState));
  const [checked, setChecked] = useState<boolean[]>(() => checks.map(() => false));
  const [correct, setCorrect] = useState<boolean[]>(() => checks.map(() => false));
  const [finished, setFinished] = useState(false);

  const q = checks[i] as Question;
  const pq = pub[i] as (typeof pub)[number];
  const st = states[i] as QState;
  const code = codeOf(pq, st);
  const score = correct.filter(Boolean).length;

  function check() {
    if (code === null) return;
    const ok = code === q.answer;
    setChecked((c) => c.map((v, k) => (k === i ? true : v)));
    setCorrect((c) => c.map((v, k) => (k === i ? ok : v)));
    play(ok ? "win" : "miss");
    haptic(ok ? 20 : 8);
    if (ok) confetti(28);
  }

  function next() {
    if (i < checks.length - 1) {
      setI(i + 1);
      return;
    }
    setFinished(true);
    const final = correct.filter(Boolean).length;
    if (final >= Math.ceil(checks.length * 0.75)) confetti(110);
    play("win");
    onDone(final);
  }

  if (finished) {
    return (
      <motion.div initial={reduce ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease }} className="text-center">
        <p className="font-heading text-5xl text-teal">{score}/{checks.length}</p>
        <p className="mt-2 text-lg">
          {score === checks.length ? "Perfect on the first try." : score >= Math.ceil(checks.length * 0.75) ? "Nicely done." : "You have the shape of it. The video and the cards above are worth a second look."}
        </p>
        <p className="mt-1 text-sm text-secondary">Quick checks do not change your score or points. They are for you.</p>
      </motion.div>
    );
  }

  const done = checked[i];
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="segs" role="progressbar" aria-label="Quick check progress" aria-valuemin={1} aria-valuemax={checks.length} aria-valuenow={i + 1}>
          {checks.map((c, k) => (
            <span key={c.q} className={`seg${checked[k] ? " done" : ""}${k === i ? " on" : ""}`} />
          ))}
        </div>
        <span className="text-xs font-semibold text-secondary">{i + 1} of {checks.length}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={reduce ? false : { opacity: 0, x: 22 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -22 }}
          transition={{ duration: 0.3, ease }}
          className="mt-4"
        >
          <p className="flex items-center gap-2">
            <span className="qz-kind">{KIND_LABEL[pq.kind].label}</span>
            <span className="text-xs text-muted">{KIND_LABEL[pq.kind].hint}</span>
          </p>
          <h3 className="mt-3 mb-4 text-xl leading-snug sm:text-2xl">{pq.q}</h3>
          <QuestionInput q={pq} state={st} onChange={(next2) => setStates((all) => all.map((s, k) => (k === i ? next2 : s)))} disabled={done} name={`check-${i}`} />
          {done ? (
            <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }} className={`feedback ${correct[i] ? "ok" : "no"}`} role="status">
              <p className="font-semibold">{correct[i] ? "Yes, that is right." : "Not quite. Here is the answer."}</p>
              {!correct[i] ? <div className="mt-2"><AnswerReview q={pq} mine={code} right={q.answer} /></div> : null}
              <p className="mt-2 text-sm text-secondary">{q.why}</p>
            </motion.div>
          ) : null}
        </motion.div>
      </AnimatePresence>
      <div className="mt-5 flex justify-end">
        {done ? (
          <button type="button" className="pill-teal" onClick={next} data-track="lesson-check-next">
            {i === checks.length - 1 ? "Finish" : "Next"}
          </button>
        ) : (
          <button type="button" className="pill-coral" disabled={code === null} onClick={check} data-track="lesson-check">
            Check
          </button>
        )}
      </div>
    </div>
  );
}

export function LessonQuest({
  lessonSlug,
  signedIn,
  hook,
  bites,
  checks,
  keyPoints,
  children,
}: {
  lessonSlug: string;
  signedIn: boolean;
  hook: { ask: string; reveal: string };
  bites: Bite[];
  checks: Question[];
  keyPoints: string[];
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const completed = useCompleted(useScope()).includes(lessonSlug);
  const [revealed, setRevealed] = useState(false);
  const [flipped, setFlipped] = useState<boolean[]>(() => bites.map(() => false));
  const [seen, setSeen] = useState<boolean[]>(() => bites.map(() => false));
  const [score, setScore] = useState<number | null>(null);

  const seenCount = seen.filter(Boolean).length;
  const learned = seenCount === bites.length;
  const checked = score !== null;
  const steps = [
    { label: "Predict", done: revealed },
    { label: "Learn", done: learned },
    { label: "Check", done: checked },
    { label: "Claim", done: completed },
  ];
  const active = steps.findIndex((s) => !s.done);

  return (
    <div>
      <ol className="quest-steps" aria-label="Lesson steps">
        {steps.map((s, n) => (
          <Step key={s.label} n={n + 1} label={s.label} done={s.done} active={n === active} />
        ))}
      </ol>

      <section className="glass mt-6 p-5 sm:p-6" aria-labelledby="predict-title">
        <p className="qz-kind"><AiIcon name="bulb" size={14} /> Before you watch</p>
        <h2 id="predict-title" className="mt-3 text-2xl leading-snug sm:text-3xl">{hook.ask}</h2>
        <AnimatePresence initial={false}>
          {revealed ? (
            <motion.p
              key="reveal"
              initial={reduce ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.4, ease }}
              className="mt-4 overflow-hidden rounded-2xl bg-mint/25 p-4 text-[0.98rem]"
            >
              {hook.reveal}
            </motion.p>
          ) : (
            <button type="button" className="pill-white mt-4" onClick={() => { play("lock"); haptic(10); setRevealed(true); }} data-track="lesson-predict">
              Think it over, then show me
            </button>
          )}
        </AnimatePresence>
      </section>

      <div className="mt-6">{children}</div>

      <section className="mt-8" aria-labelledby="bites-title">
        <div className="flex items-end justify-between gap-3">
          <h2 id="bites-title" className="text-3xl">The ideas, in bites</h2>
          <span className="text-sm font-semibold text-secondary" aria-live="polite">{seenCount} of {bites.length} flipped</span>
        </div>
        <div className="progress-track mt-2" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${(seenCount / bites.length) * 100}%` }} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {bites.map((b, n) => (
            <BiteCard
              key={b.title}
              bite={b}
              flipped={flipped[n] ?? false}
              onFlip={() => {
                play("tap");
                haptic(8);
                setFlipped((f) => f.map((v, k) => (k === n ? !v : v)));
                setSeen((s) => s.map((v, k) => (k === n ? true : v)));
              }}
            />
          ))}
        </div>
      </section>

      <section className="glass mt-8 p-5 sm:p-6" aria-labelledby="check-title">
        <p className="qz-kind"><AiIcon name="target" size={14} /> Quick check</p>
        <h2 id="check-title" className="mt-3 mb-4 text-3xl">See what stuck</h2>
        <QuickChecks checks={checks} onDone={(s) => setScore(s)} />
      </section>

      <section className={`glass mt-8 p-5 sm:p-6${checked && !completed ? " claim-ready" : ""}`} aria-labelledby="claim-title">
        <h2 id="claim-title" className="text-3xl">Claim it</h2>
        <details className="mt-3 group">
          <summary className="cursor-pointer text-sm font-semibold text-teal">The exact notes from the video</summary>
          <div className="mt-3 grid gap-1">
            {keyPoints.map((point) => (
              <div key={point} className="keypoint">
                <span className="keypoint-dot" />
                <span className="text-[0.98rem]">{point}</span>
              </div>
            ))}
          </div>
        </details>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-black/5 pt-5">
          <CompleteButton slug={lessonSlug} signedIn={signedIn} />
          <span className="text-sm text-secondary">
            {signedIn ? (checked ? "You did the checks. Claim your 5 points." : "Earns 5 points the first time. The checks above are optional but worth doing.") : "Sign in to earn points for it."}
          </span>
        </div>
      </section>
    </div>
  );
}

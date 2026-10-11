import { Fragment } from "react";
import { decode, type PublicQuestion } from "@/lib/question-types";
import { BUCKET_COLORS } from "@/components/questions/Inputs";

/** Shows the right answer for one question, and where the learner's own answer differed. */
export function AnswerReview({ q, mine, right }: { q: PublicQuestion; mine: number | null; right: number }) {
  const r = decode(q, right);
  const m = mine === null ? null : decode(q, mine);

  if (q.kind === "choice" && r.kind === "choice") {
    const wrongPick = m && m.kind === "choice" && m.index !== r.index ? (q.options[m.index] ?? null) : null;
    return (
      <div className="grid gap-1 text-sm">
        {wrongPick ? <p className="text-coral"><span className="text-muted">You picked: </span><s>{wrongPick}</s></p> : null}
        <p><span className="text-muted">Right answer: </span><strong>{q.options[r.index]}</strong></p>
      </div>
    );
  }

  if (q.kind === "spot" && r.kind === "spot") {
    const picked = m && m.kind === "spot" ? m.index : null;
    return (
      <div className="grid gap-1.5 text-sm">
        {q.lines.map((line, i) => (
          <p key={line} className={`review-line${i === r.index ? " right" : i === picked ? " wrong" : ""}`}>
            {line}
            {i === r.index ? <span className="review-tag">this one</span> : i === picked ? <span className="review-tag bad">your pick</span> : null}
          </p>
        ))}
      </div>
    );
  }

  if (q.kind === "sort" && r.kind === "sort") {
    const mine2 = m && m.kind === "sort" ? m.digits : null;
    return (
      <ul className="grid gap-1.5 text-sm">
        {q.cards.map((card, i) => {
          const ok = mine2 ? mine2[i] === r.digits[i] : false;
          return (
            <li key={card} className="flex flex-wrap items-center justify-between gap-2">
              <span>{card}</span>
              <span className="flex items-center gap-1.5">
                {!ok && mine2 ? <s className="text-xs text-muted">{q.buckets[mine2[i] as number]}</s> : null}
                <span className="sort-bucket" style={{ ["--c" as string]: BUCKET_COLORS[r.digits[i] as number] }}>
                  {q.buckets[r.digits[i] as number]}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  if (q.kind === "order" && r.kind === "order") {
    const mine2 = m && m.kind === "order" ? m.sequence : null;
    return (
      <ol className="grid gap-1.5 text-sm">
        {r.sequence.map((itemIdx, pos) => (
          <li key={itemIdx} className="flex items-start gap-2">
            <span className={`ord-num small${mine2 && mine2[pos] === itemIdx ? " ok" : ""}`}>{pos + 1}</span>
            <span>{q.items[itemIdx]}</span>
          </li>
        ))}
      </ol>
    );
  }

  if (q.kind === "fill" && r.kind === "fill") {
    const mine2 = m && m.kind === "fill" ? m.digits : null;
    return (
      <p className="text-sm leading-8">
        {q.parts.map((part, i) => (
          <Fragment key={i}>
            {part}
            {i < q.blanks.length ? (
              <span className={`fill-answer${mine2 && mine2[i] === r.digits[i] ? " ok" : ""}`}>
                {(q.blanks[i] as string[])[r.digits[i] as number]}
              </span>
            ) : null}
          </Fragment>
        ))}
      </p>
    );
  }

  return null;
}

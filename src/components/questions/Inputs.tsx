"use client";

import { Reorder } from "framer-motion";
import { Fragment } from "react";
import { haptic, play } from "@/lib/fx";
import type { PublicQuestion } from "@/lib/question-types";
import type { QState } from "@/components/questions/state";

const KEYS = ["A", "B", "C", "D"];
export const BUCKET_COLORS = ["#1f6f8b", "#e0566b", "#c58a00", "#2e9e6b"];

type Props = {
  q: PublicQuestion;
  state: QState;
  onChange: (next: QState) => void;
  disabled?: boolean;
  /** Unique per question so radio groups do not share a name. */
  name: string;
};

/** The right input for the question's format. Fully controlled: the parent keeps the state. */
export function QuestionInput({ q, state, onChange, disabled = false, name }: Props) {
  const touch = () => {
    haptic(10);
    play("tap");
  };

  if (q.kind === "choice" && state.kind === "choice") {
    return (
      <fieldset className="grid gap-3" disabled={disabled}>
        <legend className="sr-only">Choose one answer</legend>
        {q.options.map((option, i) => (
          <label key={option} className={`opt${state.value === i ? " picked" : ""}`}>
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={state.value === i}
              onChange={() => {
                touch();
                onChange({ kind: "choice", value: i });
              }}
            />
            <span className="opt-key" aria-hidden="true">{KEYS[i]}</span>
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
    );
  }

  if (q.kind === "spot" && state.kind === "spot") {
    return (
      <div className="spot-bubble">
        <div className="spot-head">
          <span className="spot-avatar" aria-hidden="true">{q.speaker.slice(0, 2)}</span>
          <span>{q.speaker}</span>
        </div>
        <div role="radiogroup" aria-label="Tap the line" className="grid gap-1.5">
          {q.lines.map((line, i) => (
            <button
              key={line}
              type="button"
              role="radio"
              aria-checked={state.value === i}
              disabled={disabled}
              className={`spot-line${state.value === i ? " picked" : ""}`}
              onClick={() => {
                touch();
                onChange({ kind: "spot", value: state.value === i ? null : i });
              }}
            >
              <span>{line}</span>
              {state.value === i ? <span className="spot-flag">flagged</span> : null}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (q.kind === "sort" && state.kind === "sort") {
    const placed = state.value.filter((v) => v !== null).length;
    return (
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          {q.buckets.map((b, j) => (
            <span key={b} className="sort-bucket" style={{ ["--c" as string]: BUCKET_COLORS[j] }}>
              {b}
            </span>
          ))}
          <span className="ml-auto text-muted" aria-live="polite">
            {placed} of {q.cards.length} sorted
          </span>
        </div>
        {q.cards.map((card, i) => {
          const chosen = state.value[i] ?? null;
          return (
            <div
              key={card}
              className={`sort-card${chosen !== null ? " set" : ""}`}
              style={{ ["--c" as string]: chosen !== null ? BUCKET_COLORS[chosen] : "rgba(29,29,31,0.15)" }}
            >
              <p className="text-[0.98rem]">{card}</p>
              <div role="radiogroup" aria-label={`Bucket for: ${card}`} className="sort-seg">
                {q.buckets.map((b, j) => (
                  <button
                    key={b}
                    type="button"
                    role="radio"
                    aria-checked={chosen === j}
                    disabled={disabled}
                    className={chosen === j ? "on" : ""}
                    style={{ ["--c" as string]: BUCKET_COLORS[j] }}
                    onClick={() => {
                      touch();
                      const next = [...state.value];
                      next[i] = j;
                      onChange({ kind: "sort", value: next });
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (q.kind === "order" && state.kind === "order") {
    const move = (pos: number, by: -1 | 1) => {
      const next = [...state.value];
      const target = pos + by;
      if (target < 0 || target >= next.length) return;
      [next[pos], next[target]] = [next[target] as number, next[pos] as number];
      touch();
      onChange({ kind: "order", value: next, touched: true });
    };
    return (
      <div>
        <Reorder.Group
          as="ol"
          axis="y"
          values={state.value}
          onReorder={(v) => {
            if (!disabled) onChange({ kind: "order", value: v, touched: true });
          }}
          className="grid gap-2"
          aria-label="Steps. Drag to reorder, or use the arrow buttons."
        >
          {state.value.map((itemIdx, pos) => {
            const text = q.items[itemIdx] as string;
            return (
              <Reorder.Item
                as="li"
                key={itemIdx}
                value={itemIdx}
                drag={disabled ? false : "y"}
                whileDrag={{ scale: 1.02, boxShadow: "0 14px 30px rgba(31,111,139,0.22)" }}
                className="ord-item"
              >
                <span className="ord-num" aria-hidden="true">{pos + 1}</span>
                <span className="ord-grip" aria-hidden="true">⠿</span>
                <span className="flex-1 select-none text-[0.98rem]">{text}</span>
                <span className="ord-btns">
                  <button type="button" aria-label={`Move up: ${text}`} disabled={disabled || pos === 0} onClick={() => move(pos, -1)}>↑</button>
                  <button type="button" aria-label={`Move down: ${text}`} disabled={disabled || pos === state.value.length - 1} onClick={() => move(pos, 1)}>↓</button>
                </span>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
        {!state.touched ? <p className="mt-2 text-xs text-muted">Move at least one step to lock this in.</p> : null}
      </div>
    );
  }

  if (q.kind === "fill" && state.kind === "fill") {
    return (
      <p className="fill-sentence">
        {q.parts.map((part, i) => (
          <Fragment key={i}>
            {part}
            {i < q.blanks.length ? (
              <select
                aria-label={`Gap ${i + 1} of ${q.blanks.length}`}
                disabled={disabled}
                className={`fill-gap${state.value[i] !== null && state.value[i] !== undefined ? " set" : ""}`}
                value={state.value[i] ?? ""}
                onChange={(e) => {
                  touch();
                  const next = [...state.value];
                  next[i] = Number(e.target.value);
                  onChange({ kind: "fill", value: next });
                }}
              >
                <option value="" disabled>
                  choose…
                </option>
                {(q.blanks[i] as string[]).map((o, j) => (
                  <option key={o} value={j}>
                    {o}
                  </option>
                ))}
              </select>
            ) : null}
          </Fragment>
        ))}
      </p>
    );
  }

  return null;
}

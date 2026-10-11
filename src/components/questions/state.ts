import { pack, unpack } from "@/lib/question-codes";
import { radixOf, type Decoded, type PublicQuestion } from "@/lib/question-types";

/** What a learner has done so far on one question, per format. null / null entries mean "not yet". */
export type QState =
  | { kind: "choice"; value: number | null }
  | { kind: "spot"; value: number | null }
  | { kind: "sort"; value: (number | null)[] }
  | { kind: "fill"; value: (number | null)[] }
  | { kind: "order"; value: number[]; touched: boolean };

export function initialState(q: PublicQuestion): QState {
  switch (q.kind) {
    case "choice":
      return { kind: "choice", value: null };
    case "spot":
      return { kind: "spot", value: null };
    case "sort":
      return { kind: "sort", value: q.cards.map(() => null) };
    case "fill":
      return { kind: "fill", value: q.blanks.map(() => null) };
    case "order":
      return { kind: "order", value: q.items.map((_, i) => i), touched: false };
  }
}

/** The single number to send, or null while the question is still incomplete. */
export function codeOf(q: PublicQuestion, s: QState): number | null {
  switch (s.kind) {
    case "choice":
    case "spot":
      return s.value;
    case "order":
      return s.touched ? pack(s.value, q.kind === "order" ? q.items.length : 0) : null;
    case "sort":
    case "fill":
      return s.value.some((v) => v === null) ? null : pack(s.value as number[], radixOf(q));
  }
}

/** A rebuilt state, used by quick checks that reveal the answer. */
export function stateFromDecoded(d: Decoded): QState {
  switch (d.kind) {
    case "choice": return { kind: "choice", value: d.index };
    case "spot": return { kind: "spot", value: d.index };
    case "order": return { kind: "order", value: d.sequence, touched: true };
    case "sort": return { kind: "sort", value: d.digits };
    case "fill": return { kind: "fill", value: d.digits };
  }
}

export { unpack };

export const KIND_LABEL: Record<PublicQuestion["kind"], { label: string; hint: string }> = {
  choice: { label: "Pick one", hint: "Choose the best answer." },
  spot: { label: "Spot it", hint: "Tap the line." },
  sort: { label: "Sort it", hint: "Put every card in a bucket." },
  order: { label: "Put in order", hint: "Drag the steps, or use the arrows." },
  fill: { label: "Fill the gaps", hint: "Choose a word for each gap." },
};

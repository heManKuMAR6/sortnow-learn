// The five question formats. Authors write the meaning (which card goes in which bucket, what the
// right order is); the constructors turn that into the single number the database stores.
// The browser gets PublicQuestion: the same thing with every answer removed.
import { MAX_CODE, pack, unpack } from "@/lib/question-codes";

type Common = { q: string; why: string; answer: number };

export type ChoiceQuestion = Common & { kind: "choice"; options: string[] };
/** Tap the one line in a chat bubble or a plan that is wrong, risky or useless. */
export type SpotQuestion = Common & { kind: "spot"; lines: string[]; speaker: string };
/** Put every card into one bucket. */
export type SortQuestion = Common & { kind: "sort"; buckets: string[]; cards: string[]; sorted: number[] };
/** Arrange steps. `items` is the fixed starting (shuffled) order; `sequence` lists item indexes in the right order. */
export type OrderQuestion = Common & { kind: "order"; items: string[]; sequence: number[] };
/** A sentence with gaps. parts has one more entry than blanks; each blank offers options. */
export type FillQuestion = Common & { kind: "fill"; parts: string[]; blanks: string[][]; filled: number[] };

export type Question = ChoiceQuestion | SpotQuestion | SortQuestion | OrderQuestion | FillQuestion;

export type PublicQuestion =
  | { kind: "choice"; q: string; options: string[] }
  | { kind: "spot"; q: string; lines: string[]; speaker: string }
  | { kind: "sort"; q: string; buckets: string[]; cards: string[] }
  | { kind: "order"; q: string; items: string[] }
  | { kind: "fill"; q: string; parts: string[]; blanks: string[][] };

const SALT = "s9";

/** A small deterministic generator, so the same question always shuffles the same way. */
function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
}

/**
 * Options are shuffled by a fixed recipe (seeded by the question text) so the right answer is not
 * always B or C. The author writes the options in any order and says which is right; the number
 * stored for grading is the shuffled position. Editing the question text reshuffles it, which is
 * why `npm run gen:catalog` must be run after any content change.
 */
export const choice = (q: string, options: string[], answer: number, why: string): ChoiceQuestion => {
  const rand = seeded(`${SALT}|${q}`);
  const perm = options.map((_, i) => i);
  for (let i = perm.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [perm[i], perm[j]] = [perm[j] as number, perm[i] as number];
  }
  return { kind: "choice", q, options: perm.map((i) => options[i] as string), answer: perm.indexOf(answer), why };
};

export const spot = (q: string, lines: string[], answer: number, why: string, speaker = "AI"): SpotQuestion => ({
  kind: "spot", q, lines, speaker, answer, why,
});

export const sort = (q: string, buckets: string[], cards: string[], sorted: number[], why: string): SortQuestion => ({
  kind: "sort", q, buckets, cards, sorted, answer: pack(sorted, buckets.length), why,
});

export const order = (q: string, items: string[], sequence: number[], why: string): OrderQuestion => ({
  kind: "order", q, items, sequence, answer: pack(sequence, items.length), why,
});

export const fill = (q: string, parts: string[], blanks: string[][], filled: number[], why: string): FillQuestion => ({
  kind: "fill", q, parts, blanks, filled, answer: pack(filled, Math.max(...blanks.map((b) => b.length))), why,
});

/** Base used to pack this question's digits. 0 for formats that send a plain index. */
export function radixOf(q: PublicQuestion): number {
  switch (q.kind) {
    case "sort": return q.buckets.length;
    case "order": return q.items.length;
    case "fill": return Math.max(...q.blanks.map((b) => b.length));
    default: return 0;
  }
}

export function publicQuestion(q: Question): PublicQuestion {
  switch (q.kind) {
    case "choice": return { kind: "choice", q: q.q, options: q.options };
    case "spot": return { kind: "spot", q: q.q, lines: q.lines, speaker: q.speaker };
    case "sort": return { kind: "sort", q: q.q, buckets: q.buckets, cards: q.cards };
    case "order": return { kind: "order", q: q.q, items: q.items };
    case "fill": return { kind: "fill", q: q.q, parts: q.parts, blanks: q.blanks };
  }
}

export type Decoded =
  | { kind: "choice"; index: number }
  | { kind: "spot"; index: number }
  | { kind: "sort"; digits: number[] }
  | { kind: "fill"; digits: number[] }
  | { kind: "order"; sequence: number[] };

/** Turns a stored or submitted number back into something a screen can draw. */
export function decode(q: PublicQuestion, code: number): Decoded {
  switch (q.kind) {
    case "choice": return { kind: "choice", index: code };
    case "spot": return { kind: "spot", index: code };
    case "sort": return { kind: "sort", digits: unpack(code, q.buckets.length, q.cards.length) };
    case "order": return { kind: "order", sequence: unpack(code, q.items.length, q.items.length) };
    case "fill": return { kind: "fill", digits: unpack(code, radixOf(q), q.blanks.length) };
  }
}

/** Why a question is malformed, or null. Used by the content test so a typo cannot ship. */
export function problemWith(q: Question): string | null {
  if (!q.q.trim() || !q.why.trim()) return "missing text";
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= MAX_CODE) return "answer out of range";
  switch (q.kind) {
    case "choice":
      if (q.options.length !== 4) return "choice needs 4 options";
      return q.answer < q.options.length ? null : "answer is not an option";
    case "spot":
      if (q.lines.length < 3 || q.lines.length > 6) return "spot needs 3 to 6 lines";
      return q.answer < q.lines.length ? null : "answer is not a line";
    case "sort":
      if (q.buckets.length < 2 || q.buckets.length > 4) return "sort needs 2 to 4 buckets";
      if (q.cards.length < 3 || q.cards.length > 5) return "sort needs 3 to 5 cards";
      if (q.sorted.length !== q.cards.length || q.sorted.some((b) => !Number.isInteger(b) || b < 0 || b >= q.buckets.length)) return "bad sorted";
      return new Set(q.sorted).size > 1 ? null : "every card in one bucket makes a pointless question";
    case "order": {
      const n = q.items.length;
      if (n < 3 || n > 5) return "order needs 3 to 5 steps";
      if (q.sequence.length !== n || new Set(q.sequence).size !== n || q.sequence.some((i) => i < 0 || i >= n)) return "sequence must use every step once";
      return q.sequence.every((v, i) => v === i) ? "the shown order must not already be correct" : null;
    }
    case "fill":
      if (q.parts.length !== q.blanks.length + 1) return "parts must be blanks + 1";
      if (q.blanks.length < 1 || q.blanks.length > 4) return "fill needs 1 to 4 gaps";
      if (q.blanks.some((b) => b.length < 2 || b.length > 4)) return "each gap needs 2 to 4 options";
      if (q.filled.length !== q.blanks.length || q.filled.some((v, i) => v < 0 || v >= (q.blanks[i] as string[]).length)) return "bad filled";
      return null;
  }
}

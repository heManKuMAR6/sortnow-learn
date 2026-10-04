import type { Lesson } from "@/lib/content";

const STOP = new Set([
  "a", "an", "the", "this", "that", "what", "when", "how", "why", "who",
  "is", "are", "was", "were", "be", "to", "of", "and", "or", "in", "on",
  "for", "from", "with", "it", "me", "my", "we", "you", "do", "does",
  "about", "should", "take", "lesson", "video", "please", "just",
]);

export type AnswerIntent = "explain" | "quiz" | "manager" | "beginner" | "lookup";

export function detectIntent(question: string): AnswerIntent {
  const q = question.toLowerCase();
  if (/\b(quiz|test me|question me|check me)\b/.test(q)) return "quiz";
  if (/\b(manager|stakeholder|executive|leader|leadership)\b/.test(q)) return "manager";
  if (/\b(beginner|i'm new|im new|new to|eli5)\b/.test(q)) return "beginner";
  if (/\b(explain|simply|simple|summar|in plain|overview|what is)\b/.test(q)) return "explain";
  return "lookup";
}

function bullets(points: string[]): string {
  return points.map((point) => `• ${point}`).join("\n");
}

function formatExplain(lesson: Lesson): string {
  return [
    `${lesson.title}, from this lesson’s notes:`,
    "",
    bullets(lesson.keyPoints),
    "",
    "That is the whole set of notes for this lesson.",
  ].join("\n");
}

function formatQuiz(lesson: Lesson): string {
  const items = lesson.quiz
    .map((item, index) => {
      const answer = lesson.keyPoints[item.point];
      if (!answer) return null;
      return `${index + 1}. ${item.ask}\nAnswer: ${answer}`;
    })
    .filter((item): item is string => Boolean(item));
  if (items.length === 0) return formatExplain(lesson);
  return [
    "Answer from this lesson, then check. The answers are the notes, not an outside source.",
    "",
    items.join("\n\n"),
  ].join("\n");
}

function formatManager(lesson: Lesson): string {
  if (lesson.track === "manager") {
    return [
      "What a manager can take from this lesson:",
      "",
      bullets(lesson.keyPoints),
      "",
      "If a question needs a number, a vendor, or a date that is not in those lines, this lesson does not cover it.",
    ].join("\n");
  }
  return [
    "This lesson does not brief a manager on budget, vendors, or rollout.",
    "",
    "What it does establish:",
    "",
    bullets(lesson.keyPoints),
    "",
    "Use that when someone describes the mechanism with words these notes do not support. Do not treat it as a buying guide.",
  ].join("\n");
}

function words(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOP.has(word));
}

function matchPoints(lesson: Lesson, question: string): string[] {
  const wanted = new Set(words(question));
  if (wanted.size === 0) return [];
  return lesson.keyPoints.filter((point) => {
    const have = words(point);
    const hits = have.filter((word) => wanted.has(word));
    return hits.length >= 2 || (wanted.size === 1 && hits.length === 1);
  });
}

export function answerFromLesson(lesson: Lesson, question: string): string {
  const intent = detectIntent(question);
  if (intent === "quiz") return formatQuiz(lesson);
  if (intent === "manager") return formatManager(lesson);
  if (intent === "explain" || intent === "beginner") return formatExplain(lesson);
  const matched = matchPoints(lesson, question);
  if (matched.length === 0) {
    return [
      "This lesson does not cover that.",
      "",
      "It does cover:",
      bullets(lesson.keyPoints),
    ].join("\n");
  }
  return [
    "From this lesson:",
    "",
    bullets(matched),
    "",
    "The other notes do not add anything further on that question.",
  ].join("\n");
}

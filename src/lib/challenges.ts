export type ChallengeTrack = "beginner" | "manager";

export type Challenge = {
  id: string;
  track: ChallengeTrack;
  day: number;
  title: string;
  prompt: string;
};

export type ChallengeCompletion = {
  challengeId: string;
  track: ChallengeTrack;
  response: string;
  completedOn: string;
};

export type DayStatus = "done" | "open" | "locked" | "wait";

export const dailyTracks: {
  id: ChallengeTrack;
  title: string;
  description: string;
  chip: "mint" | "coral";
}[] = [
  {
    id: "beginner",
    title: "Starting now",
    description:
      "For people who are new to this. A few sentences, no code. The days follow the beginner lessons.",
    chip: "mint",
  },
  {
    id: "manager",
    title: "Managers",
    description:
      "For managers who are not technical. Questions you can ask in a meeting, without writing code.",
    chip: "coral",
  },
];

export const challenges: Challenge[] = [
  {
    id: "starting-what-it-is-doing",
    track: "beginner",
    day: 1,
    title: "What it is doing",
    prompt:
      "In a sentence or two, say what a neural network is doing when it looks at a handwritten digit. Skip the math. Name the job.",
  },
  {
    id: "starting-a-weight",
    track: "beginner",
    day: 2,
    title: "A weight, in plain words",
    prompt:
      "Explain what a weight is to someone who has not watched the lesson. One or two sentences, the kind you would actually say out loud.",
  },
  {
    id: "starting-guess-then-adjust",
    track: "beginner",
    day: 3,
    title: "Guess, then adjust",
    prompt:
      "What is the difference between the network guessing and the network learning? Use the handwritten digit as the example.",
  },
  {
    id: "starting-a-claim-you-heard",
    track: "beginner",
    day: 4,
    title: "A claim you heard",
    prompt:
      "Think of one claim you heard about this recently. Is it about how a network is built, or about a product someone is selling? Say which, and why.",
  },
  {
    id: "manager-before-you-say-agent",
    track: "manager",
    day: 1,
    title: "Before you say agent",
    prompt:
      "A vendor calls the product an agent. Write the question you would ask, and what you would need to see before you believed them.",
  },
  {
    id: "manager-it-does-not-remember",
    track: "manager",
    day: 2,
    title: "It does not remember the meeting",
    prompt:
      "A teammate says the model remembers last week’s meeting. Write what would have to be true for that to be right.",
  },
  {
    id: "manager-did-the-change-help",
    track: "manager",
    day: 3,
    title: "Did the change help?",
    prompt:
      "Someone wants to switch models because a public score moved. Name one task from your own work you would check, and what “better” would look like.",
  },
  {
    id: "manager-before-you-pay",
    track: "manager",
    day: 4,
    title: "Before you pay",
    prompt:
      "Before another model bill, write what you know about how long a request takes, what a real day of use costs, and how often a person has to fix the output. If you do not know one, say which.",
  },
];

const PRACTICE_ZONE = "America/Chicago";

export function practiceToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PRACTICE_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function shiftDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getChallenge(id: string): Challenge | undefined {
  return challenges.find((challenge) => challenge.id === id);
}

export function challengesFor(track: ChallengeTrack): Challenge[] {
  return challenges.filter((challenge) => challenge.track === track).sort((a, b) => a.day - b.day);
}

export function knownCompletions(completions: ChallengeCompletion[]): ChallengeCompletion[] {
  const ids = new Set(challenges.map((challenge) => challenge.id));
  return completions.filter(
    (row) => ids.has(row.challengeId) && (row.track === "beginner" || row.track === "manager"),
  );
}

export function dayStatus(
  challenge: Challenge,
  completions: ChallengeCompletion[],
  today = practiceToday(),
): DayStatus {
  const real = knownCompletions(completions);
  if (real.some((row) => row.challengeId === challenge.id)) return "done";
  const previousOpen = challengesFor(challenge.track).some(
    (row) => row.day < challenge.day && !real.some((done) => done.challengeId === row.id),
  );
  if (previousOpen) return "locked";
  const savedToday = real.some((row) => row.track === challenge.track && row.completedOn === today);
  if (savedToday) return "wait";
  return "open";
}

export function practiceStats(completions: ChallengeCompletion[], today = practiceToday()) {
  const real = knownCompletions(completions);
  const days = new Set(real.map((row) => row.completedOn));
  let cursor = days.has(today) ? today : shiftDate(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return {
    streak,
    dailyCount: real.filter((row) => row.completedOn === today).length,
    daysPracticed: days.size,
    practicedToday: days.has(today),
  };
}

export function bestStreak(completions: ChallengeCompletion[]): number {
  const days = [...new Set(knownCompletions(completions).map((row) => row.completedOn))].sort();
  let best = 0;
  let run = 0;
  let previous = "";
  for (const day of days) {
    run = previous && shiftDate(previous, 1) === day ? run + 1 : 1;
    if (run > best) best = run;
    previous = day;
  }
  return best;
}

export type Achievement = {
  id: string;
  title: string;
  detail: string;
  unlocked: boolean;
};

export function achievementsFor(completions: ChallengeCompletion[]): Achievement[] {
  const real = knownCompletions(completions);
  const beginnerDone = new Set(real.filter((row) => row.track === "beginner").map((row) => row.challengeId));
  const managerDone = new Set(real.filter((row) => row.track === "manager").map((row) => row.challengeId));
  const beginnerTotal = challengesFor("beginner").length;
  const managerTotal = challengesFor("manager").length;
  const longest = bestStreak(real);

  return [
    {
      id: "first-day",
      title: "First day",
      detail: "Finish one daily challenge.",
      unlocked: real.length >= 1,
    },
    {
      id: "both-tracks",
      title: "Both tracks",
      detail: "Finish a day on Starting now and a day on Managers.",
      unlocked: beginnerDone.size >= 1 && managerDone.size >= 1,
    },
    {
      id: "three-days",
      title: "Three days running",
      detail: "Practice on three days in a row.",
      unlocked: longest >= 3,
    },
    {
      id: "whole-track",
      title: "A whole track",
      detail: "Finish every day on one track.",
      unlocked: beginnerDone.size >= beginnerTotal || managerDone.size >= managerTotal,
    },
  ];
}

export function parsePracticeResponse(
  input: unknown,
): { ok: true; response: string } | { ok: false; error: string } {
  if (typeof input !== "string") {
    return { ok: false, error: "Write a sentence or two before saving." };
  }
  const response = input.trim();
  if (response.length < 20) {
    return { ok: false, error: "Write a sentence or two before saving." };
  }
  if (response.length > 800) {
    return { ok: false, error: "Keep it under 800 characters." };
  }
  return { ok: true, response };
}

export function parseDisplayName(
  input: unknown,
): { ok: true; name: string | null } | { ok: false; error: string } {
  if (typeof input !== "string") {
    return { ok: false, error: "Enter a name, or leave it blank." };
  }
  const name = input.trim().replace(/\s+/g, " ");
  if (!name) return { ok: true, name: null };
  if (name.length > 60) return { ok: false, error: "Use 60 characters or fewer." };
  if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(name)) {
    return { ok: false, error: "Use letters, spaces, apostrophes, or hyphens." };
  }
  return { ok: true, name };
}

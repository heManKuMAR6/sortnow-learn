// The weekly email. Sending is not built yet, so this is also the archive page
// at /newsletter. Add an issue by putting a new object first; keep the old ones.
export type Issue = {
  number: number;
  date: string;
  title: string;
  intro: string;
  idea: { title: string; body: string[] };
  tryThis: { title: string; steps: string[] };
  picks: { label: string; href: string; note: string }[];
};

export const issues: Issue[] = [
  {
    number: 1,
    date: "2026-10-05",
    title: "A model is a guess that got practice",
    intro: "One idea, one thing to try, and two places to go next. Five minutes, tops.",
    idea: {
      title: "It guesses, then it adjusts",
      body: [
        "A neural network is a pile of numbers with a job: look at an example, make a guess, and learn how far off it was. Next time it nudges its numbers a little. That is the whole trick.",
        "It is not a lookup and it is not a person. It learned patterns from old examples and produces something new that looks like them. So ask what it was shown, what a wrong answer costs, and who checks the output.",
      ],
    },
    tryThis: {
      title: "Catch one confident mistake",
      steps: [
        "Pick a fact you already know well, such as a date or a number from your own work.",
        "Ask any AI chat tool about it, and ask it to cite where that comes from.",
        "Open the source. Does it exist, and does it say that? Note what you find.",
      ],
    },
    picks: [
      { label: "Challenge: Spot the made-up answer", href: "/challenges/spot-the-made-up-answer", note: "3 minutes, 15 points" },
      { label: "Lesson: What a neural network is", href: "/learn/beginner/what-a-neural-network-is", note: "Short video and key points" },
    ],
  },
];

export function latestIssue(): Issue | undefined {
  return [...issues].sort((a, b) => b.number - a.number)[0];
}

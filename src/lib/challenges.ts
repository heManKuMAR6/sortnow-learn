// Challenges are short AI-literacy puzzles: no code, no data-structure drills.
// Add one by appending an object. Answers stay on the server: the browser gets
// publicChallenge(), and /api/challenges/[slug] does the grading and the points.

export type IconName = "spark" | "prompt" | "shield" | "compass" | "puzzle" | "eye" | "bulb" | "flame" | "trophy" | "target";

export type Question = { q: string; options: string[]; answer: number; why: string };

export type Challenge = {
  slug: string;
  title: string;
  blurb: string;
  level: "Everyone" | "Beginner" | "Manager";
  points: number;
  minutes: number;
  icon: IconName;
  questions: Question[];
};

export const PASS_RATIO = 0.6;

export const challenges: Challenge[] = [
  {
    slug: "spot-the-made-up-answer",
    title: "Spot the made-up answer",
    blurb: "Models can sound sure and be wrong. Learn the tells, and the habit that protects you.",
    level: "Everyone",
    points: 15,
    minutes: 3,
    icon: "eye",
    questions: [
      {
        q: "A chatbot backs a claim with “Smith & Lee (2021), Journal of Applied Cognition, vol. 12.” You cannot find that paper anywhere. What is the most likely explanation?",
        options: [
          "The paper is behind a paywall.",
          "The model may have invented a plausible-looking citation.",
          "Search engines are not indexing it yet.",
          "The paper is too new to find.",
        ],
        answer: 1,
        why: "A model predicts likely text. A citation can look perfect and not exist. Always open the source.",
      },
      {
        q: "Which request is least likely to produce a made-up fact?",
        options: [
          "“Quote the exact ruling from a court case.”",
          "“Summarise the article I pasted below.”",
          "“What was the precise closing price of a stock last Tuesday?”",
          "“Give me a statistic with two decimals about my industry.”",
        ],
        answer: 1,
        why: "When the text is in the request, the model works from it instead of from memory. You should still skim the result.",
      },
      {
        q: "A model answers confidently and fluently. What does that tell you about whether it is correct?",
        options: [
          "Fluent answers are usually correct.",
          "Long answers are more reliable than short ones.",
          "Nothing dependable. Fluency and truth are different things.",
          "It means it was trained on that topic.",
        ],
        answer: 2,
        why: "Smooth writing is what the model is good at. It is not evidence the content is right.",
      },
      {
        q: "An answer will feed a real decision. What is the best habit?",
        options: [
          "Ask the model “are you sure?” and accept a yes.",
          "Regenerate until two answers agree.",
          "Check the key claims against a primary source.",
          "Trust it if it gives a long explanation.",
        ],
        answer: 2,
        why: "Asking the same model to confirm itself is not a check. Go to the original source for the claims that matter.",
      },
    ],
  },
  {
    slug: "write-a-better-prompt",
    title: "Write a better prompt",
    blurb: "Four small moves that turn a vague ask into a useful answer.",
    level: "Beginner",
    points: 20,
    minutes: 4,
    icon: "prompt",
    questions: [
      {
        q: "Which prompt will most likely get a useful result?",
        options: [
          "“Write about marketing.”",
          "“Write a 120-word LinkedIn post for a small bakery announcing a new sourdough. Friendly tone. End with a question.”",
          "“Marketing post please, make it good.”",
          "“You are the best marketer in the world. Write the best post.”",
        ],
        answer: 1,
        why: "It names the audience, length, format and tone. Praise for the model adds nothing.",
      },
      {
        q: "“Summarise this report.” What is the most useful thing missing?",
        options: [
          "The word “please”.",
          "Who the summary is for, and how long it should be.",
          "A higher creativity setting.",
          "Nothing, it is complete.",
        ],
        answer: 1,
        why: "A summary for a CEO and a summary for an engineer are different things. Say which, and how long.",
      },
      {
        q: "The answer comes back too long and too formal. What is the best next step?",
        options: [
          "Start a new chat and paste the same prompt.",
          "Reply: “Shorter. Five bullets, casual tone.”",
          "Retype the prompt in capital letters.",
          "Give up on the tool.",
        ],
        answer: 1,
        why: "Follow-ups are cheap. Specific feedback steers the next version.",
      },
      {
        q: "Why paste an example of the output you want?",
        options: [
          "It makes the answer longer.",
          "Models copy patterns, so an example shows format and tone faster than describing them.",
          "It is required by most tools.",
          "It makes the model forget earlier instructions.",
        ],
        answer: 1,
        why: "Showing beats telling. One good example usually saves three rounds of corrections.",
      },
    ],
  },
  {
    slug: "pick-the-right-tool",
    title: "Pick the right tool",
    blurb: "A language model is not always the answer. Decide where it fits and where it does not.",
    level: "Manager",
    points: 20,
    minutes: 4,
    icon: "compass",
    questions: [
      {
        q: "You need the exact total of 4,382 invoices. What should you use?",
        options: [
          "Ask a chat model to add them up.",
          "A spreadsheet formula or a small script.",
          "Ask the model twice and compare.",
          "A longer prompt with more detail.",
        ],
        answer: 1,
        why: "Exact arithmetic belongs to tools built for it. A model can slip on long sums and still sound sure.",
      },
      {
        q: "Customers ask about your refund policy, and the policy document changes monthly. Which design holds up?",
        options: [
          "Rely on what the model already knows.",
          "Retrain the model each month.",
          "Supply the current policy text with each request.",
          "Let it guess and apologise when wrong.",
        ],
        answer: 2,
        why: "Put the current source in the request. It is cheaper than retraining and it stays current.",
      },
      {
        q: "A model drafts replies to support emails and a person reviews each one before it is sent. How good a fit is that?",
        options: [
          "A good fit: a draft saves time and a person catches errors.",
          "A bad fit: models should never write text.",
          "Only acceptable if no one reviews it.",
          "It only works for English.",
        ],
        answer: 0,
        why: "Drafting with a human check keeps the cost of a wrong answer low.",
      },
      {
        q: "Before you pay for an AI product, which question matters most?",
        options: [
          "How many parameters does it have?",
          "What does a wrong answer cost, and who checks it?",
          "Which benchmark is it highest on?",
          "Does the demo look impressive?",
        ],
        answer: 1,
        why: "Your risk and your review process decide whether it works for you. Specs and demos do not.",
      },
    ],
  },
  {
    slug: "whats-in-the-context",
    title: "What is in the context?",
    blurb: "The model only sees what is sent with the request. Learn what that means for your results.",
    level: "Everyone",
    points: 15,
    minutes: 3,
    icon: "puzzle",
    questions: [
      {
        q: "You told a chatbot your name yesterday in a different chat. In a brand-new chat today, does it know it?",
        options: [
          "Yes, models remember everyone.",
          "Only if that text is in this request or in a memory feature you turned on.",
          "Yes, but only on weekdays.",
          "Only if you say please.",
        ],
        answer: 1,
        why: "A model does not carry yesterday’s chat with it. What it sees is what is sent now.",
      },
      {
        q: "What is a “context window”?",
        options: [
          "The screen where you type.",
          "The amount of text (and sometimes images) sent with one request.",
          "The time the model takes to answer.",
          "A privacy setting.",
        ],
        answer: 1,
        why: "It is the working space for one request: your instructions plus anything you include.",
      },
      {
        q: "Is a bigger context window always better?",
        options: [
          "Yes. More text always helps.",
          "No. Extra text costs money, adds delay, and can bury the instruction you care about.",
          "Yes, if the text is in capital letters.",
          "No, models ignore anything past one page.",
        ],
        answer: 1,
        why: "Include what the task needs, not everything you have.",
      },
      {
        q: "Where should the task and constraints go in a long request?",
        options: [
          "Buried in the middle.",
          "Up front, followed by the source material.",
          "Only at the very end, in one word.",
          "In a separate email.",
        ],
        answer: 1,
        why: "State the task and the rules first, then paste the material the model must use.",
      },
    ],
  },
  {
    slug: "is-it-safe-to-paste",
    title: "Is it safe to paste?",
    blurb: "A quick privacy check you can run in five seconds before you hit enter.",
    level: "Everyone",
    points: 20,
    minutes: 3,
    icon: "shield",
    questions: [
      {
        q: "Which is the safest thing to paste into a public AI chat tool?",
        options: [
          "A customer list with emails.",
          "Your company’s unreleased financials.",
          "A paragraph from a public blog you want rewritten.",
          "A file of passwords “just to organise them”.",
        ],
        answer: 2,
        why: "Public text carries no confidentiality risk. The others are private data you should not hand over.",
      },
      {
        q: "Your company has an approved AI tool with a data agreement, and there is also a free consumer app. Which should client contract details go into?",
        options: [
          "The free app. It is faster.",
          "Whichever has the nicest design.",
          "The approved tool, after checking the policy.",
          "Neither matters.",
        ],
        answer: 2,
        why: "The agreement is what controls how your data is stored and used. Use the tool your organisation has vetted.",
      },
      {
        q: "You want a summary of a document that contains personal data. What is a good first step?",
        options: [
          "Paste it as is.",
          "Remove or replace names and IDs first, or use an approved tool.",
          "Add “do not remember this” to the prompt.",
          "Split it in half.",
        ],
        answer: 1,
        why: "The simplest protection is not sending the personal data at all.",
      },
      {
        q: "“I deleted the chat, so it is gone.” Is that a safe assumption?",
        options: [
          "Yes, deleting always erases everything immediately.",
          "Not necessarily. Retention depends on the provider’s policy and your settings.",
          "Yes, if you clear your browser cache.",
          "Only on mobile.",
        ],
        answer: 1,
        why: "Check the retention and training settings of the tool you use. Do not assume.",
      },
    ],
  },
  {
    slug: "agent-or-not",
    title: "Agent or not?",
    blurb: "The word “agent” covers very different things. Learn to ask the question that separates them.",
    level: "Manager",
    points: 25,
    minutes: 5,
    icon: "spark",
    questions: [
      {
        q: "A vendor says their product is “an agent.” Which question best separates a simple tool call from a loop?",
        options: [
          "How many users do you have?",
          "Does it call a fixed list of tools once, or keep going until a stop condition?",
          "What colour is the interface?",
          "Is it on the cloud?",
        ],
        answer: 1,
        why: "A fixed tool call is predictable. A loop that runs until a stop rule is a different support burden.",
      },
      {
        q: "What should you write down before calling something a product you can run?",
        options: [
          "The tools it can use, the stop rule, and who is accountable for a wrong action.",
          "Only the price.",
          "Its name and logo.",
          "Only the model version.",
        ],
        answer: 0,
        why: "Those three decide whether you can operate it and who answers when it is wrong.",
      },
      {
        q: "Nobody can point at a log for a decision the system made. What do you have?",
        options: [
          "A fully autonomous agent.",
          "A demo, not something you can operate.",
          "A secure system.",
          "An optimised pipeline.",
        ],
        answer: 1,
        why: "If you cannot inspect what it did, you cannot fix it, audit it, or trust it in production.",
      },
      {
        q: "A person reviews a model’s draft before it is sent. Is that an autonomous agent?",
        options: [
          "Yes, any model use is autonomous.",
          "No. A person in the loop is a different product and a different risk.",
          "Yes, if the draft is long.",
          "Only if it uses tools.",
        ],
        answer: 1,
        why: "A human checkpoint changes who is accountable and how errors are caught.",
      },
    ],
  },
];

export type PublicQuestion = { q: string; options: string[] };
export type PublicChallenge = Omit<Challenge, "questions"> & { questions: PublicQuestion[] };

export function getChallenge(slug: string): Challenge | undefined {
  return challenges.find((c) => c.slug === slug);
}

export function publicChallenge(c: Challenge): PublicChallenge {
  return { ...c, questions: c.questions.map(({ q, options }) => ({ q, options })) };
}

/** One featured challenge per calendar day, the same for everybody. */
export function dailyChallenge(day: string): Challenge {
  const n = Math.round(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
  return challenges[((n % challenges.length) + challenges.length) % challenges.length] as Challenge;
}

/** Grades answers in code. Used for guests (no points) and the local preview. Signed-in people are graded in the database. */
export function gradeAnswers(challenge: Challenge, answers: number[]): { score: number; total: number; passed: boolean; correct: number[] } {
  const total = challenge.questions.length;
  const score = challenge.questions.filter((q, i) => answers[i] === q.answer).length;
  return { score, total, passed: score / total >= PASS_RATIO, correct: challenge.questions.map((q) => q.answer) };
}

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
  {
    slug: "tokens-in-plain-words",
    title: "Tokens, in plain words",
    blurb: "Why long documents get cut off and why long prompts cost more.",
    level: "Beginner",
    points: 15,
    minutes: 3,
    icon: "puzzle",
    questions: [
      {
        q: "What is a “token” to a language model?",
        options: ["A password for the tool.", "A small chunk of text, often part of a word.", "One whole sentence.", "A coin you spend per click."],
        answer: 1,
        why: "Models read and write in small pieces called tokens. A short word may be one token, a long word several.",
      },
      {
        q: "You paste a very long document and the answer ignores the beginning. What is the most likely reason?",
        options: ["The model got bored.", "Documents must be under one page.", "The text may be longer than the model’s context window, so part of it is cut off or used less reliably.", "It only ever reads the last sentence."],
        answer: 2,
        why: "A model can hold only a limited amount of text at once. Very long input may be truncated or used less reliably.",
      },
      {
        q: "Why do longer prompts and answers usually cost more?",
        options: ["They use more tokens, and usage is often billed by the token.", "Longer words are taxed.", "The model works slower when tired.", "Cost depends only on the time of day."],
        answer: 0,
        why: "Most paid tools charge by the amount of text in and out. More text means more tokens.",
      },
      {
        q: "You need a summary of a 200-page report. What is a sensible way to do it?",
        options: ["Paste everything and trust the result.", "Only paste the title.", "Ask for a five-word summary.", "Split it into sections, summarise each, then summarise the summaries, and check the key points."],
        answer: 3,
        why: "Working in pieces keeps each request inside the limit, and checking key points catches slips.",
      },
    ],
  },
  {
    slug: "same-question-different-answer",
    title: "Same question, different answer",
    blurb: "Models add a little randomness. Know when that is fine and when it is a risk.",
    level: "Everyone",
    points: 15,
    minutes: 3,
    icon: "bulb",
    questions: [
      {
        q: "You ask the same question twice and the wording changes. What does that tell you?",
        options: ["The tool is broken.", "Models generate text with some randomness, so wording can vary.", "Someone changed your account.", "The first answer was wrong."],
        answer: 1,
        why: "Text is generated step by step with some chance involved, so two runs rarely match word for word.",
      },
      {
        q: "When does that variation matter most?",
        options: ["Brainstorming slogans.", "Writing a birthday message.", "A figure that goes into a contract.", "Naming a pet."],
        answer: 2,
        why: "Creative tasks welcome variety. Exact figures and wording do not.",
      },
      {
        q: "A teammate says, “I asked the AI and it said X, so X is true.” What is the best reply?",
        options: ["Great, ship it.", "Ask again until it agrees.", "Check X against a trusted source before relying on it.", "Delete the chat."],
        answer: 2,
        why: "An answer is a starting point. Confirm anything that matters with a source you trust.",
      },
      {
        q: "How can you get more consistent answers?",
        options: ["Give clear instructions, a format and an example, and lower the randomness setting where one exists.", "Use more exclamation marks.", "Use a different font.", "Ask at night."],
        answer: 0,
        why: "Clear instructions and examples narrow what a good answer looks like.",
      },
    ],
  },
  {
    slug: "summaries-you-can-trust",
    title: "Summaries you can trust",
    blurb: "AI summaries save time. Learn what to check before you pass one on.",
    level: "Everyone",
    points: 20,
    minutes: 4,
    icon: "eye",
    questions: [
      {
        q: "An AI summarises a long email thread. What is the safest next step before you forward it?",
        options: ["Forward it to the client.", "Delete the original thread.", "Ask for a longer summary.", "Skim the original for the names, dates, amounts and decisions the summary mentions."],
        answer: 3,
        why: "Summaries drop or blur details. A quick check of the specifics catches the costly mistakes.",
      },
      {
        q: "Which part of a summary is most likely to be wrong?",
        options: ["The overall topic.", "A specific number or date.", "The language used.", "The number of paragraphs."],
        answer: 1,
        why: "Overall gist is usually right. Exact figures and dates are where models slip.",
      },
      {
        q: "You need a summary for a busy executive. Which prompt is best?",
        options: ["“Summarise this.”", "“Make it shorter.”", "“Summarise this for a busy executive in 5 bullets: decisions, risks, deadlines, owners, next step.”", "“Summarise but be creative.”"],
        answer: 2,
        why: "Saying who it is for and what to include gives a far more useful result.",
      },
      {
        q: "The notes include a confidential salary figure. Before using a public AI tool you should:",
        options: ["Remove or replace the sensitive details, or use a tool your company has approved.", "Paste it anyway, the tool is private.", "Add “please keep this secret” to the prompt.", "Paste half of it."],
        answer: 0,
        why: "Asking nicely is not a control. Keep sensitive data out of tools you have not been cleared to use.",
      },
    ],
  },
  {
    slug: "real-or-generated",
    title: "Real or generated?",
    blurb: "Voices, photos and videos can be faked. Build habits that protect you.",
    level: "Everyone",
    points: 20,
    minutes: 4,
    icon: "shield",
    questions: [
      {
        q: "A video of a leader announcing something shocking spreads fast. What is your first move?",
        options: ["Share it so others can judge.", "Look for the same news from a trusted outlet or the person’s official channel.", "Trust it if the voice sounds right.", "Count the likes."],
        answer: 1,
        why: "Check where it came from and whether trusted sources confirm it before you pass it on.",
      },
      {
        q: "Why is “it looks real to me” a weak test?",
        options: ["Phones lie.", "Only experts have eyes.", "Real photos never look perfect.", "Modern generated images and voices can be very convincing, so looks alone prove little."],
        answer: 3,
        why: "Quality has improved a lot. Source and context matter more than how it looks.",
      },
      {
        q: "A caller who sounds exactly like your manager asks for an urgent payment to a new account. What is the best action?",
        options: ["Pay, the voice is right.", "Pay half to be safe.", "Ask them to text from the same number.", "Hang up, call back on a number you already have, and follow the normal payment approval."],
        answer: 3,
        why: "Voices can be cloned. Use a channel you trust and your normal approval steps.",
      },
      {
        q: "Which habit helps most with content you plan to share?",
        options: ["Ask where it came from, who posted it first, and whether trusted sources confirm it.", "Share first and check later.", "Share it only if it agrees with you.", "Share it only at night."],
        answer: 0,
        why: "A few seconds of checking stops most fakes from spreading.",
      },
    ],
  },
  {
    slug: "prompt-search-or-retrain",
    title: "Prompt, search, or retrain?",
    blurb: "Three ways to improve an AI assistant, and which to try first.",
    level: "Manager",
    points: 25,
    minutes: 5,
    icon: "target",
    questions: [
      {
        q: "Your assistant must answer from a price list that changes every week. What holds up best?",
        options: ["Fine-tune the model each week.", "Hope it remembers.", "Give it the current price list with each question.", "Tell customers to ask a person."],
        answer: 2,
        why: "Supplying the current source text is cheaper than retraining and stays up to date.",
      },
      {
        q: "When is fine-tuning more likely to be worth it?",
        options: ["To teach facts that change daily.", "To avoid ever writing a prompt.", "To make the model free to run.", "To get a consistent style or format across thousands of cases after better prompting fell short."],
        answer: 3,
        why: "Fine-tuning shapes behaviour and style. It is a poor way to store changing facts.",
      },
      {
        q: "Output quality is poor. What should you try first?",
        options: ["Train a new model.", "Improve the instructions and add examples.", "Buy a bigger server.", "Switch vendors every week."],
        answer: 1,
        why: "Clearer instructions and examples are fast, cheap and easy to undo.",
      },
      {
        q: "Why try the cheaper options before training?",
        options: ["They are quick to test and reversible, so you learn what the real problem is before spending more.", "Training never works.", "Managers do not approve training.", "It makes the demo look better."],
        answer: 0,
        why: "Each step up costs more time and money. Only climb when the step below has been tried and measured.",
      },
    ],
  },
  {
    slug: "measure-before-you-ship",
    title: "Measure before you ship",
    blurb: "How to know an AI feature works before customers find out it doesn’t.",
    level: "Manager",
    points: 25,
    minutes: 5,
    icon: "trophy",
    questions: [
      {
        q: "What best shows an AI feature is ready to launch?",
        options: ["The demo looked good.", "The team feels confident.", "It answered the first three questions well.", "A set of real example cases with expected outcomes, scored the same way each time."],
        answer: 3,
        why: "A repeatable test on realistic cases beats impressions.",
      },
      {
        q: "Your test set has only easy questions. What is the risk?",
        options: ["None, easy tests are fine.", "The scores look great but real users bring harder, messier cases.", "The model will refuse to answer.", "The tests will cost more."],
        answer: 1,
        why: "A test set should include hard, odd and badly written cases that look like real use.",
      },
      {
        q: "Accuracy moved from 90% to 92% after a change, measured on 20 cases. What do you conclude?",
        options: ["The change worked.", "The change failed.", "Twenty cases is too few to be sure, so test more before celebrating.", "Accuracy does not matter."],
        answer: 2,
        why: "Small samples swing a lot. Gather more cases before you decide.",
      },
      {
        q: "What should you keep tracking after launch?",
        options: ["Quality on real traffic, user corrections, cost and speed, and re-test when the model or data changes.", "Nothing, launch is the finish line.", "Only the number of users.", "Only the cost."],
        answer: 0,
        why: "Models, data and users change. Keep measuring.",
      },
    ],
  },
  {
    slug: "who-checks-the-work",
    title: "Who checks the work?",
    blurb: "Where a person must stay in the loop, and how to keep reviews honest.",
    level: "Manager",
    points: 20,
    minutes: 4,
    icon: "puzzle",
    questions: [
      {
        q: "Which task most needs a person to approve it before it goes out?",
        options: ["Drafting a lunch order.", "Suggesting meeting times.", "Rewording a headline.", "Emailing a customer a refund decision or legal wording."],
        answer: 3,
        why: "The higher the cost of a mistake, the more a human check is worth.",
      },
      {
        q: "Which review step is designed well?",
        options: ["Show only the AI’s answer.", "Show the source and the AI’s answer side by side, make edits easy, and record what changed.", "Ask reviewers to approve in bulk.", "Hide the source so reviewers are not biased."],
        answer: 1,
        why: "Reviewers need the evidence in front of them and an easy way to correct.",
      },
      {
        q: "After a few weeks reviewers approve almost everything without reading. What is happening, and what helps?",
        options: ["They are doing great, reduce checks.", "The AI is perfect.", "People trust automation too much. Add spot checks and occasionally slip in known errors to test attention.", "The review screen is too small."],
        answer: 2,
        why: "Over-trust is common. Sample checks and seeded errors keep reviews real.",
      },
      {
        q: "Who is accountable for an AI-drafted decision sent to a customer?",
        options: ["The person or team that sent it. The tool is not accountable.", "The AI vendor.", "Nobody, it was automatic.", "The customer."],
        answer: 0,
        why: "Responsibility stays with people. Put a named owner on every AI-assisted decision.",
      },
    ],
  },
  {
    slug: "whose-view-is-in-the-answer",
    title: "Whose view is in the answer?",
    blurb: "AI learns from human writing, including its blind spots. Spot them.",
    level: "Everyone",
    points: 20,
    minutes: 4,
    icon: "compass",
    questions: [
      {
        q: "Why can an AI answer reflect bias?",
        options: ["It was designed to be unfair.", "Bias only appears in images.", "It learned from large amounts of human writing, which contains stereotypes and gaps.", "It copies the last user."],
        answer: 2,
        why: "Models learn patterns from the text they were trained on, including the unfair ones.",
      },
      {
        q: "An AI tool used to screen CVs keeps favouring certain schools and names. What is the right response?",
        options: ["Trust it, it is objective.", "Stop relying on it for that decision, test results across groups, and keep a person accountable.", "Hide the names and carry on.", "Use it only on Fridays."],
        answer: 1,
        why: "Automated screening can bake in unfairness. Test it, and keep a human decision-maker.",
      },
      {
        q: "Which prompt invites a more balanced answer?",
        options: ["“Prove I am right.”", "“Give me one side only.”", "“Write it so it sounds neutral.”", "“Give me the strongest arguments on both sides and say what evidence each side relies on.”"],
        answer: 3,
        why: "Asking for several views and their evidence surfaces more of the picture.",
      },
      {
        q: "“The AI said it, so it must be neutral.” Is that right?",
        options: ["Yes, machines have no opinions.", "No. A neutral tone does not remove bias, so check sources and ask who is missing.", "Yes, if it is a paid tool.", "Only for facts."],
        answer: 1,
        why: "Confident, even wording is not the same as fair or complete.",
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

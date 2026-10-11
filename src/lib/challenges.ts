// Challenges are short AI-literacy puzzles: no code, no data-structure drills.
// Each one opens with a small story (`hook`) and mixes formats: tap the odd line out, sort cards
// into buckets, put steps in order, fill the gaps, or pick an answer (see question-types.ts).
// Add one by appending an object. Answers stay on the server: the browser gets publicChallenge(),
// and /api/challenges/[slug] does the grading and the points.
import { choice, fill, order, publicQuestion, sort, spot, type PublicQuestion, type Question } from "@/lib/question-types";

export type IconName = "spark" | "prompt" | "shield" | "compass" | "puzzle" | "eye" | "bulb" | "flame" | "trophy" | "target";

export type Challenge = {
  slug: string;
  title: string;
  /** One line on the card. */
  blurb: string;
  /** A tiny story shown before the first question. */
  hook: string;
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
    hook: "A colleague pastes an AI answer into a client email. One line in it is exactly the kind of thing models invent. Can you find it before it goes out?",
    level: "Everyone",
    points: 15,
    minutes: 3,
    icon: "eye",
    questions: [
      spot(
        "An AI wrote this for a report. Tap the line you would check first.",
        [
          "Remote teams reported higher focus in the study.",
          "It was published by Smith & Lee (2021) in the Journal of Applied Cognition, vol. 12.",
          "Researchers surveyed workers across three countries.",
          "The effect was strongest for people who work alone.",
        ],
        1,
        "A neat citation is the classic invention: it looks precise and costs the model nothing to make up. Look the source up before you repeat it.",
      ),
      sort(
        "Sort each request: will the model stay on the facts, or might it make things up?",
        ["Stays on the facts", "Might invent"],
        [
          "Summarise the article I pasted below",
          "Quote the exact wording of a court ruling",
          "Give the closing price of a stock last Tuesday",
          "Fix the typos in my paragraph",
        ],
        [0, 1, 1, 0],
        "When the text is in the request, the model works from it. Exact quotes, figures and dates from memory are where it slips.",
      ),
      choice(
        "A model answers confidently and fluently. What does that tell you about whether it is correct?",
        [
          "Fluent answers are usually correct.",
          "Long answers are more reliable than short ones.",
          "Nothing dependable. Fluency and truth are different things.",
          "It means it was trained on that topic.",
        ],
        2,
        "Smooth writing is what the model is good at. It is not evidence the content is right.",
      ),
      order(
        "An AI answer will feed a real decision. Put these steps in the order you should do them.",
        [
          "Decide whether to use it",
          "Pick out the claims that matter",
          "Check those claims against a source you trust",
          "Read the AI’s answer",
        ],
        [3, 1, 2, 0],
        "Read, pick what matters, check it, then decide. Asking the same model to confirm itself is not a check.",
      ),
    ],
  },
  {
    slug: "write-a-better-prompt",
    title: "Write a better prompt",
    blurb: "Four small moves that turn a vague ask into a useful answer.",
    hook: "A bakery owner types “write about marketing” and gets mush. Fix her prompt in four quick moves.",
    level: "Beginner",
    points: 20,
    minutes: 4,
    icon: "prompt",
    questions: [
      fill(
        "Build a prompt that gets a useful post. Pick the best word for each gap.",
        ["Write a ", " LinkedIn post for ", ". Keep the tone friendly and end with ", "."],
        [
          ["short", "120-word", "good"],
          ["a small bakery announcing a new sourdough", "marketing", "everyone"],
          ["the word “please”", "a question for readers", "nothing"],
        ],
        [1, 0, 1],
        "Length, audience and a clear ending turn a vague ask into one the model can actually follow.",
      ),
      choice(
        "“Summarise this report.” What is the most useful thing missing?",
        [
          "The word “please”.",
          "Who the summary is for, and how long it should be.",
          "A higher creativity setting.",
          "Nothing, it is complete.",
        ],
        1,
        "A summary for a CEO and a summary for an engineer are different things. Say which, and how long.",
      ),
      spot(
        "Tap the line in this prompt that adds nothing.",
        [
          "Write a 120-word LinkedIn post for a small bakery announcing a new sourdough.",
          "You are the best marketer in the world.",
          "Use a friendly tone.",
          "End with a question.",
        ],
        1,
        "Praise for the model does not change the result. Audience, length, format and tone do.",
        "Prompt",
      ),
      sort(
        "The answer came back too long and too formal. Is each next move a good one?",
        ["Good move", "Waste of time"],
        [
          "Reply: “Shorter. Five bullets, casual tone.”",
          "Paste the same prompt into a new chat",
          "Type the prompt again in capital letters",
          "Paste an example of the style you want",
        ],
        [0, 1, 1, 0],
        "Follow-ups are cheap, and one good example usually saves three rounds of corrections. Shouting does nothing.",
      ),
    ],
  },
  {
    slug: "pick-the-right-tool",
    title: "Pick the right tool",
    blurb: "A language model is not always the answer. Decide where it fits and where it does not.",
    hook: "You manage a team that wants AI for everything. Match each job to the right tool before the budget goes.",
    level: "Manager",
    points: 20,
    minutes: 4,
    icon: "compass",
    questions: [
      sort(
        "Which tool fits each job best?",
        ["Spreadsheet or script", "Language model", "Model + your own documents"],
        [
          "Exact total of 4,382 invoices",
          "Rewrite a rough email so it sounds friendly",
          "Answer refund questions from this month’s policy",
          "Flag every row with a missing date",
        ],
        [0, 1, 2, 0],
        "Exact arithmetic and rule checks belong to tools built for them. Wording is a model’s strength, and answers that depend on your documents need those documents in the request.",
      ),
      choice(
        "Customers ask about your refund policy, and the policy document changes monthly. Which design holds up?",
        [
          "Rely on what the model already knows.",
          "Retrain the model each month.",
          "Supply the current policy text with each request.",
          "Let it guess and apologise when wrong.",
        ],
        2,
        "Put the current source in the request. It is cheaper than retraining and it stays current.",
      ),
      spot(
        "A model drafts support replies and a person reviews them. Tap the weak link in this plan.",
        [
          "A model drafts each support reply.",
          "A person reviews it before it is sent.",
          "When the queue is busy, replies go out without review.",
          "Corrections are logged to improve the prompt.",
        ],
        2,
        "A review step only protects you if it never gets skipped. Drafting with a human check keeps the cost of a wrong answer low.",
        "Plan",
      ),
      choice(
        "Before you pay for an AI product, which question matters most?",
        [
          "How many parameters does it have?",
          "What does a wrong answer cost, and who checks it?",
          "Which benchmark is it highest on?",
          "Does the demo look impressive?",
        ],
        1,
        "Your risk and your review process decide whether it works for you. Specs and demos do not.",
      ),
    ],
  },
  {
    slug: "whats-in-the-context",
    title: "What is in the context?",
    blurb: "The model only sees what is sent with the request. Learn what that means for your results.",
    hook: "The chatbot “forgot” you. Is it broken, or did you never hand it the text in the first place?",
    level: "Everyone",
    points: 15,
    minutes: 3,
    icon: "puzzle",
    questions: [
      choice(
        "You told a chatbot your name yesterday in a different chat. In a brand-new chat today, does it know it?",
        [
          "Yes, models remember everyone.",
          "Only if that text is in this request or in a memory feature you turned on.",
          "Yes, but only on weekdays.",
          "Only if you say please.",
        ],
        1,
        "A model does not carry yesterday’s chat with it. What it sees is what is sent now.",
      ),
      choice(
        "What is a “context window”?",
        [
          "The screen where you type.",
          "The amount of text (and sometimes images) sent with one request.",
          "The time the model takes to answer.",
          "A privacy setting.",
        ],
        1,
        "It is the working space for one request: your instructions plus anything you include.",
      ),
      sort(
        "You are building a long request. Does adding each of these help or hurt?",
        ["Helps", "Hurts"],
        [
          "The exact paragraph the answer must come from",
          "Forty pages of unrelated old emails",
          "Clear rules for the format you want",
          "The same instruction pasted five times",
        ],
        [0, 1, 0, 1],
        "Extra text costs money, adds delay, and can bury the instruction you care about. Include what the task needs, not everything you have.",
      ),
      fill(
        "Finish the rule for a long request.",
        ["Put the task and the rules ", ", then paste the ", "."],
        [
          ["first", "last", "in the middle"],
          ["source material", "whole inbox", "weather forecast"],
        ],
        [0, 0],
        "State the task and the rules first, then paste the material the model must use.",
      ),
    ],
  },
  {
    slug: "is-it-safe-to-paste",
    title: "Is it safe to paste?",
    blurb: "A quick privacy check you can run in five seconds before you hit enter.",
    hook: "Five seconds before you press enter: what are you about to hand over, and to whom?",
    level: "Everyone",
    points: 20,
    minutes: 3,
    icon: "shield",
    questions: [
      sort(
        "Which of these are fine to paste into a public AI chat tool?",
        ["Fine to paste", "Keep it out"],
        [
          "A paragraph from a public blog you want reworded",
          "A customer list with emails",
          "Your company’s unreleased financials",
          "A joke you want rewritten for a birthday card",
        ],
        [0, 1, 1, 0],
        "Public text carries no confidentiality risk. Customer data and unreleased numbers are private and should not be handed over.",
      ),
      choice(
        "Your company has an approved AI tool with a data agreement, and there is also a free consumer app. Which should client contract details go into?",
        [
          "The free app. It is faster.",
          "Whichever has the nicest design.",
          "The approved tool, after checking the policy.",
          "Neither matters.",
        ],
        2,
        "The agreement is what controls how your data is stored and used. Use the tool your organisation has vetted.",
      ),
      order(
        "You must summarise a document that contains personal data. Put the steps in a safe order.",
        [
          "Paste the cleaned text into the approved tool",
          "Check which tool your company has approved",
          "Read the summary before you share it",
          "Remove or replace names and IDs",
        ],
        [1, 3, 0, 2],
        "Choose the vetted tool, strip the personal data, then paste. The simplest protection is not sending it at all.",
      ),
      choice(
        "“I deleted the chat, so it is gone.” Is that a safe assumption?",
        [
          "Yes, deleting always erases everything immediately.",
          "Not necessarily. Retention depends on the provider’s policy and your settings.",
          "Yes, if you clear your browser cache.",
          "Only on mobile.",
        ],
        1,
        "Check the retention and training settings of the tool you use. Do not assume.",
      ),
    ],
  },
  {
    slug: "agent-or-not",
    title: "Agent or not?",
    blurb: "The word “agent” covers very different things. Learn to ask the question that separates them.",
    hook: "A vendor demo says “agent” fourteen times. Work out what you would actually be signing up to run.",
    level: "Manager",
    points: 25,
    minutes: 5,
    icon: "spark",
    questions: [
      sort(
        "Is each of these a fixed tool call, or a loop that keeps going?",
        ["Fixed tool call", "Loops until a stop rule"],
        [
          "Looks up today’s order status once, then replies",
          "Plans, searches, edits and retries until the task passes its checks",
          "Fills a form from an email, then waits for a person to approve",
          "Keeps browsing and buying until a budget runs out",
        ],
        [0, 1, 0, 1],
        "A fixed tool call is predictable. A loop that runs until a stop rule is a different support burden.",
      ),
      fill(
        "Before you call it a product you can run, write down three things.",
        ["The ", " it can use, the ", " rule, and who is ", " for a wrong action."],
        [
          ["logos", "tools", "colours"],
          ["pricing", "naming", "stop"],
          ["famous", "accountable", "cheapest"],
        ],
        [1, 2, 1],
        "Those three decide whether you can operate it and who answers when it is wrong.",
      ),
      choice(
        "Nobody can point at a log for a decision the system made. What do you have?",
        [
          "A fully autonomous agent.",
          "A demo, not something you can operate.",
          "A secure system.",
          "An optimised pipeline.",
        ],
        1,
        "If you cannot inspect what it did, you cannot fix it, audit it, or trust it in production.",
      ),
      spot(
        "Tap the line that makes this NOT an autonomous agent.",
        [
          "The model reads the customer’s email.",
          "It drafts a reply and proposes a refund.",
          "The refund is recorded in the order system.",
          "Before anything goes out, a person checks the draft and clicks send.",
        ],
        3,
        "A human checkpoint changes who is accountable and how errors are caught. It is a different product and a different risk.",
        "Flow",
      ),
    ],
  },
  {
    slug: "tokens-in-plain-words",
    title: "Tokens, in plain words",
    blurb: "Why long documents get cut off and why long prompts cost more.",
    hook: "Why did the AI cut off your long document, and why does a long prompt cost more? It comes down to one small word: token.",
    level: "Beginner",
    points: 15,
    minutes: 3,
    icon: "puzzle",
    questions: [
      choice(
        "What is a “token” to a language model?",
        [
          "A password for the tool.",
          "A small chunk of text, often part of a word.",
          "One whole sentence.",
          "A coin you spend per click.",
        ],
        1,
        "Models read and write in small pieces called tokens. A short word may be one token, a long word several.",
      ),
      choice(
        "You paste a very long document and the answer ignores the beginning. What is the most likely reason?",
        [
          "The model got bored.",
          "Documents must be under one page.",
          "The text may be longer than the model’s context window, so part of it is cut off or used less reliably.",
          "It only ever reads the last sentence.",
        ],
        2,
        "A model can hold only a limited amount of text at once. Very long input may be truncated or used less reliably.",
      ),
      sort(
        "Does each of these use more tokens, or fewer?",
        ["More tokens", "Fewer tokens"],
        [
          "Pasting a 50-page report",
          "Asking a yes-or-no question",
          "Asking for a 2,000-word essay",
          "Sending a one-line question",
        ],
        [0, 1, 0, 1],
        "Most paid tools charge by the amount of text in and out. More text means more tokens.",
      ),
      order(
        "You need a summary of a 200-page report. Put the steps in order.",
        [
          "Summarise the summaries into one",
          "Split the report into sections",
          "Check the key figures against the original",
          "Summarise each section",
        ],
        [1, 3, 0, 2],
        "Working in pieces keeps each request inside the limit, and checking key figures catches slips.",
      ),
    ],
  },
  {
    slug: "same-question-different-answer",
    title: "Same question, different answer",
    blurb: "Models add a little randomness. Know when that is fine and when it is a risk.",
    hook: "You asked twice and got two different answers. Which one do you trust, and why do they differ at all?",
    level: "Everyone",
    points: 15,
    minutes: 3,
    icon: "bulb",
    questions: [
      choice(
        "You ask the same question twice and the wording changes. What does that tell you?",
        [
          "The tool is broken.",
          "Models generate text with some randomness, so wording can vary.",
          "Someone changed your account.",
          "The first answer was wrong.",
        ],
        1,
        "Text is generated step by step with some chance involved, so two runs rarely match word for word.",
      ),
      sort(
        "Does variation between runs matter for each of these?",
        ["Variety is fine", "Needs to be exact"],
        [
          "Brainstorming slogans",
          "A figure that goes into a contract",
          "Birthday message ideas",
          "The dose printed on a medicine label",
        ],
        [0, 1, 0, 1],
        "Creative tasks welcome variety. Exact figures and wording do not.",
      ),
      choice(
        "A teammate says, “I asked the AI and it said X, so X is true.” What is the best reply?",
        [
          "Great, ship it.",
          "Ask again until it agrees.",
          "Check X against a trusted source before relying on it.",
          "Delete the chat.",
        ],
        2,
        "An answer is a starting point. Confirm anything that matters with a source you trust.",
      ),
      fill(
        "How do you get steadier answers?",
        ["Give clear ", ", show an ", ", and lower the ", " setting where there is one."],
        [
          ["emoji", "instructions", "fonts"],
          ["apology", "invoice", "example"],
          ["randomness", "brightness", "volume"],
        ],
        [1, 2, 0],
        "Clear instructions and an example narrow what a good answer looks like, and some tools let you turn the randomness down.",
      ),
    ],
  },
  {
    slug: "summaries-you-can-trust",
    title: "Summaries you can trust",
    blurb: "AI summaries save time. Learn what to check before you pass one on.",
    hook: "AI summarised the 60-email thread in four seconds. Before you forward it, what do you check?",
    level: "Everyone",
    points: 20,
    minutes: 4,
    icon: "eye",
    questions: [
      choice(
        "An AI summarises a long email thread. What is the safest next step before you forward it?",
        [
          "Forward it to the client.",
          "Delete the original thread.",
          "Ask for a longer summary.",
          "Skim the original for the names, dates, amounts and decisions the summary mentions.",
        ],
        3,
        "Summaries drop or blur details. A quick check of the specifics catches the costly mistakes.",
      ),
      spot(
        "This is an AI summary of a project thread. Tap the line most likely to be wrong.",
        [
          "The total cost came to $48,200 by the 14th.",
          "The team agreed to move the launch to October.",
          "Budget approval is still pending.",
          "Sam will confirm the venue next week.",
        ],
        0,
        "Overall gist is usually right. Exact figures and dates are where models slip, so check them against the source.",
        "Summary",
      ),
      choice(
        "You need a summary for a busy executive. Which prompt is best?",
        [
          "“Summarise this.”",
          "“Make it shorter.”",
          "“Summarise this for a busy executive in 5 bullets: decisions, risks, deadlines, owners, next step.”",
          "“Summarise but be creative.”",
        ],
        2,
        "Saying who it is for and what to include gives a far more useful result.",
      ),
      sort(
        "Is it okay to paste each of these into a public AI tool as it is?",
        ["OK to paste", "Remove first"],
        [
          "Notes from a public webinar",
          "Meeting notes that include a salary figure",
          "A client’s contract terms",
          "The agenda for a team lunch",
        ],
        [0, 1, 1, 0],
        "Asking a tool nicely to keep a secret is not a control. Keep sensitive data out of tools you have not been cleared to use.",
      ),
    ],
  },
  {
    slug: "real-or-generated",
    title: "Real or generated?",
    blurb: "Voices, photos and videos can be faked. Build habits that protect you.",
    hook: "A voice note from “your boss” asks for an urgent payment to a new account. It sounds exactly like them.",
    level: "Everyone",
    points: 20,
    minutes: 4,
    icon: "shield",
    questions: [
      choice(
        "A video of a leader announcing something shocking spreads fast. What is your first move?",
        [
          "Share it so others can judge.",
          "Look for the same news from a trusted outlet or the person’s official channel.",
          "Trust it if the voice sounds right.",
          "Count the likes.",
        ],
        1,
        "Check where it came from and whether trusted sources confirm it before you pass it on.",
      ),
      choice(
        "Why is “it looks real to me” a weak test?",
        [
          "Phones lie.",
          "Only experts have eyes.",
          "Real photos never look perfect.",
          "Modern generated images and voices can be very convincing, so looks alone prove little.",
        ],
        3,
        "Quality has improved a lot. Source and context matter more than how it looks.",
      ),
      order(
        "An urgent payment request arrives in your boss’s voice. Put the safe steps in order.",
        [
          "Follow the normal payment approval",
          "Hang up without paying",
          "Call back on a number you already have",
          "Pause: urgent plus a new account is a warning sign",
        ],
        [3, 1, 2, 0],
        "Voices can be cloned. Slow down, end the call, then use a channel you trust and your normal approval steps.",
      ),
      sort(
        "Is each of these a strong clue, or a weak clue, that something is generated or fake?",
        ["Strong clue", "Weak clue"],
        [
          "No trusted outlet reports it",
          "It looks very realistic",
          "The account that posted it was created yesterday",
          "The voice sounds exactly right",
        ],
        [0, 1, 0, 1],
        "Source and context beat appearance. A fake can look and sound perfect.",
      ),
    ],
  },
  {
    slug: "prompt-search-or-retrain",
    title: "Prompt, search, or retrain?",
    blurb: "Three ways to improve an AI assistant, and which to try first.",
    hook: "Your assistant gives stale answers. Do you rewrite the prompt, feed it documents, or retrain it? Choose the cheapest fix that works.",
    level: "Manager",
    points: 25,
    minutes: 5,
    icon: "target",
    questions: [
      choice(
        "Your assistant must answer from a price list that changes every week. What holds up best?",
        [
          "Fine-tune the model each week.",
          "Hope it remembers.",
          "Give it the current price list with each question.",
          "Tell customers to ask a person.",
        ],
        2,
        "Supplying the current source text is cheaper than retraining and stays up to date.",
      ),
      sort(
        "What is the best first fix for each problem?",
        ["Better prompt", "Give it documents", "Fine-tune"],
        [
          "Answers are too long and too casual",
          "Answers quote last year’s prices",
          "It must follow one strict house style across thousands of cases, even after good prompting",
          "It ignores half of your instructions",
        ],
        [0, 1, 2, 0],
        "Style and instructions are prompt problems, changing facts need the documents, and only a persistent behaviour gap after good prompting justifies fine-tuning.",
      ),
      order(
        "Climb the ladder: put the fixes in order, cheapest to try first.",
        [
          "Fine-tune a model",
          "Add the documents it needs",
          "Improve the instructions and examples",
        ],
        [2, 1, 0],
        "Each step up costs more time and money. Only climb when the step below has been tried and measured.",
      ),
      choice(
        "Why try the cheaper options before training?",
        [
          "They are quick to test and reversible, so you learn what the real problem is before spending more.",
          "Training never works.",
          "Managers do not approve training.",
          "It makes the demo look better.",
        ],
        0,
        "Fine-tuning shapes behaviour and style. It is a poor way to store facts that change.",
      ),
    ],
  },
  {
    slug: "measure-before-you-ship",
    title: "Measure before you ship",
    blurb: "How to know an AI feature works before customers find out it doesn’t.",
    hook: "The demo wowed everyone. Would it survive 1,000 real customer questions? Plan the test that tells you.",
    level: "Manager",
    points: 25,
    minutes: 5,
    icon: "trophy",
    questions: [
      choice(
        "What best shows an AI feature is ready to launch?",
        [
          "The demo looked good.",
          "The team feels confident.",
          "It answered the first three questions well.",
          "A set of real example cases with expected outcomes, scored the same way each time.",
        ],
        3,
        "A repeatable test on realistic cases beats impressions.",
      ),
      spot(
        "Tap the weak spot in this launch plan.",
        [
          "We collected 200 real customer questions.",
          "We wrote the expected answer for each one.",
          "We kept only the easy ones so the score looks good.",
          "We score every version the same way.",
        ],
        2,
        "A test set should include hard, odd and badly written cases that look like real use. Easy tests give scores that real users will not reproduce.",
        "Plan",
      ),
      choice(
        "Accuracy moved from 90% to 92% after a change, measured on 20 cases. What do you conclude?",
        [
          "The change worked.",
          "The change failed.",
          "Twenty cases is too few to be sure, so test more before celebrating.",
          "Accuracy does not matter.",
        ],
        2,
        "Small samples swing a lot. Gather more cases before you decide.",
      ),
      sort(
        "After launch, should you keep tracking each of these?",
        ["Keep tracking", "Skip"],
        [
          "Quality on real conversations",
          "Customer corrections and complaints",
          "The colour of the dashboard",
          "Cost and speed per answer",
        ],
        [0, 0, 1, 0],
        "Models, data and users change, so keep measuring what matters: quality, corrections, cost and speed.",
      ),
    ],
  },
  {
    slug: "who-checks-the-work",
    title: "Who checks the work?",
    blurb: "Where a person must stay in the loop, and how to keep reviews honest.",
    hook: "After week three, reviewers click “approve” on everything. Whose fault is that, and what fixes it?",
    level: "Manager",
    points: 20,
    minutes: 4,
    icon: "puzzle",
    questions: [
      sort(
        "Does each of these need a person to approve it before it goes out?",
        ["Person must approve", "Fine to automate"],
        [
          "A refund decision emailed to a customer",
          "Suggested meeting times",
          "Wording in a legal notice",
          "Rewording a headline for a draft post",
        ],
        [0, 1, 0, 1],
        "The higher the cost of a mistake, the more a human check is worth.",
      ),
      choice(
        "Which review step is designed well?",
        [
          "Show only the AI’s answer.",
          "Show the source and the AI’s answer side by side, make edits easy, and record what changed.",
          "Ask reviewers to approve in bulk.",
          "Hide the source so reviewers are not biased.",
        ],
        1,
        "Reviewers need the evidence in front of them and an easy way to correct.",
      ),
      choice(
        "After a few weeks reviewers approve almost everything without reading. What is happening, and what helps?",
        [
          "They are doing great, reduce checks.",
          "The AI is perfect.",
          "People trust automation too much. Add spot checks and occasionally slip in known errors to test attention.",
          "The review screen is too small.",
        ],
        2,
        "Over-trust is common. Sample checks and seeded errors keep reviews real.",
      ),
      fill(
        "Who is accountable when an AI-drafted decision reaches a customer?",
        ["The person who ", " an AI-drafted decision is ", " for it. The tool is not."],
        [
          ["sent", "deleted", "admired"],
          ["accountable", "excused", "nobody"],
        ],
        [0, 0],
        "Responsibility stays with people. Put a named owner on every AI-assisted decision.",
      ),
    ],
  },
  {
    slug: "whose-view-is-in-the-answer",
    title: "Whose view is in the answer?",
    blurb: "AI learns from human writing, including its blind spots. Spot them.",
    hook: "A CV-screening tool keeps preferring the same schools. Why does that happen, and what do you do about it?",
    level: "Everyone",
    points: 20,
    minutes: 4,
    icon: "compass",
    questions: [
      choice(
        "Why can an AI answer reflect bias?",
        [
          "It was designed to be unfair.",
          "Bias only appears in images.",
          "It learned from large amounts of human writing, which contains stereotypes and gaps.",
          "It copies the last user.",
        ],
        2,
        "Models learn patterns from the text they were trained on, including the unfair ones.",
      ),
      spot(
        "This is a report on an AI CV screener. Tap the line that most suggests hidden bias.",
        [
          "It ranked 500 CVs in under a minute.",
          "Its shortlist was 92% from three universities.",
          "It produced a score for each candidate.",
          "It listed the skills it found.",
        ],
        1,
        "A lopsided result is the clue. Test results across groups and keep a person accountable for the decision.",
        "Report",
      ),
      choice(
        "Which prompt invites a more balanced answer?",
        [
          "“Prove I am right.”",
          "“Give me one side only.”",
          "“Write it so it sounds neutral.”",
          "“Give me the strongest arguments on both sides and say what evidence each side relies on.”",
        ],
        3,
        "Asking for several views and their evidence surfaces more of the picture.",
      ),
      sort(
        "Is each prompt balanced, or one-sided?",
        ["Balanced", "One-sided"],
        [
          "Give the strongest arguments on both sides",
          "Prove that I am right",
          "What evidence does each side rely on?",
          "Write it so only my view sounds reasonable",
        ],
        [0, 1, 0, 1],
        "A neutral tone does not remove bias. Ask for the range of views and for the evidence behind each.",
      ),
    ],
  },
];

/** Everything a card needs, with no questions or answers, safe to hand to any component. */
export type ChallengeSummary = Pick<Challenge, "slug" | "title" | "blurb" | "hook" | "level" | "points" | "minutes" | "icon"> & {
  questionCount: number;
  kinds: Question["kind"][];
};

export function summarize(c: Challenge): ChallengeSummary {
  const { slug, title, blurb, hook, level, points, minutes, icon } = c;
  return { slug, title, blurb, hook, level, points, minutes, icon, questionCount: c.questions.length, kinds: [...new Set(c.questions.map((q) => q.kind))] };
}

export type PublicChallenge = Omit<Challenge, "questions"> & { questions: PublicQuestion[] };

export function getChallenge(slug: string): Challenge | undefined {
  return challenges.find((c) => c.slug === slug);
}

export function publicChallenge(c: Challenge): PublicChallenge {
  return { ...c, questions: c.questions.map(publicQuestion) };
}

/** One featured challenge per calendar day, the same for everybody. */
export function dailyChallenge(day: string): Challenge {
  const n = Math.round(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
  return challenges[((n % challenges.length) + challenges.length) % challenges.length] as Challenge;
}

/** Grades answers in code. Used for the local preview; signed-in people are graded in the database. */
export function gradeAnswers(challenge: Challenge, answers: number[]): { score: number; total: number; passed: boolean; correct: number[] } {
  const total = challenge.questions.length;
  const score = challenge.questions.filter((q, i) => answers[i] === q.answer).length;
  return { score, total, passed: score / total >= PASS_RATIO, correct: challenge.questions.map((q) => q.answer) };
}

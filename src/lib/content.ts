export type Post = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  body: string[];
};

export type TrackId = "beginner" | "manager";

export type Lesson = {
  slug: string;
  track: TrackId;
  title: string;
  summary: string;
  youtubeId: string;
  videoTitle: string;
  channel: string;
  keyPoints: string[];
  quiz: { ask: string; point: number }[];
};

export const tracks: { id: TrackId; title: string; description: string; chip: string }[] = [
  {
    id: "beginner",
    title: "Beginner",
    description:
      "What a neural network is, and how it changes its numbers when it is wrong. No code required.",
    chip: "mint",
  },
  {
    id: "manager",
    title: "Manager",
    description:
      "What a language model is in practice, and what people mean by generative AI. Enough to ask better questions.",
    chip: "coral",
  },
];

export const posts: Post[] = [
  {
    slug: "what-people-mean-by-agent",
    title: "What people mean by “agent”",
    date: "2026-09-28",
    excerpt:
      "The word covers a tool call, a loop, and a person reviewing a draft. Those are not the same product.",
    body: [
      "When a vendor says agent, ask which of these they mean: a model that can call a fixed list of tools, a loop that keeps going until a stop condition, or a person in the loop with a model drafting. Those are different support burdens.",
      "A tool call you can log is not the same thing as a loop you cannot predict. Write down the tools, the stop rule, and who is accountable for a wrong action before you call it a product.",
      "If nobody can point at the log for a decision the system made, you do not have an agent you can operate. You have a demo.",
    ],
  },
  {
    slug: "context-is-the-text-it-can-see",
    title: "Context is the text the model can see",
    date: "2026-09-18",
    excerpt:
      "A larger window is not automatically a better request. Extra text costs money and can bury the instruction.",
    body: [
      "A context window is the amount of text, and sometimes images, sent with one request. The model does not remember your last meeting unless that text is in the request or in a store you explicitly search.",
      "Bigger is not automatically better. Extra text costs money, adds latency, and can bury the instruction you care about. Put the task and the constraints first. Paste the source the model must use, not a dump of everything you have.",
      "If an answer ignores a fact you thought you supplied, check whether that fact was in the request before you blame the model.",
    ],
  },
  {
    slug: "did-the-model-change-help",
    title: "Did the model change help?",
    date: "2026-09-07",
    excerpt:
      "Swap models only if you can name a real task that got better. A benchmark moving is not that list.",
    body: [
      "Keep a short set of tasks from your own work: a few inputs, the answer you wanted, and what would be unacceptable. Ten is enough to start. They should be tasks you already do, not puzzles written to flatter a model.",
      "Run the old and new model on the same set. Read the failures. A single average score hides the one case you cannot ship.",
      "If you cannot name a task that improved, you do not have a reason to switch, even if a public benchmark moved.",
    ],
  },
  {
    slug: "three-questions-before-you-pay",
    title: "Three questions before you pay for another model",
    date: "2026-08-26",
    excerpt:
      "Latency, a day of real traffic, and how often a person has to fix the output. Demos skip all three.",
    body: [
      "How long does a typical request take, including retrieval and any tool calls, not just the model? If a person is waiting, a second and eight seconds are different products.",
      "What does a day of your real traffic cost? Price a prompt you actually send, at the length you actually send, with the retries you actually have. A price per million tokens is not a budget.",
      "How often does a person have to correct the output? A cheaper model that needs a full rewrite is not cheaper. A faster model that is wrong in a way you cannot spot is not faster in the way that matters.",
    ],
  },
];

export const lessons: Lesson[] = [
  {
    slug: "what-a-neural-network-is",
    track: "beginner",
    title: "What a neural network is",
    summary:
      "Grant Sanderson walks through a network that reads handwritten digits. No code. The point is the structure: layers of numbers, weights, and a final guess.",
    youtubeId: "aircAruvnKk",
    videoTitle: "But what is a neural network? | Deep learning chapter 1",
    channel: "3Blue1Brown",
    keyPoints: [
      "The running example is handwritten digits. The input is a 28×28 grid of pixel values, 784 numbers.",
      "Neurons sit in layers. Each neuron holds an activation: a number computed from the previous layer.",
      "A connection has a weight, and a neuron has a bias. The weighted inputs are summed, then passed through a function. The video contrasts ReLU and sigmoid.",
      "The whole network is one function. In this example it has on the order of 13,000 weights and biases, and 10 output numbers, one per digit.",
      "Learning, in this video, means changing those weights and biases. You do not write a separate rule for each way someone draws a 3.",
      "This video does not train the network, derive backpropagation, or discuss language models, price, or products.",
    ],
    quiz: [
      { ask: "What goes into the digit network in this video, and what comes out?", point: 0 },
      { ask: "What is a weight doing?", point: 2 },
      { ask: "What does “learning” mean here?", point: 4 },
    ],
  },
  {
    slug: "how-a-network-learns",
    track: "beginner",
    title: "How a network learns",
    summary:
      "The follow-up. A cost function, then gradient descent: small changes to the weights that reduce error on examples you already labeled.",
    youtubeId: "IHZwWFHWa-w",
    videoTitle: "Gradient descent, how neural networks learn | Deep learning chapter 2",
    channel: "3Blue1Brown",
    keyPoints: [
      "The network starts with weights that do not yet solve the task. It learns from labeled examples.",
      "A cost function scores how far the outputs are from the labels, averaged over the training examples.",
      "The gradient of that cost says which way to nudge each weight and bias so the cost falls fastest.",
      "Gradient descent repeats the nudge: step downhill, then compute the gradient again. It reaches a local low point, not a guarantee about images it has not seen.",
      "The efficient way to compute that gradient is backpropagation. This chapter says why you need it and leaves the calculus for the next one.",
      "This video does not cover language models, pricing, or how a team should judge a product.",
    ],
    quiz: [
      { ask: "What is the cost function measuring?", point: 1 },
      { ask: "What does the gradient tell you?", point: 2 },
      { ask: "What does gradient descent not promise?", point: 3 },
    ],
  },
  {
    slug: "large-language-models",
    track: "manager",
    title: "Large language models, without training one",
    summary:
      "Andrej Karpathy’s one-hour talk for a general audience. What the model file is, what training cost looked like in 2023, and where the security problems sit. The shape of the explanation still holds.",
    youtubeId: "zjkBMFhNj_g",
    videoTitle: "[1hr Talk] Intro to Large Language Models",
    channel: "Andrej Karpathy",
    keyPoints: [
      "An LLM you run is two pieces: a parameters file and the code that runs it. It is not looking up a stored sentence.",
      "Pretraining compresses a very large text corpus into those parameters. The compression is lossy, so the model produces a plausible continuation rather than a retrieved page.",
      "The talk’s 2023 figures for Llama 2 70B are about 10TB of text, about 6,000 GPUs, about 12 days, and about $2 million. The talk says frontier systems were already roughly ten times past those figures.",
      "Fine-tuning aims the model at assistant behavior. It does not stop hallucination. The talk says an answer is more trustworthy when the needed text is in the context, from browsing or retrieval, than when the model answers from parameters alone.",
      "The talk’s “LLM OS” picture: the model is like a kernel, the context window is working memory, and tools are peripherals.",
      "Security problems named in the talk are jailbreaks, prompt injection, and data poisoning.",
      "Those figures and that security list are from this November 2023 talk. They are not a current bill or a full threat model.",
    ],
    quiz: [
      { ask: "What is the model file, if it is not a database of sentences?", point: 0 },
      { ask: "What training numbers does the talk actually give?", point: 2 },
      { ask: "When does the talk say you can trust an answer a bit more?", point: 3 },
    ],
  },
  {
    slug: "what-generative-ai-is",
    track: "manager",
    title: "What generative AI is",
    summary:
      "A short Google Cloud lesson. A definition, how this sits next to other machine learning, and the kinds of output people mean when they say generative.",
    youtubeId: "G2fqAlgmoPo",
    videoTitle: "Introduction to Generative AI",
    channel: "Google Cloud Tech",
    keyPoints: [
      "Generative AI produces new content — text, images, audio, or synthetic data — from patterns it learned.",
      "Training on existing content produces a statistical model. A prompt asks that model to predict a response. That prediction is the new content.",
      "The lesson places it in a stack: artificial intelligence, then machine learning, then deep learning, then generative models.",
      "That is different from a model that only assigns a label or a score.",
      "Applications it names around code include explaining code, translating it, writing SQL, and drafting documentation.",
      "It points at Google Cloud’s Generative AI Studio and related model APIs as places to try this. It does not compare vendors or prices.",
    ],
    quiz: [
      { ask: "What does the lesson say generative AI produces?", point: 0 },
      { ask: "What is a prompt doing in this definition?", point: 1 },
      { ask: "What does the lesson not decide for you?", point: 5 },
    ],
  },
];


export type WeeklyLessonLink = {
  href: string;
  label: string;
};

export type WeeklyNote = {
  weekOf: string;
  title: string;
  intro: string;
  beginnerTitle: string;
  beginner: string[];
  beginnerLesson: WeeklyLessonLink;
  managerTitle: string;
  manager: string[];
  managerLesson: WeeklyLessonLink;
};

export const weeklyNotes: WeeklyNote[] = [
  {
    weekOf: "2026-10-05",
    title: "A model is a guess that got practice",
    intro:
      "One idea this week, in plain words. Beginners can stop after the first card. If you manage the work, the second card is the part worth keeping.",
    beginnerTitle: "It guesses, then it adjusts",
    beginner: [
      "You do not need the math yet. A neural network is a pile of numbers with a job: look at an example, make a guess, and get told how far off it was.",
      "Next time it nudges those numbers a little. That is the whole trick. The beginner lesson uses handwritten digits so you can see the guess.",
    ],
    beginnerLesson: {
      href: "/learn/beginner/what-a-neural-network-is",
      label: "Watch: what a neural network is",
    },
    managerTitle: "It is not a lookup, and it is not a person",
    manager: [
      "The useful version is shorter. It learned patterns from old examples and will produce something new that looks like those examples.",
      "Ask what it was shown, what a wrong answer costs, and who checks the output. The short lesson below is the definition, not a buying guide.",
    ],
    managerLesson: {
      href: "/learn/manager/what-generative-ai-is",
      label: "Read with the video: what generative AI is",
    },
  },
];

export function weeklyNotesNewestFirst(): WeeklyNote[] {
  return [...weeklyNotes].sort((a, b) => (a.weekOf < b.weekOf ? 1 : -1));
}

export const coachPrompts = [
  "Explain this simply",
  "Quiz me",
  "What should a manager take from this?",
] as const;

export function getPost(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}

export function postsNewestFirst(): Post[] {
  return [...posts].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function lessonsFor(track: TrackId): Lesson[] {
  return lessons.filter((lesson) => lesson.track === track);
}

export function getLesson(track: string, slug: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.track === track && lesson.slug === slug);
}

export function getLessonBySlug(slug: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.slug === slug);
}

// Add a week by appending an object. Leave older entries in place.
// ManyChat for that reel should link to /ig/<slug>.
// Drop the still at public/ig/<slug>.png when you have it.
//
// Attachments and documents: put the file in public/ig/files/<slug>/ and list it
// under `resources` with href "/ig/files/<slug>/name.pdf" (or any web link).
// The page itself is gated server-side: nothing below is sent to a visitor until
// they leave their name and email. A file's direct URL is not protected, so use
// an unlisted link for anything that must stay private.
export type IgResource = { label: string; href: string; kind: "pdf" | "doc" | "sheet" | "link" };

export type IgPost = {
  slug: string;
  weekOf: string;
  title: string;
  dateLabel: string;
  explanation: string;
  howItHelps: string;
  prompt: string;
  sample: string;
  notes: string[];
  links: { href: string; label: string }[];
  resources?: IgResource[];
  nextLine: string;
  /** Extra copyable prompts, shown under the main one in "Build your own". */
  prompts?: { title: string; when: string; body: string }[];
  /** A whole file to copy, e.g. the SKILL.md from the reel. */
  skillFile?: { path: string; content: string };
  /** Starter ideas, shown as a short list. */
  ideas?: string[];
  /** A highlighted card on /notes that links to this drop. */
  notesCard?: { eyebrow: string; title: string; text: string };
};

export const igPosts: IgPost[] = [
  {
    slug: "skills",
    weekOf: "2026-10-13",
    title: "Build your own AI skill",
    dateLabel: "Week of October 13",
    explanation:
      "A skill is a how-to guide you write once and save in your project. When your request matches it, Copilot or Claude reads the guide and follows it, every time.",
    howItHelps:
      "How it helps: you stop re-explaining the same task. The steps stay the same, the output looks the same, and anyone who opens the project gets the same skill.",
    sample:
      "From the reel: the resume-tailor skill. Resume and job description in, match score, keywords and rewritten bullets out.",
    skillFile: {
      path: ".github/skills/resume-tailor/SKILL.md",
      content: [
        "---",
        "name: resume-tailor",
        "description: Tailor my resume to a job description. Use when I share my resume and a job posting.",
        "---",
        "",
        "# Resume Tailor",
        "",
        "When I give you my resume and a job description:",
        "",
        "1. Give a match score out of 100.",
        "2. List the 5 most important keywords from the job.",
        "3. Rewrite my 3 weakest bullets to fit the job. Show before → after.",
        "4. Tell me which keywords I'm missing.",
        "",
        "Rules:",
        "- Never make up experience, tools, or numbers.",
        "- Keep it short and simple.",
      ].join("\n"),
    },
    prompt: [
      "I want to turn a task I repeat into an AI skill (a SKILL.md file).",
      "",
      "The task: [describe it in one or two lines]",
      "What I give the AI each time: [e.g. my notes, a job post, a spreadsheet]",
      "What I want back: [e.g. a short email, a table, 5 bullet points]",
      "Rules it must follow: [e.g. never invent numbers, keep it under 150 words]",
      "",
      "Write the SKILL.md for me:",
      "- Start with this header between --- lines:",
      "  name: a short lowercase-with-hyphens name",
      "  description: one sentence that says what it does AND when to use it",
      "- Then 3 to 6 numbered steps, in plain words.",
      "- Then a short \"Rules\" list.",
      "- Keep the whole file under 40 lines so a beginner can read it.",
      "Ask me if anything is unclear before you write it.",
    ].join("\n"),
    prompts: [
      {
        title: "Let Copilot create the files for you",
        when: "In VS Code, Copilot Chat in Agent mode, with your project folder open.",
        body: [
          "Create an agent skill in this project.",
          "",
          "Make the folder .github/skills/[skill-name]/ and inside it a file named SKILL.md",
          "with exactly this content:",
          "",
          "[paste the SKILL.md you wrote]",
          "",
          "Don't change any other files. When you're done, show me the folder tree.",
        ].join("\n"),
      },
      {
        title: "Test your skill",
        when: "Open a new chat. Don't mention the skill by name, so you can see if it gets picked up.",
        body: [
          "[Attach or paste your input, e.g. your resume and the job post]",
          "",
          "[Ask for the task in plain words, e.g. \"Tailor my resume for this job.\"]",
          "",
          "After you answer, tell me which skill or instructions you used, if any.",
        ].join("\n"),
      },
      {
        title: "Fix a skill that isn't working",
        when: "If the AI ignored your skill or the answer came out wrong.",
        body: [
          "Here is my SKILL.md:",
          "",
          "[paste it]",
          "",
          "Here is what I asked: [your request]",
          "Here is what I got: [paste the answer]",
          "Here is what I wanted instead: [one or two lines]",
          "",
          "Rewrite the SKILL.md so this works next time. Most of all, improve the",
          "\"description\" line so it clearly matches requests like mine. Keep it short.",
        ].join("\n"),
      },
    ],
    ideas: [
      "Meeting notes → action items with owners and dates",
      "Job post → a cover letter that only uses what's in your resume",
      "Messy update → a weekly status report in your team's format",
      "Any topic → 5 interview questions with model answers",
      "Long article → a 5-bullet summary for your manager",
      "Draft post → a LinkedIn post in your own voice",
    ],
    notes: [
      "Save project skills in .github/skills/<name>/SKILL.md. For skills you want in every project, use ~/.copilot/skills/ (Copilot) or ~/.claude/skills/ (Claude).",
      "Two ways to run one: type / and pick it, or just ask in plain words and the AI picks it up from the description line.",
      "The description line is what gets matched. If a skill never triggers, fix that line first.",
      "New skill not showing? Reload VS Code (Developer: Reload Window) and use Agent mode.",
      "Never put passwords, client names or company data inside a skill you share.",
    ],
    links: [
      { href: "/jobs", label: "Tailored your resume? See this week's jobs" },
      { href: "/notes", label: "More AI notes" },
    ],
    nextLine: "Next drop: SLMs, the small models companies are quietly betting on.",
    notesCard: {
      eyebrow: "Skills",
      title: "Build your own AI skill",
      text: "The resume-tailor skill from the reel, plus copy-paste prompts to make your own for Copilot or Claude.",
    },
  },
];

export function getIgPost(slug: string): IgPost | undefined {
  return igPosts.find((post) => post.slug === slug);
}

export function igPostsNewestFirst(): IgPost[] {
  return [...igPosts].sort((a, b) => (a.weekOf < b.weekOf ? 1 : -1));
}

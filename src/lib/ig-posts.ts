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
};

export const igPosts: IgPost[] = [
  {
    slug: "skills",
    weekOf: "2026-10-06",
    title: "What a skill is, and how it helps",
    dateLabel: "Week of October 6",
    explanation:
      "A skill is a saved way of doing one kind of work, so the next time you don't start from zero.",
    howItHelps:
      "How it helps: the steps stay consistent, a beginner can follow them, and you can hand the same skill to someone else.",
    prompt: [
      "Follow this skill one step at a time, and show your work as you go.",
      "",
      "Before each step, name the step and say what you are about to do. After the step, show what you used, what you produced, and anything you are unsure about. Do not skip ahead or merge steps. If a step needs something I have not given you, stop and ask for it.",
      "",
      "Skill:",
      "[paste the skill here]",
      "",
      "The work:",
      "[paste what you want this skill to do]",
    ].join("\n"),
    sample: "Sample: a skill that turns a messy note into a lesson outline",
    notes: [
      "Keep a skill to one kind of work, written so you are not inventing the steps again.",
      "The same steps every time are what a beginner can follow.",
      "If someone else can run it, you can hand the skill over instead of explaining it from scratch.",
    ],
    links: [
      { href: "/learn", label: "Beginner track" },
      { href: "/notes", label: "More notes" },
    ],
    nextLine: "Next week gets its own page. This one stays.",
  },
];

export function getIgPost(slug: string): IgPost | undefined {
  return igPosts.find((post) => post.slug === slug);
}

export function igPostsNewestFirst(): IgPost[] {
  return [...igPosts].sort((a, b) => (a.weekOf < b.weekOf ? 1 : -1));
}

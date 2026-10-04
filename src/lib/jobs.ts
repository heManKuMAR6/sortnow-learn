// Open roles from people we know are hiring. Add one by appending an object and
// pushing. Remove a role by deleting its entry. Applications (who tapped Apply)
// are stored in the job_applications table; read them in the Supabase dashboard.
//
// Template:
// {
//   slug: "ai-ops-associate",            // used in the URL, keep it stable
//   title: "AI Operations Associate",
//   company: "Company name",
//   location: "Austin, TX",
//   mode: "Remote",                      // "Remote" | "Hybrid" | "On-site"
//   type: "Full-time",                   // "Full-time" | "Part-time" | "Contract" | "Internship"
//   level: "Entry",                      // "Entry" | "Mid" | "Senior"
//   posted: "2026-10-04",
//   summary: "One sentence that sells the role.",
//   about: ["Paragraph about the role.", "Another paragraph."],
//   skills: ["Prompting", "Spreadsheets"],
//   applyUrl: "https://company.com/jobs/123",   // optional: where they finish applying
// },

export type Job = {
  slug: string;
  title: string;
  company: string;
  location: string;
  mode: "Remote" | "Hybrid" | "On-site";
  type: "Full-time" | "Part-time" | "Contract" | "Internship";
  level: "Entry" | "Mid" | "Senior";
  posted: string;
  summary: string;
  about: string[];
  skills: string[];
  applyUrl?: string;
};

export const jobs: Job[] = [];

export function getJob(slug: string): Job | undefined {
  return jobs.find((j) => j.slug === slug);
}

export function jobsNewestFirst(): Job[] {
  return [...jobs].sort((a, b) => (a.posted < b.posted ? 1 : -1));
}

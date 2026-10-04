// Jobs are managed from /admin/jobs by admins (see docs/ARCHITECTURE.md) and stored
// in the `jobs` table. This file holds the type, the contact rule, and the starter
// listings: they seed the database (supabase/schema.sql), the local preview, and act
// as a fallback if the database cannot be read.
//
// Contacts: listings never carry a recruiter's name, email or phone. Every role points
// to sortNow, which is the only contact.

export const JOBS_CONTACT_EMAIL = process.env.NEXT_PUBLIC_JOBS_CONTACT_EMAIL || "hemanofficial6@gmail.com";

export const JOB_MODES = ["Remote", "Hybrid", "On-site"] as const;
export const JOB_LEVELS = ["Entry", "Mid", "Senior", "Lead", "Manager", "Principal"] as const;
export const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"] as const;

export type Job = {
  slug: string;
  title: string;
  /** The end employer, when it is safe to show. Left out when unknown. */
  company?: string;
  location: string;
  mode: (typeof JOB_MODES)[number];
  level: (typeof JOB_LEVELS)[number];
  type?: (typeof JOB_TYPES)[number];
  /** YYYY-MM-DD */
  posted: string;
  summary: string;
  about: string[];
  skills: string[];
  status: "open" | "closed";
};

export type JobInput = Omit<Job, "status"> & { status?: Job["status"] };

export function contactHref(job: Pick<Job, "title" | "company">): string {
  const subject = `Interested in: ${job.title}${job.company ? ` (${job.company})` : ""}`;
  const body = "Hi sortNow,\n\nI found this role on sortNow Learn and I am interested.\n\nMy profile link:\nMy resume:\n";
  return `mailto:${JOBS_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function jobSlug(title: string, company?: string): string {
  const base = `${title} ${company ?? ""}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
  return base || "role";
}

export const starterJobs: Job[] = [
  { slug: "sr-lead-ai-engineer-plano", title: "Sr/Lead AI Engineer", location: "Plano, Dallas, TX", mode: "On-site", level: "Senior", posted: "2026-06-08", summary: "Design, build and scale production-grade AI and machine learning systems.", about: ["We are looking for a Senior/Lead AI Engineer to design, build, and scale production-grade AI and machine learning systems.", "The role bridges ML engineering, agentic AI and data engineering, with strong Python and SQL expected."], skills: ["Python", "ML Engineering", "Agentic AI", "Data Engineering with SQL"], status: "open" },
  { slug: "lead-ai-project-manager", title: "Lead AI Project Manager", location: "Remote", mode: "Remote", level: "Manager", posted: "2026-06-04", summary: "Own AI product strategy, roadmap and go-to-market for AI-powered solutions in retirement and wealth.", about: ["Lead the AI product strategy, vision, roadmap, and go-to-market execution for AI-powered solutions serving retirement participants, financial advisors, and plan sponsors, for a client's digital and wealth business."], skills: ["LLM product experience", "RAG architecture fluency", "Agentic AI product design", "Model evaluation and metrics", "Data fluency", "AI tooling in practice"], status: "open" },
  { slug: "lead-ai-engineer-iii", title: "Lead AI Engineer III", location: "Remote", mode: "Remote", level: "Lead", posted: "2026-06-04", summary: "Top of the individual contributor track: architect and lead AI engineering work.", about: ["The top of the individual contributor track, equivalent to Staff at most technology companies and to a C14 / SVP-equivalent in financial services engineering.", "Architect and lead development across APIs, backend services and data pipelines, using AI coding tools day to day."], skills: ["Rust", "TypeScript", "Solana", "RAG architectures", "Prompt pipelines", "Claude Code", "GitHub Copilot", "Cursor or equivalent", "APIs and backend services", "Data pipelines"], status: "open" },
  { slug: "lead-ai-engineer-design", title: "Lead AI Engineer (design-focused)", location: "Remote", mode: "Remote", level: "Senior", posted: "2026-06-04", summary: "Lead / Principal individual contributor shaping product decisions for AI tools through interaction design.", about: ["Leveled as a Lead / Principal individual contributor, equivalent to Staff Designer at technology companies.", "At this level the designer shapes product decisions, not just design artifacts."], skills: ["Figma", "Protopie", "Voiceflow", "WCAG 2.2 AA", "Interaction design for AI tools"], status: "open" },
  { slug: "ai-ml-architect-mlops", title: "AI/ML Architect (MLOps: Dataiku & Vertex AI)", location: "Austin, TX", mode: "On-site", level: "Mid", posted: "2026-05-30", summary: "Define, architect and operationalize enterprise-grade MLOps platforms on Dataiku and Google Cloud Vertex AI.", about: ["Principal AI/ML Architect responsible for defining, architecting, and operationalizing enterprise-grade MLOps platforms using Dataiku and Google Cloud Vertex AI."], skills: ["MLOps", "Dataiku", "Google Cloud Vertex AI"], status: "open" },
  { slug: "iam-engineer-humana", title: "IAM Engineer", company: "Humana", location: "Dallas, TX", mode: "Hybrid", level: "Mid", posted: "2026-05-21", summary: "Customer identity and access management (CIAM) software engineering at Humana.", about: ["A customer identity and access management (CIAM) software engineering role at Humana, based in Dallas on a hybrid schedule."], skills: ["Java", "Linux", "ForgeRock", "Vue JS"], status: "open" },
  { slug: "ai-architect-hitachi", title: "AI Architect", company: "Hitachi", location: "Dallas, TX", mode: "On-site", level: "Principal", posted: "2026-05-20", summary: "Hands-on enterprise AI and LLM architect for next-generation AI platforms.", about: ["We are seeking a highly skilled and hands-on AI Architect to lead the design and implementation of next-generation enterprise AI platforms powered by Large Language Models (LLMs)."], skills: ["Enterprise AI & LLM architecture", "Amazon Bedrock", "RAG pipelines"], status: "open" },
  { slug: "azure-devops-java-baron-budd", title: "Azure DevOps with Java", company: "Baron & Budd", location: "Dallas, TX", mode: "Hybrid", level: "Mid", posted: "2026-05-20", summary: "High-impact DevOps engineer with strong Java experience to support and modernize Baron & Budd's systems.", about: ["We are seeking a high-impact DevOps Engineer with strong Java experience to support and modernize Baron & Budd's systems, based in Dallas, Texas."], skills: ["Azure DevOps CI/CD pipelines", "Kubernetes", "Java", "Docker"], status: "open" },
];

export function newestFirst<T extends { posted: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => (a.posted < b.posted ? 1 : -1));
}

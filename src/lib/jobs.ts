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
  /** One or two lines for the list view. */
  summary: string;
  /** "About the role": a few paragraphs. */
  about: string[];
  /** What the person will do. One bullet each. */
  responsibilities: string[];
  /** Must-haves. */
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  /** Plain text, e.g. "8+ years in ML engineering". */
  experience?: string;
  /** Plain text, only when the employer has shared it. */
  salary?: string;
  /** Tools and technologies, shown as tags. */
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

const J = (job: Omit<Job, "status" | "benefits"> & { benefits?: string[] }): Job => ({ benefits: [], ...job, status: "open" });

// Descriptions below are drafted from each role's headline details. Check them against
// the employer's real JD before you share a role widely, and edit them in /admin/jobs.
export const starterJobs: Job[] = [
  J({
    slug: "sr-lead-ai-engineer-plano", title: "Sr/Lead AI Engineer", location: "Plano, Dallas, TX", mode: "On-site", level: "Senior", posted: "2026-06-08",
    summary: "Design, build and scale production-grade AI and machine learning systems.",
    about: [
      "We are looking for a Senior/Lead AI Engineer to design, build, and scale production-grade AI and machine learning systems.",
      "The role bridges ML engineering, agentic AI and data engineering, with strong Python and SQL expected. You will take models from prototype to something the business can rely on every day.",
    ],
    responsibilities: [
      "Design and build production AI and machine learning services, from data intake to a deployed model.",
      "Build agentic AI workflows: tool use, retrieval, guardrails and evaluation.",
      "Own data pipelines and SQL models that feed training and inference.",
      "Set up monitoring for quality, latency, drift and cost, and act on what it shows.",
      "Review designs and code, and mentor engineers on ML engineering practice.",
      "Work with product and business owners to turn a problem into a measurable AI outcome.",
    ],
    requirements: [
      "Strong Python and SQL, written for production rather than notebooks.",
      "Hands-on ML engineering: training, packaging, deploying and operating models.",
      "Practical experience with agentic AI or LLM-based applications.",
      "Data engineering skills: pipelines, data quality and warehouse design.",
      "Comfortable owning a system end to end, including on-call and incident follow-up.",
    ],
    niceToHave: ["Experience with a major cloud platform's ML services", "Evaluation and testing frameworks for LLM systems", "Experience leading or mentoring a small team"],
    skills: ["Python", "ML Engineering", "Agentic AI", "Data Engineering with SQL"],
  }),
  J({
    slug: "lead-ai-project-manager", title: "Lead AI Project Manager", location: "Remote", mode: "Remote", level: "Manager", posted: "2026-06-04",
    summary: "Own AI product strategy, roadmap and go-to-market for AI-powered solutions in retirement and wealth.",
    about: [
      "Lead the AI product strategy, vision, roadmap, and go-to-market execution for AI-powered solutions serving retirement participants, financial advisors, and plan sponsors, for a client's digital and wealth business.",
      "You will sit between engineering, design, compliance and the business, and decide what gets built, in what order, and how success is measured.",
    ],
    responsibilities: [
      "Define the AI product vision and a roadmap tied to business outcomes.",
      "Write clear requirements for LLM, RAG and agentic features and prioritise the backlog.",
      "Set evaluation and quality metrics for model output, and review them with the team every release.",
      "Plan the go-to-market: pilots, rollout, training and feedback loops with advisors and plan sponsors.",
      "Work with risk and compliance so AI features meet regulatory expectations.",
      "Report progress, risks and results to senior stakeholders.",
    ],
    requirements: [
      "Experience shipping LLM-based products, with a working grasp of RAG and agentic designs.",
      "Able to define and track model evaluation metrics, not only delivery dates.",
      "Fluent with data: comfortable reading dashboards and challenging the numbers.",
      "Strong written and verbal communication with technical and non-technical audiences.",
      "Regular, practical use of AI tools in your own work.",
    ],
    niceToHave: ["Background in financial services, retirement or wealth", "Experience with regulated product launches"],
    skills: ["LLM product experience", "RAG architecture fluency", "Agentic AI product design", "Model evaluation and metrics", "Data fluency", "AI tooling in practice"],
  }),
  J({
    slug: "lead-ai-engineer-iii", title: "Lead AI Engineer III", location: "Remote", mode: "Remote", level: "Lead", posted: "2026-06-04",
    summary: "Top of the individual contributor track: architect and lead AI engineering work.",
    about: [
      "The top of the individual contributor track, equivalent to Staff at most technology companies and to a C14 / SVP-equivalent in financial services engineering.",
      "Architect and lead development across APIs, backend services and data pipelines, using AI coding tools day to day.",
    ],
    responsibilities: [
      "Architect AI-enabled systems across APIs, backend services and data pipelines.",
      "Build RAG architectures and prompt pipelines that hold up in production.",
      "Use AI coding tools (Claude Code, GitHub Copilot, Cursor or similar) to raise the team's speed and quality, and teach others how.",
      "Lead technical design reviews and set engineering standards.",
      "Break down ambiguous problems into plans other engineers can execute.",
    ],
    requirements: [
      "Deep experience building backend systems and APIs at scale.",
      "Production experience with Rust and TypeScript.",
      "Hands-on with RAG architectures and prompt pipelines.",
      "Daily use of AI coding assistants, with judgement about where they help and where they do not.",
      "A record of leading technical work across several engineers or teams.",
    ],
    niceToHave: ["Solana or other blockchain development", "Data pipeline design", "Open source contributions"],
    skills: ["Rust", "TypeScript", "Solana", "RAG architectures", "Prompt pipelines", "Claude Code", "GitHub Copilot", "Cursor or equivalent", "APIs and backend services", "Data pipelines"],
  }),
  J({
    slug: "lead-ai-engineer-design", title: "Lead AI Engineer (design-focused)", location: "Remote", mode: "Remote", level: "Senior", posted: "2026-06-04",
    summary: "Lead / Principal individual contributor shaping product decisions for AI tools through interaction design.",
    about: [
      "Leveled as a Lead / Principal individual contributor, equivalent to Staff Designer at technology companies.",
      "At this level the designer shapes product decisions, not just design artifacts. You will decide how people interact with AI tools: what they ask, what they see back, and how they know when to trust it.",
    ],
    responsibilities: [
      "Design interaction patterns for AI tools: prompting, review, correction and hand-off to a person.",
      "Prototype quickly in Figma, Protopie and Voiceflow, and test with real users.",
      "Define how the product shows uncertainty, sources and limits of an AI answer.",
      "Hold designs to WCAG 2.2 AA from the first prototype.",
      "Partner with engineering and product to decide scope, and say no when a design does not serve the user.",
    ],
    requirements: [
      "A portfolio showing interaction design for complex or data-heavy products.",
      "Expert Figma, with working knowledge of Protopie and Voiceflow.",
      "Working knowledge of WCAG 2.2 AA and how to test for it.",
      "Experience designing with or for AI and conversational interfaces.",
      "Comfort influencing product direction at senior level.",
    ],
    niceToHave: ["Experience in regulated industries", "Ability to build simple prototypes in code"],
    skills: ["Figma", "Protopie", "Voiceflow", "WCAG 2.2 AA", "Interaction design for AI tools"],
  }),
  J({
    slug: "ai-ml-architect-mlops", title: "AI/ML Architect (MLOps: Dataiku & Vertex AI)", location: "Austin, TX", mode: "On-site", level: "Mid", posted: "2026-05-30",
    summary: "Define, architect and operationalize enterprise-grade MLOps platforms on Dataiku and Google Cloud Vertex AI.",
    about: [
      "Principal AI/ML Architect responsible for defining, architecting, and operationalizing enterprise-grade MLOps platforms using Dataiku and Google Cloud Vertex AI.",
      "You will set the platform standards that data science teams use to move models from experiment to production safely and repeatably.",
    ],
    responsibilities: [
      "Define the target MLOps architecture across Dataiku and Vertex AI.",
      "Build repeatable pipelines for training, validation, deployment and rollback.",
      "Set standards for model registry, versioning, lineage and approvals.",
      "Put monitoring in place for model performance, drift and cost.",
      "Work with data science, platform and security teams to onboard use cases.",
      "Document the platform and train teams to use it.",
    ],
    requirements: [
      "Hands-on MLOps experience on an enterprise platform.",
      "Working experience with Dataiku and Google Cloud Vertex AI.",
      "Solid understanding of CI/CD for machine learning.",
      "Ability to explain architecture choices to engineers and executives.",
    ],
    niceToHave: ["Google Cloud certification", "Experience with feature stores and model governance"],
    skills: ["MLOps", "Dataiku", "Google Cloud Vertex AI"],
  }),
  J({
    slug: "iam-engineer-humana", title: "IAM Engineer", company: "Humana", location: "Dallas, TX", mode: "Hybrid", level: "Mid", posted: "2026-05-21",
    summary: "Customer identity and access management (CIAM) software engineering at Humana.",
    about: [
      "A customer identity and access management (CIAM) software engineering role at Humana, based in Dallas on a hybrid schedule.",
      "You will build and run the sign-in, registration and access experiences that members use, with security and reliability as the first requirements.",
    ],
    responsibilities: [
      "Build and maintain CIAM features: registration, sign-in, recovery and consent.",
      "Configure and extend the identity platform (ForgeRock) for new journeys.",
      "Develop front-end screens in Vue JS and back-end services in Java.",
      "Troubleshoot production issues on Linux environments and fix the root cause.",
      "Work with security teams to meet policy and audit requirements.",
    ],
    requirements: [
      "Java development experience.",
      "Working knowledge of Linux.",
      "Experience with ForgeRock or a comparable identity platform.",
      "Front-end experience with Vue JS.",
      "Understanding of authentication and authorisation standards such as OAuth 2.0 and OpenID Connect.",
    ],
    niceToHave: ["Experience in healthcare or another regulated industry", "Automated testing for identity flows"],
    skills: ["Java", "Linux", "ForgeRock", "Vue JS"],
  }),
  J({
    slug: "ai-architect-hitachi", title: "AI Architect", company: "Hitachi", location: "Dallas, TX", mode: "On-site", level: "Principal", posted: "2026-05-20",
    summary: "Hands-on enterprise AI and LLM architect for next-generation AI platforms.",
    about: [
      "We are seeking a highly skilled and hands-on AI Architect to lead the design and implementation of next-generation enterprise AI platforms powered by Large Language Models (LLMs).",
      "You will be the person who both draws the architecture and builds the first working version of it.",
    ],
    responsibilities: [
      "Design enterprise AI and LLM platform architecture, including security and cost controls.",
      "Build RAG pipelines and the data foundations behind them.",
      "Use Amazon Bedrock to select, deploy and evaluate foundation models.",
      "Define evaluation, guardrail and monitoring practices for LLM applications.",
      "Guide delivery teams and review designs.",
    ],
    requirements: [
      "Proven experience designing enterprise AI or LLM solutions.",
      "Hands-on experience with Amazon Bedrock.",
      "Experience building RAG pipelines.",
      "Strong coding ability: you build prototypes, not just diagrams.",
      "Clear communication with business and engineering leaders.",
    ],
    niceToHave: ["AWS certification", "Experience with vector databases and search"],
    skills: ["Enterprise AI & LLM architecture", "Amazon Bedrock", "RAG pipelines"],
  }),
  J({
    slug: "azure-devops-java-baron-budd", title: "Azure DevOps with Java", company: "Baron & Budd", location: "Dallas, TX", mode: "Hybrid", level: "Mid", posted: "2026-05-20",
    summary: "High-impact DevOps engineer with strong Java experience to support and modernize Baron & Budd's systems.",
    about: [
      "We are seeking a high-impact DevOps Engineer with strong Java experience to support and modernize Baron & Budd's systems, based in Dallas, Texas.",
      "You will improve how software is built, tested and released, and help move older systems onto a modern, containerised footing.",
    ],
    responsibilities: [
      "Build and maintain Azure DevOps CI/CD pipelines for Java applications.",
      "Containerise applications with Docker and run them on Kubernetes.",
      "Automate builds, tests, security checks and releases.",
      "Support and troubleshoot existing Java systems, and help modernise them.",
      "Document pipelines and teach developers how to use them.",
    ],
    requirements: [
      "Hands-on Azure DevOps pipelines.",
      "Strong Java experience.",
      "Experience with Docker and Kubernetes.",
      "A habit of automating repeated work.",
    ],
    niceToHave: ["Infrastructure as code (Terraform or Bicep)", "Experience modernising legacy applications"],
    skills: ["Azure DevOps CI/CD pipelines", "Kubernetes", "Java", "Docker"],
  }),
];

export function newestFirst<T extends { posted: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => (a.posted < b.posted ? 1 : -1));
}

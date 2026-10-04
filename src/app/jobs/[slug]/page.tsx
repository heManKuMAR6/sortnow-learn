import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobApply } from "@/components/JobApply";
import { Reveal } from "@/components/Reveal";
import { formatDay } from "@/lib/format";
import { getJob, jobs } from "@/lib/jobs";
import { safely } from "@/lib/safe";
import { getStore } from "@/lib/platform/store";
import { getCurrentUser } from "@/lib/session";

type Params = { slug: string };

export function generateStaticParams() {
  return jobs.map((j) => ({ slug: j.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const job = getJob(slug);
  return job ? { title: `${job.title} at ${job.company}`, description: job.summary } : { title: "Job" };
}

export default async function JobPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const job = getJob(slug);
  if (!job) notFound();
  const user = await getCurrentUser();
  const applied = user ? (await safely(getStore().appliedJobs(user.id), [] as string[], "applied jobs")).includes(slug) : false;

  return (
    <article className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="text-sm text-secondary">
        <Link href="/jobs" className="text-link" data-track="crumb-jobs">
          Jobs
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{job.company}</span>
      </nav>
      <Reveal>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="chip chip-mint">{job.mode}</span>
          <span className="chip chip-sun">{job.type}</span>
          <span className="chip chip-coral">{job.level}</span>
        </div>
        <h1 className="mt-4 text-4xl sm:text-6xl">{job.title}</h1>
        <p className="mt-2 text-lg text-ink">
          {job.company} · {job.location}
        </p>
        <p className="text-sm text-muted">Posted {formatDay(job.posted)}</p>
        <p className="mt-4 text-lg text-secondary">{job.summary}</p>
      </Reveal>

      <Reveal>
        <section className="glass mt-8 grid gap-3 p-6">
          <h2 className="text-3xl">About the role</h2>
          {job.about.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {job.skills.length ? (
            <div className="mt-2">
              <p className="eyebrow mb-2">Skills</p>
              <ul className="flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <li key={s} className="chip chip-mint">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </Reveal>

      <Reveal className="mt-6">
        <JobApply slug={job.slug} signedIn={Boolean(user)} applied={applied} applyUrl={job.applyUrl} />
      </Reveal>
    </article>
  );
}

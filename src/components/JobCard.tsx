import Link from "next/link";
import type { Job } from "@/lib/jobs";
import { formatDay } from "@/lib/format";

export function JobCard({ job, applied = false }: { job: Job; applied?: boolean }) {
  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip chip-mint">{job.mode}</span>
        <span className="chip chip-sun">{job.type}</span>
        <span className="chip chip-coral">{job.level}</span>
        {applied ? <span className="chip chip-teal">✓ Applied</span> : null}
      </div>
      <h3 className="mt-3 text-3xl">
        <Link href={`/jobs/${job.slug}`} data-track={`job-${job.slug}`} className="card-link">
          {job.title}
        </Link>
      </h3>
      <p className="mt-1 text-sm font-medium text-ink">
        {job.company} · {job.location}
      </p>
      <p className="mt-2 text-sm text-secondary">{job.summary}</p>
      <p className="mt-4 flex items-center justify-between text-xs text-muted">
        <span>Posted {formatDay(job.posted)}</span>
        <span className="arrow-link">
          View role <span>→</span>
        </span>
      </p>
    </div>
  );
}

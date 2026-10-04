import Link from "next/link";
import { formatDay } from "@/lib/format";
import type { Job } from "@/lib/jobs";

export function JobCard({ job, applied = false }: { job: Job; applied?: boolean }) {
  return (
    <div className="card flex h-full flex-col p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip chip-mint">{job.mode}</span>
        <span className="chip chip-coral">{job.level}</span>
        {job.type ? <span className="chip chip-sun">{job.type}</span> : null}
        {job.status === "closed" ? <span className="chip chip-sun">Closed</span> : null}
        {applied ? <span className="chip chip-teal">✓ Applied</span> : null}
      </div>
      <h3 className="mt-3 text-3xl">
        <Link href={`/jobs/${job.slug}`} data-track={`job-${job.slug}`} className="card-link">
          {job.title}
        </Link>
      </h3>
      <p className="mt-1 text-sm font-medium text-ink">
        {job.company ? `${job.company} · ` : ""}
        {job.location}
      </p>
      <p className="mt-2 text-sm text-secondary">{job.summary}</p>
      {job.skills.length ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 4).map((s) => (
            <li key={s} className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs text-secondary">
              {s}
            </li>
          ))}
          {job.skills.length > 4 ? <li className="px-1 text-xs text-muted">+{job.skills.length - 4} more</li> : null}
        </ul>
      ) : null}
      <p className="mt-auto flex items-center justify-between pt-4 text-xs text-muted">
        <span>Posted {formatDay(job.posted)}</span>
        <span className="arrow-link">
          View role <span>→</span>
        </span>
      </p>
    </div>
  );
}

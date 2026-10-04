import type { Metadata } from "next";
import Link from "next/link";
import { AiIcon } from "@/components/AiIcon";
import { JobCard } from "@/components/JobCard";
import { Reveal } from "@/components/Reveal";
import { Stagger, StaggerItem } from "@/components/Stagger";
import { JOBS_CONTACT_EMAIL } from "@/lib/jobs";
import { loadJobs } from "@/lib/jobs-data";
import { getStore } from "@/lib/platform/store";
import { safely } from "@/lib/safe";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Open roles from people we know are hiring. Email sortNow to apply.",
};

export default async function JobsPage() {
  const user = await getCurrentUser();
  const store = getStore();
  const [jobs, admin, applied] = await Promise.all([
    loadJobs(),
    user ? safely(store.isAdmin(user), false, "isAdmin") : Promise.resolve(false),
    user ? safely(store.appliedJobs(user.id), [] as string[], "applied jobs") : Promise.resolve([] as string[]),
  ]);

  return (
    <div>
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Jobs</p>
            <h1 className="mt-3 max-w-3xl text-5xl sm:text-6xl">
              Put what you learn to work<span className="dot">.</span>
            </h1>
          </div>
          {admin ? (
            <Link href="/admin/jobs" data-track="jobs-manage" className="pill-teal">
              Manage jobs
            </Link>
          ) : null}
        </div>
        <p className="mt-4 max-w-xl text-lg text-secondary">
          {jobs.length ? `${jobs.length} open roles` : "Roles"} from people we know are hiring. To apply for any of them,
          email sortNow at{" "}
          <a href={`mailto:${JOBS_CONTACT_EMAIL}`} className="text-link" data-track="jobs-email">
            {JOBS_CONTACT_EMAIL}
          </a>
          .
        </p>
      </Reveal>

      {jobs.length ? (
        <Stagger className="mt-8 grid gap-5 md:grid-cols-2">
          {jobs.map((job) => (
            <StaggerItem key={job.slug} className="h-full">
              <JobCard job={job} applied={applied.includes(job.slug)} />
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <Reveal className="mt-8">
          <div className="glass p-8 text-center sm:p-12">
            <span className="challenge-icon mx-auto">
              <AiIcon name="compass" size={26} />
            </span>
            <h2 className="mt-4 text-3xl">No openings right now</h2>
            <p className="mx-auto mt-2 max-w-md text-secondary">
              New roles land here as people we know start hiring. Build your profile in the meantime, so you are ready
              when one does.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/settings" className="pill-teal">
                Polish my profile
              </Link>
              <a href={`mailto:${JOBS_CONTACT_EMAIL}?subject=Hiring%20through%20sortNow%20Learn`} className="pill-white">
                Hiring? Tell us
              </a>
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}

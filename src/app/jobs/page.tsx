import type { Metadata } from "next";
import { AiIcon } from "@/components/AiIcon";
import { JobCard } from "@/components/JobCard";
import { Reveal } from "@/components/Reveal";
import { Stagger, StaggerItem } from "@/components/Stagger";
import { jobsNewestFirst } from "@/lib/jobs";
import { getStore } from "@/lib/platform/store";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Roles from people we know are hiring. Apply with your sortNow Learn profile.",
};

export default async function JobsPage() {
  const jobs = jobsNewestFirst();
  const user = await getCurrentUser();
  const applied = user ? await getStore().appliedJobs(user.id) : [];

  return (
    <div>
      <Reveal>
        <p className="eyebrow">Jobs</p>
        <h1 className="mt-3 max-w-3xl text-5xl sm:text-6xl">
          Put what you learn to work<span className="dot">.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-secondary">
          Roles from people we know are hiring. Your profile, streak and portfolio are your application.
        </p>
      </Reveal>

      {jobs.length ? (
        <Stagger className="mt-8 grid gap-5 md:grid-cols-2">
          {jobs.map((job) => (
            <StaggerItem key={job.slug}>
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
              New roles land here as people we know start hiring. Build your profile in the meantime, so you are
              ready when one does.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <a href="/settings" className="pill-teal">
                Polish my profile
              </a>
              <a href="mailto:hello@sortnow.co?subject=Hiring%20through%20sortNow%20Learn" className="pill-white">
                Hiring? Tell us
              </a>
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}

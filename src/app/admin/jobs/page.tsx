import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobsAdmin } from "@/components/JobsAdmin";
import { JOBS_CONTACT_EMAIL } from "@/lib/jobs";
import { loadJobs } from "@/lib/jobs-data";
import { getStore } from "@/lib/platform/store";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Manage jobs", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  const user = await getCurrentUser();
  // Anyone who is not an admin gets the normal "not found" page, so this URL reveals nothing.
  if (!user || !(await getStore().isAdmin(user).catch(() => false))) notFound();
  const jobs = await loadJobs(true);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="eyebrow">Admin</p>
      <h1 className="mt-2 text-5xl">
        Manage jobs<span className="dot">.</span>
      </h1>
      <p className="mt-3 text-secondary">
        Only admins can see this page. Visitors see open roles on{" "}
        <Link href="/jobs" className="text-link">
          /jobs
        </Link>{" "}
        and are told to email {JOBS_CONTACT_EMAIL}. Never paste a recruiter&apos;s personal email or phone into a listing.
      </p>
      <JobsAdmin initialJobs={jobs} />
    </div>
  );
}

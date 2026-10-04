import { contactHref, JOBS_CONTACT_EMAIL, type Job } from "@/lib/jobs";

/** Every role has one contact: sortNow. No recruiter details are ever shown. */
export function ContactSortNow({ job }: { job: Pick<Job, "title" | "company"> }) {
  return (
    <div className="glass p-6">
      <p className="eyebrow">Contact sortNow</p>
      <h2 className="mt-2 text-3xl">Interested in this role?</h2>
      <p className="mt-2 text-secondary">
        Email us with the role title and a link to your profile or resume. We will take it from there.
      </p>
      <a href={contactHref(job)} data-track="job-email" className="pill-teal pill-lg mt-4">
        Email {JOBS_CONTACT_EMAIL}
      </a>
    </div>
  );
}

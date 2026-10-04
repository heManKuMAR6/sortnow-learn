import { newestFirst, starterJobs, type Job } from "@/lib/jobs";
import { getStore } from "@/lib/platform/store";

/** Open roles (or all, for admins). If the database cannot be read, the starter listings stand in. */
export async function loadJobs(includeClosed = false): Promise<Job[]> {
  try {
    return newestFirst(await getStore().listJobs({ includeClosed }));
  } catch (error) {
    console.error("[jobs] falling back to starter listings:", error instanceof Error ? error.message : error);
    return newestFirst(starterJobs.filter((j) => includeClosed || j.status === "open"));
  }
}

export async function loadJob(slug: string, includeClosed = false): Promise<Job | null> {
  try {
    return await getStore().getJob(slug, { includeClosed });
  } catch (error) {
    console.error("[jobs] falling back to starter listing:", error instanceof Error ? error.message : error);
    const job = starterJobs.find((j) => j.slug === slug);
    return job && (includeClosed || job.status === "open") ? job : null;
  }
}

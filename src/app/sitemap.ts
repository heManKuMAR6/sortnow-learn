import type { MetadataRoute } from "next";
import { lessons, posts } from "@/lib/content";
import { loadJobs } from "@/lib/jobs-data";
import { igPosts } from "@/lib/ig-posts";
import { SITE_URL } from "@/lib/site";

const base = SITE_URL;

// Built per request so it lists the jobs that are open right now.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const openJobs = await loadJobs();
  const fixed = ["", "/learn", "/challenges", "/jobs", "/notes", "/week", "/ig", "/newsletter"].map((path) => ({ url: `${base}${path}` }));
  return [
    ...fixed,
    ...lessons.map((l) => ({ url: `${base}/learn/${l.track}/${l.slug}` })),
    ...posts.map((p) => ({ url: `${base}/posts/${p.slug}`, lastModified: p.date })),
    ...openJobs.map((j) => ({ url: `${base}/jobs/${j.slug}`, lastModified: j.posted })),
    ...igPosts.map((p) => ({ url: `${base}/ig/${p.slug}` })),
  ];
}

import type { MetadataRoute } from "next";
import { lessons, posts } from "@/lib/content";
import { igPosts } from "@/lib/ig-posts";

const base = "https://learn.sortnow.co";

export default function sitemap(): MetadataRoute.Sitemap {
  const fixed = ["", "/learn", "/notes", "/week", "/ig"].map((path) => ({ url: `${base}${path}` }));
  return [
    ...fixed,
    ...lessons.map((l) => ({ url: `${base}/learn/${l.track}/${l.slug}` })),
    ...posts.map((p) => ({ url: `${base}/posts/${p.slug}`, lastModified: p.date })),
    ...igPosts.map((p) => ({ url: `${base}/ig/${p.slug}` })),
  ];
}

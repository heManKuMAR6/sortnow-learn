import type { Metadata } from "next";
import Link from "next/link";
import { NotesGate } from "@/components/NotesGate";
import { hasNotesAccess } from "@/lib/gate";
import { Reveal } from "@/components/Reveal";
import { Stagger, StaggerItem } from "@/components/Stagger";
import { postsNewestFirst } from "@/lib/content";
import { formatDay } from "@/lib/format";

export const metadata: Metadata = {
  title: "Notes",
  description: "Short notes on the words, the measurements, and the questions that show up when people put models into real work.",
};

export default async function NotesPage() {
  if (!(await hasNotesAccess())) return <NotesGate next="/notes" />;
  const posts = postsNewestFirst();
  return (
    <div>
      <Reveal>
        <p className="eyebrow">Notes</p>
        <h1 className="mt-3 text-5xl sm:text-6xl">
          Plain words for real work<span className="dot">.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-secondary">
          A few notes on the words, the measurements, and the questions that show up when people put models into
          real work.
        </p>
        <p className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/week" data-track="notes-week" className="pill-white">
            This week&apos;s note
          </Link>
          <Link href="/ig" data-track="notes-drops" className="pill-white">
            Reel drops
          </Link>
        </p>
      </Reveal>
      <Stagger className="mt-10 grid gap-5 md:grid-cols-2">
        {posts.map((post) => (
          <StaggerItem key={post.slug}>
            <article className="card h-full p-6">
              <p className="text-sm text-muted">{formatDay(post.date)}</p>
              <h2 className="mt-2 text-3xl">
                <Link href={`/posts/${post.slug}`} data-track={`post-${post.slug}`} className="card-link">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 text-secondary">{post.excerpt}</p>
              <p className="mt-4">
                <span className="arrow-link">
                  Read <span>→</span>
                </span>
              </p>
            </article>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}

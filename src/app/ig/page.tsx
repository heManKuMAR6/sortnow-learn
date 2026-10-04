import type { Metadata } from "next";
import Link from "next/link";
import { igPostsNewestFirst } from "@/lib/ig-posts";

export const metadata: Metadata = {
  title: "Reel drops",
  description: "The prompts, skills and notes from each reel, in one place. Each drop stays up.",
};

export default function IgIndexPage() {
  const posts = igPostsNewestFirst();

  return (
    <div className="max-w-2xl">
      <p className="eyebrow">Reel drops</p>
      <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">The prompts behind the reels<span className="dot">.</span></h1>
      <p className="mt-4 text-secondary">Every reel gets its own drop: a prompt, the notes, and links to keep. Open one and leave your name and email to unlock it.</p>
      <ul className="mt-10 grid gap-8">
        {posts.map((post) => (
          <li key={post.slug}>
            <p className="text-sm text-muted">{post.dateLabel}</p>
            <h2 className="mt-1 text-2xl">
              <Link href={`/ig/${post.slug}`} data-track={`ig-index-${post.slug}`} className="text-link">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 text-secondary">{post.explanation}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

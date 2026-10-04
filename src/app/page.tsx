import type { Metadata } from "next";
import Link from "next/link";
import { postsNewestFirst } from "@/lib/content";
import { formatDay } from "@/lib/format";

export const metadata: Metadata = {
  title: "Notes",
};

export default function HomePage() {
  const posts = postsNewestFirst();

  return (
    <div>
      <section className="max-w-3xl pt-6 pb-12">
        <p className="font-heading text-sm font-semibold text-teal">Are you sorted?</p>
        <h1 className="mt-3 max-w-3xl text-5xl font-semibold leading-[1.05] sm:text-6xl">
          We untangle the lesson and make it stick.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-secondary">
          Short videos, the points that matter, and a place to ask while you watch.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/learn" data-track="hero-lessons" className="pill-coral">
            Start a lesson
          </Link>
          <Link href="#notes" data-track="hero-notes" className="pill-white">
            Read the notes
          </Link>
        </div>
      </section>
      <section id="notes">
        <h2 className="text-3xl font-semibold">Notes</h2>
        <p className="mt-2 max-w-xl text-secondary">
          A few notes on the words, the measurements, and the questions that show up when people put
          models into real work.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <article key={post.slug} className="glass p-5">
              <p className="text-sm text-muted">{formatDay(post.date)}</p>
              <h3 className="mt-2 text-2xl font-semibold">
                <Link href={`/posts/${post.slug}`} data-track={`post-${post.slug}`} className="text-link">
                  {post.title}
                </Link>
              </h3>
              <p className="mt-2 text-secondary">{post.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

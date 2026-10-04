import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/Reveal";
import { getPost, posts, postsNewestFirst } from "@/lib/content";
import { formatDay } from "@/lib/format";

type Params = { slug: string };

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Note" };
  return { title: post.title, description: post.excerpt };
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const ordered = postsNewestFirst();
  const at = ordered.findIndex((item) => item.slug === post.slug);
  const newer = at > 0 ? ordered[at - 1] : undefined;
  const older = at < ordered.length - 1 ? ordered[at + 1] : undefined;
  const minutes = Math.max(1, Math.round(post.body.join(" ").split(/\s+/).length / 200));

  return (
    <article className="mx-auto max-w-3xl">
      <p className="text-sm text-muted">
        {formatDay(post.date)} · {minutes} min read
      </p>
      <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">{post.title}</h1>
      <Reveal>
      <div className="glass mt-6 grid gap-5 p-6 text-[1.05rem] sm:p-8">
        {post.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      </Reveal>
      <nav aria-label="More notes" className="mt-8 grid gap-4 sm:grid-cols-2">
        {newer ? (
          <div className="card p-5">
            <p className="eyebrow">← Newer</p>
            <Link href={`/posts/${newer.slug}`} data-track="post-newer" className="card-link mt-2 block font-heading text-lg text-teal">
              {newer.title}
            </Link>
          </div>
        ) : (
          <div />
        )}
        {older ? (
          <div className="card p-5 sm:text-right">
            <p className="eyebrow">Older →</p>
            <Link href={`/posts/${older.slug}`} data-track="post-older" className="card-link mt-2 block font-heading text-lg text-teal">
              {older.title}
            </Link>
          </div>
        ) : null}
      </nav>
      <p className="mt-8">
        <Link href="/notes" data-track="back-to-notes" className="pill-white text-sm">
          All notes
        </Link>
      </p>
    </article>
  );
}

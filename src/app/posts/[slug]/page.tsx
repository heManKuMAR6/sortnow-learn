import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, posts } from "@/lib/content";
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

  return (
    <article className="max-w-3xl">
      <p className="text-sm text-muted">{formatDay(post.date)}</p>
      <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">{post.title}</h1>
      <div className="glass mt-6 grid gap-4 p-6">
        {post.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <p className="mt-8">
        <Link href="/" data-track="back-to-notes" className="pill-white text-sm">
          All notes
        </Link>
      </p>
    </article>
  );
}

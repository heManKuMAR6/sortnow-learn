import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IgLanding } from "@/components/IgLanding";
import { getIgPost, igPosts } from "@/lib/ig-posts";

type Params = { slug: string };

export function generateStaticParams() {
  return igPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getIgPost(slug);
  if (!post) return { title: "This week" };
  return { title: post.title, description: post.explanation };
}

export default async function IgPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getIgPost(slug);
  if (!post) notFound();
  return <IgLanding post={post} />;
}

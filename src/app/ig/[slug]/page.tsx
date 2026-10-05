import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { IgLanding } from "@/components/IgLanding";
import { LockedDrop } from "@/components/LockedDrop";
import { getIgPost, igPosts } from "@/lib/ig-posts";
import { isLeadUnlocked, LEAD_COOKIE } from "@/lib/lead-cookie";

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
  if (!post) return { title: "Reel drop" };
  return { title: post.title, description: post.explanation };
}

export default async function IgPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getIgPost(slug);
  if (!post) notFound();
  const unlocked = isLeadUnlocked((await cookies()).get(LEAD_COOKIE)?.value);
  return unlocked ? <IgLanding post={post} /> : <LockedDrop post={post} />;
}

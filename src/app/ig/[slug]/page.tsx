import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { IgLanding } from "@/components/IgLanding";
import { LockedDrop } from "@/components/LockedDrop";
import { getIgPost, igPosts } from "@/lib/ig-posts";
import { isSupabaseConfigured } from "@/lib/env";
import { isLeadUnlocked, LEAD_COOKIE } from "@/lib/lead-cookie";
import { createClient } from "@/lib/supabase/server";

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
  // Open for anyone who left their details here, or who is signed in.
  const leadOk = isLeadUnlocked((await cookies()).get(LEAD_COOKIE)?.value);
  const signedIn = await isSignedIn();
  return leadOk || signedIn ? <IgLanding post={post} signedIn={signedIn} /> : <LockedDrop post={post} />;
}

async function isSignedIn(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user != null;
  } catch {
    return false;
  }
}

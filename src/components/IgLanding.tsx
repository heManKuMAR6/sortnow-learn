"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LearningMark } from "@/components/LearningMark";
import { Reveal } from "@/components/Reveal";
import type { IgPost } from "@/lib/ig-posts";

const marks = [25, 50, 75, 100] as const;
const seen = new Set<string>();

function postEvent(path: string, type: "view" | "scroll", depth: number | null) {
  const key = type === "view" ? `${path}:view` : `${path}:scroll:${depth}`;
  if (seen.has(key)) return;
  seen.add(key);
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      path,
      target: type === "view" ? "ig" : null,
      depth,
      createdAt: new Date().toISOString(),
    }),
    keepalive: true,
  }).catch(() => undefined);
}

function ReelStill({ slug, title }: { slug: string; title: string }) {
  const [missing, setMissing] = useState(false);
  if (missing) {
    return (
      <div className="reel-still">
        <LearningMark size="hero" />
        <p className="font-heading text-2xl font-semibold leading-tight">{title}</p>
        <p className="text-secondary">The reel still goes here</p>
      </div>
    );
  }
  return (
    <div className="reel-still reel-still-photo">
      {/* The file is optional. A missing still falls back to the drawn frame. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/ig/${slug}.png`}
        alt=""
        className="reel-photo"
        onError={() => setMissing(true)}
      />
    </div>
  );
}

function CopyPrompt({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" className="pill-coral" data-track="ig-copy-prompt" onClick={() => void copy()}>
      {copied ? "Copied" : "Copy the prompt"}
    </button>
  );
}

export function IgLanding({ post }: { post: IgPost }) {
  const pathname = usePathname();

  useEffect(() => {
    postEvent(pathname, "view", null);
    const root = document.querySelector(".page-scroll");
    if (!(root instanceof HTMLElement)) return;

    const measure = () => {
      const room = root.scrollHeight - root.clientHeight;
      const depth = room <= 0 ? 100 : Math.min(100, Math.round((root.scrollTop / room) * 100));
      for (const mark of marks) {
        if (depth >= mark) postEvent(pathname, "scroll", mark);
      }
    };

    measure();
    root.addEventListener("scroll", measure, { passive: true });
    return () => root.removeEventListener("scroll", measure);
  }, [pathname]);

  return (
    <article className="ig-layout">
      <ReelStill slug={post.slug} title={post.title} />
      <div className="ig-read">
        <Reveal>
          <p className="text-sm font-semibold text-teal">{post.dateLabel}</p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.08] sm:text-5xl">{post.title}</h1>
          <p className="mt-5 max-w-xl text-lg">{post.explanation}</p>
          <p className="mt-3 max-w-xl text-secondary">{post.howItHelps}</p>
          <div className="mt-8">
            <p className="text-sm font-semibold text-secondary">From the reel</p>
            <p className="mt-2 max-w-xl">{post.sample}</p>
          </div>
        </Reveal>

        <Reveal className="mt-14" delay={0.05}>
          <h2 className="text-2xl font-semibold">Try this prompt</h2>
          <pre className="prompt-block">{post.prompt}</pre>
          <div className="mt-4">
            <CopyPrompt text={post.prompt} />
          </div>
        </Reveal>

        <Reveal className="mt-14" delay={0.05}>
          <h2 className="text-2xl font-semibold">Notes</h2>
          <ul className="mt-4 grid max-w-xl gap-3">
            {post.notes.map((note) => (
              <li key={note} className="flex gap-3">
                <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-mint" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="mt-14" delay={0.05}>
          <h2 className="text-2xl font-semibold">Keep going</h2>
          <ul className="mt-4 grid gap-2">
            {post.links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} data-track={`ig-link-${link.href}`} className="text-link text-lg">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm text-secondary">{post.nextLine}</p>
          <p className="mt-3 text-sm">
            <Link href="/ig" data-track="ig-all-weeks" className="text-link">
              All weeks
            </Link>
          </p>
        </Reveal>
      </div>
    </article>
  );
}

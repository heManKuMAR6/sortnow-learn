"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GoogleButton, googleEnabled } from "@/components/GoogleButton";
import { PuzzleMark } from "@/components/PuzzleMark";
import { Reveal } from "@/components/Reveal";
import { SIGNUP_CONSENT_TEXT } from "@/lib/consent";
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
        <PuzzleMark size={84} />
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

function CopyPrompt({
  text,
  label = "Copy the prompt",
  track = "ig-copy-prompt",
}: {
  text: string;
  label?: string;
  track?: string;
}) {
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
    <button type="button" className="pill-coral" data-track={track} onClick={() => void copy()}>
      {copied ? "Copied" : label}
    </button>
  );
}

export function IgLanding({ post, signedIn = false }: { post: IgPost; signedIn?: boolean }) {
  const pathname = usePathname();

  useEffect(() => {
    postEvent(pathname, "view", null);
    const measure = () => {
      const el = document.documentElement;
      const room = el.scrollHeight - el.clientHeight;
      const depth = room <= 0 ? 100 : Math.min(100, Math.round((el.scrollTop / room) * 100));
      for (const mark of marks) {
        if (depth >= mark) postEvent(pathname, "scroll", mark);
      }
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    return () => window.removeEventListener("scroll", measure);
  }, [pathname]);

  return (
    <article className="ig-layout">
      <ReelStill slug={post.slug} title={post.title} />
      <div className="ig-read">
        <Reveal>
          <p className="text-sm font-semibold text-teal">{post.dateLabel}</p>
          <h1 className="mt-3 text-4xl leading-[1.08] sm:text-5xl">{post.title}</h1>
          <p className="mt-5 max-w-xl text-lg">{post.explanation}</p>
          <p className="mt-3 max-w-xl text-secondary">{post.howItHelps}</p>
          <div className="mt-8">
            <p className="text-sm font-semibold text-secondary">From the reel</p>
            <p className="mt-2 max-w-xl">{post.sample}</p>
          </div>
        </Reveal>

        {!signedIn && googleEnabled ? (
          <Reveal className="mt-10" delay={0.05}>
            <div className="card grid max-w-xl gap-3 p-5">
              <p className="font-medium text-ink">
                Save your spot — continue with Google to keep your progress and get the next drop.
              </p>
              <GoogleButton next={`/ig/${post.slug}`} track="ig-save-spot-google" consentText={SIGNUP_CONSENT_TEXT} />
            </div>
          </Reveal>
        ) : null}

        {post.skillFile ? (
          <Reveal className="mt-14" delay={0.05}>
            <h2 className="text-2xl">The skill from the reel</h2>
            <p className="mt-2 text-sm text-secondary">
              <code className="prompt-path">{post.skillFile.path}</code>
            </p>
            <pre className="prompt-block prompt-file">{post.skillFile.content}</pre>
            <div className="mt-4">
              <CopyPrompt text={post.skillFile.content} label="Copy SKILL.md" track="ig-copy-skillmd" />
            </div>
          </Reveal>
        ) : null}

        <Reveal className="mt-14" delay={0.05}>
          <h2 className="text-2xl">{post.prompts?.length ? "Build your own" : "Try this prompt"}</h2>
          {post.prompts?.length ? <h3 className="mt-5 text-xl">Turn a task you repeat into a skill</h3> : null}
          <pre className="prompt-block">{post.prompt}</pre>
          <div className="mt-4">
            <CopyPrompt text={post.prompt} track={post.prompts?.length ? "ig-copy-prompt-0" : "ig-copy-prompt"} />
          </div>
          {post.prompts?.map((p, i) => (
            <div key={p.title} className="mt-10">
              <h3 className="text-xl">{p.title}</h3>
              <p className="mt-1 text-sm text-secondary">{p.when}</p>
              <pre className="prompt-block">{p.body}</pre>
              <div className="mt-4">
                <CopyPrompt text={p.body} track={`ig-copy-prompt-${i + 1}`} />
              </div>
            </div>
          ))}
        </Reveal>

        {post.ideas?.length ? (
          <Reveal className="mt-14" delay={0.05}>
            <h2 className="text-2xl">Starter skill ideas</h2>
            <ul className="mt-4 grid max-w-xl gap-3">
              {post.ideas.map((idea) => (
                <li key={idea} className="flex gap-3">
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-mint" />
                  <span>{idea}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}

        {post.resources?.length ? (
          <Reveal className="mt-14" delay={0.05}>
            <h2 className="text-2xl">Downloads and links</h2>
            <ul className="mt-4 grid max-w-xl gap-3">
              {post.resources.map((r) => (
                <li key={r.href}>
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-track={`ig-resource-${r.kind}`}
                    className="card flex items-center justify-between gap-3 p-4"
                  >
                    <span className="font-medium text-ink">{r.label}</span>
                    <span className="chip chip-mint uppercase">{r.kind}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}

        <Reveal className="mt-14" delay={0.05}>
          <h2 className="text-2xl">Notes</h2>
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
          <h2 className="text-2xl">Keep going</h2>
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

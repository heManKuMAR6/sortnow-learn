"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AiIcon } from "@/components/AiIcon";

const KEY = "sn_newsletter";
const DELAY_MS = 45_000;
const SNOOZE_DAYS = 14;
const QUIET = ["/login", "/signup", "/settings"];

type Saved = { state: "subscribed" | "dismissed"; at: number };

function readSaved(): Saved | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function save(state: Saved["state"]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ state, at: Date.now() }));
  } catch {
    // ignore
  }
}

/** After a while on the site, ask once, in our own style, about the weekly email. */
export function NewsletterPrompt({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const quiet = QUIET.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (quiet) return;
    const saved = readSaved();
    if (saved?.state === "subscribed") return;
    if (saved?.state === "dismissed" && Date.now() - saved.at < SNOOZE_DAYS * 86_400_000) return;
    const timer = window.setTimeout(() => setOpen(true), DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [quiet]);

  function close() {
    setOpen(false);
    if (!done) save("dismissed");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signedIn ? {} : { email }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Try that once more.");
        return;
      }
      save("subscribed");
      setDone(true);
      window.setTimeout(() => setOpen(false), 2600);
    } catch {
      setError("The line hiccuped. Try once more.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="news-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="news-card glass"
            role="dialog"
            aria-modal="true"
            aria-labelledby="news-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === "Escape" && close()}
          >
            <div className="news-icon">
              <AiIcon name="spark" size={26} />
            </div>
            {done ? (
              <>
                <h2 id="news-title" className="mt-4 text-3xl">
                  You&apos;re in<span className="dot">.</span>
                </h2>
                <p className="mt-2 text-secondary">See you next week with something worth knowing.</p>
              </>
            ) : (
              <>
                <h2 id="news-title" className="mt-4 text-3xl">
                  Stay a step ahead<span className="dot">.</span>
                </h2>
                <p className="mt-2 text-secondary">
                  A short email each week on AI: what changed, what to learn next, and one thing to try. No spam,
                  leave any time.
                </p>
                <form onSubmit={(e) => void submit(e)} className="mt-5 grid gap-3">
                  {signedIn ? null : (
                    <label className="grid gap-1 text-sm">
                      Email
                      <input
                        className="field"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </label>
                  )}
                  {error ? <p className="text-sm text-coral">{error}</p> : null}
                  <div className="flex flex-wrap gap-3">
                    <button type="submit" className="pill-teal" disabled={pending} data-track="newsletter-yes">
                      {pending ? "One moment…" : signedIn ? "Yes, send it to me" : "Yes, count me in"}
                    </button>
                    <button type="button" className="pill-white" onClick={close} data-track="newsletter-no">
                      Not now
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

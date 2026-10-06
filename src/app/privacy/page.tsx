import type { Metadata } from "next";
import Link from "next/link";
import { CONSENT_VERSION } from "@/lib/consent";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "What sortNow Learn collects, why, who can see it, and how to remove it.",
};

const rows: [string, string, string][] = [
  ["Name, email, phone", "When you unlock a reel drop or the notes.", "To give you the content, contact you about it, and send the weekly newsletter (you agreed on the form)."],
  ["Name, email, password", "When you create an account.", "To run your account. Passwords are hashed by our sign-in provider; we never see them."],
  ["Phone number (members, optional)", "Only if you add one at sign-up or in Settings.", "So sortNow can reach you about roles you ask about. It is private and never shown on your profile. Remove it any time in Settings."],
  ["Profile details", "Only what you choose to add: photo, headline, bio, skills, links, portfolio.", "To show your public profile at /u/your-handle. Your email is never shown."],
  ["Points, streak, completed lessons and challenges", "As you use the site.", "To show your progress and rank you fairly."],
  ["Activity: pages viewed, clicks, scroll depth, time on a page, where you came from, browser type", "Only while you are signed in to an account. Nothing is recorded about visitors who have not signed in.", "To improve the lessons and notes and to show your own progress."],
  ["Which post brought you here", "When you leave your details after clicking a link we shared (a short tag such as ig-week-41 in the link).", "So we know which post or newsletter works."],
  ["Job interest", "When you tell us you are interested in a role.", "So sortNow can follow up with you about that role."],
];

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl">
      <p className="eyebrow">Privacy</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">What we keep, and why</h1>
      <p className="mt-4 text-lg text-secondary">
        sortNow Learn is run by sortNow &amp; Company. We ask for your details so we can give you free lessons and notes and, if
        you agree, send you a weekly newsletter. We do not sell your data.
      </p>

      <div className="mt-8 grid gap-3">
        {rows.map(([what, when, why]) => (
          <div key={what} className="card p-5">
            <p className="font-semibold">{what}</p>
            <p className="mt-1 text-sm text-secondary"><span className="text-muted">When: </span>{when}</p>
            <p className="mt-1 text-sm text-secondary"><span className="text-muted">Why: </span>{why}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-2xl">Your agreement</h2>
      <p className="mt-2 text-secondary">
        Every form that collects your details has an unticked box you must tick, with the exact words you are agreeing to. We
        save those words (version {CONSENT_VERSION}) and the time, next to your details.
      </p>

      <h2 className="mt-8 text-2xl">Who can see it</h2>
      <p className="mt-2 text-secondary">
        Only a small number of sortNow administrators can see leads, subscribers and activity. Your public profile is visible
        to anyone. Our database and sign-in are hosted with Supabase and the site with Vercel, both in the United States.
      </p>

      <h2 className="mt-8 text-2xl">Cookies</h2>
      <p className="mt-2 text-secondary">
        We use a sign-in cookie, a cookie that remembers you unlocked the notes, and, only while you are signed in, a small tab-session
        id that links the pages you view in one visit. We do not use advertising cookies.
      </p>

      <h2 className="mt-8 text-2xl">Your choices</h2>
      <ul className="mt-2 grid list-disc gap-2 pl-5 text-secondary">
        <li>Unsubscribe from the newsletter in one click with the link in every email, or at <Link className="text-link" href="/unsubscribe">/unsubscribe</Link>.</li>
        <li>Delete your account and everything attached to it yourself in <Link className="text-link" href="/settings">Settings</Link>.</li>
        <li>
          Ask us to show, correct or delete anything we hold about you, including details you left on a form, by emailing{" "}
          <a className="text-link" href="mailto:hello@sortnow.co">hello@sortnow.co</a>. We act on it within 30 days.
        </li>
      </ul>
      <p className="mt-8 text-sm text-muted">We keep your details until you ask us to remove them or you delete your account.</p>
    </article>
  );
}

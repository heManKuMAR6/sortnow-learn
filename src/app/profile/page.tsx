import type { Metadata } from "next";
import Link from "next/link";
import { ProfileNameForm } from "@/components/ProfileNameForm";
import { SignOutButton } from "@/components/SignOutButton";
import { achievementsFor, practiceStats } from "@/lib/challenges";
import { initialsFrom } from "@/lib/initials";
import { listCompletions } from "@/lib/practice";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="max-w-xl">
        <p className="font-heading text-sm font-semibold text-teal">Profile</p>
        <h1 className="mt-3 text-4xl font-semibold">Your profile</h1>
        <p className="mt-4 text-secondary">Sign in to see your name, your streak, and the days you have finished.</p>
        <p className="mt-6">
          <Link href="/login" data-track="profile-sign-in" className="pill-teal text-sm">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  const practice = await listCompletions(user);
  const stats = practiceStats(practice.completions);
  const achievements = achievementsFor(practice.completions);
  const initials = initialsFrom(user.displayName, user.email);
  const streakLabel = stats.streak === 1 ? "1 day" : `${stats.streak} days`;

  return (
    <div className="max-w-3xl">
      <p className="font-heading text-sm font-semibold text-teal">Profile</p>
      <div className="mt-4 flex items-center gap-4">
        <span className="initials-mark initials-mark-lg" aria-hidden="true">
          {initials}
        </span>
        <div>
          <h1 className="text-4xl font-semibold">{user.displayName ?? "Your profile"}</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <section className="glass p-4">
          <p className="text-sm text-muted">Daily streak</p>
          <p className="mt-1 text-3xl font-semibold">{streakLabel}</p>
          <p className="mt-2 text-sm text-secondary">
            {stats.streak === 0
              ? "Save a day to start."
              : stats.practicedToday
                ? "Saved today."
                : "Includes yesterday. Save a day today to keep it going."}
          </p>
        </section>
        <section className="glass p-4">
          <p className="text-sm text-muted">Today</p>
          <p className="mt-1 text-3xl font-semibold">{stats.dailyCount}</p>
          <p className="mt-2 text-sm text-secondary">
            {stats.dailyCount === 1 ? "Challenge saved today." : "Challenges saved today."}
          </p>
        </section>
        <section className="glass p-4">
          <p className="text-sm text-muted">Days practiced</p>
          <p className="mt-1 text-3xl font-semibold">{stats.daysPracticed}</p>
          <p className="mt-2 text-sm text-secondary">Days with at least one saved challenge.</p>
        </section>
      </div>

      <section className="glass mt-6 p-5 sm:p-6">
        <h2 className="text-2xl font-semibold">Name</h2>
        <div className="mt-4">
          <ProfileNameForm key={user.displayName ?? "unset"} initialName={user.displayName} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">Achievements</h2>
        <p className="mt-2 max-w-xl text-secondary">
          These open when you finish real days on this site. Nothing here is filled in ahead of time.
        </p>
        {practice.error ? <p className="mt-4 text-sm text-coral">{practice.error}</p> : null}
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {achievements.map((item) => (
            <li key={item.id} className="rounded-3xl bg-white/55 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                {item.unlocked ? (
                  <span className="chip chip-sun">Unlocked</span>
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Not yet</span>
                )}
              </div>
              <p className="mt-2 text-sm text-secondary">{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href="/daily" data-track="profile-daily" className="pill-coral text-sm">
          Daily practice
        </Link>
        <SignOutButton mode={user.mode} />
      </div>
    </div>
  );
}

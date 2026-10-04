import Link from "next/link";
import { LearningMark } from "@/components/LearningMark";
import { SignOutButton } from "@/components/SignOutButton";
import type { AppUser } from "@/lib/session";

const links = [
  { href: "/", label: "Notes", track: "nav-notes" },
  { href: "/learn", label: "Lessons", track: "nav-lessons" },
  { href: "/activity", label: "Activity", track: "nav-activity" },
];

export function SiteHeader({ user }: { user: AppUser | null }) {
  return (
    <header className="site-header">
      <div className="header-bar">
        <div className="brand-cluster">
          <Link href="/" data-track="brand" className="wordmark-btn">
            sortNow
          </Link>
          <LearningMark />
          <span className="learn-label">Learn</span>
        </div>
        <nav aria-label="Primary" className="header-nav">
          {links.map((link) => (
            <Link key={link.href} href={link.href} data-track={link.track} className="nav-link">
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/activity" data-track="nav-account" className="pill-teal max-w-[12rem] truncate text-sm">
                {user.email}
              </Link>
              <SignOutButton mode={user.mode} />
            </>
          ) : (
            <Link href="/login" data-track="nav-sign-in" className="pill-teal text-sm">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

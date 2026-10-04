"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AiIcon } from "@/components/AiIcon";
import { Brand } from "@/components/PuzzleMark";
import { SignOutButton } from "@/components/SignOutButton";
import { UserMenu, type MenuProfile } from "@/components/UserMenu";

const links = [
  { href: "/learn", label: "Lessons", track: "nav-lessons" },
  { href: "/challenges", label: "Challenges", track: "nav-challenges" },
  { href: "/jobs", label: "Jobs", track: "nav-jobs" },
  { href: "/notes", label: "Notes", track: "nav-notes" },
];

function isActive(pathname: string, href: string) {
  if (href === "/notes") return pathname === "/notes" || pathname.startsWith("/posts") || pathname.startsWith("/week");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type HeaderProfile = MenuProfile & { points: number; streak: number };

/** `limbo` is set when someone is signed in but their profile could not load. */
export function SiteHeader({ profile, limbo }: { profile: HeaderProfile | null; limbo?: "supabase" | "demo" }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenu(false);
  }, [pathname]);

  return (
    <header className={`site-header${scrolled ? " scrolled" : ""}`}>
      <div className="header-bar">
        <Link href="/" data-track="brand" className="brand-link" aria-label="sortNow Learn home">
          <Brand />
        </Link>
        <nav id="primary-nav" aria-label="Primary" className={`header-nav${menu ? " open" : ""}`}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-track={link.track}
              className="nav-link"
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-end">
          {profile ? (
            <>
              <Link href="/dashboard" className="stat-chip" data-track="nav-stats" title="Your streak and points">
                <span className="stat-chip-item streak">
                  <AiIcon name="flame" size={16} /> {profile.streak}
                </span>
                <span className="stat-chip-item">
                  <AiIcon name="spark" size={16} /> {profile.points}
                </span>
              </Link>
              <UserMenu profile={profile} />
            </>
          ) : limbo ? (
            <SignOutButton mode={limbo} />
          ) : (
            <>
              <Link href="/login" data-track="nav-sign-in" className="nav-link hidden sm:inline-block">
                Sign in
              </Link>
              <Link href="/signup" data-track="nav-join" className="pill-teal text-sm">
                Join free
              </Link>
            </>
          )}
          <button
            type="button"
            className="menu-btn"
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
            aria-controls="primary-nav"
            onClick={() => setMenu((open) => !open)}
          >
            {menu ? "✕" : "☰"}
          </button>
        </div>
      </div>
    </header>
  );
}

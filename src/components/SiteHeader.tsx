"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LearningMark } from "@/components/LearningMark";
import { SignOutButton } from "@/components/SignOutButton";
import type { AppUser } from "@/lib/session";

const links = [
  { href: "/", label: "Home", track: "nav-home" },
  { href: "/learn", label: "Lessons", track: "nav-lessons" },
  { href: "/notes", label: "Notes", track: "nav-notes" },
  { href: "/week", label: "This week", track: "nav-week" },
  { href: "/activity", label: "Activity", track: "nav-activity" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/notes") return pathname === "/notes" || pathname.startsWith("/posts");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ user }: { user: AppUser | null }) {
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
        <div className="brand-cluster">
          <Link href="/" data-track="brand" className="wordmark-btn" aria-label="sortNow Learn home">
            sortNow
          </Link>
          <LearningMark />
          <span className="learn-label">Learn</span>
        </div>
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

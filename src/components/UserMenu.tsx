"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { SignOutButton } from "@/components/SignOutButton";

export type MenuProfile = { displayName: string; handle: string; avatarUrl: string | null; mode: "supabase" | "demo" };

export function UserMenu({ profile }: { profile: MenuProfile }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={box}>
      <button
        type="button"
        className="avatar-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${profile.displayName}`}
        data-track="nav-account"
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar name={profile.displayName} seed={profile.handle} src={profile.avatarUrl} size={40} />
      </button>
      {open ? (
        <div className="menu-pop" role="menu">
          <div className="menu-head">
            <Avatar name={profile.displayName} seed={profile.handle} src={profile.avatarUrl} size={44} />
            <div className="min-w-0">
              <p className="truncate font-heading text-lg text-ink">{profile.displayName}</p>
              <p className="truncate text-xs text-muted">@{profile.handle}</p>
            </div>
          </div>
          <Link role="menuitem" href="/dashboard" className="menu-item" onClick={() => setOpen(false)}>
            Dashboard
          </Link>
          <Link role="menuitem" href={`/u/${profile.handle}`} className="menu-item" onClick={() => setOpen(false)}>
            My profile
          </Link>
          <Link role="menuitem" href="/settings" className="menu-item" onClick={() => setOpen(false)}>
            Edit profile
          </Link>
          <div className="menu-foot">
            <SignOutButton mode={profile.mode} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

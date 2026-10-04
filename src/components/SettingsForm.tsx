"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import type { PortfolioItem, Profile } from "@/lib/platform/types";
import { toast } from "@/lib/toast";

async function api(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await response.json().catch(() => ({}))) as { error?: string } & Record<string, unknown>;
  if (!response.ok) throw new Error(json.error ?? "Something went wrong.");
  return json;
}

/** Centre-crop to a square and shrink to 256px so the upload is tiny. */
async function squareJpeg(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that picture.");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 256, 256);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function SettingsForm({ profile, portfolio }: { profile: Profile; portfolio: PortfolioItem[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(profile.avatarUrl);
  const [form, setForm] = useState({
    displayName: profile.displayName,
    handle: profile.handle,
    headline: profile.headline,
    location: profile.location,
    bio: profile.bio,
    skills: profile.skills.join(", "),
    linkedin: profile.links.linkedin ?? "",
    github: profile.links.github ?? "",
    website: profile.links.website ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState(portfolio);
  const [piece, setPiece] = useState({ title: "", description: "", url: "", tags: "" });
  const [addError, setAddError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await squareJpeg(file);
      const { profile: next } = (await api("/api/profile/avatar", "POST", { dataUrl })) as { profile: Profile };
      setAvatar(next.avatarUrl);
      toast({ title: "Photo updated", icon: "spark" });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not upload that picture.");
    }
  }

  async function removePhoto() {
    try {
      await api("/api/profile/avatar", "DELETE");
      setAvatar(null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove it.");
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const { profile: next } = (await api("/api/profile", "PATCH", {
        displayName: form.displayName,
        handle: form.handle,
        headline: form.headline,
        location: form.location,
        bio: form.bio,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        links: { linkedin: form.linkedin, github: form.github, website: form.website },
      })) as { profile: Profile };
      setForm((f) => ({ ...f, handle: next.handle }));
      toast({ title: "Profile saved", body: "Your changes are live.", icon: "shield" });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function addPiece(event: FormEvent) {
    event.preventDefault();
    setAddError(null);
    try {
      const { item } = (await api("/api/portfolio", "POST", {
        title: piece.title,
        description: piece.description,
        url: piece.url,
        tags: piece.tags.split(",").map((s) => s.trim()).filter(Boolean),
      })) as { item: PortfolioItem };
      setItems((list) => [item, ...list]);
      setPiece({ title: "", description: "", url: "", tags: "" });
      toast({ title: "Added to your portfolio", icon: "trophy" });
      router.refresh();
    } catch (caught) {
      setAddError(caught instanceof Error ? caught.message : "Could not add that.");
    }
  }

  async function removePiece(id: string) {
    setItems((list) => list.filter((i) => i.id !== id));
    try {
      await api("/api/portfolio", "DELETE", { id });
      router.refresh();
    } catch {
      router.refresh();
    }
  }

  return (
    <div className="mt-8 grid gap-6">
      <section className="glass p-6">
        <h2 className="text-3xl">Photo</h2>
        <div className="mt-4 flex flex-wrap items-center gap-5">
          <Avatar name={form.displayName || profile.displayName} seed={profile.handle} src={avatar} size={96} />
          <div className="grid gap-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => void onPhoto(e)} />
            <button type="button" className="pill-teal text-sm" onClick={() => fileRef.current?.click()} data-track="settings-photo">
              {avatar ? "Change photo" : "Upload a photo"}
            </button>
            {avatar ? (
              <button type="button" className="text-link text-left text-sm" onClick={() => void removePhoto()}>
                Remove photo
              </button>
            ) : (
              <p className="text-xs text-muted">Without one, we show your initials.</p>
            )}
          </div>
        </div>
      </section>

      <form onSubmit={(e) => void save(e)} className="grid gap-6">
        <section className="glass grid gap-4 p-6">
          <h2 className="text-3xl">The basics</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              Name
              <input className="field" required maxLength={80} value={form.displayName} onChange={set("displayName")} />
            </label>
            <label className="grid gap-1 text-sm">
              Handle
              <input className="field" required maxLength={30} value={form.handle} onChange={set("handle")} />
              <span className="text-xs text-muted">Your profile lives at /u/{form.handle || "handle"}</span>
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            Headline
            <input className="field" maxLength={120} placeholder="Product manager learning to work with AI" value={form.headline} onChange={set("headline")} />
          </label>
          <label className="grid gap-1 text-sm">
            Location
            <input className="field" maxLength={80} placeholder="Austin, TX" value={form.location} onChange={set("location")} />
          </label>
        </section>

        <section className="glass grid gap-4 p-6">
          <h2 className="text-3xl">About you</h2>
          <label className="grid gap-1 text-sm">
            Career, work and what you are building
            <textarea className="field min-h-36" maxLength={1200} value={form.bio} onChange={set("bio")} placeholder="Where you have worked, what you are good at, what you want to do next." />
            <span className="text-xs text-muted">{form.bio.length}/1200</span>
          </label>
          <label className="grid gap-1 text-sm">
            Skills
            <input className="field" placeholder="Prompting, Data analysis, Project management" value={form.skills} onChange={set("skills")} />
            <span className="text-xs text-muted">Separate with commas. Up to 20.</span>
          </label>
        </section>

        <section className="glass grid gap-4 p-6">
          <h2 className="text-3xl">Links</h2>
          <label className="grid gap-1 text-sm">
            LinkedIn
            <input className="field" type="url" placeholder="https://linkedin.com/in/you" value={form.linkedin} onChange={set("linkedin")} />
          </label>
          <label className="grid gap-1 text-sm">
            GitHub
            <input className="field" type="url" placeholder="https://github.com/you" value={form.github} onChange={set("github")} />
          </label>
          <label className="grid gap-1 text-sm">
            Website
            <input className="field" type="url" placeholder="https://yoursite.com" value={form.website} onChange={set("website")} />
          </label>
        </section>

        {error ? <p className="text-sm text-coral">{error}</p> : null}
        <div>
          <button type="submit" className="pill-teal pill-lg" disabled={saving} data-track="settings-save">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      <section id="portfolio" className="glass p-6">
        <h2 className="text-3xl">Portfolio</h2>
        <p className="mt-1 text-secondary">Projects, write-ups, prompt libraries: anything that shows what you can do.</p>
        {items.length ? (
          <ul className="mt-4 grid gap-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white/70 p-4">
                <div className="min-w-0">
                  <p className="font-heading text-lg text-teal">{item.title}</p>
                  {item.description ? <p className="text-sm text-secondary">{item.description}</p> : null}
                  {item.url ? <p className="truncate text-xs text-muted">{item.url}</p> : null}
                </div>
                <button type="button" className="text-link shrink-0 text-sm" onClick={() => void removePiece(item.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <form onSubmit={(e) => void addPiece(e)} className="mt-5 grid gap-3 border-t border-black/5 pt-5">
          <p className="eyebrow">Add a piece</p>
          <input className="field" required maxLength={100} placeholder="Title" value={piece.title} onChange={(e) => setPiece({ ...piece, title: e.target.value })} />
          <textarea className="field" maxLength={600} placeholder="What it is and what you did (optional)" value={piece.description} onChange={(e) => setPiece({ ...piece, description: e.target.value })} />
          <input className="field" type="url" placeholder="Link (optional) https://…" value={piece.url} onChange={(e) => setPiece({ ...piece, url: e.target.value })} />
          <input className="field" placeholder="Tags, separated by commas (optional)" value={piece.tags} onChange={(e) => setPiece({ ...piece, tags: e.target.value })} />
          {addError ? <p className="text-sm text-coral">{addError}</p> : null}
          <div>
            <button type="submit" className="pill-white" data-track="portfolio-add">
              Add to portfolio
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

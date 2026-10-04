"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { JOB_LEVELS, JOB_MODES, JOB_TYPES, type Job } from "@/lib/jobs";
import { toast } from "@/lib/toast";

type Draft = {
  slug: string;
  title: string;
  company: string;
  location: string;
  mode: string;
  level: string;
  type: string;
  posted: string;
  summary: string;
  about: string;
  skills: string;
  status: "open" | "closed";
};

const today = () => new Date().toISOString().slice(0, 10);
const blank = (): Draft => ({
  slug: "",
  title: "",
  company: "",
  location: "",
  mode: "Remote",
  level: "Mid",
  type: "",
  posted: today(),
  summary: "",
  about: "",
  skills: "",
  status: "open",
});

const toDraft = (j: Job): Draft => ({
  slug: j.slug,
  title: j.title,
  company: j.company ?? "",
  location: j.location,
  mode: j.mode,
  level: j.level,
  type: j.type ?? "",
  posted: j.posted,
  summary: j.summary,
  about: j.about.join("\n\n"),
  skills: j.skills.join(", "),
  status: j.status,
});

async function call(method: string, body: unknown) {
  const response = await fetch("/api/admin/jobs", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await response.json().catch(() => ({}))) as { error?: string; job?: Job };
  if (!response.ok) throw new Error(json.error ?? "Something went wrong.");
  return json;
}

export function JobsAdmin({ initialJobs }: { initialJobs: Job[] }) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [draft, setDraft] = useState<Draft>(blank());
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const set = (k: keyof Draft) => (e: { target: { value: string } }) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  async function save(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { job } = await call("POST", { ...draft, skills: draft.skills });
      if (job) setJobs((list) => [job, ...list.filter((j) => j.slug !== job.slug)].sort((a, b) => (a.posted < b.posted ? 1 : -1)));
      toast({ title: editing ? "Role updated" : "Role posted", body: draft.status === "open" ? "It is live on /jobs." : "Saved as closed.", icon: "trophy" });
      setDraft(blank());
      setEditing(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save.");
    } finally {
      setPending(false);
    }
  }

  async function toggle(job: Job) {
    const status = job.status === "open" ? "closed" : "open";
    try {
      await call("PATCH", { slug: job.slug, status });
      setJobs((list) => list.map((j) => (j.slug === job.slug ? { ...j, status } : j)));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not change that.");
    }
  }

  async function remove(job: Job) {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone. Closing it keeps it for later.`)) return;
    try {
      await call("DELETE", { slug: job.slug });
      setJobs((list) => list.filter((j) => j.slug !== job.slug));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete.");
    }
  }

  return (
    <div className="mt-8 grid gap-8">
      <section className="glass p-6">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-3xl">All roles</h2>
          <span className="text-sm text-muted">
            {jobs.filter((j) => j.status === "open").length} open · {jobs.filter((j) => j.status === "closed").length} closed
          </span>
        </div>
        {jobs.length ? (
          <ul className="mt-4 grid gap-3" data-testid="admin-job-list">
            {jobs.map((job) => (
              <li key={job.slug} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/70 p-4">
                <div className="min-w-0">
                  <p className="font-heading text-lg text-teal">
                    <Link href={`/jobs/${job.slug}`} className="hover:underline">
                      {job.title}
                    </Link>
                  </p>
                  <p className="text-sm text-secondary">
                    {job.company ? `${job.company} · ` : ""}
                    {job.location === job.mode ? job.location : `${job.location} · ${job.mode}`} · {job.level}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={job.status === "open" ? "chip chip-mint" : "chip chip-sun"}>{job.status === "open" ? "Open" : "Closed"}</span>
                  <button type="button" className="pill-white text-sm" onClick={() => void toggle(job)}>
                    {job.status === "open" ? "Close" : "Reopen"}
                  </button>
                  <button
                    type="button"
                    className="pill-white text-sm"
                    onClick={() => {
                      setDraft(toDraft(job));
                      setEditing(true);
                      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className="text-link text-sm" onClick={() => void remove(job)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-secondary">No roles yet. Post the first one below.</p>
        )}
      </section>

      <form onSubmit={(e) => void save(e)} className="glass grid gap-4 p-6" id="post">
        <h2 className="text-3xl">{editing ? `Editing: ${draft.title}` : "Post a role"}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            Title
            <input className="field" required maxLength={120} value={draft.title} onChange={set("title")} />
          </label>
          <label className="grid gap-1 text-sm">
            Company <span className="text-xs text-muted">(leave blank if unknown or confidential)</span>
            <input className="field" maxLength={80} value={draft.company} onChange={set("company")} />
          </label>
          <label className="grid gap-1 text-sm">
            Location
            <input className="field" required maxLength={80} placeholder="Dallas, TX or Remote" value={draft.location} onChange={set("location")} />
          </label>
          <label className="grid gap-1 text-sm">
            Posted on
            <input className="field" type="date" value={draft.posted} onChange={set("posted")} />
          </label>
          <label className="grid gap-1 text-sm">
            Work mode
            <select className="field" value={draft.mode} onChange={set("mode")}>
              {JOB_MODES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Level
            <select className="field" value={draft.level} onChange={set("level")}>
              {JOB_LEVELS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Type <span className="text-xs text-muted">(optional)</span>
            <select className="field" value={draft.type} onChange={set("type")}>
              <option value="">Not specified</option>
              {JOB_TYPES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Status
            <select className="field" value={draft.status} onChange={set("status")}>
              <option value="open">Open (visible to everyone)</option>
              <option value="closed">Closed (hidden)</option>
            </select>
          </label>
        </div>
        <label className="grid gap-1 text-sm">
          One-line summary
          <input className="field" maxLength={300} value={draft.summary} onChange={set("summary")} />
        </label>
        <label className="grid gap-1 text-sm">
          Description <span className="text-xs text-muted">(separate paragraphs with a blank line)</span>
          <textarea className="field min-h-40" value={draft.about} onChange={set("about")} />
        </label>
        <label className="grid gap-1 text-sm">
          Skills <span className="text-xs text-muted">(separate with commas)</span>
          <input className="field" value={draft.skills} onChange={set("skills")} />
        </label>
        <p className="rounded-2xl bg-sun/30 p-3 text-sm">
          Do not paste a recruiter&apos;s name, email, phone or personal links. Everyone is told to email sortNow instead.
        </p>
        {error ? <p className="text-sm text-coral">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="pill-teal pill-lg" disabled={pending} data-track="admin-job-save">
            {pending ? "Saving…" : editing ? "Save changes" : "Post role"}
          </button>
          {editing ? (
            <button
              type="button"
              className="pill-white pill-lg"
              onClick={() => {
                setDraft(blank());
                setEditing(false);
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

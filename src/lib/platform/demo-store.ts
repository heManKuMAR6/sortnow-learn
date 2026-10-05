import { randomUUID } from "crypto";
import { demoDoc, saveDemoDoc } from "@/lib/platform/demo-db";
import { deleteDemoUser } from "@/lib/demo-users";
import { gradeAnswers, getChallenge, dailyChallenge } from "@/lib/challenges";
import { getLessonBySlug } from "@/lib/content";
import { applyStreakDay, todayIn } from "@/lib/platform/dates";
import { LESSON_POINTS } from "@/lib/points";
import { starterJobs, type Job } from "@/lib/jobs";
import { HANDLE_RE, suggestHandle } from "@/lib/platform/handle";
import type { Store } from "@/lib/platform/store";
import { StoreError, type Profile } from "@/lib/platform/types";

const MAX_AVATAR_BYTES = 120_000;

async function jobsOf(): Promise<{ doc: Awaited<ReturnType<typeof demoDoc>>; jobs: Job[] }> {
  const doc = await demoDoc();
  doc.jobs ??= starterJobs.map((j) => ({ ...j }));
  return { doc, jobs: doc.jobs };
}

export const demoStore: Store = {
  async getProfileById(id) {
    return (await demoDoc()).profiles[id] ?? null;
  },

  async getProfileByHandle(handle) {
    const doc = await demoDoc();
    return Object.values(doc.profiles).find((p) => p.handle === handle.toLowerCase()) ?? null;
  },

  async ensureProfile(id, name) {
    const doc = await demoDoc();
    const existing = doc.profiles[id];
    if (existing) return existing;
    let handle = suggestHandle(name);
    for (let i = 1; Object.values(doc.profiles).some((p) => p.handle === handle); i += 1) {
      handle = suggestHandle(name, i);
    }
    const profile: Profile = {
      id,
      handle,
      displayName: name,
      headline: "",
      bio: "",
      skills: [],
      location: "",
      links: {},
      avatarUrl: null,
      points: 0,
      streak: 0,
      longestStreak: 0,
      lastActiveDay: null,
      lastCheckinDay: null,
      challengesDone: 0,
      lessonsDone: 0,
      createdAt: new Date().toISOString(),
    };
    doc.profiles[id] = profile;
    await saveDemoDoc(doc);
    return profile;
  },

  async updateProfile(id, patch) {
    const doc = await demoDoc();
    const current = doc.profiles[id];
    if (!current) throw new StoreError("No profile yet.", 404);
    if (patch.handle !== undefined) {
      const handle = patch.handle.toLowerCase();
      if (!HANDLE_RE.test(handle)) {
        throw new StoreError("Handle is 3 to 30 letters, numbers or dashes.");
      }
      if (Object.values(doc.profiles).some((p) => p.id !== id && p.handle === handle)) {
        throw new StoreError("That handle is taken.", 409);
      }
      patch = { ...patch, handle };
    }
    const next = { ...current, ...patch };
    doc.profiles[id] = next;
    await saveDemoDoc(doc);
    return next;
  },

  async setAvatar(id, bytes, mime) {
    if (bytes.byteLength > MAX_AVATAR_BYTES) throw new StoreError("That picture is too large.");
    const url = `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
    return this.updateProfile(id, { avatarUrl: url });
  },

  async getTimezone(id) {
    return (await demoDoc()).private[id]?.timezone ?? "UTC";
  },

  async setTimezone(id, tz) {
    const doc = await demoDoc();
    const cur = (doc.private[id] ??= { timezone: "UTC", tzChangedAt: null });
    if (cur.timezone === tz) return cur.timezone;
    if (cur.tzChangedAt !== null && Date.now() - cur.tzChangedAt < 7 * 86_400_000) return cur.timezone;
    doc.private[id] = { timezone: tz, tzChangedAt: Date.now() };
    await saveDemoDoc(doc);
    return tz;
  },

  async checkIn(id) {
    const doc = await demoDoc();
    const p = doc.profiles[id];
    if (!p) throw new StoreError("No profile yet.", 404);
    const day = todayIn(doc.private[id]?.timezone ?? "UTC");
    if (p.lastCheckinDay && p.lastCheckinDay >= day) {
      return { awarded: false, points: p.points, streak: p.streak, longest: p.longestStreak, day };
    }
    doc.profiles[id] = { ...p, points: p.points + 1, lastCheckinDay: day };
    const days = (doc.activity[id] ??= {});
    days[day] = (days[day] ?? 0) + 1;
    await saveDemoDoc(doc);
    return { awarded: true, points: p.points + 1, streak: p.streak, longest: p.longestStreak, day };
  },

  async completeLesson(id, slug) {
    const doc = await demoDoc();
    const p = doc.profiles[id];
    if (!p) throw new StoreError("No profile yet.", 404);
    if (!getLessonBySlug(slug)) throw new StoreError("Unknown lesson.", 404);
    if (doc.awards.some((a) => a.userId === id && a.kind === "lesson" && a.ref === slug)) {
      return { awarded: false, points: p.points, gained: 0 };
    }
    const day = todayIn(doc.private[id]?.timezone ?? "UTC");
    doc.awards.push({ userId: id, kind: "lesson", ref: slug, points: LESSON_POINTS, score: null, total: null, day });
    doc.profiles[id] = { ...p, points: p.points + LESSON_POINTS, lessonsDone: p.lessonsDone + 1 };
    const days = (doc.activity[id] ??= {});
    days[day] = (days[day] ?? 0) + LESSON_POINTS;
    await saveDemoDoc(doc);
    return { awarded: true, points: p.points + LESSON_POINTS, gained: LESSON_POINTS };
  },

  async submitChallenge(id, slug, answers) {
    const doc = await demoDoc();
    const p = doc.profiles[id];
    if (!p) throw new StoreError("No profile yet.", 404);
    const challenge = getChallenge(slug);
    if (!challenge) throw new StoreError("Unknown challenge.", 404);
    if (answers.length !== challenge.questions.length) throw new StoreError("Answer every question first.");
    const day = todayIn(doc.private[id]?.timezone ?? "UTC");
    const daily = dailyChallenge(day).slug === slug;
    const key = `${id}|${slug}|${day}`;
    const tries = doc.attempts[key] ?? 0;
    if (tries >= 3) throw new StoreError("That was your third try today. Come back tomorrow.", 429);
    doc.attempts[key] = tries + 1;
    const attemptsLeft = 3 - (tries + 1);
    const g = gradeAnswers(challenge, answers);
    const reveal = g.passed || attemptsLeft === 0;
    const base = { score: g.score, total: g.total, passed: g.passed, correct: reveal ? g.correct : null, attemptsLeft, daily };
    if (!g.passed) {
      await saveDemoDoc(doc);
      return { ...base, awarded: false, gained: 0, points: p.points, streak: p.streak, streakDay: false };
    }
    let profile = p;
    let streakDay = false;
    if (daily) {
      const r = applyStreakDay(
        { streak: p.streak, longest: p.longestStreak, lastActiveDay: p.lastActiveDay, points: p.points },
        day,
      );
      if (r.moved) {
        streakDay = true;
        profile = { ...p, streak: r.next.streak, longestStreak: r.next.longest, lastActiveDay: day };
      }
    }
    const already = doc.awards.some((a) => a.userId === id && a.kind === "challenge" && a.ref === slug);
    if (already) {
      doc.profiles[id] = profile;
      await saveDemoDoc(doc);
      return { ...base, awarded: false, gained: 0, points: p.points, streak: profile.streak, streakDay };
    }
    doc.awards.push({ userId: id, kind: "challenge", ref: slug, points: challenge.points, score: g.score, total: g.total, day });
    doc.profiles[id] = { ...profile, points: p.points + challenge.points, challengesDone: p.challengesDone + 1 };
    const days = (doc.activity[id] ??= {});
    days[day] = (days[day] ?? 0) + challenge.points;
    await saveDemoDoc(doc);
    return { ...base, awarded: true, gained: challenge.points, points: p.points + challenge.points, streak: profile.streak, streakDay };
  },

  async deleteAccount(id) {
    const doc = await demoDoc();
    delete doc.profiles[id];
    delete doc.activity[id];
    delete doc.private[id];
    doc.awards = doc.awards.filter((a) => a.userId !== id);
    doc.portfolio = doc.portfolio.filter((i) => i.userId !== id);
    doc.applications = doc.applications.filter((a) => a.userId !== id);
    await saveDemoDoc(doc);
    await deleteDemoUser(id);
  },

  async completed(id) {
    const doc = await demoDoc();
    const out = { challenges: {} as Record<string, { score: number; total: number }>, lessons: [] as string[] };
    for (const a of doc.awards) {
      if (a.userId !== id) continue;
      if (a.kind === "challenge") out.challenges[a.ref] = { score: a.score ?? 0, total: a.total ?? 0 };
      else out.lessons.push(a.ref);
    }
    return out;
  },

  async activity(id) {
    return (await demoDoc()).activity[id] ?? {};
  },

  async portfolio(id) {
    const doc = await demoDoc();
    return doc.portfolio
      .filter((i) => i.userId === id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((i) => ({ id: i.id, title: i.title, description: i.description, url: i.url, tags: i.tags, createdAt: i.createdAt }));
  },

  async addPortfolio(id, input) {
    const doc = await demoDoc();
    const item = { id: randomUUID(), createdAt: new Date().toISOString(), ...input };
    doc.portfolio.push({ ...item, userId: id });
    await saveDemoDoc(doc);
    return item;
  },

  async deletePortfolio(id, itemId) {
    const doc = await demoDoc();
    doc.portfolio = doc.portfolio.filter((i) => !(i.userId === id && i.id === itemId));
    await saveDemoDoc(doc);
  },

  async applyToJob(id, jobSlug, note) {
    const doc = await demoDoc();
    if (doc.applications.some((a) => a.userId === id && a.jobSlug === jobSlug)) return { created: false };
    doc.applications.push({ userId: id, jobSlug, note, createdAt: new Date().toISOString() });
    await saveDemoDoc(doc);
    return { created: true };
  },

  async appliedJobs(id) {
    return (await demoDoc()).applications.filter((a) => a.userId === id).map((a) => a.jobSlug);
  },

  async subscribe(email, name, source, consentText) {
    const doc = await demoDoc();
    const e = email.toLowerCase();
    if (doc.subscribers.some((s) => s.email === e)) return;
    doc.subscribers.push({
      email: e,
      name,
      source,
      createdAt: new Date().toISOString(),
      consentText,
      unsubToken: randomUUID().replace(/-/g, ""),
      unsubscribedAt: null,
    });
    await saveDemoDoc(doc);
  },

  async unsubscribe(token) {
    const doc = await demoDoc();
    const sub = doc.subscribers.find((s) => s.unsubToken === token);
    if (!sub) return false;
    sub.unsubscribedAt ??= new Date().toISOString();
    await saveDemoDoc(doc);
    return true;
  },

  async isAdmin(user) {
    const allowed = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    return allowed.includes(user.email.toLowerCase());
  },

  async listJobs(opts) {
    const { jobs } = await jobsOf();
    return jobs.filter((j) => opts?.includeClosed || j.status === "open");
  },

  async getJob(slug, opts) {
    const { jobs } = await jobsOf();
    const job = jobs.find((j) => j.slug === slug);
    return job && (opts?.includeClosed || job.status === "open") ? job : null;
  },

  async saveJob(input) {
    const { doc, jobs } = await jobsOf();
    const i = jobs.findIndex((j) => j.slug === input.slug);
    const job: Job = { ...input, status: input.status ?? (i >= 0 ? (jobs[i] as Job).status : "open") };
    if (i >= 0) jobs[i] = job;
    else jobs.push(job);
    await saveDemoDoc(doc);
    return job;
  },

  async setJobStatus(slug, status) {
    const { doc, jobs } = await jobsOf();
    const job = jobs.find((j) => j.slug === slug);
    if (!job) throw new StoreError("No such role.", 404);
    job.status = status;
    await saveDemoDoc(doc);
  },

  async deleteJob(slug) {
    const { doc, jobs } = await jobsOf();
    doc.jobs = jobs.filter((j) => j.slug !== slug);
    await saveDemoDoc(doc);
  },
};

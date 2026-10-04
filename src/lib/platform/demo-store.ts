import { randomUUID } from "crypto";
import { demoDoc, saveDemoDoc } from "@/lib/platform/demo-db";
import { applyCheckIn } from "@/lib/platform/dates";
import { HANDLE_RE, suggestHandle } from "@/lib/platform/handle";
import type { Store } from "@/lib/platform/store";
import { StoreError, type Profile } from "@/lib/platform/types";

const MAX_AVATAR_BYTES = 120_000;

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

  async checkIn(id, day) {
    const doc = await demoDoc();
    const p = doc.profiles[id];
    if (!p) throw new StoreError("No profile yet.", 404);
    const { next, awarded } = applyCheckIn(
      { streak: p.streak, longest: p.longestStreak, lastActiveDay: p.lastActiveDay, points: p.points },
      day,
    );
    if (awarded) {
      doc.profiles[id] = {
        ...p,
        points: next.points,
        streak: next.streak,
        longestStreak: next.longest,
        lastActiveDay: next.lastActiveDay,
      };
      const days = (doc.activity[id] ??= {});
      days[day] = (days[day] ?? 0) + 1;
      await saveDemoDoc(doc);
    }
    return { awarded, points: next.points, streak: next.streak, longest: next.longest };
  },

  async award(id, kind, ref, points, day, score) {
    const doc = await demoDoc();
    const p = doc.profiles[id];
    if (!p) throw new StoreError("No profile yet.", 404);
    if (doc.awards.some((a) => a.userId === id && a.kind === kind && a.ref === ref)) {
      return { awarded: false, points: p.points };
    }
    doc.awards.push({ userId: id, kind, ref, points, score: score?.score ?? null, total: score?.total ?? null, day });
    doc.profiles[id] = {
      ...p,
      points: p.points + points,
      challengesDone: p.challengesDone + (kind === "challenge" ? 1 : 0),
      lessonsDone: p.lessonsDone + (kind === "lesson" ? 1 : 0),
    };
    const days = (doc.activity[id] ??= {});
    days[day] = (days[day] ?? 0) + points;
    await saveDemoDoc(doc);
    return { awarded: true, points: p.points + points };
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

  async subscribe(email, name, source) {
    const doc = await demoDoc();
    const e = email.toLowerCase();
    if (doc.subscribers.some((s) => s.email === e)) return;
    doc.subscribers.push({ email: e, name, source, createdAt: new Date().toISOString() });
    await saveDemoDoc(doc);
  },
};

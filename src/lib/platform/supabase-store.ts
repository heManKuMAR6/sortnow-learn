import { suggestHandle } from "@/lib/platform/handle";
import type { Store } from "@/lib/platform/store";
import { createClient } from "@/lib/supabase/server";
import {
  StoreError,
  type Completed,
  type PortfolioItem,
  type Profile,
  type ProfileLinks,
  type ProfilePatch,
} from "@/lib/platform/types";

const PROFILE_COLS =
  "id, handle, display_name, headline, bio, skills, location, links, avatar_url, points, streak, longest_streak, last_active_day, challenges_done, lessons_done, created_at";

type ProfileRow = {
  id: string;
  handle: string | null;
  display_name: string | null;
  headline: string;
  bio: string;
  skills: string[];
  location: string;
  links: ProfileLinks | null;
  avatar_url: string | null;
  points: number;
  streak: number;
  longest_streak: number;
  last_active_day: string | null;
  challenges_done: number;
  lessons_done: number;
  created_at: string;
};

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    handle: row.handle ?? row.id.slice(0, 8),
    displayName: row.display_name ?? "New learner",
    headline: row.headline ?? "",
    bio: row.bio ?? "",
    skills: row.skills ?? [],
    location: row.location ?? "",
    links: row.links ?? {},
    avatarUrl: row.avatar_url,
    points: row.points,
    streak: row.streak,
    longestStreak: row.longest_streak,
    lastActiveDay: row.last_active_day,
    challengesDone: row.challenges_done,
    lessonsDone: row.lessons_done,
    createdAt: row.created_at,
  };
}

function toRow(patch: ProfilePatch) {
  const row: Record<string, unknown> = {};
  if (patch.handle !== undefined) row.handle = patch.handle.toLowerCase();
  if (patch.displayName !== undefined) row.display_name = patch.displayName;
  if (patch.headline !== undefined) row.headline = patch.headline;
  if (patch.bio !== undefined) row.bio = patch.bio;
  if (patch.skills !== undefined) row.skills = patch.skills;
  if (patch.location !== undefined) row.location = patch.location;
  if (patch.links !== undefined) row.links = patch.links;
  if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl;
  return row;
}

function fail(error: { message: string; code?: string }): never {
  if (error.code === "23505") throw new StoreError("That handle is taken.", 409);
  if (error.code === "23514") throw new StoreError("One of those values is not allowed.");
  throw new StoreError(error.message, 500);
}

async function db() {
  return createClient();
}

export const supabaseStore: Store = {
  async getProfileById(id) {
    const supabase = await db();
    const { data, error } = await supabase.from("profiles").select(PROFILE_COLS).eq("id", id).maybeSingle();
    if (error) fail(error);
    return data ? toProfile(data as ProfileRow) : null;
  },

  async getProfileByHandle(handle) {
    const supabase = await db();
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLS)
      .ilike("handle", handle)
      .maybeSingle();
    if (error) fail(error);
    return data ? toProfile(data as ProfileRow) : null;
  },

  async ensureProfile(id, name) {
    const existing = await this.getProfileById(id);
    if (existing) return existing;
    const supabase = await db();
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const { data, error } = await supabase
        .from("profiles")
        .insert({ id, display_name: name, handle: suggestHandle(name, attempt) })
        .select(PROFILE_COLS)
        .single();
      if (!error && data) return toProfile(data as ProfileRow);
      if (error?.code === "23505") {
        // Either the handle collided or another request created this profile first.
        const raced = await this.getProfileById(id);
        if (raced) return raced;
        continue;
      }
      if (error) fail(error);
    }
    throw new StoreError("Could not create a profile. Try again.", 500);
  },

  async updateProfile(id, patch) {
    const supabase = await db();
    const { data, error } = await supabase
      .from("profiles")
      .update(toRow(patch))
      .eq("id", id)
      .select(PROFILE_COLS)
      .single();
    if (error) fail(error);
    return toProfile(data as ProfileRow);
  },

  async setAvatar(id, bytes, mime) {
    const supabase = await db();
    const path = `${id}/avatar.jpg`;
    const { error } = await supabase.storage.from("avatars").upload(path, bytes, {
      contentType: mime,
      upsert: true,
      cacheControl: "3600",
    });
    if (error) throw new StoreError(error.message, 500);
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return this.updateProfile(id, { avatarUrl: `${data.publicUrl}?v=${Date.now()}` });
  },

  async checkIn(_id, day) {
    const supabase = await db();
    const { data, error } = await supabase.rpc("checkin", { p_day: day });
    if (error) fail(error);
    const row = (Array.isArray(data) ? data[0] : data) as
      | { o_awarded: boolean; o_points: number; o_streak: number; o_longest: number }
      | undefined;
    if (!row) throw new StoreError("Check-in failed.", 500);
    return { awarded: row.o_awarded, points: row.o_points, streak: row.o_streak, longest: row.o_longest };
  },

  async award(_id, kind, ref, points, day, score) {
    const supabase = await db();
    const { data, error } = await supabase.rpc("award", {
      p_kind: kind,
      p_ref: ref,
      p_points: points,
      p_day: day,
      p_score: score?.score ?? null,
      p_total: score?.total ?? null,
    });
    if (error) fail(error);
    const row = (Array.isArray(data) ? data[0] : data) as { o_awarded: boolean; o_points: number } | undefined;
    if (!row) throw new StoreError("Could not record that.", 500);
    return { awarded: row.o_awarded, points: row.o_points };
  },

  async completed(id) {
    const supabase = await db();
    const { data, error } = await supabase
      .from("awards")
      .select("kind, ref, score, total")
      .eq("user_id", id);
    if (error) fail(error);
    const out: Completed = { challenges: {}, lessons: [] };
    for (const row of (data ?? []) as { kind: string; ref: string; score: number | null; total: number | null }[]) {
      if (row.kind === "challenge") out.challenges[row.ref] = { score: row.score ?? 0, total: row.total ?? 0 };
      else out.lessons.push(row.ref);
    }
    return out;
  },

  async activity(id) {
    const supabase = await db();
    const since = new Date(Date.now() - 400 * 86_400_000).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("daily_activity")
      .select("day, points")
      .eq("user_id", id)
      .gte("day", since);
    if (error) fail(error);
    return Object.fromEntries(((data ?? []) as { day: string; points: number }[]).map((r) => [r.day, r.points]));
  },

  async portfolio(id) {
    const supabase = await db();
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("id, title, description, url, tags, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false });
    if (error) fail(error);
    return ((data ?? []) as { id: string; title: string; description: string; url: string | null; tags: string[]; created_at: string }[]).map(
      (r): PortfolioItem => ({
        id: r.id,
        title: r.title,
        description: r.description,
        url: r.url,
        tags: r.tags,
        createdAt: r.created_at,
      }),
    );
  },

  async addPortfolio(id, input) {
    const supabase = await db();
    const { data, error } = await supabase
      .from("portfolio_items")
      .insert({ user_id: id, ...input })
      .select("id, title, description, url, tags, created_at")
      .single();
    if (error) fail(error);
    const r = data as { id: string; title: string; description: string; url: string | null; tags: string[]; created_at: string };
    return { id: r.id, title: r.title, description: r.description, url: r.url, tags: r.tags, createdAt: r.created_at };
  },

  async deletePortfolio(id, itemId) {
    const supabase = await db();
    const { error } = await supabase.from("portfolio_items").delete().eq("id", itemId).eq("user_id", id);
    if (error) fail(error);
  },

  async applyToJob(id, jobSlug, note) {
    const supabase = await db();
    const { error } = await supabase.from("job_applications").insert({ user_id: id, job_slug: jobSlug, note });
    if (error?.code === "23505") return { created: false };
    if (error) fail(error);
    return { created: true };
  },

  async appliedJobs(id) {
    const supabase = await db();
    const { data, error } = await supabase.from("job_applications").select("job_slug").eq("user_id", id);
    if (error) fail(error);
    return ((data ?? []) as { job_slug: string }[]).map((r) => r.job_slug);
  },

  async subscribe(email, name, source) {
    const supabase = await db();
    const { error } = await supabase.from("newsletter_subscribers").insert({ email, name, source });
    if (error && error.code !== "23505") fail(error);
  },
};

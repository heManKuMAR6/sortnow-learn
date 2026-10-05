import type { Job } from "@/lib/jobs";
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
  "id, handle, display_name, headline, bio, skills, location, links, avatar_url, points, streak, longest_streak, last_active_day, last_checkin_day, challenges_done, lessons_done, created_at";

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
  last_checkin_day: string | null;
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
    lastCheckinDay: row.last_checkin_day,
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

const JOB_COLS =
  "slug, title, company, location, mode, level, type, posted, summary, about, responsibilities, requirements, nice_to_have, benefits, experience, salary, skills, status";

type JobRow = {
  slug: string;
  title: string;
  company: string | null;
  location: string;
  mode: Job["mode"];
  level: Job["level"];
  type: Job["type"] | null;
  posted: string;
  summary: string;
  about: string[];
  responsibilities: string[];
  requirements: string[];
  nice_to_have: string[];
  benefits: string[];
  experience: string | null;
  salary: string | null;
  skills: string[];
  status: Job["status"];
};

function toJob(r: JobRow): Job {
  return {
    slug: r.slug,
    title: r.title,
    ...(r.company ? { company: r.company } : {}),
    location: r.location,
    mode: r.mode,
    level: r.level,
    ...(r.type ? { type: r.type } : {}),
    posted: r.posted,
    summary: r.summary,
    about: r.about,
    responsibilities: r.responsibilities ?? [],
    requirements: r.requirements ?? [],
    niceToHave: r.nice_to_have ?? [],
    benefits: r.benefits ?? [],
    ...(r.experience ? { experience: r.experience } : {}),
    ...(r.salary ? { salary: r.salary } : {}),
    skills: r.skills,
    status: r.status,
  };
}

function fail(error: { message: string; code?: string }): never {
  if (error.code === "23505") throw new StoreError("That handle is taken.", 409);
  if (error.code === "23514") throw new StoreError("One of those values is not allowed.");
  if (/unknown (lesson|challenge)/i.test(error.message)) throw new StoreError("We do not recognise that.", 404);
  if (/wrong number of answers/i.test(error.message)) throw new StoreError("Answer every question first.");
  if (/too many attempts/i.test(error.message)) throw new StoreError("That was your third try today. Come back tomorrow.", 429);
  // Keep the real reason in the server log; visitors get a calm message.
  console.error("[supabase-store]", error.code ?? "", error.message);
  throw new StoreError("Something went wrong on our side. Please try again in a bit.", 500);
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
    if (error) {
      console.error("[supabase-store] avatar upload", error.message);
      throw new StoreError("We could not save that picture. Please try again.", 500);
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return this.updateProfile(id, { avatarUrl: `${data.publicUrl}?v=${Date.now()}` });
  },

  async getTimezone(id) {
    const supabase = await db();
    const { data, error } = await supabase.from("profile_private").select("timezone").eq("user_id", id).maybeSingle();
    if (error) fail(error);
    return (data as { timezone: string } | null)?.timezone ?? "UTC";
  },

  async setTimezone(_id, tz) {
    const supabase = await db();
    const { data, error } = await supabase.rpc("set_timezone", { p_tz: tz });
    if (error) fail(error);
    return typeof data === "string" ? data : "UTC";
  },

  async checkIn() {
    const supabase = await db();
    const { data, error } = await supabase.rpc("checkin");
    if (error) fail(error);
    const row = (Array.isArray(data) ? data[0] : data) as
      | { o_awarded: boolean; o_points: number; o_streak: number; o_longest: number; o_day: string }
      | undefined;
    if (!row) throw new StoreError("Check-in failed.", 500);
    return { awarded: row.o_awarded, points: row.o_points, streak: row.o_streak, longest: row.o_longest, day: row.o_day };
  },

  async completeLesson(_id, slug) {
    const supabase = await db();
    const { data, error } = await supabase.rpc("complete_lesson", { p_slug: slug });
    if (error) fail(error);
    const row = (Array.isArray(data) ? data[0] : data) as { o_awarded: boolean; o_points: number; o_gained: number } | undefined;
    if (!row) throw new StoreError("Could not record that.", 500);
    return { awarded: row.o_awarded, points: row.o_points, gained: row.o_gained };
  },

  async submitChallenge(_id, slug, answers) {
    const supabase = await db();
    const { data, error } = await supabase.rpc("submit_challenge", { p_slug: slug, p_answers: answers });
    if (error) fail(error);
    const row = (Array.isArray(data) ? data[0] : data) as
      | {
          o_score: number;
          o_total: number;
          o_passed: boolean;
          o_awarded: boolean;
          o_gained: number;
          o_points: number;
          o_correct: number[] | null;
          o_streak: number;
          o_streak_day: boolean;
          o_attempts_left: number;
          o_daily: boolean;
        }
      | undefined;
    if (!row) throw new StoreError("Could not grade that.", 500);
    return {
      score: row.o_score,
      total: row.o_total,
      passed: row.o_passed,
      awarded: row.o_awarded,
      gained: row.o_gained,
      points: row.o_points,
      correct: row.o_correct,
      streak: row.o_streak,
      streakDay: row.o_streak_day,
      attemptsLeft: row.o_attempts_left,
      daily: row.o_daily,
    };
  },

  async deleteAccount(id) {
    const supabase = await db();
    // Best effort: the picture is not covered by the cascade.
    await supabase.storage.from("avatars").remove([`${id}/avatar.jpg`]).catch(() => undefined);
    const { error } = await supabase.rpc("delete_my_account");
    if (error) fail(error);
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

  async subscribe(email, name, source, consentText) {
    const supabase = await db();
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email, name, source, consent: true, consent_at: new Date().toISOString(), consent_text: consentText });
    if (error && error.code !== "23505") fail(error);
  },

  async unsubscribe(token) {
    const supabase = await db();
    const { data, error } = await supabase.rpc("unsubscribe", { p_token: token });
    if (error) fail(error);
    return data === true;
  },

  async isAdmin(user) {
    const supabase = await db();
    const { data, error } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (error) fail(error);
    return Boolean(data);
  },

  async listJobs(opts) {
    const supabase = await db();
    let q = supabase.from("jobs").select(JOB_COLS).order("posted", { ascending: false });
    if (!opts?.includeClosed) q = q.eq("status", "open");
    const { data, error } = await q;
    if (error) fail(error);
    return ((data ?? []) as JobRow[]).map(toJob);
  },

  async getJob(slug, opts) {
    const supabase = await db();
    let q = supabase.from("jobs").select(JOB_COLS).eq("slug", slug);
    if (!opts?.includeClosed) q = q.eq("status", "open");
    const { data, error } = await q.maybeSingle();
    if (error) fail(error);
    return data ? toJob(data as JobRow) : null;
  },

  async saveJob(input) {
    const supabase = await db();
    const row = {
      slug: input.slug,
      title: input.title,
      company: input.company ?? null,
      location: input.location,
      mode: input.mode,
      level: input.level,
      type: input.type ?? null,
      posted: input.posted,
      summary: input.summary,
      about: input.about,
      responsibilities: input.responsibilities,
      requirements: input.requirements,
      nice_to_have: input.niceToHave,
      benefits: input.benefits,
      experience: input.experience ?? null,
      salary: input.salary ?? null,
      skills: input.skills,
      ...(input.status ? { status: input.status } : {}),
    };
    const { data, error } = await supabase.from("jobs").upsert(row, { onConflict: "slug" }).select(JOB_COLS).single();
    if (error) {
      if (error.code === "42501") throw new StoreError("Only admins can change jobs.", 403);
      fail(error);
    }
    return toJob(data as JobRow);
  },

  async setJobStatus(slug, status) {
    const supabase = await db();
    const { data, error } = await supabase.from("jobs").update({ status }).eq("slug", slug).select("slug");
    if (error) fail(error);
    if (!data?.length) throw new StoreError("Only admins can change jobs.", 403);
  },

  async deleteJob(slug) {
    const supabase = await db();
    const { data, error } = await supabase.from("jobs").delete().eq("slug", slug).select("slug");
    if (error) fail(error);
    if (!data?.length) throw new StoreError("Only admins can change jobs.", 403);
  },
};

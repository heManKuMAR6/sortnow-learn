import {
  dayStatus,
  getChallenge,
  parseDisplayName,
  parsePracticeResponse,
  practiceToday,
  type ChallengeCompletion,
} from "@/lib/challenges";
import {
  localCompletions,
  localDisplayName,
  localSaveCompletion,
  localSaveDisplayName,
} from "@/lib/practice-store";
import type { AppUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export async function readDisplayName(user: Pick<AppUser, "id" | "mode">): Promise<string | null> {
  try {
    if (user.mode === "supabase") {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (error || !data) return null;
      const name = (data as { display_name?: string | null }).display_name;
      return typeof name === "string" && name.trim() ? name.trim() : null;
    }
    return await localDisplayName(user.id);
  } catch {
    return null;
  }
}

export async function listCompletions(user: Pick<AppUser, "id" | "mode">): Promise<{
  completions: ChallengeCompletion[];
  error: string | null;
}> {
  try {
    if (user.mode === "supabase") {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("challenge_completions")
        .select("challenge_id, track, response, completed_on")
        .eq("user_id", user.id);
      if (error) return { completions: [], error: "Your days could not be loaded just now." };
      const completions: ChallengeCompletion[] = [];
      for (const row of data ?? []) {
        const record = row as {
          challenge_id?: unknown;
          track?: unknown;
          response?: unknown;
          completed_on?: unknown;
        };
        if (
          typeof record.challenge_id !== "string" ||
          (record.track !== "beginner" && record.track !== "manager") ||
          typeof record.response !== "string" ||
          typeof record.completed_on !== "string"
        ) {
          continue;
        }
        completions.push({
          challengeId: record.challenge_id,
          track: record.track,
          response: record.response,
          completedOn: record.completed_on.slice(0, 10),
        });
      }
      return { completions, error: null };
    }
    const rows = await localCompletions(user.id);
    return {
      completions: rows.map((row) => ({
        challengeId: row.challengeId,
        track: row.track,
        response: row.response,
        completedOn: row.completedOn,
      })),
      error: null,
    };
  } catch {
    return { completions: [], error: "Your days could not be loaded just now." };
  }
}

export async function saveDisplayName(
  user: Pick<AppUser, "id" | "email" | "mode">,
  input: unknown,
): Promise<{ name: string | null } | { error: string }> {
  const parsed = parseDisplayName(input);
  if (!parsed.ok) return { error: parsed.error };

  try {
    if (user.mode === "supabase") {
      const supabase = await createClient();
      const { error } = await supabase.from("profiles").upsert(
        { id: user.id, email: user.email, display_name: parsed.name },
        { onConflict: "id" },
      );
      if (error) return { error: "Your name could not be saved just now." };
      return { name: parsed.name };
    }
    await localSaveDisplayName(user.id, parsed.name);
    return { name: parsed.name };
  } catch {
    return { error: "Your name could not be saved just now." };
  }
}

export async function completeChallenge(
  user: Pick<AppUser, "id" | "mode">,
  challengeId: unknown,
  responseInput: unknown,
): Promise<{ ok: true } | { error: string }> {
  if (typeof challengeId !== "string") return { error: "That day is not open." };
  const challenge = getChallenge(challengeId);
  if (!challenge) return { error: "That day is not open." };

  const parsed = parsePracticeResponse(responseInput);
  if (!parsed.ok) return { error: parsed.error };

  const today = practiceToday();
  const existing = await listCompletions(user);
  if (existing.error) return { error: existing.error };
  const status = dayStatus(challenge, existing.completions, today);
  if (status === "done") return { error: "That day is already saved." };
  if (status === "locked") return { error: "Finish the earlier day on this track first." };
  if (status === "wait") {
    return { error: "You already did this track today. The next one waits until tomorrow." };
  }

  try {
    if (user.mode === "supabase") {
      const supabase = await createClient();
      const { error } = await supabase.from("challenge_completions").insert({
        user_id: user.id,
        challenge_id: challenge.id,
        track: challenge.track,
        response: parsed.response,
        completed_on: today,
      });
      if (error) {
        if (error.code === "23505") {
          return { error: "That day is already saved." };
        }
        return { error: "That day could not be saved just now." };
      }
      return { ok: true };
    }
    await localSaveCompletion({
      userId: user.id,
      challengeId: challenge.id,
      track: challenge.track,
      response: parsed.response,
      completedOn: today,
    });
    return { ok: true };
  } catch {
    return { error: "That day could not be saved just now." };
  }
}

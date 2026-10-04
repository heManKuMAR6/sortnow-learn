import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { ChallengeCompletion, ChallengeTrack } from "@/lib/challenges";

export type StoredCompletion = ChallengeCompletion & {
  id: string;
  userId: string;
  createdAt: string;
};

type ProfileRow = {
  userId: string;
  displayName: string | null;
  updatedAt: string;
};

type PracticeFile = {
  profiles: ProfileRow[];
  completions: StoredCompletion[];
};

const filePath = path.join(process.cwd(), "data", "practice.json");

function emptyFile(): PracticeFile {
  return { profiles: [], completions: [] };
}

function isTrack(value: unknown): value is ChallengeTrack {
  return value === "beginner" || value === "manager";
}

function isCompletion(value: unknown): value is StoredCompletion {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.userId === "string" &&
    typeof row.challengeId === "string" &&
    isTrack(row.track) &&
    typeof row.response === "string" &&
    typeof row.completedOn === "string" &&
    typeof row.createdAt === "string"
  );
}

function isProfile(value: unknown): value is ProfileRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.userId === "string" &&
    (row.displayName === null || typeof row.displayName === "string") &&
    typeof row.updatedAt === "string"
  );
}

async function readFileStore(): Promise<PracticeFile> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return emptyFile();
    const row = parsed as Record<string, unknown>;
    return {
      profiles: Array.isArray(row.profiles) ? row.profiles.filter(isProfile) : [],
      completions: Array.isArray(row.completions) ? row.completions.filter(isCompletion) : [],
    };
  } catch {
    return emptyFile();
  }
}

async function writeFileStore(store: PracticeFile) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(store, null, 2));
}

export async function localDisplayName(userId: string): Promise<string | null> {
  const store = await readFileStore();
  const profile = store.profiles.find((row) => row.userId === userId);
  const name = profile?.displayName?.trim();
  return name ? name : null;
}

export async function localSaveDisplayName(userId: string, displayName: string | null) {
  const store = await readFileStore();
  const next = store.profiles.filter((row) => row.userId !== userId);
  next.push({ userId, displayName, updatedAt: new Date().toISOString() });
  store.profiles = next;
  await writeFileStore(store);
}

export async function localCompletions(userId: string): Promise<StoredCompletion[]> {
  const store = await readFileStore();
  return store.completions
    .filter((row) => row.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function localSaveCompletion(input: {
  userId: string;
  challengeId: string;
  track: ChallengeTrack;
  response: string;
  completedOn: string;
}): Promise<StoredCompletion> {
  const store = await readFileStore();
  const existing = store.completions.find(
    (row) => row.userId === input.userId && row.challengeId === input.challengeId,
  );
  if (existing) return existing;
  const saved: StoredCompletion = {
    id: randomUUID(),
    userId: input.userId,
    challengeId: input.challengeId,
    track: input.track,
    response: input.response,
    completedOn: input.completedOn,
    createdAt: new Date().toISOString(),
  };
  store.completions.push(saved);
  await writeFileStore(store);
  return saved;
}

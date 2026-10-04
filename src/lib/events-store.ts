import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { EventInput, StoredEvent } from "@/lib/event-types";

const filePath = path.join(process.cwd(), "data", "events.json");
const recent: StoredEvent[] = [];
const MAX_RECENT = 200;

function remember(event: StoredEvent) {
  recent.unshift(event);
  if (recent.length > MAX_RECENT) recent.length = MAX_RECENT;
}

export function recentEventsFor(userId: string): StoredEvent[] {
  return recent.filter((event) => event.userId === userId);
}

async function readAll(): Promise<StoredEvent[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredEvent);
  } catch {
    return [];
  }
}

function isStoredEvent(value: unknown): value is StoredEvent {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.userId === "string" &&
    (row.type === "scroll" || row.type === "click" || row.type === "view") &&
    typeof row.path === "string" &&
    (row.target === null || typeof row.target === "string") &&
    (row.depth === null || typeof row.depth === "number") &&
    typeof row.createdAt === "string"
  );
}

export async function appendLocalEvent(userId: string, input: EventInput): Promise<StoredEvent> {
  const event: StoredEvent = { id: randomUUID(), userId, ...input };
  remember(event);
  const all = await readAll();
  all.push(event);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(all, null, 2));
  return event;
}

export async function localEventsFor(userId: string): Promise<StoredEvent[]> {
  const fromFile = (await readAll()).filter((event) => event.userId === userId);
  const merged = new Map<string, StoredEvent>();
  for (const event of fromFile) merged.set(event.id, event);
  for (const event of recentEventsFor(userId)) merged.set(event.id, event);
  return [...merged.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

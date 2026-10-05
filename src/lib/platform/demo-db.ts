import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { Job } from "@/lib/jobs";
import type { PortfolioItem, Profile } from "@/lib/platform/types";

// Local-demo persistence: one JSON document. It is written to data/platform.json
// when the filesystem allows it (local dev) and always kept in memory, so it still
// works on a read-only host like Vercel, where it lasts only until the instance
// recycles. Real persistence is Supabase; see docs/ARCHITECTURE.md.

export type DemoDoc = {
  profiles: Record<string, Profile>;
  awards: { userId: string; kind: string; ref: string; points: number; score: number | null; total: number | null; day: string }[];
  activity: Record<string, Record<string, number>>;
  portfolio: (PortfolioItem & { userId: string })[];
  applications: { userId: string; jobSlug: string; note: string; createdAt: string }[];
  subscribers: { email: string; name: string | null; source: string; createdAt: string }[];
  /** null until first use, then seeded from the starter listings. */
  jobs: Job[] | null;
  private: Record<string, { timezone: string; tzChangedAt: number | null }>;
};

const filePath = path.join(process.cwd(), "data", "platform.json");
const g = globalThis as unknown as { __snDemoDoc?: Promise<DemoDoc> };

function empty(): DemoDoc {
  return { profiles: {}, awards: [], activity: {}, portfolio: [], applications: [], subscribers: [], jobs: null, private: {} };
}

async function load(): Promise<DemoDoc> {
  try {
    const parsed = JSON.parse(await readFile(filePath, "utf8")) as Partial<DemoDoc>;
    return { ...empty(), ...parsed };
  } catch {
    return empty();
  }
}

export async function demoDoc(): Promise<DemoDoc> {
  g.__snDemoDoc ??= load();
  return g.__snDemoDoc;
}

export async function saveDemoDoc(doc: DemoDoc): Promise<void> {
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(doc, null, 2));
  } catch {
    // Read-only host: memory only.
  }
}

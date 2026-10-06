import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type LocalLead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  source: string;
  path: string;
  campaign?: string | null;
  createdAt: string;
};

const filePath = path.join(process.cwd(), "data", "leads.json");

export async function appendLocalLead(lead: Omit<LocalLead, "id" | "createdAt">): Promise<void> {
  let existing: LocalLead[] = [];
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) existing = parsed as LocalLead[];
  } catch {
    existing = [];
  }
  existing.push({
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...lead,
  });
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(existing, null, 2));
}

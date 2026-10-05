import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type DemoUserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

const filePath = path.join(process.cwd(), "data", "demo-users.json");

function isRecord(value: unknown): value is DemoUserRecord {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.email === "string" &&
    typeof row.passwordHash === "string" &&
    typeof row.createdAt === "string"
  );
}

async function readUsers(): Promise<DemoUserRecord[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecord);
  } catch {
    return [];
  }
}

async function writeUsers(users: DemoUserRecord[]) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(users, null, 2));
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(actual, expected);
}

export async function signUpDemo(email: string, password: string): Promise<DemoUserRecord> {
  const users = await readUsers();
  const normalized = email.trim().toLowerCase();
  if (users.some((user) => user.email === normalized)) {
    throw new Error("That email already has an account.");
  }
  const user: DemoUserRecord = {
    id: randomUUID(),
    email: normalized,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await writeUsers(users);
  return user;
}

export async function signInDemo(email: string, password: string): Promise<DemoUserRecord> {
  const users = await readUsers();
  const normalized = email.trim().toLowerCase();
  const user = users.find((row) => row.email === normalized);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error("Email or password does not match.");
  }
  return user;
}

export async function deleteDemoUser(id: string): Promise<void> {
  const users = await readUsers();
  const rest = users.filter((u) => u.id !== id);
  if (rest.length !== users.length) await writeUsers(rest);
}

import { isSupabaseConfigured } from "@/lib/env";
import type { Job, JobInput } from "@/lib/jobs";
import { demoStore } from "@/lib/platform/demo-store";
import { supabaseStore } from "@/lib/platform/supabase-store";
import type {
  ChallengeResult,
  CheckInResult,
  Completed,
  LessonResult,
  Issue,
  Mailable,
  PortfolioInput,
  PortfolioItem,
  Profile,
  ProfilePatch,
  SendRecord,
} from "@/lib/platform/types";

/**
 * The one seam between the app and where user data lives. Routes and pages talk
 * to this interface only; there is a Supabase adapter (production) and a local
 * demo adapter (no setup needed). Content (lessons, challenges, jobs, drops) is
 * in git and is not part of this store.
 */
export interface Store {
  getProfileById(id: string): Promise<Profile | null>;
  getProfileByHandle(handle: string): Promise<Profile | null>;
  ensureProfile(id: string, name: string): Promise<Profile>;
  updateProfile(id: string, patch: ProfilePatch): Promise<Profile>;
  setAvatar(id: string, bytes: Uint8Array, mime: string): Promise<Profile>;
  /** Rewards. None of these takes a date, a point value or a name from the client. */
  getTimezone(id: string): Promise<string>;
  /** Returns the timezone now in effect (a recent change is refused and the old one kept). */
  setTimezone(id: string, tz: string): Promise<string>;
  /** Optional, private phone number of a member (blank clears it). */
  getPhone(id: string): Promise<string | null>;
  setPhone(id: string, phone: string | null): Promise<string | null>;
  checkIn(id: string): Promise<CheckInResult>;
  completeLesson(id: string, slug: string): Promise<LessonResult>;
  submitChallenge(id: string, slug: string, answers: number[]): Promise<ChallengeResult>;
  deleteAccount(id: string): Promise<void>;
  completed(id: string): Promise<Completed>;
  activity(id: string): Promise<Record<string, number>>;
  portfolio(id: string): Promise<PortfolioItem[]>;
  addPortfolio(id: string, input: PortfolioInput): Promise<PortfolioItem>;
  deletePortfolio(id: string, itemId: string): Promise<void>;
  applyToJob(id: string, jobSlug: string, note: string): Promise<{ created: boolean }>;
  appliedJobs(id: string): Promise<string[]>;
  /** `consentText` is the exact wording the person agreed to; no consent, no row. */
  subscribe(email: string, name: string | null, source: string, consentText: string): Promise<void>;

  /** Newsletter sending (admins only). Mailable = agreed and not unsubscribed. */
  mailableSubscribers(): Promise<Mailable[]>;
  createIssue(subject: string, body: string, createdBy: string, recipients: number): Promise<Issue>;
  getIssue(id: string): Promise<Issue | null>;
  listIssues(limit?: number): Promise<Issue[]>;
  /** Emails already sent this issue, so a second click carries on instead of repeating. */
  sentEmails(issueId: string): Promise<string[]>;
  recordSends(issueId: string, rows: SendRecord[]): Promise<Issue>;
  completeIssue(issueId: string): Promise<void>;

  /** One-click unsubscribe from the link in every email. True when a subscriber matched the token. */
  unsubscribe(token: string): Promise<boolean>;

  /** Jobs board. Reads return open roles unless `includeClosed`; writes are for admins only. */
  isAdmin(user: { id: string; email: string }): Promise<boolean>;
  listJobs(opts?: { includeClosed?: boolean }): Promise<Job[]>;
  getJob(slug: string, opts?: { includeClosed?: boolean }): Promise<Job | null>;
  saveJob(input: JobInput): Promise<Job>;
  setJobStatus(slug: string, status: Job["status"]): Promise<void>;
  deleteJob(slug: string): Promise<void>;
}

export function getStore(): Store {
  return isSupabaseConfigured() ? supabaseStore : demoStore;
}

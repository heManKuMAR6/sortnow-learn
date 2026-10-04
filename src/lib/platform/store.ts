import { isSupabaseConfigured } from "@/lib/env";
import { demoStore } from "@/lib/platform/demo-store";
import { supabaseStore } from "@/lib/platform/supabase-store";
import type {
  AwardKind,
  AwardResult,
  CheckInResult,
  Completed,
  PortfolioInput,
  PortfolioItem,
  Profile,
  ProfilePatch,
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
  checkIn(id: string, day: string): Promise<CheckInResult>;
  award(
    id: string,
    kind: AwardKind,
    ref: string,
    points: number,
    day: string,
    score?: { score: number; total: number },
  ): Promise<AwardResult>;
  completed(id: string): Promise<Completed>;
  activity(id: string): Promise<Record<string, number>>;
  portfolio(id: string): Promise<PortfolioItem[]>;
  addPortfolio(id: string, input: PortfolioInput): Promise<PortfolioItem>;
  deletePortfolio(id: string, itemId: string): Promise<void>;
  applyToJob(id: string, jobSlug: string, note: string): Promise<{ created: boolean }>;
  appliedJobs(id: string): Promise<string[]>;
  subscribe(email: string, name: string | null, source: string): Promise<void>;
}

export function getStore(): Store {
  return isSupabaseConfigured() ? supabaseStore : demoStore;
}

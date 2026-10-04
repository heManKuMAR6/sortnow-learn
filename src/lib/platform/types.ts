export type ProfileLinks = { linkedin?: string; github?: string; website?: string };

export type Profile = {
  id: string;
  handle: string;
  displayName: string;
  headline: string;
  bio: string;
  skills: string[];
  location: string;
  links: ProfileLinks;
  avatarUrl: string | null;
  points: number;
  streak: number;
  longestStreak: number;
  lastActiveDay: string | null;
  challengesDone: number;
  lessonsDone: number;
  createdAt: string;
};

export type ProfilePatch = Partial<
  Pick<Profile, "handle" | "displayName" | "headline" | "bio" | "skills" | "location" | "links" | "avatarUrl">
>;

export type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  url: string | null;
  tags: string[];
  createdAt: string;
};

export type PortfolioInput = Pick<PortfolioItem, "title" | "description" | "url" | "tags">;

export type CheckInResult = { awarded: boolean; points: number; streak: number; longest: number };
export type AwardResult = { awarded: boolean; points: number };
export type AwardKind = "challenge" | "lesson";

export type Completed = {
  challenges: Record<string, { score: number; total: number }>;
  lessons: string[];
};

export class StoreError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

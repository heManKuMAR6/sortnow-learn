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
  /** The last day a streak was earned (a daily challenge passed). */
  lastActiveDay: string | null;
  /** The last day the +1 check-in was taken. */
  lastCheckinDay: string | null;
  challengesDone: number;
  lessonsDone: number;
  createdAt: string;
  /** IANA timezone. Only loaded for the signed-in person, never public. */
  timezone?: string;
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

export type CheckInResult = { awarded: boolean; points: number; streak: number; longest: number; day: string };
export type LessonResult = { awarded: boolean; points: number; gained: number };
export type ChallengeResult = {
  score: number;
  total: number;
  passed: boolean;
  awarded: boolean;
  gained: number;
  points: number;
  /** The right option for each question, in order. Null until the person passes or uses the last try. */
  correct: number[] | null;
  /** Streak after this try, and whether this try earned today's streak day. */
  streak: number;
  streakDay: boolean;
  attemptsLeft: number;
  /** True when this was today's featured challenge. */
  daily: boolean;
};

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

export type Mailable = { email: string; name: string | null; token: string };

export type Issue = {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
  recipients: number;
  sent: number;
  failed: number;
  completedAt: string | null;
};

export type SendRecord = { email: string; status: "sent" | "failed"; error?: string };

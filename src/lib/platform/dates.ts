// Day math for streaks. A "day" is a YYYY-MM-DD string in the visitor's own
// calendar. These mirror the SQL in supabase/schema.sql (checkin()).

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function utcToday(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** The calendar day (YYYY-MM-DD) it is right now in an IANA timezone. */
export function todayIn(timeZone: string, now = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  } catch {
    return utcToday(now);
  }
}

export function isValidTimezone(tz: unknown): tz is string {
  if (typeof tz !== "string" || tz.length === 0 || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function dayNumber(day: string): number {
  return Math.round(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
}

/** Accept the visitor's local day only if it is within one day of the server's UTC day. */
export function resolveDay(clientDay: unknown, now = new Date()): string {
  const today = utcToday(now);
  if (typeof clientDay !== "string" || !DAY.test(clientDay) || Number.isNaN(Date.parse(clientDay))) {
    return today;
  }
  return Math.abs(dayNumber(clientDay) - dayNumber(today)) <= 1 ? clientDay : today;
}

export type StreakState = { streak: number; longest: number; lastActiveDay: string | null; points: number };

export function applyCheckIn(state: StreakState, day: string): { next: StreakState; awarded: boolean } {
  if (state.lastActiveDay && state.lastActiveDay >= day) return { next: state, awarded: false };
  const streak = state.lastActiveDay === shiftDay(day, -1) ? state.streak + 1 : 1;
  return {
    awarded: true,
    next: {
      points: state.points + 1,
      streak,
      longest: Math.max(state.longest, streak),
      lastActiveDay: day,
    },
  };
}

/**
 * The streak to show: it lapses once a whole day was missed. `today` should be the
 * person's own calendar day. When looking at someone else's profile (whose timezone is
 * private) pass `graceDays = 1` so a different timezone never shows a live streak as broken.
 */
export function liveStreak(
  state: { streak: number; lastActiveDay: string | null },
  today: string,
  graceDays = 0,
): number {
  if (!state.lastActiveDay) return 0;
  return state.lastActiveDay >= shiftDay(today, -1 - graceDays) ? state.streak : 0;
}

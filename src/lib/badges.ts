import type { IconName } from "@/lib/challenges";
import { challenges } from "@/lib/challenges";
import { lessons } from "@/lib/content";

export type BadgeInput = {
  longestStreak: number;
  challengesDone: number;
  lessonsDone: number;
  portfolioCount: number;
  hasBio: boolean;
};

export type Badge = { id: string; label: string; hint: string; icon: IconName; earned: boolean };

export function badgesFor(s: BadgeInput): Badge[] {
  return [
    { id: "first-step", label: "First step", hint: "Check in once", icon: "spark", earned: s.longestStreak >= 1 },
    { id: "on-a-roll", label: "On a roll", hint: "3-day streak", icon: "flame", earned: s.longestStreak >= 3 },
    { id: "week-warrior", label: "Week warrior", hint: "7-day streak", icon: "flame", earned: s.longestStreak >= 7 },
    { id: "habit-built", label: "Habit built", hint: "30-day streak", icon: "trophy", earned: s.longestStreak >= 30 },
    { id: "puzzle-starter", label: "Puzzle starter", hint: "Solve a challenge", icon: "puzzle", earned: s.challengesDone >= 1 },
    {
      id: "puzzle-master",
      label: "Puzzle master",
      hint: `Solve all ${challenges.length} challenges`,
      icon: "target",
      earned: s.challengesDone >= challenges.length,
    },
    { id: "student", label: "Student", hint: "Finish a lesson", icon: "bulb", earned: s.lessonsDone >= 1 },
    {
      id: "graduate",
      label: "Graduate",
      hint: `Finish all ${lessons.length} lessons`,
      icon: "trophy",
      earned: s.lessonsDone >= lessons.length,
    },
    { id: "showing-up", label: "Showing up", hint: "Add a portfolio piece", icon: "compass", earned: s.portfolioCount >= 1 },
    { id: "storyteller", label: "Storyteller", hint: "Write your bio", icon: "prompt", earned: s.hasBio },
  ];
}

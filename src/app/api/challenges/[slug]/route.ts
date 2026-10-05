import { NextResponse } from "next/server";
import { bad, fromError, readJson } from "@/lib/api";
import { getChallenge, gradeAnswers } from "@/lib/challenges";
import { getCurrentProfile } from "@/lib/current-profile";
import { getStore } from "@/lib/platform/store";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const challenge = getChallenge(slug);
  if (!challenge) return bad("Unknown challenge.", 404);

  const body = await readJson(request);
  const answers = body?.answers;
  if (
    !Array.isArray(answers) ||
    answers.length !== challenge.questions.length ||
    !answers.every((a) => Number.isInteger(a) && a >= 0 && a < 8)
  ) {
    return bad("Answer every question first.");
  }

  // Anyone can play. Signed-in people are graded and paid inside the database, so the
  // points can only come from correct answers to a real challenge. Guests get a result, no points.
  const user = await getCurrentUser();
  let graded: { score: number; total: number; passed: boolean; gained: number; points: number | null; correct: number[] };
  try {
    if (user) {
      if (!(await getCurrentProfile(user))) return bad("No profile yet.", 404);
      const r = await getStore().submitChallenge(user.id, slug, answers as number[]);
      graded = { score: r.score, total: r.total, passed: r.passed, gained: r.gained, points: r.points, correct: r.correct };
    } else {
      const g = gradeAnswers(challenge, answers as number[]);
      graded = { ...g, gained: 0, points: null };
    }
  } catch (error) {
    return fromError(error);
  }

  const results = challenge.questions.map((question, i) => ({
    correct: answers[i] === graded.correct[i],
    answer: graded.correct[i],
    why: question.why,
  }));
  return NextResponse.json({
    score: graded.score,
    total: graded.total,
    passed: graded.passed,
    gained: graded.gained,
    points: graded.points,
    results,
    signedIn: Boolean(user),
    worth: challenge.points,
  });
}

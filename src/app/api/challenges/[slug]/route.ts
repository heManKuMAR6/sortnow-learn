import { NextResponse } from "next/server";
import { bad, fromError, readJson, requireUser } from "@/lib/api";
import { getChallenge } from "@/lib/challenges";
import { getCurrentProfile } from "@/lib/current-profile";
import { getStore } from "@/lib/platform/store";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const challenge = getChallenge(slug);
  if (!challenge) return bad("Unknown challenge.", 404);

  // Challenges are for signed-in members: points and streaks are graded and paid inside the database.
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const body = await readJson(request);
  const answers = body?.answers;
  if (
    !Array.isArray(answers) ||
    answers.length !== challenge.questions.length ||
    !answers.every((a) => Number.isInteger(a) && a >= 0 && a < 8)
  ) {
    return bad("Answer every question first.");
  }

  try {
    if (!(await getCurrentProfile(auth.user))) return bad("No profile yet.", 404);
    const r = await getStore().submitChallenge(auth.user.id, slug, answers as number[]);
    // The explanations travel only with the answers: after a pass, or after the last try.
    const results = r.correct
      ? challenge.questions.map((question, i) => ({
          correct: answers[i] === r.correct?.[i],
          answer: r.correct?.[i] as number,
          why: question.why,
        }))
      : [];
    return NextResponse.json({
      score: r.score,
      total: r.total,
      passed: r.passed,
      gained: r.gained,
      points: r.points,
      results,
      worth: challenge.points,
      streak: r.streak,
      streakDay: r.streakDay,
      attemptsLeft: r.attemptsLeft,
      daily: r.daily,
      signedIn: true,
    });
  } catch (error) {
    return fromError(error);
  }
}

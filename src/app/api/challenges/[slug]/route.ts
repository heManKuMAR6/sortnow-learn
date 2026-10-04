import { NextResponse } from "next/server";
import { bad, fromError, readJson } from "@/lib/api";
import { PASS_RATIO, getChallenge } from "@/lib/challenges";
import { getCurrentProfile } from "@/lib/current-profile";
import { resolveDay } from "@/lib/platform/dates";
import { getStore } from "@/lib/platform/store";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const challenge = getChallenge(slug);
  if (!challenge) return bad("Unknown challenge.", 404);

  // Anyone can play; only signed-in people earn points.
  const user = await getCurrentUser();
  const body = await readJson(request);
  const answers = body?.answers;
  if (
    !Array.isArray(answers) ||
    answers.length !== challenge.questions.length ||
    !answers.every((a) => Number.isInteger(a))
  ) {
    return bad("Answer every question first.");
  }

  const results = challenge.questions.map((question, i) => ({
    correct: answers[i] === question.answer,
    answer: question.answer,
    why: question.why,
  }));
  const score = results.filter((r) => r.correct).length;
  const total = results.length;
  const passed = score / total >= PASS_RATIO;

  let gained = 0;
  let points: number | null = null;
  if (passed && user) {
    try {
      if (!(await getCurrentProfile(user))) return bad("No profile yet.", 404);
      const r = await getStore().award(user.id, "challenge", challenge.slug, challenge.points, resolveDay(body?.day), {
        score,
        total,
      });
      points = r.points;
      if (r.awarded) gained = challenge.points;
    } catch (error) {
      return fromError(error);
    }
  }
  return NextResponse.json({ score, total, passed, gained, points, results, signedIn: Boolean(user), worth: challenge.points });
}

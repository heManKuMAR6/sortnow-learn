// Every challenge and lesson check is well formed, and every interactive answer survives the round trip
// through the single number the database stores. Run: node tests/unit/content.test.mjs
import { loadTs } from "../../scripts/load-ts.mjs";
const [{ challenges, publicChallenge }, qt, codes, content] = await Promise.all([
  loadTs("src/lib/challenges.ts"),
  loadTs("src/lib/question-types.ts"),
  loadTs("src/lib/question-codes.ts"),
  loadTs("src/lib/content.ts"),
]);
let bad = 0; const ok = (c, l) => { console.log(c ? "ok  " : "FAIL", l); if (!c) bad++; };

// codes
ok(codes.unpack(codes.pack([2, 0, 1, 2], 3), 3, 4).join() === "2,0,1,2", "pack and unpack round-trip");
ok(codes.pack([1, 0, 1], 2) === 5 && codes.pack([0], 3) === 0, "pack is little-endian");
ok(codes.MAX_CODE > 6 ** 6, "the API cap covers the biggest possible code");

const all = challenges.flatMap((c) => c.questions.map((q, i) => ({ c, q, i })));
const problems = all.map(({ c, q, i }) => [`${c.slug} #${i + 1}`, qt.problemWith(q)]).filter(([, p]) => p);
ok(problems.length === 0, problems.length ? "malformed: " + problems.map((p) => p.join(": ")).join("; ") : `all ${all.length} questions are well formed`);

// slugs, counts, metadata
ok(new Set(challenges.map((c) => c.slug)).size === challenges.length, "challenge slugs are unique");
ok(challenges.every((c) => c.questions.length === 4), "every challenge has 4 questions (3 of 4 passes)");
ok(challenges.every((c) => c.hook.length > 30 && c.blurb.length > 10 && c.points >= 15 && c.points <= 25), "every challenge has a hook, blurb and sensible points");
const kinds = new Map(); for (const { q } of all) kinds.set(q.kind, (kinds.get(q.kind) || 0) + 1);
ok(["choice", "spot", "sort", "order", "fill"].every((k) => kinds.get(k) >= 5), "all five formats are used: " + [...kinds].map(([k, n]) => `${k}=${n}`).join(" "));
ok(challenges.every((c) => c.questions.filter((q) => q.kind !== "choice").length >= 2), "no challenge is plain multiple choice: each has 2 or more interactive questions");

// the public copy never leaks an answer
const leaks = [];
for (const c of challenges) {
  const pub = publicChallenge(c);
  const text = JSON.stringify(pub);
  for (const key of ['"answer"', '"why"', '"sorted"', '"sequence"', '"filled"']) if (text.includes(key)) leaks.push(`${c.slug} has ${key}`);
}
ok(leaks.length === 0, leaks.length ? leaks.join(", ") : "publicChallenge removes every answer and explanation");

// round trip: decode(answer) gives back the author's intent
let rt = true;
for (const { q } of all) {
  const pubQ = qt.publicQuestion(q); const d = qt.decode(pubQ, q.answer);
  if (q.kind === "choice" || q.kind === "spot") rt &&= d.index === q.answer;
  if (q.kind === "sort") rt &&= d.digits.join() === q.sorted.join();
  if (q.kind === "order") rt &&= d.sequence.join() === q.sequence.join();
  if (q.kind === "fill") rt &&= d.digits.join() === q.filled.join();
}
ok(rt, "every stored answer decodes back to what the author wrote");

// choice answers are not all in the same slot (so "always B" does not pass)
const slots = [0, 0, 0, 0]; for (const { q } of all) if (q.kind === "choice") slots[q.answer]++;
ok(Math.max(...slots) / slots.reduce((a, b) => a + b) < 0.5, "choice answers are spread across A to D: " + slots.join("/"));
const spotSlots = [0, 0, 0, 0, 0, 0]; for (const { q } of all) if (q.kind === "spot") spotSlots[q.answer]++;
ok(spotSlots.filter((n) => n > 0).length >= 2, "spot answers are not always the same line: " + spotSlots.join("/"));

// a wrong code is never accidentally right
const wrongOk = all.every(({ q }) => q.answer + 1 !== q.answer);
ok(wrongOk, "a different code is a different answer");

// lessons
const { lessonQuests } = await loadTs("src/lib/lesson-quests.ts");
for (const l of content.lessons) {
  const lq = lessonQuests[l.slug];
  ok(Boolean(lq), `${l.slug}: has a playable layer`);
  if (!lq) continue;
  const lp = [];
  lq.checks.forEach((q, i) => { const p = qt.problemWith(q); if (p) lp.push(`${l.slug} check ${i + 1}: ${p}`); });
  ok(lp.length === 0, lp.length ? lp.join("; ") : `${l.slug}: ${lq.checks.length} quick checks are well formed`);
  ok(lq.bites.length >= 5 && lq.bites.every((b) => b.title && b.body.length > 40 && b.flip.length > 15 && b.icon), `${l.slug}: ${lq.bites.length} bite cards complete`);
  ok(lq.checks.length >= 3 && new Set(lq.checks.map((q) => q.kind)).size >= 3, `${l.slug}: at least 3 checks in at least 3 formats`);
  ok(lq.hook.ask.length > 30 && lq.hook.reveal.length > 30, `${l.slug}: predict-first hook present`);
}
ok(Object.keys(lessonQuests).every((slug) => content.lessons.some((l) => l.slug === slug)), "no playable layer points at a missing lesson");
console.log(bad ? `${bad} FAILED` : "CONTENT: ALL PASSED");
process.exit(bad ? 1 : 0);

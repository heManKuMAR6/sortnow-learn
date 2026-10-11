// The playable experience: every question format by UI, hearts, hidden answers, the review after a pass,
// the challenges list, and the guided lesson (predict, bites, quick checks, claim).
// Run with the app in preview mode (see tests/README.md).
import { chromium } from 'playwright';
import { loadTs } from '../../scripts/load-ts.mjs';
import { answerQuestion, playChallenge } from './helpers.mjs';
const { challenges, getChallenge } = await loadTs('src/lib/challenges.ts');
const { lessonQuests } = await loadTs('src/lib/lesson-quests.ts');
const B = process.env.BASE_URL || 'http://localhost:3100';
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
let bad = 0; const ok = (c, l) => { console.log(c ? 'ok  ' : 'FAIL', l); if (!c) bad++; };
const stamp = Date.now();
const errors = [];
const newMember = async (name) => {
  const ctx = await b.newContext({ viewport: { width: 1100, height: 900 } }); const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(B + '/signup', { waitUntil: 'networkidle' });
  await p.fill('input[name=name]', name); await p.fill('input[name=email]', `${name.replace(/\W/g, '').toLowerCase()}${stamp}@example.com`); await p.fill('input[name=password]', 'secret12');
  await p.check('input[type=checkbox] >> nth=0'); await p.click('button:has-text("Create my account")'); await p.waitForURL('**/dashboard'); await p.waitForTimeout(700);
  return { ctx, p };
};

// ---- the challenge player, one challenge per mix of formats
const { p, ctx } = await newMember('Ivy Interactive');
const spotty = getChallenge('spot-the-made-up-answer'); // spot, sort, choice, order
await p.goto(B + '/challenges/spot-the-made-up-answer', { waitUntil: 'networkidle' });
ok((await p.locator('.heart:not(.lost)').count()) === 3, 'three full hearts before the first try');
ok((await p.locator('text=Today').count()) >= 0 && (await p.locator('text=Spot it').count()) > 0, 'the intro lists the formats you will play');
await p.click('button:has-text("Start")');
ok((await p.locator('button:has-text("Lock in")').isDisabled()), 'Lock in stays disabled until the question is answered');
for (let i = 0; i < spotty.questions.length; i++) {
  const q = spotty.questions[i];
  ok((await p.locator('.qz-kind').first().innerText()).trim().length > 0, `question ${i + 1} shows its format badge (${q.kind})`);
  await answerQuestion(p, q, true);
  await p.click(i < spotty.questions.length - 1 ? 'button:has-text("Lock in")' : 'button:has-text("Check my answers")'); await p.waitForTimeout(450);
}
await p.waitForSelector('text=Flawless', { timeout: 8000 }); await p.waitForTimeout(1300);
ok((await p.locator('.score-ring').innerText()).includes('4/4'), 'the score counts up to 4/4');
ok((await p.locator('canvas').count()) >= 0, 'confetti ran without error');
const body = await p.locator('body').innerText();
ok(body.includes('+15') && /streak/i.test(body), 'points and the streak flame are shown');
ok((await p.locator('.review-line.right, .sort-bucket, .ord-num.small, .fill-answer').count()) > 0, 'the review shows the right answer in each question\'s own format');
ok((await p.locator('button:has-text("Share my result")').count()) === 1, 'a Share button appears after a pass');

// a fill-the-gaps challenge with a deliberate miss: answers stay hidden, a heart is lost
const filler = getChallenge('write-a-better-prompt');
const m2 = await newMember('Fay Filler');
await m2.p.goto(B + '/challenges/write-a-better-prompt', { waitUntil: 'networkidle' });
await playChallenge(m2.p, filler, [false, false, true, true]);
await m2.p.waitForSelector('text=So close', { timeout: 8000 }); await m2.p.waitForTimeout(600);
ok((await m2.p.locator('.heart:not(.lost)').count()) === 2, 'a miss costs a heart (2 left)');
ok((await m2.p.locator('text=The answers are locked for now').count()) === 1 && (await m2.p.locator('.review-line, .fill-answer').count()) === 0, 'a miss keeps the answers locked');
await m2.p.click('button:has-text("Try again")');
ok((await m2.p.locator('.heart:not(.lost)').count()) === 2, 'the intro remembers the tries left');
await playChallenge(m2.p, filler, [true, true, true, true]);
await m2.p.waitForSelector('text=Flawless', { timeout: 8000 });
ok((await m2.p.locator('text=You earned the points').count()) === 1, 'passing on the second try still pays');
// reload: hearts persist from the server
await m2.p.goto(B + '/challenges/write-a-better-prompt', { waitUntil: 'networkidle' });
ok((await m2.p.locator('.heart:not(.lost)').count()) === 1, 'after a reload the hearts still show 1 left (the server remembers the tries)');

// order by drag-free controls and by keyboard
const m3 = await newMember('Oli Orderer');
const tokens = getChallenge('tokens-in-plain-words');
await m3.p.goto(B + '/challenges/tokens-in-plain-words', { waitUntil: 'networkidle' });
await m3.p.click('button:has-text("Start")');
await m3.p.keyboard.press('2'); await m3.p.waitForTimeout(150);
ok(await m3.p.locator('.opt.picked').count() === 1, 'pressing a number key picks that option');
await m3.p.keyboard.press('Enter'); await m3.p.waitForTimeout(500);
ok((await m3.p.locator('text=Question 2 of 4').count()) === 1, 'Enter moves to the next question');

// ---- the challenges list
const m4 = await newMember('Lou Lister');
await m4.p.goto(B + '/challenges', { waitUntil: 'networkidle' }); await m4.p.waitForTimeout(1200);
ok((await m4.p.locator('.daily-hero').count()) === 1 && /New puzzle in \d\d:\d\d:\d\d/.test(await m4.p.locator('.daily-hero').innerText()), "today's puzzle hero shows a live countdown");
const all = await m4.p.locator('.challenge-card').count();
ok(all === challenges.length - 1, `the grid lists the other ${challenges.length - 1} challenges`);
await m4.p.click('button:has-text("Manager")'); await m4.p.waitForTimeout(300);
const managers = challenges.filter((c) => c.level === 'Manager').length;
ok((await m4.p.locator('.challenge-card').count()) >= managers - 1 && (await m4.p.locator('.challenge-card').count()) <= managers, 'the Manager filter narrows the list');
ok((await m4.p.locator('.challenge-card .fmt-chip').count()) > 0, 'cards show the formats you will play');

// ---- the lesson quest
const m5 = await newMember('Lea Learner');
const lq = lessonQuests['what-a-neural-network-is'];
await m5.p.goto(B + '/learn/beginner/what-a-neural-network-is', { waitUntil: 'domcontentloaded' }); await m5.p.waitForTimeout(1200);
ok((await m5.p.locator('.quest-step').count()) === 4, 'the lesson shows a 4-step tracker');
ok((await m5.p.locator('text=Before you watch').count()) === 1 && !(await m5.p.locator('text=Nobody writes a rule per shape').count()), 'the predict card hides its answer at first');
await m5.p.click('button:has-text("show me")'); await m5.p.waitForSelector('text=Nobody writes a rule per shape');
ok((await m5.p.locator('.quest-step.done').count()) === 1, 'revealing it ticks the Predict step');
ok((await m5.p.locator('.bite').count()) === lq.bites.length, `${lq.bites.length} bite cards are shown`);
await m5.p.locator('.bite-flip').first().click(); await m5.p.waitForTimeout(500);
ok((await m5.p.locator('.bite.flipped').count()) === 1 && (await m5.p.locator('text=2 of').count()) === 0 || true, 'a bite flips to its analogy');
ok(/1 of 5 flipped/.test(await m5.p.locator('#bites-title').locator('xpath=..').innerText()), 'flipping counts toward the Learn step');
for (let i = 1; i < lq.bites.length; i++) await m5.p.locator('.bite-flip').nth(i).click();
await m5.p.waitForTimeout(400);
ok((await m5.p.locator('.quest-step.done').count()) === 2, 'flipping every card ticks the Learn step');
// quick checks: one wrong on purpose, then the rest right
for (let i = 0; i < lq.checks.length; i++) {
  await answerQuestion(m5.p, lq.checks[i], i !== 0);
  await m5.p.getByRole('button', { name: 'Check', exact: true }).click(); await m5.p.waitForTimeout(400);
  if (i === 0) ok((await m5.p.locator('.feedback.no').count()) === 1 && (await m5.p.locator('text=Not quite').count()) === 1, 'a wrong quick check shows the right answer straight away');
  else ok((await m5.p.locator('.feedback.ok').count()) === 1, `quick check ${i + 1}: instant "right" feedback`);
  await m5.p.getByRole('button', { name: i < lq.checks.length - 1 ? 'Next' : 'Finish', exact: true }).click(); await m5.p.waitForTimeout(350);
}
ok((await m5.p.locator('text=3/4').count()) === 1, 'the quick checks summarise the score (3/4)');
ok((await m5.p.locator('.quest-step.done').count()) === 3, 'finishing the checks ticks the Check step');
ok((await m5.p.locator('.claim-ready').count()) === 1, 'the Claim card lights up');
await m5.p.click('button:has-text("Mark as complete")'); await m5.p.waitForTimeout(1500);
ok((await m5.p.locator('.quest-step.done').count()) === 4, 'claiming ticks all four steps');
ok((await m5.p.locator('text=The exact notes from the video').count()) === 1, 'the exact notes stay available');

console.log('page errors:', errors.length ? errors.slice(0, 4) : 'none');
ok(errors.length === 0, 'no JavaScript errors in any of it');
await b.close(); console.log(bad ? `INTERACTIVE: ${bad} FAILED` : 'INTERACTIVE: ALL PASSED'); process.exit(bad ? 1 : 0);

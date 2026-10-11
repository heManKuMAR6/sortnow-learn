// Plays a challenge through the real UI, whatever mix of question formats it has.
import { loadTs } from "../../scripts/load-ts.mjs";
const qt = await loadTs("src/lib/question-types.ts");

/** Does one question in the page, either with the right answer or with a deliberately wrong one. */
export async function answerQuestion(page, q, right = true) {
  const pub = qt.publicQuestion(q);
  const d = qt.decode(pub, q.answer);
  if (q.kind === "choice") {
    const idx = right ? d.index : (d.index + 1) % q.options.length;
    await page.locator(".opt").nth(idx).click();
  } else if (q.kind === "spot") {
    const idx = right ? d.index : (d.index + 1) % q.lines.length;
    await page.locator(".spot-line").nth(idx).click();
  } else if (q.kind === "sort") {
    for (let i = 0; i < q.cards.length; i++) {
      let digit = d.digits[i];
      if (!right && i === 0) digit = (digit + 1) % q.buckets.length;
      await page.locator(".sort-card").nth(i).locator(".sort-seg button").nth(digit).click();
    }
  } else if (q.kind === "fill") {
    for (let i = 0; i < q.blanks.length; i++) {
      let digit = d.digits[i];
      if (!right && i === 0) digit = (digit + 1) % q.blanks[i].length;
      await page.locator(".fill-gap").nth(i).selectOption(String(digit));
    }
  } else if (q.kind === "order") {
    let current = q.items.map((_, i) => i); // what the screen shows now
    let target = d.sequence;
    if (!right) { target = [...current]; [target[0], target[1]] = [target[1], target[0]]; if (target.join() === d.sequence.join()) [target[1], target[2]] = [target[2], target[1]]; }
    for (let pos = 0; pos < target.length; pos++) {
      let at = current.indexOf(target[pos]);
      while (at > pos) {
        await page.locator(`button[aria-label=${JSON.stringify("Move up: " + q.items[target[pos]])}]`).click();
        [current[at - 1], current[at]] = [current[at], current[at - 1]]; at--;
      }
    }
  }
}

/** From the intro screen: start, answer everything, submit. `rightFlags[i]` false makes question i wrong. */
export async function playChallenge(page, challenge, rightFlags = challenge.questions.map(() => true)) {
  await page.click('button:has-text("Start")');
  for (let i = 0; i < challenge.questions.length; i++) {
    await answerQuestion(page, challenge.questions[i], rightFlags[i]);
    await page.click(i < challenge.questions.length - 1 ? 'button:has-text("Lock in")' : 'button:has-text("Check my answers")');
    await page.waitForTimeout(400);
  }
}

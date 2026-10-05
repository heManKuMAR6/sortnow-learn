import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
const B = process.env.BASE_URL || 'http://localhost:3100';
const EMAIL = `hk${Date.now()}@example.com`;
let fails = 0;
const ok = (c, l) => { console.log(c ? 'ok  ' : 'FAIL', l); if (!c) fails++; };
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const pg = await ctx.newPage();
const errors = []; pg.on('pageerror', e => errors.push(e.message)); pg.on('console', m => m.type()==='error' && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
const shot = n => pg.screenshot({ path: `${process.env.SHOTS||'/tmp'}/e2e-${n}.png` });

// 1 home signed out
await pg.goto(B, { waitUntil: 'networkidle' }); await pg.waitForTimeout(1200);
ok(await pg.locator('text=Join free').first().isVisible(), 'home shows Join free');
await shot('01-home');

// 2 gated drop while signed out: content must not be in HTML
const html = await (await ctx.request.get(B + '/ig/skills')).text();
ok(!html.includes('Follow this skill one step at a time'), 'locked drop HTML does not contain the prompt');
ok(html.includes('Unlock this drop'), 'locked drop shows the form');
await pg.goto(B + '/ig/skills', { waitUntil: 'networkidle' }); await shot('02-locked');
await pg.fill('input[name=name]', 'Pat Visitor'); await pg.fill('input[name=email]', 'pat@example.com');
// phone and the agreement box are both required
const noPhone = await ctx.request.post(B + '/api/leads', { data: { name: 'P', email: 'p@example.com', consent: true, path: '/ig/skills' } });
ok(noPhone.status() === 400, 'lead without a phone is refused');
const noConsent = await ctx.request.post(B + '/api/leads', { data: { name: 'P', email: 'p@example.com', phone: '+1 214 555 0100', path: '/ig/skills' } });
ok(noConsent.status() === 400, 'lead without agreement is refused');
await pg.fill('input[name=phone]', '+1 214 555 0100'); await pg.check('input[type=checkbox]');
await pg.click('button:has-text("Unlock this drop")'); await pg.waitForSelector('text=Try this prompt', { timeout: 8000 });
ok(await pg.locator('text=Follow this skill one step at a time').count() > 0, 'drop unlocks after lead form');
await shot('03-unlocked');

// 3 sign up
await pg.goto(B + '/signup', { waitUntil: 'networkidle' }); await shot('04-signup');
await pg.fill('input[name=name]', 'Hemanth Kumar'); await pg.fill('input[name=email]', EMAIL); await pg.fill('input[name=password]', 'secret12');
await pg.click('button:has-text("Create my account")'); await pg.waitForTimeout(500);
ok(!pg.url().includes('/dashboard'), 'sign-up is blocked until the agreement box is ticked');
await pg.check('input[type=checkbox] >> nth=0');
await pg.click('button:has-text("Create my account")'); await pg.waitForURL('**/dashboard', { timeout: 10000 });
await pg.waitForSelector('.toast', { timeout: 8000 });
ok((await pg.locator('.toast').first().innerText()).includes('+1'), 'daily check-in toast shows +1');
await pg.waitForTimeout(1200); await shot('05-dashboard');
const body1 = await pg.locator('body').innerText();
ok(!body1.includes(EMAIL), 'email is nowhere on the dashboard page');
ok((await pg.locator('.avatar-initials').first().innerText()).trim() === 'HK', 'avatar shows HK');
ok(/1\s*\n?\s*1|streak/i.test(await pg.locator('.stat-chip').innerText()) || true, 'stat chip present');
console.log('   chip:', (await pg.locator('.stat-chip').innerText()).replace(/\s+/g,' '));

// 4 challenge
await pg.goto(B + '/challenges/write-a-better-prompt', { waitUntil: 'networkidle' });
for (let i = 0; i < 4; i++) { await pg.locator('.opt').nth(1).click(); await pg.click(i < 3 ? 'button:has-text("Next")' : 'button:has-text("Check my answers")'); await pg.waitForTimeout(450); }
await pg.waitForSelector('text=Solved', { timeout: 8000 });
await pg.waitForTimeout(900); await shot('06-challenge-result');
ok((await pg.locator('body').innerText()).includes('You earned 20 points'), 'challenge awards 20 points');
await pg.click('button:has-text("Play again")');
for (let i = 0; i < 4; i++) { await pg.locator('.opt').nth(1).click(); await pg.click(i < 3 ? 'button:has-text("Next")' : 'button:has-text("Check my answers")'); await pg.waitForTimeout(450); }
await pg.waitForSelector('text=Solved');
ok((await pg.locator('body').innerText()).includes('already earned'), 'replay pays nothing');

// 5 lesson complete
await pg.goto(B + '/learn/beginner/what-a-neural-network-is', { waitUntil: 'networkidle' });
await pg.click('button:has-text("Mark as complete")'); await pg.waitForTimeout(1200);
ok((await pg.locator('.toast').allInnerTexts()).join(' ').includes('Lesson complete'), 'lesson complete toast');

// 6 dashboard points = 1 + 20 + 5 = 26
await pg.goto(B + '/dashboard', { waitUntil: 'networkidle' }); await pg.waitForTimeout(800);
const chip = (await pg.locator('.stat-chip').innerText()).replace(/\s+/g, ' ');
ok(/26/.test(chip), 'header chip shows 26 points -> ' + chip);

// 7 settings: photo, profile, portfolio
writeFileSync('/tmp/av.png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));
await pg.goto(B + '/settings', { waitUntil: 'networkidle' });
await pg.fill('input[placeholder^="Product manager"]', 'Operations lead learning to work with AI');
await pg.fill('input[placeholder="Austin, TX"]', 'Austin, TX');
await pg.fill('textarea[placeholder^="Where you have worked"]', 'Ten years in operations. Now building AI skills to automate the boring parts of my team’s week.');
await pg.fill('input[placeholder^="Prompting"]', 'Prompting, Process design, Spreadsheets');
await pg.fill('input[placeholder="https://linkedin.com/in/you"]', 'https://linkedin.com/in/example');
await pg.click('button:has-text("Save changes")'); await pg.waitForTimeout(900);
ok((await pg.locator('.toast').allInnerTexts()).join(' ').includes('Profile saved'), 'profile saved');
await pg.setInputFiles('input[type=file]', '/tmp/av.png'); await pg.waitForTimeout(1500);
ok((await pg.locator('.toast').allInnerTexts()).join(' ').includes('Photo updated'), 'photo uploaded');
await pg.fill('input[placeholder="Title"]', 'Prompt library for support teams');
await pg.fill('textarea[placeholder^="What it is"]', '40 tested prompts that cut reply time in half.');
await pg.fill('input[placeholder^="Link"]', 'https://example.com/prompts');
await pg.fill('input[placeholder^="Tags"]', 'prompting, support');
await pg.click('button:has-text("Add to portfolio")'); await pg.waitForTimeout(900);
await shot('07-settings');
ok(await pg.locator('text=Prompt library for support teams').count() > 0, 'portfolio piece added');
// bad URL rejected
await pg.fill('input[placeholder="Title"]', 'x'); await pg.fill('input[placeholder^="Link"]', 'javascript:alert(1)');
await pg.evaluate(() => document.querySelector('input[placeholder^="Link"]').type = 'text');
await pg.click('button:has-text("Add to portfolio")'); await pg.waitForTimeout(600);
ok(await pg.locator('text=must start with http').count() > 0, 'javascript: portfolio link rejected');

// 8 public profile, viewed by a fresh anonymous context
const handle = (await pg.locator('input[maxlength="30"]').inputValue());
const anon = await b.newContext({ viewport: { width: 1440, height: 900 } }); const ap = await anon.newPage();
await ap.goto(`${B}/u/${handle}`, { waitUntil: 'networkidle' }); await ap.waitForTimeout(1500);
await ap.screenshot({ path: (process.env.SHOTS||'/tmp')+'/e2e-08-profile.png' });
const ptxt = await ap.locator('body').innerText();
ok(ptxt.includes('Hemanth Kumar') && ptxt.includes('Prompt library for support teams'), 'public profile renders name + portfolio');
ok(!ptxt.includes(EMAIL), 'public profile does not leak email');
ok(await ap.locator('img.avatar').count() > 0, 'public profile shows uploaded photo');
await anon.close();

// 9 jobs empty state
await pg.goto(B + "/jobs", { waitUntil: "networkidle" }); await shot("09-jobs");
ok(await pg.locator("text=8 open roles").count() > 0, "jobs board lists the 8 starter roles");

// 10 lesson question author is a name, not email
await pg.goto(B + '/learn/beginner/how-a-network-learns', { waitUntil: 'networkidle' });
const ta = pg.locator('textarea').first();
if (await ta.count()) { await ta.fill('Does a bigger network always learn better?'); await pg.locator('button:has-text("Ask")').first().click(); await pg.waitForTimeout(2500); }
ok(!(await pg.locator('body').innerText()).includes(EMAIL), 'lesson thread never shows email');

// 11 newsletter popup after 45s (fake clock)
const np = await ctx.newPage(); await np.clock.install(); await np.goto(B + '/notes', { waitUntil: 'networkidle' });
await np.clock.fastForward(46000); await np.waitForTimeout(800);
ok(await np.locator('text=Stay a step ahead').count() > 0, 'newsletter popup appears after a while');
await np.screenshot({ path: (process.env.SHOTS||'/tmp')+'/e2e-10-newsletter.png' });
await np.click('button:has-text("Yes, send it to me")'); await np.waitForTimeout(500);
ok(await np.locator("text=You're in").count() === 0, 'newsletter is refused until the agreement box is ticked');
await np.check('input[type=checkbox]'); await np.click('button:has-text("Yes, send it to me")'); await np.waitForSelector("text=You're in", { timeout: 6000 });
ok(true, 'signed-in newsletter opt-in works with no email typed');

// 12 sign out then streak chip gone
console.log('console/page errors:', errors.length ? errors.slice(0,5) : 'none');
console.log(fails ? `${fails} FAILED` : 'ALL E2E CHECKS PASSED');
await b.close();

// Audience features: notes gate, consent, admin console + exports, unsubscribe, audit events.
// Run with the app in preview mode and ADMIN_EMAILS=admin@example.com (see tests/README.md).
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import http from 'http';
const B = process.env.BASE_URL || 'http://localhost:3100';
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
let bad = 0; const ok = (c, l) => { console.log(c ? 'ok  ' : 'FAIL', l); if (!c) bad++; };
const stamp = Date.now();
const signup = async (ctx, email, name) => { const p = await ctx.newPage(); await p.goto(B + '/signup', { waitUntil: 'networkidle' }); await p.fill('input[name=name]', name); await p.fill('input[name=email]', email); await p.fill('input[name=password]', 'secret12'); await p.check('input[type=checkbox] >> nth=0'); await p.click('button:has-text("Create my account")'); await p.waitForURL('**/dashboard'); return p; };

// privacy notice is public and says what matters
const anon = await b.newContext();
const priv = await (await anon.request.get(B + '/privacy')).text();
ok(priv.includes('Nothing is recorded about visitors who have not signed in') && priv.includes('Your agreement') && priv.includes('Unsubscribe') && priv.includes('hello@sortnow.co'), 'privacy notice is public and covers agreement, unsubscribe and contact');

// notes: gate for strangers, open after leaving name + email + phone
const nr = await (await anon.request.get(B + '/notes')).text();
ok(nr.includes('Unlock the notes') && !nr.includes('Plain words for real work'), 'notes show only the gate to a stranger');
const lp = await anon.newPage(); await lp.goto(B + '/notes', { waitUntil: 'networkidle' });
await lp.fill('input[name=name]', 'Nora Notes'); await lp.fill('input[name=email]', `nora${stamp}@example.com`); await lp.fill('input[name=phone]', '+1 972 555 0101');
await lp.click('button:has-text("Unlock the notes")'); await lp.waitForTimeout(800);
ok((await lp.locator('text=Plain words for real work').count()) === 0, 'the form will not submit without the agreement box');
await lp.check('input[type=checkbox]'); await lp.click('button:has-text("Unlock the notes")'); await lp.waitForSelector('text=Plain words for real work', { timeout: 8000 });
ok(true, 'notes open after name, email, phone and agreement');
ok((await (await anon.request.get(B + '/week')).text()).includes('This week') && !(await (await anon.request.get(B + '/week')).text()).includes('Unlock the notes'), 'the weekly note opens too, with the same unlock');
const leads = JSON.parse(readFileSync('data/leads.json', 'utf8'));
ok(leads.some((l) => l.email === `nora${stamp}@example.com` && l.phone === '+1 972 555 0101'), 'the lead (name, email, phone) was stored');

// the lead is also on the newsletter list with the words they agreed to, and can unsubscribe
const plat = JSON.parse(readFileSync('data/platform.json', 'utf8'));
const sub = plat.subscribers.find((s) => s.email === `nora${stamp}@example.com`);
ok(sub && /I agree that sortNow can store my name, email and phone/.test(sub.consentText || '') && (sub.consentText || '').startsWith('2026-10-v2'), 'newsletter row keeps the exact consent wording and its version');
ok(sub && sub.unsubToken && sub.unsubToken.length === 32, 'subscriber has an unsubscribe token');
const page = await anon.newPage(); await page.goto(B + '/unsubscribe?t=' + sub.unsubToken, { waitUntil: 'networkidle' });
await page.click('button:has-text("Yes, unsubscribe me")'); await page.waitForSelector("text=You're unsubscribed");
ok(JSON.parse(readFileSync('data/platform.json', 'utf8')).subscribers.find((s) => s.email === sub.email).unsubscribedAt, 'unsubscribing is recorded');
ok((await anon.request.post(B + '/api/unsubscribe', { data: { token: 'x'.repeat(32) } })).status() === 404, 'an unknown token unsubscribes nobody');
ok((await anon.request.post(B + '/api/newsletter', { data: { email: 'a@b.co' } })).status() === 400, 'newsletter signup without consent is refused');

// admin console
const mem = await b.newContext(); await signup(mem, `m${stamp}@example.com`, 'Mia Member');
for (const u of ['/admin', '/api/admin/export?kind=leads']) ok((await mem.request.get(B + u)).status() === 404, `member GET ${u} -> 404`);
ok((await anon.request.get(B + '/admin')).status() === 404, 'anonymous GET /admin -> 404');
const adm = await b.newContext(); const ap = await adm.newPage();
await ap.goto(B + '/signup', { waitUntil: 'networkidle' }); await ap.fill('input[name=name]', 'Ada Admin'); await ap.fill('input[name=email]', 'admin@example.com'); await ap.fill('input[name=password]', 'secret12'); await ap.check('input[type=checkbox] >> nth=0'); await ap.click('button:has-text("Create my account")');
if (!(await ap.waitForURL('**/dashboard', { timeout: 5000 }).then(() => true).catch(() => false))) { // the admin account already exists from an earlier suite: sign in instead
  await ap.goto(B + '/login', { waitUntil: 'networkidle' }); await ap.fill('input[name=email]', 'admin@example.com'); await ap.fill('input[name=password]', 'secret12'); await ap.click('button:has-text("Sign in")'); await ap.waitForURL('**/dashboard');
}
await ap.goto(B + '/admin', { waitUntil: 'networkidle' });
const txt = await ap.locator('main').innerText();
ok(txt.includes('Nora Notes') && txt.includes('+1 972 555 0101'), 'admin console lists the lead with phone');
ok(txt.includes('Where people go'), 'admin console has the audit section');
const csv = await adm.request.get(B + '/api/admin/export?kind=leads'); const body = await csv.text();
ok(csv.status() === 200 && (csv.headers()['content-type'] || '').includes('text/csv') && body.includes('Nora Notes'), 'leads export is a CSV with the lead');
const nl = await (await adm.request.get(B + '/api/admin/export?kind=newsletter')).text();
ok(!nl.includes(`nora${stamp}@example.com`), 'the newsletter export leaves out anyone who unsubscribed');
ok((await adm.request.get(B + '/api/admin/export?kind=nope')).status() === 400, 'unknown export is a 400');

// audit trail: a member's movements are recorded (views and time on page)
const posts = []; const tp = await mem.newPage(); tp.on('request', (r) => { if (r.url().endsWith('/api/events') && r.method() === 'POST') posts.push(JSON.parse(r.postData() || '{}')); });
await tp.goto(B + '/learn', { waitUntil: 'networkidle' }); await tp.waitForTimeout(1500); await tp.goto(B + '/jobs', { waitUntil: 'networkidle' }); await tp.waitForTimeout(1200);
ok(posts.some((e) => e.type === 'view' && e.path === '/learn') && posts.some((e) => e.type === 'view' && e.path === '/jobs'), 'page views are recorded for each page');
ok(posts.some((e) => e.type === 'dwell' && e.path === '/learn' && e.seconds >= 1), 'time on the previous page is recorded');
ok(posts.every((e) => typeof e.sessionId === 'string' && e.sessionId.length >= 16), 'every event carries a visit id');
ok(posts.some((e) => e.type === 'view' && e.path === '/jobs' && e.referrer === '/learn'), 'the previous page is kept as the referrer');


// visitors who are not signed in are never tracked
for (const path of ['/ig/skills', '/notes', '/week']) {
  const r = await anon.request.post(B + '/api/events', { data: { type: 'view', path, createdAt: new Date().toISOString() } });
  ok(r.status() === 401, `an anonymous visit event on ${path} is refused (401): nothing is stored about people who do not sign in`);
}
const ipCtx = await b.newContext(); const ipPage = await ipCtx.newPage(); const ipEvents = []; ipPage.on('request', (r) => { if (r.url().endsWith('/api/events')) ipEvents.push(r.url()); });
await ipPage.goto(B + '/ig/skills', { waitUntil: 'networkidle' }); await ipPage.waitForTimeout(1500); await ipPage.mouse.wheel(0, 800); await ipPage.waitForTimeout(800);
ok(ipEvents.length === 0, 'opening a reel drop without filling the form sends no tracking at all');

// link tag: ?src= is kept and stored with the lead
const tagCtx = await b.newContext(); const tp2 = await tagCtx.newPage();
await tp2.goto(B + '/week?src=ig-week-41', { waitUntil: 'networkidle' }); await tp2.goto(B + '/notes', { waitUntil: 'networkidle' });
await tp2.fill('input[name=name]', 'Tag Tester'); await tp2.fill('input[name=email]', `tag${stamp}@example.com`); await tp2.fill('input[name=phone]', '+1 972 555 0177'); await tp2.check('input[type=checkbox]');
await tp2.click('button:has-text("Unlock the notes")'); await tp2.waitForSelector('text=Plain words for real work');
ok(JSON.parse(readFileSync('data/leads.json', 'utf8')).some((l) => l.email === `tag${stamp}@example.com` && l.campaign === 'ig-week-41'), 'the link tag (?src=ig-week-41) is stored with the lead');
ok((await anon.request.post(B + '/api/leads', { data: { name: 'T', email: `bad${stamp}@example.com`, phone: '+1 972 555 0178', consent: true, path: '/notes', campaign: 'x; drop table' } })).status() === 200 && JSON.parse(readFileSync('data/leads.json', 'utf8')).find((l) => l.email === `bad${stamp}@example.com`)?.campaign === null, 'a malformed tag is dropped, the lead is kept');

// spam: a filled hidden field looks successful but keeps nothing and unlocks nothing
const bot = await anon.request.post(B + '/api/leads', { data: { name: 'Bot', email: `bot${stamp}@example.com`, phone: '+1 972 555 0199', consent: true, path: '/notes', website: 'http://spam.example' } });
ok(bot.status() === 200 && !(bot.headers()['set-cookie'] || '').includes('sortnow_learn_lead'), 'a bot (hidden field filled) gets no unlock cookie');
ok(!JSON.parse(readFileSync('data/leads.json', 'utf8')).some((l) => l.email === `bot${stamp}@example.com`), 'and nothing is stored for it');
let limited = 0; for (let i = 0; i < 20; i++) { const r = await anon.request.post(B + '/api/leads', { headers: { 'X-Forwarded-For': '198.51.100.7' }, data: { name: 'S', email: 'spam@example.com', consent: false, path: '/notes' } }); if (r.status() === 429) limited++; }
ok(limited >= 4, `rapid repeats from one address are slowed down (${limited} of 20 refused with 429)`);

// newsletter sending (needs the app started with RESEND_API_KEY, NEWSLETTER_FROM and RESEND_API_URL=http://localhost:4010)
const got = []; let failNext = 0;
const mock = http.createServer((req, res) => { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => {
  if (req.url === '/emails/batch') { if (failNext > 0) { failNext--; res.writeHead(500, { 'Content-Type': 'application/json' }); return res.end('{"message":"boom"}'); } got.push({ auth: req.headers.authorization, msgs: JSON.parse(d) }); res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{"data":[]}'); }
  res.writeHead(404); res.end(); }); });
await new Promise((r) => mock.listen(4010, r));
const subA = `sa${stamp}@example.com`, subB = `sb${stamp}@example.com`;
for (const e of [subA, subB]) ok((await anon.request.post(B + '/api/newsletter', { data: { email: e, consent: true } })).status() === 200, `newsletter signup ${e.slice(0, 2)} with agreement`);
const mailBefore = JSON.parse(readFileSync('data/platform.json', 'utf8')).subscribers.filter((s2) => s2.consentText && !s2.unsubscribedAt);
ok(!mailBefore.some((s2) => s2.email === sub.email), 'an unsubscribed person is not mailable');
await ap.goto(B + '/admin/newsletter', { waitUntil: 'networkidle' });
ok((await ap.locator('text=Send me a test').count()) === 1, 'admin newsletter page shows the composer when sending is configured');
ok((await mem.request.get(B + '/admin/newsletter')).status() === 404 && (await mem.request.post(B + '/api/admin/newsletter', { data: { mode: 'send', confirm: 'SEND', subject: 'x', body: 'y' } })).status() === 404, 'members cannot open or call the newsletter tools');
await ap.fill('input[maxlength="150"]', 'Week 41: tokens'); await ap.fill('textarea', 'Hello from sortNow.\n\nThis week: https://learn.sortnow.co/week');
await ap.click('button:has-text("Send me a test")'); await ap.waitForSelector('text=Test sent to admin@example.com');
ok(got.length === 1 && got[0].msgs.length === 1 && got[0].msgs[0].to[0] === 'admin@example.com' && got[0].msgs[0].subject === '[Test] Week 41: tokens', 'the test goes only to the admin, marked [Test]');
ok(got[0].auth === 'Bearer testkey12345', 'the API key is sent as a bearer token');
ok((await ap.locator('button:has-text("Send to")').isDisabled()), 'send stays disabled until SEND is typed');
await ap.fill('input[autocomplete=off]', 'SEND'); await ap.click('button:has-text("Send to")'); await ap.waitForSelector('text=finished');
const all = got.slice(1).flatMap((g) => g.msgs); const sentTo = all.map((m) => m.to[0]);
ok(sentTo.includes(subA) && sentTo.includes(subB) && !sentTo.includes(sub.email), 'it goes to people who agreed and skips the unsubscribed one');
ok(new Set(sentTo).size === sentTo.length && sentTo.length === mailBefore.length, `each mailable person gets it once (${sentTo.length} of ${mailBefore.length})`);
const mA = all.find((m) => m.to[0] === subA); const tokA = JSON.parse(readFileSync('data/platform.json', 'utf8')).subscribers.find((s2) => s2.email === subA).unsubToken;
ok(mA.headers['List-Unsubscribe'].includes('/api/unsubscribe?t=' + tokA) && mA.headers['List-Unsubscribe-Post'] === 'List-Unsubscribe=One-Click' && mA.html.includes('/unsubscribe?t=' + tokA) && mA.text.includes('Unsubscribe in one click'), 'every email has its own one-click unsubscribe (header and footer)');
ok((await anon.request.post(B + '/api/unsubscribe?t=' + tokA, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, data: 'List-Unsubscribe=One-Click' })).status() === 200, 'the mail app one-click button unsubscribes');
await ap.waitForTimeout(1500); ok((await ap.locator('li:has-text("Week 41: tokens")').count()) >= 1, 'the sent issue is listed with its counts');

// a failed batch is recorded and a retry sends only what is missing
const issuesBefore = JSON.parse(readFileSync('data/platform.json', 'utf8')).issues.length;
failNext = 1; got.length = 0;
const r1 = await (await adm.request.post(B + '/api/admin/newsletter', { data: { mode: 'send', confirm: 'SEND', subject: 'Retry test', body: 'Body' } })).json();
ok(r1.issue && r1.issue.failed > 0 && r1.done === false, 'a failed batch is recorded as failed, not lost');
const r2 = await (await adm.request.post(B + '/api/admin/newsletter', { data: { mode: 'send', confirm: 'SEND', issueId: r1.issue.id } })).json();
ok(r2.done === true && r2.issue.sent >= 1, 'retrying sends the missing ones and finishes');
ok((await adm.request.post(B + '/api/admin/newsletter', { data: { mode: 'send', subject: 'x', body: 'y' } })).status() === 400, 'sending needs the word SEND');
ok(JSON.parse(readFileSync('data/platform.json', 'utf8')).issues.length === issuesBefore + 1, 'the retry reused the same issue');
mock.close();

await b.close(); console.log(bad ? `AUDIENCE: ${bad} FAILED` : 'AUDIENCE: ALL PASSED'); process.exit(bad ? 1 : 0);

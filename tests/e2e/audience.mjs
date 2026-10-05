// Audience features: notes gate, consent, admin console + exports, unsubscribe, audit events.
// Run with the app in preview mode and ADMIN_EMAILS=admin@example.com (see tests/README.md).
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const B = process.env.BASE_URL || 'http://localhost:3100';
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
let bad = 0; const ok = (c, l) => { console.log(c ? 'ok  ' : 'FAIL', l); if (!c) bad++; };
const stamp = Date.now();
const signup = async (ctx, email, name) => { const p = await ctx.newPage(); await p.goto(B + '/signup', { waitUntil: 'networkidle' }); await p.fill('input[name=name]', name); await p.fill('input[name=email]', email); await p.fill('input[name=password]', 'secret12'); await p.check('input[type=checkbox] >> nth=0'); await p.click('button:has-text("Create my account")'); await p.waitForURL('**/dashboard'); return p; };

// privacy notice is public and says what matters
const anon = await b.newContext();
const priv = await (await anon.request.get(B + '/privacy')).text();
ok(priv.includes('Your agreement') && priv.includes('Unsubscribe') && priv.includes('hello@sortnow.co'), 'privacy notice is public and covers agreement, unsubscribe and contact');

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
ok(sub && /I agree that sortNow can store my name, email and phone/.test(sub.consentText || '') && (sub.consentText || '').startsWith('2026-10-v1'), 'newsletter row keeps the exact consent wording and its version');
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

await b.close(); console.log(bad ? `AUDIENCE: ${bad} FAILED` : 'AUDIENCE: ALL PASSED'); process.exit(bad ? 1 : 0);

// Idle sign-out, end to end. Start the app with APP_SECRET=e2e-session-secret-e2e-session-secret-0001
// (the test forges "last active" stamps with the same secret) and ALLOW_DEMO_MODE=1.
process.env.APP_SECRET ||= "e2e-session-secret-e2e-session-secret-0001";
import { chromium } from 'playwright';
const idle = await import('../../src/lib/idle.ts');
const B = process.env.BASE_URL || 'http://localhost:3100';
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
let bad = 0; const ok = (c, l) => { console.log(c ? 'ok  ' : 'FAIL', l); if (!c) bad++; };
const stamp = Date.now(), H = 3600_000, HTML = { Accept: 'text/html' };
const member = async (name) => {
  const ctx = await b.newContext({ viewport: { width: 1100, height: 900 } }); const p = await ctx.newPage();
  const email = `${name}${stamp}@example.com`;
  await p.goto(B + '/signup', { waitUntil: 'networkidle' });
  await p.fill('input[name=name]', name); await p.fill('input[name=email]', email); await p.fill('input[name=password]', 'secret12');
  await p.check('input[type=checkbox] >> nth=0'); await p.click('button:has-text("Create my account")'); await p.waitForURL('**/dashboard'); await p.waitForTimeout(800);
  return { ctx, p, email };
};
const setStamp = async (ctx, agoMs) => ctx.addCookies([{ name: idle.IDLE_COOKIE, value: await idle.signActive(Date.now() - agoMs), url: B, httpOnly: true }]);
const stampOf = async (ctx) => { const c = (await ctx.cookies(B)).find((x) => x.name === idle.IDLE_COOKIE); return c ? idle.readActive(c.value) : null; };
const names = async (ctx) => (await ctx.cookies(B)).map((c) => c.name);
const get = (ctx, path) => ctx.request.get(B + path, { maxRedirects: 0, headers: HTML });

// ---- the stamp
const a = await member('Ada');
const first = await stampOf(a.ctx);
ok(first !== null && Math.abs(Date.now() - first) < 60_000, 'signing in stamps a "last active" time');
ok((await a.ctx.cookies(B)).find((c) => c.name === idle.IDLE_COOKIE)?.httpOnly === true, 'the stamp is HttpOnly, so scripts cannot touch it');
ok((await get(a.ctx, '/dashboard')).status() === 200, 'a signed-in member reaches a members page');

// ---- not idle yet: 2h59m ago is fine, and a page load refreshes the stamp
await setStamp(a.ctx, 2 * H + 59 * 60_000);
ok((await get(a.ctx, '/dashboard')).status() === 200, 'quiet for 2h59m: still signed in');
const refreshed = await stampOf(a.ctx);
ok(refreshed !== null && Date.now() - refreshed < 60_000, 'that page load refreshed the stamp (it counts as activity)');
await setStamp(a.ctx, 30_000);
const before = await stampOf(a.ctx); await get(a.ctx, '/dashboard');
ok((await stampOf(a.ctx)) === before, 'the stamp is not rewritten on every request (at most once a minute)');

// ---- background calls do not count as activity
await setStamp(a.ctx, 10 * 60_000);
const bgBefore = await stampOf(a.ctx);
await a.ctx.request.post(B + '/api/checkin', { data: { tz: 'UTC', lessons: [] } });
await a.ctx.request.post(B + '/api/events', { data: { type: 'view', path: '/dashboard', createdAt: new Date().toISOString() } });
ok((await stampOf(a.ctx)) === bgBefore, 'check-in and activity pings do not keep a session alive');

// ---- the touch endpoint
ok((await (await b.newContext()).request.post(B + '/api/session/touch')).status() === 401, 'touch needs a signed-in session (401)');
await setStamp(a.ctx, 10 * 60_000);
ok((await a.ctx.request.post(B + '/api/session/touch')).status() === 200 && Date.now() - (await stampOf(a.ctx)) < 60_000, 'touch refreshes the stamp for an active session');

// ---- idle: 4h ago
await setStamp(a.ctx, 4 * H);
const pageRes = await get(a.ctx, '/dashboard');
ok(pageRes.status() === 307 && (pageRes.headers().location || '').includes('/login?reason=idle') && (pageRes.headers().location || '').includes('next=%2Fdashboard'), 'idle for 4h: a members page redirects to sign-in with reason=idle and the way back');
ok(!(await names(a.ctx)).includes(idle.IDLE_COOKIE) && !(await names(a.ctx)).includes('sortnow_learn_demo'), 'the session and the stamp are cleared');
const again = await get(a.ctx, '/dashboard');
ok(again.status() === 307 && !(again.headers().location || '').includes('reason=idle'), 'the next request is simply signed out (no repeated idle message)');

// ---- idle API call
const b2 = await member('Bea');
await setStamp(b2.ctx, 4 * H);
const api = await b2.ctx.request.post(B + '/api/events', { data: { type: 'view', path: '/x', createdAt: new Date().toISOString() } });
ok(api.status() === 401 && (await api.json()).idle === true, 'idle: an API call gets a 401 flagged idle, not data');
const c2 = await member('Cy');
await setStamp(c2.ctx, 4 * H);
ok((await c2.ctx.request.post(B + '/api/session/touch')).status() === 401, 'an expired session cannot be revived with touch');

// ---- public pages: stale session cleared quietly, then a fresh sign-in is not punished
const d = await member('Dee');
await setStamp(d.ctx, 4 * H);
ok((await get(d.ctx, '/privacy')).status() === 200, 'idle on a public page: no redirect');
ok(!(await names(d.ctx)).includes(idle.IDLE_COOKIE), 'but the stale session is cleared');
await d.p.goto(B + '/login', { waitUntil: 'networkidle' });
await d.p.fill('input[name=email]', d.email); await d.p.fill('input[name=password]', 'secret12'); await d.p.click('button:has-text("Sign in")'); await d.p.waitForURL('**/dashboard', { timeout: 10000 });
await d.p.waitForTimeout(800);
ok((await get(d.ctx, '/dashboard')).status() === 200, 'signing in again after being idle works and is not signed straight back out');

// ---- forged or broken stamps
const e = await member('Eve');
await e.ctx.addCookies([{ name: idle.IDLE_COOKIE, value: `${Date.now() - 4 * H}.${'A'.repeat(43)}`, url: B, httpOnly: true }]);
ok((await get(e.ctx, '/dashboard')).status() === 200 && (await stampOf(e.ctx)) !== null, 'a forged stamp is ignored and replaced (it cannot extend or shorten anything)');
await e.ctx.addCookies([{ name: idle.IDLE_COOKIE, value: 'not-a-stamp', url: B, httpOnly: true }]);
ok((await get(e.ctx, '/dashboard')).status() === 200, 'a malformed stamp is replaced, not an error');

// ---- the warning and sign-out as a person sees them
const f = await member('Flo');
await f.p.close();
const page = await f.ctx.newPage(); const touches = []; page.on('request', (r) => { if (r.url().endsWith('/api/session/touch')) touches.push(r.method()); });
await page.clock.install({ time: Date.now() });
await page.goto(B + '/dashboard', { waitUntil: 'networkidle' });
ok((await page.locator('[role=alertdialog]').count()) === 0, 'no warning while the person is active');
await page.clock.fastForward('02:57:00'); await page.waitForTimeout(400);
ok((await page.locator('[role=alertdialog]').count()) === 1, 'after 2h57m of quiet a "Still there?" warning appears');
const left = await page.locator('[data-testid=idle-countdown]').innerText();
ok(/^[0-5]:\d\d$/.test(left), `it counts down the time left (${left})`);
await page.click('button:has-text("Stay signed in")'); await page.waitForTimeout(400);
ok((await page.locator('[role=alertdialog]').count()) === 0 && touches.includes('POST'), '"Stay signed in" dismisses it and tells the server');
await page.clock.fastForward('03:01:00'); await page.waitForURL('**/login?reason=idle**', { timeout: 10000 });
ok((await page.locator('text=signed out after a long time away').count()) >= 1, 'after 3 more quiet hours the person lands on sign-in with a clear message');
const afterGuard = await get(f.ctx, '/dashboard');
ok(afterGuard.status() === 307, 'and the session really ended on the server too');
await b.close(); console.log(bad ? `SESSION: ${bad} FAILED` : 'SESSION: ALL PASSED'); process.exit(bad ? 1 : 0);

// The idle sign-out rules: the signed cookie cannot be forged, and expiry is decided correctly.
// Run: node tests/unit/idle.test.mjs
process.env.APP_SECRET = "unit-test-secret-unit-test-secret-1234";
const idle = await import("../../src/lib/idle.ts");
let bad = 0; const ok = (c, l) => { console.log(c ? "ok  " : "FAIL", l); if (!c) bad++; };
const MIN = 60_000, now = Date.now();

const fresh = await idle.signActive(now);
ok((await idle.readActive(fresh)) === now, "a signed stamp reads back as the same time");
ok((await idle.readActive(undefined)) === null && (await idle.readActive("")) === null && (await idle.readActive("garbage")) === null, "missing or malformed stamps read as nothing");
const [ts, sig] = fresh.split(".");
ok((await idle.readActive(`${now - 4 * 3600_000}.${sig}`)) === null, "changing the time breaks the signature (cannot back-date or extend)");
ok((await idle.readActive(`${ts}.${sig.slice(0, -2)}xx`)) === null, "a tampered signature is rejected");
ok((await idle.readActive(`${now + 3600_000}.${await idle.signActive(now + 3600_000).then((v) => v.split(".")[1])}`)) === null, "a stamp from the future is rejected");
process.env.APP_SECRET = "a-different-secret-a-different-secret-99";
ok((await idle.readActive(fresh)) === null, "a stamp signed with another secret is rejected");
process.env.APP_SECRET = "unit-test-secret-unit-test-secret-1234";

delete process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES;
ok(idle.idleMinutes() === 180 && idle.idleMs() === 3 * 3600_000, "the default limit is 3 hours");
process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES = "30"; ok(idle.idleMinutes() === 30, "the limit can be changed with NEXT_PUBLIC_SESSION_IDLE_MINUTES");
for (const v of ["0", "-5", "abc", "99999"]) { process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES = v; if (idle.idleMinutes() !== 180) ok(false, `a silly limit (${v}) falls back to 3 hours`); }
ok(true, "silly limits (0, negative, text, huge) fall back to 3 hours");
delete process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES;

ok(!idle.isIdle(now - 179 * MIN, now) && !idle.isIdle(now - 180 * MIN, now) && idle.isIdle(now - 181 * MIN, now), "idle means more than 3 hours since last activity");
ok(idle.IDLE_WARN_MS === 5 * MIN, "the warning comes 5 minutes before");

const open = ["/", "/login", "/signup", "/privacy", "/unsubscribe", "/ig/skills", "/u/hemu", "/notes", "/posts/x", "/week", "/auth/callback"];
const gated = ["/dashboard", "/learn", "/learn/beginner/x", "/challenges", "/challenges/x", "/jobs", "/settings", "/admin", "/activity"];
ok(open.every((p) => idle.isOpenPath(p)), "public pages are not redirected when a stale session is cleared");
ok(gated.every((p) => !idle.isOpenPath(p)), "member pages send a stale session to sign in");
ok(!idle.isOpenPath("/loginx") && !idle.isOpenPath("/uploads"), "similar-looking paths are not treated as public");
console.log(bad ? `${bad} FAILED` : "IDLE: ALL PASSED"); process.exit(bad ? 1 : 0);

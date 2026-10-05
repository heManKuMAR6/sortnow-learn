// Pure logic: timezones, streak maths, and the post-login redirect validator.
// Run: node --experimental-strip-types --no-warnings tests/unit/logic.test.mjs
const [d, s] = await Promise.all([import("../../src/lib/platform/dates.ts"), import("../../src/lib/safe-next.ts")]);
const t = [];
const at = new Date("2026-10-05T03:30:00Z");
t.push(["same instant is a different day in different zones", d.todayIn("America/Chicago", at) === "2026-10-04" && d.todayIn("Asia/Kolkata", at) === "2026-10-05" && d.todayIn("Pacific/Kiritimati", at) === "2026-10-05"]);
t.push(["bad timezone falls back instead of throwing", d.todayIn("Mars/Olympus", at) === "2026-10-05"]);
t.push(["isValidTimezone", d.isValidTimezone("America/Chicago") && !d.isValidTimezone("Mars/Olympus") && !d.isValidTimezone("") && !d.isValidTimezone(5)]);
t.push(["streak lapses after a missed day (own tz)", d.liveStreak({ streak: 5, lastActiveDay: "2026-10-02" }, "2026-10-04") === 0 && d.liveStreak({ streak: 5, lastActiveDay: "2026-10-03" }, "2026-10-04") === 5]);
t.push(["public profile gets one day of grace", d.liveStreak({ streak: 5, lastActiveDay: "2026-10-02" }, "2026-10-04", 1) === 5 && d.liveStreak({ streak: 5, lastActiveDay: "2026-10-01" }, "2026-10-04", 1) === 0]);
t.push(["streak maths: gap resets, same day is a no-op", (() => { let st = { streak: 0, longest: 0, lastActiveDay: null, points: 0 }; const r = (x) => { const o = d.applyCheckIn(st, x); st = o.next; return o.awarded; }; return r("2026-10-01") && !r("2026-10-01") && r("2026-10-02") && st.streak === 2 && r("2026-10-09") && st.streak === 1 && st.longest === 2; })()]);
const n = s.safeNext;
t.push(["safeNext blocks external and tricky paths", ["//e.com", "/\\e.com", "/.//e.com", "https://e.com", "javascript:x", "///e.com", "/\t/e.com", "", null, undefined, 5, "/" + "a".repeat(400)].every((v) => n(v) === "/dashboard")]);
t.push(["safeNext keeps good paths and query strings", n("/challenges") === "/challenges" && n("/jobs/x?a=1#top") === "/jobs/x?a=1#top" && n(["/a", "/b"]) === "/a" && n("x", "/home") === "/home"]);
let bad = 0;
for (const [l, ok] of t) { console.log(ok ? "ok  " : "FAIL", l); if (!ok) bad++; }
console.log(bad ? `${bad} FAILED` : "UNIT: ALL PASSED");
process.exit(bad ? 1 : 0);

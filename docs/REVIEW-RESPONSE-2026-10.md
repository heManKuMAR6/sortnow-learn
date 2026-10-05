# Response to the 2026-10-04 external review

Status of each finding after this change. "Test" names the check that proves it. Anything that depends on a dashboard setting, or that is a product decision, is listed as open, not claimed fixed.

| # | Finding | Status | What changed | Test |
|---|---|---|---|---|
| 1 | Points can be fabricated through the exposed SQL function | **Fixed** | Removed `award()`. `complete_lesson()` and `submit_challenge()` pay only for refs in `award_catalog` and grade answers inside Postgres. `checkin()` takes no date. | `pg/t.mjs`: invented lesson and challenge refused, wrong answers pay nothing, `checkin(date)` and `award()` no longer exist |
| 2 | Demo auth bypassable with a forged cookie | **Fixed** | Cookie is HMAC-signed. Demo login is off in production unless `ALLOW_DEMO_MODE=1`. | `sec.mjs`: three forged cookies rejected for edits and dashboard; production without the flag returns 503 |
| 3 | Coach auth only visual | **Fixed** | API requires sign-in; 20 questions/hour per person. | `sec.mjs`: guest 401, then 20 OK and 429 |
| 4 | Progress leaks between accounts, disagrees across devices, undo is local only | **Fixed** | Ticks are stored per account and per guest; the server list replaces the cache; signed-in completion has no undo. | `sec.mjs`: second account starts clean, second device shows the server state, guest ticks merge once and do not leak |
| 5 | Lead gate bypassable; leads vanish silently | **Fixed** | Signed unlock cookie; storage failure returns 503 and does not unlock. | `sec.mjs`: forged cookies stay locked; unwritable storage returns 503 with no cookie |
| 6 | Passing a challenge before sign-up loses the result | **Fixed** | A passed guest attempt is remembered and claimed automatically after sign-up. | `sec.mjs`: guest passes, signs up, lands back with "You earned 20 points" |
| 7 | Open redirect and a 500 on repeated `?next=` | **Fixed** | One `safeNext()` validator used everywhere. | `sec.mjs`: `//`, `/\`, `/.//`, absolute, `javascript:` all stay on site; repeated params return 200 |
| 8 | Newsletter and hiring unfinished; avatar replacement, accessibility, reduced motion | **Partly** | Avatar: added the storage SELECT policy that upsert needs (**not verified against hosted Supabase**). Reduced motion: global rule. Contrast: muted text darkened. Challenge options are real radio inputs. Newsletter dialog moves focus, closes on Escape, restores focus. | Build and e2e. A full accessibility audit has not been repeated |
| 9 | Streak: +1 for opening the app | **Open (your call)** | Unchanged on purpose: login-based check-in was the original request. | n/a |
| 10 | Forging yesterday/today/tomorrow gave a 3-day streak | **Fixed** | The client sends no date. The server uses its clock and the person's stored timezone, which can change once per 7 days. | `pg/t.mjs`, `sec.mjs` |
| 11 | Open across midnight does not check in again | **Fixed** | Re-check on tab visible, navigation and every 5 minutes. | `sec.mjs` with a fake clock: 1 call, then 2 after midnight |
| 12 | Local dates for check-in, UTC for display | **Fixed** | Header and dashboard use the person's own day. Public profiles use UTC with one day of grace. | `dates` unit checks, `sec.mjs` |
| 13 | Daily challenge repeats every six days; 135 points total | **Open (content)** | Needs new content. | n/a |
| 14 | `/status` called `awards` missing | **Fixed** | Distinguishes "missing" from "private, as intended"; also checks the new functions and reports whether `APP_SECRET` is set. | Simulated outage run |
| 15 | Missing account management | **Fixed (code)** | Password reset, resend confirmation, self-service deletion. | `sec.mjs` (deletion); reset and resend need a real Supabase to try |
| 16 | Email ownership verification disabled; Google/GitHub disabled | **Open (dashboard)** | Supabase settings, not code. | n/a |
| 17 | Newsletter delivery and unsubscribe; job-interest follow-up | **Open (build)** | Needs an email provider. | n/a |

Also verified: the real `supabase-js` client against the real schema logic (`pg/rpc-contract.mjs`) for argument names, result shapes and error messages the app maps to 404 and 400.

Not verified: real email delivery, OAuth, hosted avatar upload, video playback, and the live Supabase project.

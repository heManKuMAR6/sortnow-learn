# sortNow Learn: architecture

An AI learning platform on a zero-cost stack: **Vercel Hobby** (Next.js) and **Supabase Free** (Auth, Postgres, Storage). Videos stay on YouTube.

## What it does

| Area | Route | Notes |
| --- | --- | --- |
| Landing | `/` | One message, one next step |
| Lessons | `/learn`, `/learn/[track]/[slug]` | Video, key points, coach, mark complete (+5 points, once) |
| Challenges | `/challenges`, `/challenges/[slug]` | Short AI-literacy puzzles. Anyone can play, members earn points |
| Dashboard | `/dashboard` | Streak, points, today's challenge, next lesson, heatmap, badges |
| Public profile | `/u/[handle]` | Photo or initials, headline, bio, skills, links, portfolio, stats, heatmap, badges |
| Edit profile | `/settings` | Photo, basics, bio, skills, links, portfolio |
| Jobs | `/jobs`, `/jobs/[slug]` | Open roles for everyone. Every role says "email sortNow" (hemanofficial6@gmail.com); no recruiter contacts are ever shown. Optional "I'm interested" stores the application |
| Jobs admin | `/admin/jobs` | Admins only (404 for everyone else): post, edit, close, reopen, delete |
| Reel drops | `/ig`, `/ig/[slug]` | Prompts, notes, links and files. Locked until name + email (+ optional phone) |
| Newsletter | pop-up | After 45 s on the site, once, then snoozed 14 days |
| Auth | `/login`, `/signup` | Email + password, plus Google when Supabase is connected |

Daily check-in: the first visit each day while signed in gives **+1 point**, moves the **streak**, and shows a "+1" pop-up. Lessons pay 5 points, challenges pay 15 to 25. Each pays once.

## Principles

1. **Free tier only.** Nothing here needs a paid service. Move off a free tier only when you outgrow it.
2. **Content in git, people in the database.** Lessons, challenges and drops are TypeScript files you edit and push (`content.ts`, `challenges.ts`, `ig-posts.ts`). User data is stored in Postgres. Jobs are the exception: admins manage them in the app, so they live in Postgres (seeded from `src/lib/jobs.ts`).
3. **One seam for user data.** Pages and API routes call `getStore()` (`src/lib/platform/store.ts`). It returns the **Supabase adapter** when keys are set and a **local demo adapter** otherwise, so previews and `npm run dev` work with zero setup.
4. **The browser cannot award itself anything.** Points, streaks and counters change only inside `SECURITY DEFINER` SQL functions: `checkin()` (no date argument), `complete_lesson()` and `submit_challenge()`. They pay only for refs in `award_catalog` and grade against `challenge_answers`, both generated from the content files by `npm run gen:catalog` and unreadable by the browser. The old generic `award()` no longer exists. Column-level grants block direct writes. See `supabase/schema.sql`.
5. **Public by design, private by default.** Profiles are public but the table has no email column. Applications, awards, leads and subscribers are not readable by the anon key.
6. **Gate on the server.** A reel drop's content is not in the HTML until the visitor has submitted the lead form.

## Data model

```
auth.users (Supabase)
  profiles            1:1  handle, display_name, headline, bio, skills[], location, links,
                           avatar_url, points, streak, longest_streak, last_active_day,
                           challenges_done, lessons_done          (public read; owner edits text only)
  daily_activity      N    (user_id, day) -> points              (public read; function-written)
  awards              N    (user_id, kind, ref) unique           (owner read; function-written)
  portfolio_items     N    title, description, url, tags         (public read; owner CRUD)
  job_applications    N    (user_id, job_slug) unique, note      (owner read/insert)
  admins              N    user_id                               (read own row; added only in the SQL editor)
  jobs                N    slug, title, company?, location, mode, level, type?, posted, summary,
                           about[], skills[], status open|closed (public reads OPEN rows; only admins write)
leads                      name, email, phone, source            (anon insert only)
newsletter_subscribers     email unique, name, source            (anon insert only)
storage: avatars/<user_id>/avatar.jpg                            (public read; owner write)
```

## Request flow

```
Browser ──> Next.js (Vercel) ──> getStore() ──> Supabase (user's JWT, RLS applies)
                  │                        └─> demo adapter (data/platform.json or memory)
                  └─ content from src/lib/*.ts
```

- `middleware.ts` refreshes the Supabase session cookie.
- `getCurrentUser()` and `getCurrentProfile()` are memoised per request.
- The layout loads the profile once and passes only `displayName`, `handle`, `avatarUrl`, `points`, `streak` to the header. **Email is never rendered.**
- Daily check-in: `DailyCheckIn` (client) sends only the browser's timezone to `/api/checkin`. The server works out the day from its own clock and the person's stored timezone, so a client cannot submit yesterday or tomorrow. The SQL function enforces once per local day. The component re-checks after midnight (tab visible, navigation, every 5 minutes).
- Challenge grading: the browser receives questions without answers. For a signed-in person `/api/challenges/[slug]` calls `submit_challenge()`, which grades inside Postgres against `challenge_answers` and pays the catalog points once. Guests are graded in code and earn nothing; a passed guest attempt is remembered and claimed automatically after sign-up. Passing is 60 percent.
- Avatars: the browser crops to a 256 px JPEG; `/api/profile/avatar` stores it in Storage (Supabase) or on the profile (demo).

## Security model

- **Sessions.** Supabase Auth in production. The local demo login is for development only: it is **off in production** unless `ALLOW_DEMO_MODE=1`, and its cookie is HMAC-signed so it cannot be forged.
- **`APP_SECRET`** (32+ random characters, set in Vercel) signs the demo and lead cookies. Without it the app falls back to a weaker derived key and `/status` says so.
- **Lead gate.** The unlock cookie is signed. A lead that cannot be stored returns an error and does not unlock.
- **Return paths.** `safeNext()` accepts only same-site paths (no `//host`, no backslashes, no dot-segment tricks) and tolerates repeated `?next=`.
- **Coach.** Sign-in required, 20 questions per hour per person (best effort, per server instance).
- **Progress.** Lesson ticks are stored per account (and per guest) in the browser; for a signed-in person the server list replaces the cache, so devices agree. Signed-in completion cannot be undone, because its points were paid.
- **Timezone.** Stored privately (`profile_private`), first set free, changed at most once per 7 days, so switching zones cannot farm extra days. The header and dashboard use the person's own day; public profiles allow one day of grace.
- **Account management.** Password reset (`/forgot-password`, `/reset-password`), resend confirmation, and self-service deletion (`delete_my_account()`).

## Known limits, and what comes next

- **Demo mode is not durable.** Without Supabase keys the app keeps data in memory (and `data/platform.json` locally). On Vercel it resets when the instance recycles. A footer note says so. Connect Supabase to go live.
- **Reel-drop files.** A file in `public/` has a guessable URL. The page is gated; the file is not. Use an unlisted link for anything truly private.
- **Newsletter sending** is not built. Subscribers are collected; sending (Resend or Brevo free tiers) is the next step.
- **Admin UI covers jobs only.** Read leads, applications and subscribers in the Supabase table editor. Add drops in git.
- **Admin identity.** With Supabase, admins are rows in `admins`, enforced by RLS (`is_admin()`), so the rule holds even if the app has a bug. In preview mode only, `ADMIN_EMAILS` stands in.
- **Abuse controls** (rate limits, CAPTCHA on the lead form) are not in yet. Add them before running paid traffic.
- Check-in is login-based by design: opening the app while signed in earns +1 and moves the streak. If you would rather a streak day require finishing a lesson or challenge, that is a small change to `checkin()`.
- Content is finite: 4 lessons and 6 challenges pay 135 points once. The daily challenge cycles through the same six. Fresh daily content is the next product job.
- Newsletter delivery, an unsubscribe flow, and an automated follow-up for job interest are not built.
- Email-ownership verification is a Supabase setting (Authentication, Providers, Email, Confirm email) and needs a real SMTP provider for production.

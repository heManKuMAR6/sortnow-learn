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
| Jobs | `/jobs`, `/jobs/[slug]` | Roles from people who are hiring. "I'm interested" stores the application |
| Reel drops | `/ig`, `/ig/[slug]` | Prompts, notes, links and files. Locked until name + email (+ optional phone) |
| Newsletter | pop-up | After 45 s on the site, once, then snoozed 14 days |
| Auth | `/login`, `/signup` | Email + password, plus Google when Supabase is connected |

Daily check-in: the first visit each day while signed in gives **+1 point**, moves the **streak**, and shows a "+1" pop-up. Lessons pay 5 points, challenges pay 15 to 25. Each pays once.

## Principles

1. **Free tier only.** Nothing here needs a paid service. Move off a free tier only when you outgrow it.
2. **Content in git, people in the database.** Lessons, challenges, jobs and drops are TypeScript files you edit and push (`content.ts`, `challenges.ts`, `jobs.ts`, `ig-posts.ts`). Only user data is stored in Postgres.
3. **One seam for user data.** Pages and API routes call `getStore()` (`src/lib/platform/store.ts`). It returns the **Supabase adapter** when keys are set and a **local demo adapter** otherwise, so previews and `npm run dev` work with zero setup.
4. **The browser cannot award itself anything.** Points, streaks and counters change only inside two `SECURITY DEFINER` SQL functions (`checkin`, `award`). Column-level grants block direct writes to those columns. See `supabase/schema.sql`.
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
- Daily check-in: `DailyCheckIn` (client) posts the visitor's local date to `/api/checkin`; the server accepts it only within one day of UTC and the SQL function enforces once-per-day.
- Challenge grading: the browser receives questions without answers. `/api/challenges/[slug]` grades, then calls `award`. Passing is 60 percent.
- Avatars: the browser crops to a 256 px JPEG; `/api/profile/avatar` stores it in Storage (Supabase) or on the profile (demo).

## Known limits, and what comes next

- **Demo mode is not durable.** Without Supabase keys the app keeps data in memory (and `data/platform.json` locally). On Vercel it resets when the instance recycles. A footer note says so. Connect Supabase to go live.
- **Reel-drop files.** A file in `public/` has a guessable URL. The page is gated; the file is not. Use an unlisted link for anything truly private.
- **Newsletter sending** is not built. Subscribers are collected; sending (Resend or Brevo free tiers) is the next step.
- **No admin UI.** Read leads, applications and subscribers in the Supabase table editor. Add jobs and drops in git.
- **Abuse controls** (rate limits, CAPTCHA on the lead form) are not in yet. Add them before running paid traffic.
- Streaks use the visitor's local date. Someone who travels across timezones can gain or lose one day at the edges.

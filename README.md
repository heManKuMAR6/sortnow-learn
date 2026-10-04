# Sortnow Learn

Short notes and two lesson tracks (Beginner and Manager) from Sortnow. This is not the company homepage. sortnow.co stays the consulting site for sortNow & Company (software, ML, and cloud engineering). This app is meant to be served at learn.sortnow.co.

## What this is

An AI learning platform: short lessons, daily challenges, a streak and points, public profiles with a portfolio, a jobs board, and gated "reel drops" for Instagram. Architecture and data model: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Go live (free)

The app runs with no setup in a labeled preview mode, but accounts there are temporary. To make it real:

1. Create a free project at supabase.com.
2. In the SQL editor, run `supabase/schema.sql` (safe to re-run).
3. In Vercel, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings, API) and redeploy.
4. Supabase, Authentication, URL Configuration: set Site URL to `https://sortnow-learn.vercel.app` and add `https://sortnow-learn.vercel.app/auth/callback` to Redirect URLs.
5. Google and GitHub sign-in (optional): Supabase, Authentication, Providers. For Google create an OAuth client in Google Cloud Console; for GitHub create an OAuth App in GitHub Developer settings. Paste each client ID and secret into Supabase, and add the callback URL Supabase shows (`https://<project-ref>.supabase.co/auth/v1/callback`) to the Google client / GitHub app. Buttons appear only when Supabase is connected.
6. Email sign-up: leave "Confirm email" on for production. For quick testing you can turn it off.

Where things live:

| Want to | Do this |
| --- | --- |
| Post a job | Add an object to `src/lib/jobs.ts` (template at the top), push |
| Publish a reel drop | Append to `src/lib/ig-posts.ts`; link the reel to `/ig/<slug>` |
| Add a challenge | Append to `src/lib/challenges.ts` |
| See leads, job applicants, newsletter signups | Supabase table editor: `leads`, `job_applications`, `newsletter_subscribers` |

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Environment

Copy `.env.example` to `.env.local`. Variable names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

If either is missing, sign-up and sign-in use a labeled local demo session (an httpOnly cookie, also mirrored in localStorage). Events are appended to `data/events.json` (gitignored) and kept in a short in-memory list. `/activity` shows both for the current demo user.

The Supabase service role key is not used. Do not put it in the browser or in a `NEXT_PUBLIC_` variable.

When you have a Supabase project, run `supabase/schema.sql` in the SQL editor. That file includes `lesson_questions` (anyone can read, signed-in users insert their own). Notes and lessons on the site come from `src/lib/content.ts`, so the pages are not empty before any rows exist. With keys set, events insert into the `events` table under the signed-in user.

## Hosting

Free-tier path: a Vercel Hobby project, Supabase free tier (Auth and the tables in `supabase/schema.sql`), and YouTube embeds. No video files are stored in this repo.

The live address is https://sortnow-learn.vercel.app (set `NEXT_PUBLIC_SITE_URL` if you attach a custom domain). To use `learn.sortnow.co`, point a CNAME at the Vercel project. Do not overwrite the apex `sortnow.co` site. That domain already serves the live consulting site. Attaching this app to the apex would replace it. This is not a new domain purchase.

## When AWS is actually worth it

AWS starts to matter when you leave those free tiers or you need to own the video files: storing lessons yourself, running your own transcoding, or serving a private catalog with signed playback. Until then, Vercel Hobby, Supabase free, and public YouTube embeds are enough. This repo does not set up AWS.


## Lesson coach

On each lesson, “Ask while you watch” posts to `POST /api/coach` with the lesson slug and the question. Answers are grounded in that lesson’s key points in `src/lib/content.ts`.

`OPENAI_API_KEY` is optional and server-only. If it is set, the route calls OpenAI chat completions (`gpt-4o-mini`) with those key points as the only context and tells the model to say when the lesson does not cover the question. If the key is absent, the same prompts still get an answer from the notes, and the page says “Answers come from this lesson.” It does not pretend a missing key is a live model. Do not commit the key.

Questions on a lesson go to gitignored `data/questions.json` (plus a short in-memory list) unless Supabase is configured, in which case they go to `lesson_questions`. Anyone can read the thread. Posting needs a session, including the local demo session.


## Instagram weeks

`/ig` lists weeks, newest first. Each reel is its own page at `/ig/[slug]` and stays up. Add a week by appending an entry in `src/lib/ig-posts.ts`. Do not overwrite an older one. ManyChat should link to that week's page. The October 6 reel is `/ig/skills`.

The reel still is `public/ig/<slug>.png`. Until that file is there, the page draws a frame.

`/week` is separate. It links to the newest Instagram note.

Reel drops (`/ig/<slug>`) are gated on the server: until a visitor submits name, email and an optional phone, the page contains only the title, a teaser and the form, none of the prompt or links. After Continue, a cookie unlocks drops on this browser. The rest of the site is open. Leads include `source` (`instagram` on `/ig` paths, otherwise `site`).

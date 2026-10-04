# Sortnow Learn

Short notes and two lesson tracks (Beginner and Manager) from Sortnow. This is not the company homepage. sortnow.co stays the consulting site for sortNow & Company (software, ML, and cloud engineering). This app is meant to be served at learn.sortnow.co.

## Pages

- `/` landing page: hero, how it works, tracks, this week, latest notes.
- `/learn` and `/learn/[track]/[slug]` lessons, with per-device progress (`localStorage`, key `sortnow_learn_progress`), previous/next, and the lesson coach.
- `/notes` and `/posts/[slug]` short notes. `/week` the weekly note. `/ig` the reel pages.
- `sitemap.xml` and `robots.txt` are generated from `src/lib/content.ts` and `src/lib/ig-posts.ts`.

The look follows the company site (sortnow.co): same palette, light teal Outfit headings, glass cards that lift on hover, staggered reveals. The page scrolls with the browser, not an inner container.

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

Point a CNAME for `learn.sortnow.co` at the Vercel project. Do not overwrite the apex `sortnow.co` site. That domain already serves the live consulting site. Attaching this app to the apex would replace it. This is not a new domain purchase.

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

The first-visit gate appears on every page: name, email, and an optional phone. After Continue, a cookie skips the gate on this browser and the visitor stays on the URL they opened. Leads include `source` (`instagram` on `/ig` paths, otherwise `site`).

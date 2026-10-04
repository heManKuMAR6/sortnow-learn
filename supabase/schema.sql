-- Sortnow Learn schema for a Supabase free-tier project.
--
-- Free-tier intent: Auth, a small Postgres database, and row level security
-- are enough. Posts and lessons are short text. Videos stay on YouTube;
-- this database does not store media files. The events table is append-only
-- behavior (scroll and click), which stays small on a learning site.
-- Move off the free tier when you outgrow Auth/database limits, or when you
-- need to host and transcode video yourself. Do not put the service role
-- key in the browser. The app uses the anon key plus the signed-in user's
-- JWT, and these policies.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text not null,
  body text not null,
  published_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  track text not null check (track in ('beginner', 'manager')),
  youtube_id text not null,
  title text not null,
  summary text not null,
  position int not null default 0,
  unique (track, slug)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  type text not null check (type in ('scroll', 'click', 'view')),
  path text not null,
  target text,
  depth numeric,
  created_at timestamptz not null default now()
);

create index if not exists events_user_created_idx
  on public.events (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.lessons enable row level security;
alter table public.events enable row level security;

-- Profiles: a user reads and writes only their own row.
drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Posts and lessons are public read. The running app also ships the same
-- notes in src/lib/content.ts so the site is not empty before you seed SQL.
drop policy if exists "posts public read" on public.posts;
create policy "posts public read"
  on public.posts for select
  using (true);

drop policy if exists "lessons public read" on public.lessons;
create policy "lessons public read"
  on public.lessons for select
  using (true);

-- Events: users read and write only their own rows.
drop policy if exists "events select own" on public.events;
create policy "events select own"
  on public.events for select
  using (auth.uid() = user_id);

drop policy if exists "events insert own" on public.events;
create policy "events insert own"
  on public.events for insert
  with check (auth.uid() = user_id);

drop policy if exists "events delete own" on public.events;
create policy "events delete own"
  on public.events for delete
  using (auth.uid() = user_id);

grant select on public.posts to anon, authenticated;
grant select on public.lessons to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, delete on public.events to authenticated;

-- Optional profile row on signup. Left commented so applying this file
-- does not change Auth behavior until you want it.
-- create or replace function public.handle_new_user()
-- returns trigger
-- language plpgsql
-- security definer
-- set search_path = public
-- as $$
-- begin
--   insert into public.profiles (id, email)
--   values (new.id, new.email)
--   on conflict (id) do nothing;
--   return new;
-- end;
-- $$;
--
-- drop trigger if exists on_auth_user_created on auth.users;
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute function public.handle_new_user();

-- Questions people post on a lesson page. Text only, same free-tier idea as events:
-- no video, no attachments. Anyone can read. A signed-in user inserts their own row.
create table if not exists public.lesson_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_slug text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  author text not null,
  question text not null,
  created_at timestamptz not null default now()
);

create index if not exists lesson_questions_slug_created_idx
  on public.lesson_questions (lesson_slug, created_at desc);

alter table public.lesson_questions enable row level security;

drop policy if exists "lesson questions public read" on public.lesson_questions;
create policy "lesson questions public read"
  on public.lesson_questions for select
  using (true);

drop policy if exists "lesson questions insert own" on public.lesson_questions;
create policy "lesson questions insert own"
  on public.lesson_questions for insert
  with check (auth.uid() = user_id);

grant select on public.lesson_questions to anon, authenticated;
grant insert on public.lesson_questions to authenticated;

-- Public lead form (Instagram and the first-visit gate).
-- Anon may insert. There is no select policy, so the anon key cannot read
-- other people's names, emails, or phones. Read these rows from the
-- Supabase dashboard or the service role, not from the browser.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  source text not null default 'site',
  path text,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

drop policy if exists "leads public insert" on public.leads;
create policy "leads public insert"
  on public.leads
  for insert
  to anon, authenticated
  with check (true);

grant insert on public.leads to anon, authenticated;

-- Existing projects: allow a view event, a null user for an Instagram visit,
-- and a lead source of instagram or site.
alter table public.events drop constraint if exists events_type_check;
alter table public.events add constraint events_type_check
  check (type in ('scroll', 'click', 'view'));
alter table public.events alter column user_id drop not null;
alter table public.leads alter column source set default 'site';

drop policy if exists "events public ig insert" on public.events;
create policy "events public ig insert"
  on public.events
  for insert
  to anon, authenticated
  with check (
    user_id is null
    and type in ('view', 'scroll')
    and path like '/ig%'
  );

grant insert on public.events to anon;

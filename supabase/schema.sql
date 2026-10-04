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

-- =====================================================================
-- Platform v2: public profiles, streaks and points, portfolio, jobs,
-- newsletter. Safe to re-run. See docs/ARCHITECTURE.md.
--
-- Integrity rule: a browser can edit its own profile text, but it can
-- NEVER write points, streaks or counters. Those change only inside the
-- SECURITY DEFINER functions checkin() and award() below, enforced with
-- column-level grants.
-- =====================================================================

-- Profiles become public (the /u/<handle> page). Email is not stored here.
alter table public.profiles drop column if exists email;
alter table public.profiles
  add column if not exists handle text,
  add column if not exists headline text not null default '',
  add column if not exists bio text not null default '',
  add column if not exists skills text[] not null default '{}',
  add column if not exists location text not null default '',
  add column if not exists links jsonb not null default '{}'::jsonb,
  add column if not exists avatar_url text,
  add column if not exists points int not null default 0,
  add column if not exists streak int not null default 0,
  add column if not exists longest_streak int not null default 0,
  add column if not exists last_active_day date,
  add column if not exists challenges_done int not null default 0,
  add column if not exists lessons_done int not null default 0;

create unique index if not exists profiles_handle_key on public.profiles (lower(handle));
alter table public.profiles drop constraint if exists profiles_handle_format;
alter table public.profiles add constraint profiles_handle_format
  check (handle is null or handle ~ '^[a-z0-9][a-z0-9-]{2,29}$');
alter table public.profiles drop constraint if exists profiles_text_len;
alter table public.profiles add constraint profiles_text_len
  check (char_length(coalesce(display_name, '')) <= 80
     and char_length(headline) <= 120
     and char_length(bio) <= 1200
     and char_length(location) <= 80
     and cardinality(skills) <= 20);

drop policy if exists "profiles select own" on public.profiles;
drop policy if exists "profiles public read" on public.profiles;
create policy "profiles public read" on public.profiles for select using (true);

-- Column-level grants: this is what keeps points and streaks tamper-proof.
revoke all on public.profiles from anon, authenticated;
grant select (id, handle, display_name, headline, bio, skills, location, links, avatar_url,
              points, streak, longest_streak, last_active_day, challenges_done, lessons_done, created_at)
  on public.profiles to anon, authenticated;
grant insert (id, handle, display_name, headline, bio, skills, location, links, avatar_url)
  on public.profiles to authenticated;
grant update (handle, display_name, headline, bio, skills, location, links, avatar_url)
  on public.profiles to authenticated;

-- One row per user per active day. Feeds the activity heatmap.
create table if not exists public.daily_activity (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  points int not null default 0,
  primary key (user_id, day)
);
alter table public.daily_activity enable row level security;
drop policy if exists "daily activity public read" on public.daily_activity;
create policy "daily activity public read" on public.daily_activity for select using (true);
revoke all on public.daily_activity from anon, authenticated;
grant select on public.daily_activity to anon, authenticated;

-- Each challenge or lesson pays out once per user.
create table if not exists public.awards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('challenge', 'lesson')),
  ref text not null,
  points int not null,
  score int,
  total int,
  day date not null,
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref)
);
alter table public.awards enable row level security;
drop policy if exists "awards select own" on public.awards;
create policy "awards select own" on public.awards for select using (auth.uid() = user_id);
revoke all on public.awards from anon, authenticated;
grant select on public.awards to authenticated;

-- Daily check-in: +1 point and the streak moves. Once per calendar day.
-- p_day is the visitor's local date; it is accepted only within one day of
-- the server's UTC date, otherwise the server date is used.
create or replace function public.checkin(p_day date)
returns table (o_awarded boolean, o_points int, o_streak int, o_longest int)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  prof public.profiles%rowtype;
  d date := p_day;
  next_streak int;
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  if d is null or abs(d - (now() at time zone 'utc')::date) > 1 then
    d := (now() at time zone 'utc')::date;
  end if;
  select * into prof from public.profiles where id = uid for update;
  if not found then
    raise exception 'no profile';
  end if;
  if prof.last_active_day is not null and prof.last_active_day >= d then
    return query select false, prof.points, prof.streak, prof.longest_streak;
    return;
  end if;
  if prof.last_active_day = d - 1 then
    next_streak := prof.streak + 1;
  else
    next_streak := 1;
  end if;
  update public.profiles
     set points = points + 1,
         streak = next_streak,
         longest_streak = greatest(longest_streak, next_streak),
         last_active_day = d
   where id = uid;
  insert into public.daily_activity (user_id, day, points) values (uid, d, 1)
  on conflict (user_id, day) do update set points = public.daily_activity.points + 1;
  return query select true, prof.points + 1, next_streak, greatest(prof.longest_streak, next_streak);
end;
$$;

-- Pays points for a challenge or lesson the first time only.
create or replace function public.award(
  p_kind text, p_ref text, p_points int, p_day date,
  p_score int default null, p_total int default null
)
returns table (o_awarded boolean, o_points int)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  d date := p_day;
  inserted int;
  new_points int;
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  if p_kind not in ('challenge', 'lesson') or p_points < 1 or p_points > 50
     or p_ref is null or char_length(p_ref) > 120 then
    raise exception 'bad award';
  end if;
  if d is null or abs(d - (now() at time zone 'utc')::date) > 1 then
    d := (now() at time zone 'utc')::date;
  end if;
  insert into public.awards (user_id, kind, ref, points, score, total, day)
  values (uid, p_kind, p_ref, p_points, p_score, p_total, d)
  on conflict (user_id, kind, ref) do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then
    select p.points into new_points from public.profiles p where p.id = uid;
    return query select false, coalesce(new_points, 0);
    return;
  end if;
  update public.profiles
     set points = points + p_points,
         challenges_done = challenges_done + (p_kind = 'challenge')::int,
         lessons_done = lessons_done + (p_kind = 'lesson')::int
   where id = uid
   returning points into new_points;
  insert into public.daily_activity (user_id, day, points) values (uid, d, p_points)
  on conflict (user_id, day) do update set points = public.daily_activity.points + p_points;
  return query select true, new_points;
end;
$$;

revoke all on function public.checkin(date) from public, anon;
revoke all on function public.award(text, text, int, date, int, int) from public, anon;
grant execute on function public.checkin(date) to authenticated;
grant execute on function public.award(text, text, int, date, int, int) to authenticated;

-- Portfolio: public to read, owner writes.
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  description text not null default '' check (char_length(description) <= 600),
  url text check (url is null or url ~* '^https?://'),
  tags text[] not null default '{}' check (cardinality(tags) <= 8),
  created_at timestamptz not null default now()
);
create index if not exists portfolio_items_user_idx on public.portfolio_items (user_id, created_at desc);
alter table public.portfolio_items enable row level security;
drop policy if exists "portfolio public read" on public.portfolio_items;
create policy "portfolio public read" on public.portfolio_items for select using (true);
drop policy if exists "portfolio insert own" on public.portfolio_items;
create policy "portfolio insert own" on public.portfolio_items for insert with check (auth.uid() = user_id);
drop policy if exists "portfolio update own" on public.portfolio_items;
create policy "portfolio update own" on public.portfolio_items for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "portfolio delete own" on public.portfolio_items;
create policy "portfolio delete own" on public.portfolio_items for delete using (auth.uid() = user_id);
grant select on public.portfolio_items to anon, authenticated;
grant insert, update, delete on public.portfolio_items to authenticated;

-- Job interest. Jobs themselves live in src/lib/jobs.ts. You read these
-- rows in the Supabase dashboard to see who applied.
create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_slug text not null,
  note text not null default '' check (char_length(note) <= 800),
  created_at timestamptz not null default now(),
  unique (user_id, job_slug)
);
alter table public.job_applications enable row level security;
drop policy if exists "applications select own" on public.job_applications;
create policy "applications select own" on public.job_applications for select using (auth.uid() = user_id);
drop policy if exists "applications insert own" on public.job_applications;
create policy "applications insert own" on public.job_applications for insert with check (auth.uid() = user_id);
grant select, insert on public.job_applications to authenticated;

-- Weekly newsletter list. Insert only; read it from the dashboard.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  source text not null default 'site',
  created_at timestamptz not null default now()
);
create unique index if not exists newsletter_email_key on public.newsletter_subscribers (lower(email));
alter table public.newsletter_subscribers enable row level security;
drop policy if exists "newsletter public insert" on public.newsletter_subscribers;
create policy "newsletter public insert" on public.newsletter_subscribers
  for insert to anon, authenticated with check (true);
grant insert on public.newsletter_subscribers to anon, authenticated;

-- Avatars: a public bucket, each user writes only inside their own folder.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars insert own" on storage.objects;
create policy "avatars insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

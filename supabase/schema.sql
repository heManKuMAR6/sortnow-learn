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
-- SECURITY DEFINER functions checkin(), complete_lesson() and submit_challenge()
-- below, enforced with column-level grants.
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

-- ---------------------------------------------------------------------
-- Rewards. Only the functions below can change points, streaks or counters, and
-- none of them trusts the caller:
--   * checkin() takes NO date. The day comes from the server clock and the
--     person's stored timezone, so a client cannot submit yesterday or tomorrow.
--   * complete_lesson() pays only for lessons in award_catalog.
--   * submit_challenge() grades the answers here, against challenge_answers, and
--     pays only for challenges in award_catalog.
-- award_catalog and challenge_answers are generated from the app's content files
-- (scripts/gen-catalog-sql.mjs) and are unreadable by anon and authenticated.
-- ---------------------------------------------------------------------

drop function if exists public.checkin(date);
drop function if exists public.award(text, text, int, date, int, int);

create table if not exists public.profile_private (
  user_id uuid primary key references auth.users (id) on delete cascade,
  timezone text not null default 'UTC',
  tz_changed_at timestamptz
);
alter table public.profile_private enable row level security;
drop policy if exists "profile private select own" on public.profile_private;
create policy "profile private select own" on public.profile_private for select using (auth.uid() = user_id);
revoke all on public.profile_private from anon, authenticated;
grant select on public.profile_private to authenticated;

create table if not exists public.award_catalog (
  kind text not null check (kind in ('lesson', 'challenge')),
  ref text not null,
  points int not null check (points between 1 and 50),
  primary key (kind, ref)
);
create table if not exists public.challenge_answers (
  slug text not null,
  idx int not null,
  answer int not null,
  primary key (slug, idx)
);
alter table public.award_catalog enable row level security;
alter table public.challenge_answers enable row level security;
revoke all on public.award_catalog from anon, authenticated;
revoke all on public.challenge_answers from anon, authenticated;

-- The person's calendar day, from the server clock and their stored timezone.
create or replace function public.local_day(p_uid uuid)
returns date
language sql
stable
security definer
set search_path = public
as $$
  select (now() at time zone coalesce((select timezone from public.profile_private where user_id = p_uid), 'UTC'))::date;
$$;
revoke all on function public.local_day(uuid) from public, anon, authenticated;

-- Sets the timezone. The first set is free; later changes are allowed once every
-- 7 days, so switching timezones cannot be used to farm extra days.
create or replace function public.set_timezone(p_tz text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cur public.profile_private%rowtype;
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  if p_tz is null or not exists (select 1 from pg_timezone_names where name = p_tz) then
    raise exception 'bad timezone';
  end if;
  insert into public.profile_private (user_id) values (uid) on conflict do nothing;
  select * into cur from public.profile_private where user_id = uid for update;
  if cur.timezone = p_tz then
    return cur.timezone;
  end if;
  if cur.tz_changed_at is not null and cur.tz_changed_at > now() - interval '7 days' then
    return cur.timezone;
  end if;
  update public.profile_private set timezone = p_tz, tz_changed_at = now() where user_id = uid;
  return p_tz;
end;
$$;

-- Daily check-in: +1 point and the streak moves, once per local calendar day.
create or replace function public.checkin()
returns table (o_awarded boolean, o_points int, o_streak int, o_longest int, o_day date)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  prof public.profiles%rowtype;
  d date;
  next_streak int;
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  d := public.local_day(uid);
  select * into prof from public.profiles where id = uid for update;
  if not found then
    raise exception 'no profile';
  end if;
  if prof.last_active_day is not null and prof.last_active_day >= d then
    return query select false, prof.points, prof.streak, prof.longest_streak, d;
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
  return query select true, prof.points + 1, next_streak, greatest(prof.longest_streak, next_streak), d;
end;
$$;

-- A lesson marked complete pays its catalog points once.
create or replace function public.complete_lesson(p_slug text)
returns table (o_awarded boolean, o_points int, o_gained int)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_pts int;
  v_new int;
  v_rows int;
  d date;
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  select c.points into v_pts from public.award_catalog c where c.kind = 'lesson' and c.ref = p_slug;
  if not found then
    raise exception 'unknown lesson';
  end if;
  d := public.local_day(uid);
  insert into public.awards (user_id, kind, ref, points, day) values (uid, 'lesson', p_slug, v_pts, d)
  on conflict (user_id, kind, ref) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    select p.points into v_new from public.profiles p where p.id = uid;
    return query select false, coalesce(v_new, 0), 0;
    return;
  end if;
  update public.profiles
     set points = points + v_pts, lessons_done = lessons_done + 1
   where id = uid
   returning points into v_new;
  insert into public.daily_activity (user_id, day, points) values (uid, d, v_pts)
  on conflict (user_id, day) do update set points = public.daily_activity.points + v_pts;
  return query select true, v_new, v_pts;
end;
$$;

-- Grades a challenge here, then pays its catalog points the first time it is passed
-- (3 of 4, that is 60 percent). Returns the correct answers so the app can explain them.
create or replace function public.submit_challenge(p_slug text, p_answers int[])
returns table (o_score int, o_total int, o_passed boolean, o_awarded boolean, o_gained int, o_points int, o_correct int[])
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_total int;
  v_score int;
  v_pts int;
  v_new int;
  v_rows int;
  v_passed boolean;
  v_correct int[];
  d date;
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  select c.points into v_pts from public.award_catalog c where c.kind = 'challenge' and c.ref = p_slug;
  select count(*) into v_total from public.challenge_answers a where a.slug = p_slug;
  if v_pts is null or v_total = 0 then
    raise exception 'unknown challenge';
  end if;
  if coalesce(array_length(p_answers, 1), 0) <> v_total then
    raise exception 'wrong number of answers';
  end if;
  select count(*) into v_score
    from public.challenge_answers a
   where a.slug = p_slug and p_answers[a.idx + 1] = a.answer;
  v_correct := array(select a.answer from public.challenge_answers a where a.slug = p_slug order by a.idx);
  v_passed := v_score::numeric / v_total >= 0.6;
  select p.points into v_new from public.profiles p where p.id = uid;
  if not v_passed then
    return query select v_score, v_total, false, false, 0, coalesce(v_new, 0), v_correct;
    return;
  end if;
  d := public.local_day(uid);
  insert into public.awards (user_id, kind, ref, points, score, total, day)
  values (uid, 'challenge', p_slug, v_pts, v_score, v_total, d)
  on conflict (user_id, kind, ref) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return query select v_score, v_total, true, false, 0, coalesce(v_new, 0), v_correct;
    return;
  end if;
  update public.profiles
     set points = points + v_pts, challenges_done = challenges_done + 1
   where id = uid
   returning points into v_new;
  insert into public.daily_activity (user_id, day, points) values (uid, d, v_pts)
  on conflict (user_id, day) do update set points = public.daily_activity.points + v_pts;
  return query select v_score, v_total, true, true, v_pts, v_new, v_correct;
end;
$$;

-- Lets a person delete their own account. Their profile, portfolio, awards and
-- applications go with it (on delete cascade).
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.set_timezone(text) from public, anon;
revoke all on function public.checkin() from public, anon;
revoke all on function public.complete_lesson(text) from public, anon;
revoke all on function public.submit_challenge(text, int[]) from public, anon;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.set_timezone(text) to authenticated;
grant execute on function public.checkin() to authenticated;
grant execute on function public.complete_lesson(text) to authenticated;
grant execute on function public.submit_challenge(text, int[]) to authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- BEGIN GENERATED CATALOG (run: npm run gen:catalog; do not edit by hand)
insert into public.award_catalog (kind, ref, points) values
  ('lesson', 'what-a-neural-network-is', 5),
  ('lesson', 'how-a-network-learns', 5),
  ('lesson', 'large-language-models', 5),
  ('lesson', 'what-generative-ai-is', 5),
  ('challenge', 'spot-the-made-up-answer', 15),
  ('challenge', 'write-a-better-prompt', 20),
  ('challenge', 'pick-the-right-tool', 20),
  ('challenge', 'whats-in-the-context', 15),
  ('challenge', 'is-it-safe-to-paste', 20),
  ('challenge', 'agent-or-not', 25)
on conflict (kind, ref) do update set points = excluded.points;

insert into public.challenge_answers (slug, idx, answer) values
  ('spot-the-made-up-answer', 0, 1),
  ('spot-the-made-up-answer', 1, 1),
  ('spot-the-made-up-answer', 2, 2),
  ('spot-the-made-up-answer', 3, 2),
  ('write-a-better-prompt', 0, 1),
  ('write-a-better-prompt', 1, 1),
  ('write-a-better-prompt', 2, 1),
  ('write-a-better-prompt', 3, 1),
  ('pick-the-right-tool', 0, 1),
  ('pick-the-right-tool', 1, 2),
  ('pick-the-right-tool', 2, 0),
  ('pick-the-right-tool', 3, 1),
  ('whats-in-the-context', 0, 1),
  ('whats-in-the-context', 1, 1),
  ('whats-in-the-context', 2, 1),
  ('whats-in-the-context', 3, 1),
  ('is-it-safe-to-paste', 0, 2),
  ('is-it-safe-to-paste', 1, 2),
  ('is-it-safe-to-paste', 2, 1),
  ('is-it-safe-to-paste', 3, 1),
  ('agent-or-not', 0, 1),
  ('agent-or-not', 1, 0),
  ('agent-or-not', 2, 1),
  ('agent-or-not', 3, 1)
on conflict (slug, idx) do update set answer = excluded.answer;
-- END GENERATED CATALOG

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
drop policy if exists "avatars read" on storage.objects;
create policy "avatars read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================================
-- Jobs board, managed by admins from /admin/jobs.
-- Public visitors can read OPEN roles only. Only admins can create, edit,
-- close or delete. Roles never carry a recruiter's contact: sortNow is the contact.
-- =====================================================================

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;
drop policy if exists "admins read own" on public.admins;
create policy "admins read own" on public.admins for select using (auth.uid() = user_id);
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;
-- No one can add themselves: admins are added here, in the SQL editor, by the project owner:
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'YOUR-LOGIN-EMAIL' on conflict do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.jobs (
  slug text primary key check (slug ~ '^[a-z0-9][a-z0-9-]{1,80}$'),
  title text not null check (char_length(title) between 1 and 120),
  company text check (company is null or char_length(company) <= 80),
  location text not null check (char_length(location) between 1 and 80),
  mode text not null check (mode in ('Remote', 'Hybrid', 'On-site')),
  level text not null check (level in ('Entry', 'Mid', 'Senior', 'Lead', 'Manager', 'Principal')),
  type text check (type is null or type in ('Full-time', 'Part-time', 'Contract', 'Internship')),
  posted date not null default current_date,
  summary text not null default '' check (char_length(summary) <= 300),
  about text[] not null default '{}' check (cardinality(about) <= 12),
  skills text[] not null default '{}' check (cardinality(skills) <= 20),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);
create index if not exists jobs_status_posted_idx on public.jobs (status, posted desc);
alter table public.jobs enable row level security;

drop policy if exists "jobs public read open" on public.jobs;
create policy "jobs public read open" on public.jobs for select using (status = 'open' or public.is_admin());
drop policy if exists "jobs admin insert" on public.jobs;
create policy "jobs admin insert" on public.jobs for insert with check (public.is_admin());
drop policy if exists "jobs admin update" on public.jobs;
create policy "jobs admin update" on public.jobs for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "jobs admin delete" on public.jobs;
create policy "jobs admin delete" on public.jobs for delete using (public.is_admin());

revoke all on public.jobs from anon, authenticated;
grant select on public.jobs to anon, authenticated;
grant insert, update, delete on public.jobs to authenticated;

-- Starter listings. Safe to re-run: existing rows are left alone, so edits made in
-- /admin/jobs are never overwritten.
insert into public.jobs (slug, title, company, location, mode, level, type, posted, summary, about, skills, status) values
  ('sr-lead-ai-engineer-plano', 'Sr/Lead AI Engineer', null, 'Plano, Dallas, TX', 'On-site', 'Senior', null, date '2026-06-08', 'Design, build and scale production-grade AI and machine learning systems.', array['We are looking for a Senior/Lead AI Engineer to design, build, and scale production-grade AI and machine learning systems.','The role bridges ML engineering, agentic AI and data engineering, with strong Python and SQL expected.']::text[], array['Python','ML Engineering','Agentic AI','Data Engineering with SQL']::text[], 'open'),
  ('lead-ai-project-manager', 'Lead AI Project Manager', null, 'Remote', 'Remote', 'Manager', null, date '2026-06-04', 'Own AI product strategy, roadmap and go-to-market for AI-powered solutions in retirement and wealth.', array['Lead the AI product strategy, vision, roadmap, and go-to-market execution for AI-powered solutions serving retirement participants, financial advisors, and plan sponsors, for a client''s digital and wealth business.']::text[], array['LLM product experience','RAG architecture fluency','Agentic AI product design','Model evaluation and metrics','Data fluency','AI tooling in practice']::text[], 'open'),
  ('lead-ai-engineer-iii', 'Lead AI Engineer III', null, 'Remote', 'Remote', 'Lead', null, date '2026-06-04', 'Top of the individual contributor track: architect and lead AI engineering work.', array['The top of the individual contributor track, equivalent to Staff at most technology companies and to a C14 / SVP-equivalent in financial services engineering.','Architect and lead development across APIs, backend services and data pipelines, using AI coding tools day to day.']::text[], array['Rust','TypeScript','Solana','RAG architectures','Prompt pipelines','Claude Code','GitHub Copilot','Cursor or equivalent','APIs and backend services','Data pipelines']::text[], 'open'),
  ('lead-ai-engineer-design', 'Lead AI Engineer (design-focused)', null, 'Remote', 'Remote', 'Senior', null, date '2026-06-04', 'Lead / Principal individual contributor shaping product decisions for AI tools through interaction design.', array['Leveled as a Lead / Principal individual contributor, equivalent to Staff Designer at technology companies.','At this level the designer shapes product decisions, not just design artifacts.']::text[], array['Figma','Protopie','Voiceflow','WCAG 2.2 AA','Interaction design for AI tools']::text[], 'open'),
  ('ai-ml-architect-mlops', 'AI/ML Architect (MLOps: Dataiku & Vertex AI)', null, 'Austin, TX', 'On-site', 'Mid', null, date '2026-05-30', 'Define, architect and operationalize enterprise-grade MLOps platforms on Dataiku and Google Cloud Vertex AI.', array['Principal AI/ML Architect responsible for defining, architecting, and operationalizing enterprise-grade MLOps platforms using Dataiku and Google Cloud Vertex AI.']::text[], array['MLOps','Dataiku','Google Cloud Vertex AI']::text[], 'open'),
  ('iam-engineer-humana', 'IAM Engineer', 'Humana', 'Dallas, TX', 'Hybrid', 'Mid', null, date '2026-05-21', 'Customer identity and access management (CIAM) software engineering at Humana.', array['A customer identity and access management (CIAM) software engineering role at Humana, based in Dallas on a hybrid schedule.']::text[], array['Java','Linux','ForgeRock','Vue JS']::text[], 'open'),
  ('ai-architect-hitachi', 'AI Architect', 'Hitachi', 'Dallas, TX', 'On-site', 'Principal', null, date '2026-05-20', 'Hands-on enterprise AI and LLM architect for next-generation AI platforms.', array['We are seeking a highly skilled and hands-on AI Architect to lead the design and implementation of next-generation enterprise AI platforms powered by Large Language Models (LLMs).']::text[], array['Enterprise AI & LLM architecture','Amazon Bedrock','RAG pipelines']::text[], 'open'),
  ('azure-devops-java-baron-budd', 'Azure DevOps with Java', 'Baron & Budd', 'Dallas, TX', 'Hybrid', 'Mid', null, date '2026-05-20', 'High-impact DevOps engineer with strong Java experience to support and modernize Baron & Budd''s systems.', array['We are seeking a high-impact DevOps Engineer with strong Java experience to support and modernize Baron & Budd''s systems, based in Dallas, Texas.']::text[], array['Azure DevOps CI/CD pipelines','Kubernetes','Java','Docker']::text[], 'open')
on conflict (slug) do nothing;

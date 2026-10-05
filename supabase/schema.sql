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
  type text not null check (type in ('scroll', 'click', 'view', 'dwell', 'session')),
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
  position int not null default 0,
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
revoke all on function public.complete_lesson(text) from public, anon;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.set_timezone(text) to authenticated;
grant execute on function public.complete_lesson(text) to authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- BEGIN GENERATED CATALOG (run: npm run gen:catalog; do not edit by hand)
insert into public.award_catalog (kind, ref, points, position) values
  ('lesson', 'what-a-neural-network-is', 5, 0),
  ('lesson', 'how-a-network-learns', 5, 1),
  ('lesson', 'large-language-models', 5, 2),
  ('lesson', 'what-generative-ai-is', 5, 3),
  ('challenge', 'spot-the-made-up-answer', 15, 0),
  ('challenge', 'write-a-better-prompt', 20, 1),
  ('challenge', 'pick-the-right-tool', 20, 2),
  ('challenge', 'whats-in-the-context', 15, 3),
  ('challenge', 'is-it-safe-to-paste', 20, 4),
  ('challenge', 'agent-or-not', 25, 5)
on conflict (kind, ref) do update set points = excluded.points, position = excluded.position;

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



-- =====================================================================
-- v3: consent, audit trail, admin console, stricter streak, full job descriptions.
-- Safe to re-run.
-- =====================================================================

-- ---- Consent on every list we build ------------------------------------
alter table public.leads
  add column if not exists consent boolean not null default false,
  add column if not exists consent_at timestamptz,
  add column if not exists consent_text text,
  add column if not exists session_id text,
  add column if not exists user_agent text,
  add column if not exists unsubscribed_at timestamptz;

alter table public.newsletter_subscribers
  add column if not exists consent boolean not null default false,
  add column if not exists consent_at timestamptz,
  add column if not exists consent_text text,
  add column if not exists unsub_token text not null default replace(gen_random_uuid()::text, '-', ''),
  add column if not exists unsubscribed_at timestamptz;
create unique index if not exists newsletter_unsub_token_key on public.newsletter_subscribers (unsub_token);

-- New rows must carry consent; a reel-drop lead must also carry a phone. Old rows (made
-- before consent was collected) stay as they are, flagged consent = false, and are never mailed.
alter table public.leads drop constraint if exists leads_consent_required;
alter table public.leads add constraint leads_consent_required
  check (consent and consent_at is not null and consent_text is not null) not valid;
alter table public.leads drop constraint if exists leads_ig_phone_required;
alter table public.leads add constraint leads_ig_phone_required
  check (source <> 'instagram' or (phone is not null and char_length(phone) >= 7)) not valid;
alter table public.newsletter_subscribers drop constraint if exists newsletter_consent_required;
alter table public.newsletter_subscribers add constraint newsletter_consent_required
  check (consent and consent_at is not null and consent_text is not null) not valid;

drop policy if exists "leads public insert" on public.leads;
create policy "leads public insert" on public.leads for insert to anon, authenticated with check (consent);
drop policy if exists "newsletter public insert" on public.newsletter_subscribers;
create policy "newsletter public insert" on public.newsletter_subscribers for insert to anon, authenticated with check (consent);

-- One-click unsubscribe by token (the link in every email). Works for anyone holding the token.
create or replace function public.unsubscribe(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if p_token is null or char_length(p_token) < 16 then
    return false;
  end if;
  update public.newsletter_subscribers set unsubscribed_at = coalesce(unsubscribed_at, now()) where unsub_token = p_token;
  get diagnostics n = row_count;
  if n > 0 then
    update public.leads l set unsubscribed_at = coalesce(l.unsubscribed_at, now())
     where lower(l.email) = (select lower(s.email) from public.newsletter_subscribers s where s.unsub_token = p_token);
  end if;
  return n > 0;
end;
$$;
revoke all on function public.unsubscribe(text) from public;
grant execute on function public.unsubscribe(text) to anon, authenticated;

-- ---- Audit trail: where people go and for how long ------------------------
alter table public.events drop constraint if exists events_type_check;
alter table public.events add constraint events_type_check
  check (type in ('scroll', 'click', 'view', 'dwell', 'session'));
alter table public.events
  add column if not exists session_id text,
  add column if not exists referrer text,
  add column if not exists user_agent text,
  add column if not exists seconds int;
create index if not exists events_created_idx on public.events (created_at desc);
create index if not exists events_path_idx on public.events (path);

drop policy if exists "events public ig insert" on public.events;
create policy "events public ig insert" on public.events for insert to anon, authenticated
  with check (user_id is null and type in ('view', 'scroll', 'click', 'dwell', 'session') and path like '/ig%');

-- ---- Admin console: admins read the lists; nobody else can ---------------
drop policy if exists "leads admin read" on public.leads;
create policy "leads admin read" on public.leads for select to authenticated using (public.is_admin());
drop policy if exists "newsletter admin read" on public.newsletter_subscribers;
create policy "newsletter admin read" on public.newsletter_subscribers for select to authenticated using (public.is_admin());
drop policy if exists "events admin read" on public.events;
create policy "events admin read" on public.events for select to authenticated using (public.is_admin());
drop policy if exists "applications admin read" on public.job_applications;
create policy "applications admin read" on public.job_applications for select to authenticated using (public.is_admin());
grant select on public.leads, public.newsletter_subscribers to authenticated;

-- Members (email lives in auth.users, which the API cannot read). Admins only.
create or replace function public.admin_members()
returns table (id uuid, email text, display_name text, handle text, points int, streak int, created_at timestamptz, last_sign_in_at timestamptz)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'admins only';
  end if;
  return query
    select u.id, u.email::text, p.display_name, p.handle, coalesce(p.points, 0), coalesce(p.streak, 0), u.created_at, u.last_sign_in_at
      from auth.users u left join public.profiles p on p.id = u.id
     order by u.created_at desc;
end;
$$;
revoke all on function public.admin_members() from public, anon;
grant execute on function public.admin_members() to authenticated;

-- ---- Streak: a day counts only when the day's puzzle is passed ------------
-- Checking in earns +1 point. The streak moves only when you PASS today's daily
-- challenge. Every challenge gets 3 tries a day, and the answers are shown only
-- after a pass or after the third try.
alter table public.profiles add column if not exists last_checkin_day date;
grant select (last_checkin_day) on public.profiles to anon, authenticated;

alter table public.award_catalog add column if not exists position int not null default 0;

create table if not exists public.challenge_attempts (
  user_id uuid not null references auth.users (id) on delete cascade,
  slug text not null,
  day date not null,
  n int not null default 0,
  primary key (user_id, slug, day)
);
alter table public.challenge_attempts enable row level security;
revoke all on public.challenge_attempts from anon, authenticated;

-- The featured challenge for a calendar day. Same formula as dailyChallenge() in the app.
create or replace function public.daily_slug(p_day date)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select ref from (
    select ref, row_number() over (order by position, ref) - 1 as rn, count(*) over () as total
      from public.award_catalog where kind = 'challenge'
  ) c
  where c.rn = (((p_day - date '1970-01-01') % c.total) + c.total) % c.total
  limit 1;
$$;
revoke all on function public.daily_slug(date) from public, anon, authenticated;

drop function if exists public.checkin();
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
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  d := public.local_day(uid);
  select * into prof from public.profiles where id = uid for update;
  if not found then
    raise exception 'no profile';
  end if;
  if prof.last_checkin_day is not null and prof.last_checkin_day >= d then
    return query select false, prof.points, prof.streak, prof.longest_streak, d;
    return;
  end if;
  update public.profiles set points = points + 1, last_checkin_day = d where id = uid;
  insert into public.daily_activity (user_id, day, points) values (uid, d, 1)
  on conflict (user_id, day) do update set points = public.daily_activity.points + 1;
  return query select true, prof.points + 1, prof.streak, prof.longest_streak, d;
end;
$$;
revoke all on function public.checkin() from public, anon;
grant execute on function public.checkin() to authenticated;

drop function if exists public.submit_challenge(text, int[]);
create or replace function public.submit_challenge(p_slug text, p_answers int[])
returns table (o_score int, o_total int, o_passed boolean, o_awarded boolean, o_gained int, o_points int,
               o_correct int[], o_streak int, o_streak_day boolean, o_attempts_left int, o_daily boolean)
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
  v_tries int;
  v_left int;
  v_daily boolean;
  v_streak int;
  v_streak_day boolean := false;
  prof public.profiles%rowtype;
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
  d := public.local_day(uid);
  v_daily := public.daily_slug(d) = p_slug;

  insert into public.challenge_attempts (user_id, slug, day, n) values (uid, p_slug, d, 0)
  on conflict (user_id, slug, day) do nothing;
  select n into v_tries from public.challenge_attempts where user_id = uid and slug = p_slug and day = d for update;
  if v_tries >= 3 then
    raise exception 'too many attempts';
  end if;
  update public.challenge_attempts set n = n + 1 where user_id = uid and slug = p_slug and day = d;
  v_tries := v_tries + 1;
  v_left := 3 - v_tries;

  select count(*) into v_score
    from public.challenge_answers a
   where a.slug = p_slug and p_answers[a.idx + 1] = a.answer;
  v_passed := v_score::numeric / v_total >= 0.6;
  select * into prof from public.profiles where id = uid for update;
  v_new := coalesce(prof.points, 0);
  v_streak := coalesce(prof.streak, 0);
  -- Answers are revealed only once the person has passed or used the last try.
  v_correct := case when v_passed or v_left = 0
                    then array(select a.answer from public.challenge_answers a where a.slug = p_slug order by a.idx)
                    else null end;
  if not v_passed then
    return query select v_score, v_total, false, false, 0, v_new, v_correct, v_streak, false, v_left, v_daily;
    return;
  end if;

  -- Passing today's featured challenge is what moves the streak.
  if v_daily and (prof.last_active_day is null or prof.last_active_day < d) then
    v_streak := case when prof.last_active_day = d - 1 then prof.streak + 1 else 1 end;
    update public.profiles
       set streak = v_streak, longest_streak = greatest(longest_streak, v_streak), last_active_day = d
     where id = uid;
    v_streak_day := true;
  end if;

  insert into public.awards (user_id, kind, ref, points, score, total, day)
  values (uid, 'challenge', p_slug, v_pts, v_score, v_total, d)
  on conflict (user_id, kind, ref) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return query select v_score, v_total, true, false, 0, v_new, v_correct, v_streak, v_streak_day, v_left, v_daily;
    return;
  end if;
  update public.profiles
     set points = points + v_pts, challenges_done = challenges_done + 1
   where id = uid
   returning points into v_new;
  insert into public.daily_activity (user_id, day, points) values (uid, d, v_pts)
  on conflict (user_id, day) do update set points = public.daily_activity.points + v_pts;
  return query select v_score, v_total, true, true, v_pts, v_new, v_correct, v_streak, v_streak_day, v_left, v_daily;
end;
$$;
revoke all on function public.submit_challenge(text, int[]) from public, anon;
grant execute on function public.submit_challenge(text, int[]) to authenticated;

-- ---- Job descriptions: a real JD, not one line --------------------------
alter table public.jobs
  add column if not exists responsibilities text[] not null default '{}',
  add column if not exists requirements text[] not null default '{}',
  add column if not exists nice_to_have text[] not null default '{}',
  add column if not exists benefits text[] not null default '{}',
  add column if not exists experience text check (experience is null or char_length(experience) <= 80),
  add column if not exists salary text check (salary is null or char_length(salary) <= 80);
alter table public.jobs drop constraint if exists jobs_list_sizes;
alter table public.jobs add constraint jobs_list_sizes
  check (cardinality(responsibilities) <= 20 and cardinality(requirements) <= 20
     and cardinality(nice_to_have) <= 15 and cardinality(benefits) <= 12);

-- BEGIN GENERATED JOBS (run: npm run gen:catalog; do not edit by hand)
-- Starter listings. Existing rows keep any edit made in /admin/jobs; a role's description is
-- filled in here only while its responsibilities are still empty.
insert into public.jobs (slug, title, company, location, mode, level, type, posted, summary, about, responsibilities, requirements, nice_to_have, benefits, skills, status) values
  ('sr-lead-ai-engineer-plano', 'Sr/Lead AI Engineer', null, 'Plano, Dallas, TX', 'On-site', 'Senior', null, date '2026-06-08', 'Design, build and scale production-grade AI and machine learning systems.', array['We are looking for a Senior/Lead AI Engineer to design, build, and scale production-grade AI and machine learning systems.', 'The role bridges ML engineering, agentic AI and data engineering, with strong Python and SQL expected. You will take models from prototype to something the business can rely on every day.']::text[], array['Design and build production AI and machine learning services, from data intake to a deployed model.', 'Build agentic AI workflows: tool use, retrieval, guardrails and evaluation.', 'Own data pipelines and SQL models that feed training and inference.', 'Set up monitoring for quality, latency, drift and cost, and act on what it shows.', 'Review designs and code, and mentor engineers on ML engineering practice.', 'Work with product and business owners to turn a problem into a measurable AI outcome.']::text[], array['Strong Python and SQL, written for production rather than notebooks.', 'Hands-on ML engineering: training, packaging, deploying and operating models.', 'Practical experience with agentic AI or LLM-based applications.', 'Data engineering skills: pipelines, data quality and warehouse design.', 'Comfortable owning a system end to end, including on-call and incident follow-up.']::text[], array['Experience with a major cloud platform''s ML services', 'Evaluation and testing frameworks for LLM systems', 'Experience leading or mentoring a small team']::text[], array[]::text[], array['Python', 'ML Engineering', 'Agentic AI', 'Data Engineering with SQL']::text[], 'open'),
  ('lead-ai-project-manager', 'Lead AI Project Manager', null, 'Remote', 'Remote', 'Manager', null, date '2026-06-04', 'Own AI product strategy, roadmap and go-to-market for AI-powered solutions in retirement and wealth.', array['Lead the AI product strategy, vision, roadmap, and go-to-market execution for AI-powered solutions serving retirement participants, financial advisors, and plan sponsors, for a client''s digital and wealth business.', 'You will sit between engineering, design, compliance and the business, and decide what gets built, in what order, and how success is measured.']::text[], array['Define the AI product vision and a roadmap tied to business outcomes.', 'Write clear requirements for LLM, RAG and agentic features and prioritise the backlog.', 'Set evaluation and quality metrics for model output, and review them with the team every release.', 'Plan the go-to-market: pilots, rollout, training and feedback loops with advisors and plan sponsors.', 'Work with risk and compliance so AI features meet regulatory expectations.', 'Report progress, risks and results to senior stakeholders.']::text[], array['Experience shipping LLM-based products, with a working grasp of RAG and agentic designs.', 'Able to define and track model evaluation metrics, not only delivery dates.', 'Fluent with data: comfortable reading dashboards and challenging the numbers.', 'Strong written and verbal communication with technical and non-technical audiences.', 'Regular, practical use of AI tools in your own work.']::text[], array['Background in financial services, retirement or wealth', 'Experience with regulated product launches']::text[], array[]::text[], array['LLM product experience', 'RAG architecture fluency', 'Agentic AI product design', 'Model evaluation and metrics', 'Data fluency', 'AI tooling in practice']::text[], 'open'),
  ('lead-ai-engineer-iii', 'Lead AI Engineer III', null, 'Remote', 'Remote', 'Lead', null, date '2026-06-04', 'Top of the individual contributor track: architect and lead AI engineering work.', array['The top of the individual contributor track, equivalent to Staff at most technology companies and to a C14 / SVP-equivalent in financial services engineering.', 'Architect and lead development across APIs, backend services and data pipelines, using AI coding tools day to day.']::text[], array['Architect AI-enabled systems across APIs, backend services and data pipelines.', 'Build RAG architectures and prompt pipelines that hold up in production.', 'Use AI coding tools (Claude Code, GitHub Copilot, Cursor or similar) to raise the team''s speed and quality, and teach others how.', 'Lead technical design reviews and set engineering standards.', 'Break down ambiguous problems into plans other engineers can execute.']::text[], array['Deep experience building backend systems and APIs at scale.', 'Production experience with Rust and TypeScript.', 'Hands-on with RAG architectures and prompt pipelines.', 'Daily use of AI coding assistants, with judgement about where they help and where they do not.', 'A record of leading technical work across several engineers or teams.']::text[], array['Solana or other blockchain development', 'Data pipeline design', 'Open source contributions']::text[], array[]::text[], array['Rust', 'TypeScript', 'Solana', 'RAG architectures', 'Prompt pipelines', 'Claude Code', 'GitHub Copilot', 'Cursor or equivalent', 'APIs and backend services', 'Data pipelines']::text[], 'open'),
  ('lead-ai-engineer-design', 'Lead AI Engineer (design-focused)', null, 'Remote', 'Remote', 'Senior', null, date '2026-06-04', 'Lead / Principal individual contributor shaping product decisions for AI tools through interaction design.', array['Leveled as a Lead / Principal individual contributor, equivalent to Staff Designer at technology companies.', 'At this level the designer shapes product decisions, not just design artifacts. You will decide how people interact with AI tools: what they ask, what they see back, and how they know when to trust it.']::text[], array['Design interaction patterns for AI tools: prompting, review, correction and hand-off to a person.', 'Prototype quickly in Figma, Protopie and Voiceflow, and test with real users.', 'Define how the product shows uncertainty, sources and limits of an AI answer.', 'Hold designs to WCAG 2.2 AA from the first prototype.', 'Partner with engineering and product to decide scope, and say no when a design does not serve the user.']::text[], array['A portfolio showing interaction design for complex or data-heavy products.', 'Expert Figma, with working knowledge of Protopie and Voiceflow.', 'Working knowledge of WCAG 2.2 AA and how to test for it.', 'Experience designing with or for AI and conversational interfaces.', 'Comfort influencing product direction at senior level.']::text[], array['Experience in regulated industries', 'Ability to build simple prototypes in code']::text[], array[]::text[], array['Figma', 'Protopie', 'Voiceflow', 'WCAG 2.2 AA', 'Interaction design for AI tools']::text[], 'open'),
  ('ai-ml-architect-mlops', 'AI/ML Architect (MLOps: Dataiku & Vertex AI)', null, 'Austin, TX', 'On-site', 'Mid', null, date '2026-05-30', 'Define, architect and operationalize enterprise-grade MLOps platforms on Dataiku and Google Cloud Vertex AI.', array['Principal AI/ML Architect responsible for defining, architecting, and operationalizing enterprise-grade MLOps platforms using Dataiku and Google Cloud Vertex AI.', 'You will set the platform standards that data science teams use to move models from experiment to production safely and repeatably.']::text[], array['Define the target MLOps architecture across Dataiku and Vertex AI.', 'Build repeatable pipelines for training, validation, deployment and rollback.', 'Set standards for model registry, versioning, lineage and approvals.', 'Put monitoring in place for model performance, drift and cost.', 'Work with data science, platform and security teams to onboard use cases.', 'Document the platform and train teams to use it.']::text[], array['Hands-on MLOps experience on an enterprise platform.', 'Working experience with Dataiku and Google Cloud Vertex AI.', 'Solid understanding of CI/CD for machine learning.', 'Ability to explain architecture choices to engineers and executives.']::text[], array['Google Cloud certification', 'Experience with feature stores and model governance']::text[], array[]::text[], array['MLOps', 'Dataiku', 'Google Cloud Vertex AI']::text[], 'open'),
  ('iam-engineer-humana', 'IAM Engineer', 'Humana', 'Dallas, TX', 'Hybrid', 'Mid', null, date '2026-05-21', 'Customer identity and access management (CIAM) software engineering at Humana.', array['A customer identity and access management (CIAM) software engineering role at Humana, based in Dallas on a hybrid schedule.', 'You will build and run the sign-in, registration and access experiences that members use, with security and reliability as the first requirements.']::text[], array['Build and maintain CIAM features: registration, sign-in, recovery and consent.', 'Configure and extend the identity platform (ForgeRock) for new journeys.', 'Develop front-end screens in Vue JS and back-end services in Java.', 'Troubleshoot production issues on Linux environments and fix the root cause.', 'Work with security teams to meet policy and audit requirements.']::text[], array['Java development experience.', 'Working knowledge of Linux.', 'Experience with ForgeRock or a comparable identity platform.', 'Front-end experience with Vue JS.', 'Understanding of authentication and authorisation standards such as OAuth 2.0 and OpenID Connect.']::text[], array['Experience in healthcare or another regulated industry', 'Automated testing for identity flows']::text[], array[]::text[], array['Java', 'Linux', 'ForgeRock', 'Vue JS']::text[], 'open'),
  ('ai-architect-hitachi', 'AI Architect', 'Hitachi', 'Dallas, TX', 'On-site', 'Principal', null, date '2026-05-20', 'Hands-on enterprise AI and LLM architect for next-generation AI platforms.', array['We are seeking a highly skilled and hands-on AI Architect to lead the design and implementation of next-generation enterprise AI platforms powered by Large Language Models (LLMs).', 'You will be the person who both draws the architecture and builds the first working version of it.']::text[], array['Design enterprise AI and LLM platform architecture, including security and cost controls.', 'Build RAG pipelines and the data foundations behind them.', 'Use Amazon Bedrock to select, deploy and evaluate foundation models.', 'Define evaluation, guardrail and monitoring practices for LLM applications.', 'Guide delivery teams and review designs.']::text[], array['Proven experience designing enterprise AI or LLM solutions.', 'Hands-on experience with Amazon Bedrock.', 'Experience building RAG pipelines.', 'Strong coding ability: you build prototypes, not just diagrams.', 'Clear communication with business and engineering leaders.']::text[], array['AWS certification', 'Experience with vector databases and search']::text[], array[]::text[], array['Enterprise AI & LLM architecture', 'Amazon Bedrock', 'RAG pipelines']::text[], 'open'),
  ('azure-devops-java-baron-budd', 'Azure DevOps with Java', 'Baron & Budd', 'Dallas, TX', 'Hybrid', 'Mid', null, date '2026-05-20', 'High-impact DevOps engineer with strong Java experience to support and modernize Baron & Budd''s systems.', array['We are seeking a high-impact DevOps Engineer with strong Java experience to support and modernize Baron & Budd''s systems, based in Dallas, Texas.', 'You will improve how software is built, tested and released, and help move older systems onto a modern, containerised footing.']::text[], array['Build and maintain Azure DevOps CI/CD pipelines for Java applications.', 'Containerise applications with Docker and run them on Kubernetes.', 'Automate builds, tests, security checks and releases.', 'Support and troubleshoot existing Java systems, and help modernise them.', 'Document pipelines and teach developers how to use them.']::text[], array['Hands-on Azure DevOps pipelines.', 'Strong Java experience.', 'Experience with Docker and Kubernetes.', 'A habit of automating repeated work.']::text[], array['Infrastructure as code (Terraform or Bicep)', 'Experience modernising legacy applications']::text[], array[]::text[], array['Azure DevOps CI/CD pipelines', 'Kubernetes', 'Java', 'Docker']::text[], 'open')
on conflict (slug) do update set
  about = case when public.jobs.responsibilities = '{}' then excluded.about else public.jobs.about end,
  requirements = case when public.jobs.responsibilities = '{}' then excluded.requirements else public.jobs.requirements end,
  nice_to_have = case when public.jobs.responsibilities = '{}' then excluded.nice_to_have else public.jobs.nice_to_have end,
  responsibilities = case when public.jobs.responsibilities = '{}' then excluded.responsibilities else public.jobs.responsibilities end;
-- END GENERATED JOBS

-- sortNow Learn: handy queries for checking things by hand.
-- Where: Supabase dashboard > SQL editor > New query. Paste ONE query, press Run.
-- The SQL editor runs as the project owner, so row-level security does not hide anything here.
-- Everything marked READ-ONLY only reads. Anything that changes or deletes data says so in capitals.

-- =====================================================================
-- 1. THE QUICK PICTURE
-- =====================================================================

-- 1.1 Row counts for every table that matters (READ-ONLY)
select 'leads' as what, count(*) from public.leads
union all select 'newsletter subscribers', count(*) from public.newsletter_subscribers
union all select 'members (accounts)', count(*) from auth.users
union all select 'profiles', count(*) from public.profiles
union all select 'page-view events', count(*) from public.events
union all select 'awards (lessons + challenges done)', count(*) from public.awards
union all select 'job interests', count(*) from public.job_applications
union all select 'open jobs', count(*) from public.jobs where status = 'open'
union all select 'newsletter issues sent', count(*) from public.newsletter_issues
order by 1;

-- 1.2 Today and the last 7 days at a glance (READ-ONLY)
select
  (select count(*) from public.leads where created_at > now() - interval '1 day')  as leads_24h,
  (select count(*) from public.leads where created_at > now() - interval '7 days') as leads_7d,
  (select count(*) from auth.users where created_at > now() - interval '1 day')    as signups_24h,
  (select count(*) from auth.users where created_at > now() - interval '7 days')   as signups_7d,
  (select count(distinct user_id) from public.events where created_at > now() - interval '1 day')  as active_members_24h,
  (select count(distinct user_id) from public.events where created_at > now() - interval '7 days') as active_members_7d;

-- =====================================================================
-- 2. LEADS (people who left name, email and phone)
-- =====================================================================

-- 2.1 Latest 50 leads, with what they agreed to (READ-ONLY)
select created_at, name, email, phone, source, path as unlocked_on, campaign as link_tag, consent, consent_at
from public.leads order by created_at desc limit 50;

-- 2.2 Leads per day, last 30 days (READ-ONLY)
select created_at::date as day, count(*) as leads
from public.leads where created_at > now() - interval '30 days'
group by 1 order by 1 desc;

-- 2.3 Which post or link brings people in (the ?src= tag on your links) (READ-ONLY)
select coalesce(campaign, '(no tag)') as link_tag, count(*) as leads
from public.leads group by 1 order by 2 desc;

-- 2.4 Which page they unlocked on (READ-ONLY)
select source, coalesce(path, '(none)') as unlocked_on, count(*) as leads
from public.leads group by 1, 2 order by 3 desc;

-- 2.5 Older leads saved before the agreement box existed: do NOT email these (READ-ONLY)
select created_at, name, email, phone from public.leads where consent = false order by created_at;

-- 2.6 The same email left more than once (READ-ONLY)
select lower(email) as email, count(*) as times, min(created_at) as first_seen, max(created_at) as last_seen
from public.leads group by 1 having count(*) > 1 order by 2 desc;

-- 2.7 Leads who have a phone number (for follow-up calls) (READ-ONLY)
select name, phone, email, created_at from public.leads
where phone is not null and unsubscribed_at is null order by created_at desc;

-- =====================================================================
-- 3. NEWSLETTER LIST
-- =====================================================================

-- 3.1 How many you can email right now: agreed AND not unsubscribed (READ-ONLY)
select count(*) as can_email from public.newsletter_subscribers where consent and unsubscribed_at is null;

-- 3.2 The mailing list itself, newest first (READ-ONLY)
select created_at, email, name, source from public.newsletter_subscribers
where consent and unsubscribed_at is null order by created_at desc;

-- 3.3 Who unsubscribed and when (READ-ONLY)
select unsubscribed_at, email, name from public.newsletter_subscribers
where unsubscribed_at is not null order by unsubscribed_at desc;

-- 3.4 Subscribers saved without an agreement (do not email) (READ-ONLY)
select created_at, email, name, source from public.newsletter_subscribers where not consent;

-- 3.5 Exactly what each person agreed to (READ-ONLY)
select email, consent_at, consent_text from public.newsletter_subscribers
where consent order by consent_at desc limit 50;

-- 3.6 Newsletters sent: how many went out and how many failed (READ-ONLY)
select created_at, subject, recipients, sent, failed, completed_at is not null as finished
from public.newsletter_issues order by created_at desc;

-- 3.7 Anyone a send failed for, and why (READ-ONLY)
select s.at, i.subject, s.email, s.error
from public.newsletter_sends s join public.newsletter_issues i on i.id = s.issue_id
where s.status = 'failed' order by s.at desc limit 100;

-- =====================================================================
-- 4. MEMBERS (accounts)
-- =====================================================================

-- 4.1 Every member with last sign-in, points and streak (READ-ONLY)
select u.created_at as joined, p.display_name, u.email, p.handle, p.points, p.streak, p.longest_streak,
       p.lessons_done, p.challenges_done, u.last_sign_in_at
from auth.users u left join public.profiles p on p.id = u.id
order by u.created_at desc;

-- 4.2 Sign-ups per day, last 30 days (READ-ONLY)
select created_at::date as day, count(*) as signups
from auth.users where created_at > now() - interval '30 days' group by 1 order by 1 desc;

-- 4.3 Accounts that never confirmed their email (READ-ONLY)
select created_at, email from auth.users where email_confirmed_at is null order by created_at desc;

-- 4.4 Who is an admin (READ-ONLY)
select u.email, a.user_id from public.admins a join auth.users u on u.id = a.user_id;

-- 4.5 Members who ticked the newsletter box at sign-up but are not on the list (READ-ONLY)
select u.email, u.raw_user_meta_data ->> 'full_name' as name
from auth.users u
where (u.raw_user_meta_data ->> 'newsletter_opt_in') = 'true'
  and not exists (select 1 from public.newsletter_subscribers s where lower(s.email) = lower(u.email));

-- 4.6 Members with a profile photo (READ-ONLY)
select p.display_name, p.handle, p.avatar_url from public.profiles p where p.avatar_url is not null;

-- =====================================================================
-- 5. WHERE PEOPLE GO (signed-in members only; nobody else is tracked)
-- =====================================================================

-- 5.1 Page views per page, last 7 days (READ-ONLY)
select path, count(*) as views, count(distinct user_id) as people
from public.events where type = 'view' and created_at > now() - interval '7 days'
group by 1 order by 2 desc;

-- 5.2 Average time on each page, in seconds, last 30 days (READ-ONLY)
select path, round(avg(seconds)) as avg_seconds, count(*) as visits
from public.events where type = 'dwell' and seconds is not null and created_at > now() - interval '30 days'
group by 1 having count(*) >= 2 order by 2 desc;

-- 5.3 Pages people scroll to the bottom of (READ-ONLY)
select path, round(avg(depth)) as avg_scroll_percent, count(*) as samples
from public.events where type = 'scroll' and created_at > now() - interval '30 days'
group by 1 having count(*) >= 2 order by 2 desc;

-- 5.4 Active members per day, last 14 days (READ-ONLY)
select created_at::date as day, count(distinct user_id) as active_members
from public.events where created_at > now() - interval '14 days' group by 1 order by 1 desc;

-- 5.5 What one member did, in order (change the email) (READ-ONLY)
select e.created_at, e.type, e.path, e.referrer, e.seconds
from public.events e join auth.users u on u.id = e.user_id
where u.email = 'someone@example.com' order by e.created_at desc limit 200;

-- 5.6 Where members arrive from (READ-ONLY)
select coalesce(referrer, '(none)') as came_from, count(*) as visits
from public.events where type = 'session' group by 1 order by 2 desc limit 20;

-- 5.7 Which buttons and links get clicked (READ-ONLY)
select target, count(*) as clicks from public.events
where type = 'click' and target is not null and created_at > now() - interval '30 days'
group by 1 order by 2 desc limit 30;

-- =====================================================================
-- 6. LEARNING, POINTS AND STREAKS
-- =====================================================================

-- 6.1 Points leaderboard (READ-ONLY)
select display_name, handle, points, streak, longest_streak, lessons_done, challenges_done
from public.profiles order by points desc, longest_streak desc limit 25;

-- 6.2 Streaks running right now (a streak counts if they passed a daily puzzle yesterday or today) (READ-ONLY)
select display_name, handle, streak, last_active_day from public.profiles
where streak > 0 and last_active_day >= current_date - 1 order by streak desc;

-- 6.3 How many people passed each challenge (READ-ONLY)
select ref as challenge, count(*) as passed, round(avg(score::numeric / nullif(total, 0)) * 100) as avg_score_percent
from public.awards where kind = 'challenge' group by 1 order by 2 desc;

-- 6.4 Challenges nobody has passed yet (READ-ONLY)
select c.ref as challenge from public.award_catalog c
where c.kind = 'challenge' and not exists (select 1 from public.awards a where a.kind = 'challenge' and a.ref = c.ref);

-- 6.5 Lessons completed (READ-ONLY)
select ref as lesson, count(*) as completed from public.awards where kind = 'lesson' group by 1 order by 2 desc;

-- 6.6 Today's featured challenge (the one that moves the streak) (READ-ONLY)
select public.daily_slug(current_date) as todays_puzzle, public.daily_slug(current_date + 1) as tomorrows_puzzle;

-- 6.7 Challenge tries today (3 allowed per challenge per person) (READ-ONLY)
select slug as challenge, count(*) as people, sum(n) as tries from public.challenge_attempts
where day = current_date group by 1 order by 3 desc;

-- 6.8 Daily check-ins in the last 14 days (READ-ONLY)
select last_checkin_day as day, count(*) as members_last_checked_in_on_this_day
from public.profiles where last_checkin_day > current_date - 14 group by 1 order by 1 desc;

-- =====================================================================
-- 7. JOBS
-- =====================================================================

-- 7.1 All jobs and whether they are open (READ-ONLY)
select title, company, location, mode, level, status, posted,
       cardinality(responsibilities) as responsibilities, cardinality(requirements) as requirements
from public.jobs order by posted desc;

-- 7.2 Who said they are interested in which role (READ-ONLY)
select a.created_at, j.title, u.email, p.display_name, a.note
from public.job_applications a
join auth.users u on u.id = a.user_id
left join public.profiles p on p.id = a.user_id
left join public.jobs j on j.slug = a.job_slug
order by a.created_at desc;

-- 7.3 Interest per role (READ-ONLY)
select coalesce(j.title, a.job_slug) as role, count(*) as interested
from public.job_applications a left join public.jobs j on j.slug = a.job_slug
group by 1 order by 2 desc;

-- =====================================================================
-- 8. HOUSEKEEPING AND HEALTH
-- =====================================================================

-- 8.1 How big the database is (free tier limit is 500 MB) (READ-ONLY)
select pg_size_pretty(pg_database_size(current_database())) as database_size;

-- 8.2 Biggest tables (READ-ONLY)
select relname as table_name, pg_size_pretty(pg_total_relation_size(relid)) as size, n_live_tup as approx_rows
from pg_stat_user_tables where schemaname = 'public' order by pg_total_relation_size(relid) desc;

-- 8.3 Profile photos stored (free tier limit is 1 GB of files) (READ-ONLY)
select count(*) as photos, pg_size_pretty(coalesce(sum((metadata ->> 'size')::bigint), 0)) as total_size
from storage.objects where bucket_id = 'avatars';

-- 8.4 Every table has row-level security switched on (anything listed here is a problem) (READ-ONLY)
select relname as table_without_rls from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;

-- 8.5 The database functions the site needs are all there (READ-ONLY)
select proname from pg_proc where pronamespace = 'public'::regnamespace order by 1;

-- 8.6 Leads and subscribers still missing the agreement record (READ-ONLY)
select (select count(*) from public.leads where not consent) as leads_without_consent,
       (select count(*) from public.newsletter_subscribers where not consent) as subscribers_without_consent;

-- 8.7 Make someone an admin (CHANGES DATA: gives access to the audience pages, only for people you trust)
-- insert into public.admins (user_id) select id from auth.users where email = 'their-login-email@example.com' on conflict do nothing;

-- 8.8 Remove an admin (CHANGES DATA)
-- delete from public.admins where user_id = (select id from auth.users where email = 'their-login-email@example.com');

-- =====================================================================
-- 9. CLEAN-UP AND "PLEASE DELETE MY DATA" (all CHANGE DATA: read each one first)
-- =====================================================================

-- 9.1 Erase a person who left details on a form (change the email). Run the three lines together.
-- delete from public.leads where lower(email) = lower('person@example.com');
-- delete from public.newsletter_subscribers where lower(email) = lower('person@example.com');
-- delete from public.newsletter_sends where lower(email) = lower('person@example.com');

-- 9.2 Erase a member completely: account, profile, points, activity, portfolio, job interest.
--     (Members can also do this themselves in Settings.) Their form entries are separate: see 9.1.
-- delete from auth.users where email = 'member@example.com';

-- 9.3 Delete activity older than 12 months to keep the database small
-- delete from public.events where created_at < now() - interval '12 months';

-- 9.4 Delete any activity recorded for visitors who were not signed in (the site no longer records any)
-- delete from public.events where user_id is null;

-- 9.5 Remove duplicate leads, keeping the first one for each email
-- delete from public.leads l using public.leads k
--  where lower(l.email) = lower(k.email) and l.created_at > k.created_at;

-- 9.6 Mark someone unsubscribed by hand (they asked by email)
-- update public.newsletter_subscribers set unsubscribed_at = now() where lower(email) = lower('person@example.com') and unsubscribed_at is null;
-- update public.leads set unsubscribed_at = now() where lower(email) = lower('person@example.com') and unsubscribed_at is null;

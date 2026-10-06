-- Run once in the Supabase SQL editor (Dashboard > SQL editor > New query > paste > Run).
-- These statements were left out of the automated update because the Supabase connector
-- asks a person to confirm any statement that drops or deletes. Everything else is already applied.

-- 1. Let the activity log record time-on-page and visit starts (adds 'dwell' and 'session').
alter table public.events drop constraint if exists events_type_check;
alter table public.events add constraint events_type_check
  check (type in ('scroll', 'click', 'view', 'dwell', 'session'));

-- 2. "Delete my account" in Settings.
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
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- 3. Remove tracking rows saved about visitors who were not signed in (the site no longer records any).
delete from public.events where user_id is null;

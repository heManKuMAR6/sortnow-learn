-- Interactive challenges: the database update. Safe to run more than once.
-- Where: Supabase dashboard > SQL editor > New query > paste all of this > Run.
--
-- Why: challenges now mix five question formats (pick one, spot it, sort it, put in order, fill the
-- gaps). Each answer is still ONE whole number that the database grades, but the numbers are
-- different from before, so the stored answers must be replaced. Until this is run, correct
-- answers on the live site are marked wrong.
--
-- Nothing here deletes anything or changes anyone's points, streaks or progress.

-- How many tries the signed-in person has used today on one challenge (drives the hearts in the player).
create or replace function public.challenge_tries_today(p_slug text)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select n from public.challenge_attempts
                    where user_id = auth.uid() and slug = p_slug and day = public.local_day(auth.uid())), 0);
$$;
revoke all on function public.challenge_tries_today(text) from public, anon;
grant execute on function public.challenge_tries_today(text) to authenticated;

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
  ('challenge', 'agent-or-not', 25, 5),
  ('challenge', 'tokens-in-plain-words', 15, 6),
  ('challenge', 'same-question-different-answer', 15, 7),
  ('challenge', 'summaries-you-can-trust', 20, 8),
  ('challenge', 'real-or-generated', 20, 9),
  ('challenge', 'prompt-search-or-retrain', 25, 10),
  ('challenge', 'measure-before-you-ship', 25, 11),
  ('challenge', 'who-checks-the-work', 20, 12),
  ('challenge', 'whose-view-is-in-the-answer', 20, 13)
on conflict (kind, ref) do update set points = excluded.points, position = excluded.position;

insert into public.challenge_answers (slug, idx, answer) values
  ('spot-the-made-up-answer', 0, 1),
  ('spot-the-made-up-answer', 1, 6),
  ('spot-the-made-up-answer', 2, 0),
  ('spot-the-made-up-answer', 3, 39),
  ('write-a-better-prompt', 0, 10),
  ('write-a-better-prompt', 1, 1),
  ('write-a-better-prompt', 2, 1),
  ('write-a-better-prompt', 3, 6),
  ('pick-the-right-tool', 0, 21),
  ('pick-the-right-tool', 1, 3),
  ('pick-the-right-tool', 2, 2),
  ('pick-the-right-tool', 3, 3),
  ('whats-in-the-context', 0, 2),
  ('whats-in-the-context', 1, 2),
  ('whats-in-the-context', 2, 10),
  ('whats-in-the-context', 3, 0),
  ('is-it-safe-to-paste', 0, 6),
  ('is-it-safe-to-paste', 1, 3),
  ('is-it-safe-to-paste', 2, 141),
  ('is-it-safe-to-paste', 3, 2),
  ('agent-or-not', 0, 10),
  ('agent-or-not', 1, 16),
  ('agent-or-not', 2, 0),
  ('agent-or-not', 3, 3),
  ('tokens-in-plain-words', 0, 1),
  ('tokens-in-plain-words', 1, 0),
  ('tokens-in-plain-words', 2, 10),
  ('tokens-in-plain-words', 3, 141),
  ('same-question-different-answer', 0, 1),
  ('same-question-different-answer', 1, 10),
  ('same-question-different-answer', 2, 3),
  ('same-question-different-answer', 3, 7),
  ('summaries-you-can-trust', 0, 0),
  ('summaries-you-can-trust', 1, 0),
  ('summaries-you-can-trust', 2, 1),
  ('summaries-you-can-trust', 3, 6),
  ('real-or-generated', 0, 0),
  ('real-or-generated', 1, 0),
  ('real-or-generated', 2, 39),
  ('real-or-generated', 3, 10),
  ('prompt-search-or-retrain', 0, 1),
  ('prompt-search-or-retrain', 1, 21),
  ('prompt-search-or-retrain', 2, 5),
  ('prompt-search-or-retrain', 3, 3),
  ('measure-before-you-ship', 0, 2),
  ('measure-before-you-ship', 1, 2),
  ('measure-before-you-ship', 2, 2),
  ('measure-before-you-ship', 3, 4),
  ('who-checks-the-work', 0, 10),
  ('who-checks-the-work', 1, 3),
  ('who-checks-the-work', 2, 2),
  ('who-checks-the-work', 3, 0),
  ('whose-view-is-in-the-answer', 0, 1),
  ('whose-view-is-in-the-answer', 1, 1),
  ('whose-view-is-in-the-answer', 2, 0),
  ('whose-view-is-in-the-answer', 3, 10)
on conflict (slug, idx) do update set answer = excluded.answer;

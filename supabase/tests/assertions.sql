-- Assertions for supabase/migrations/*.sql, run by scripts/test-db.sh after supabase/tests/setup.sql.
-- They act as the real roles (anon, authenticated, service_role) with a fake JWT subject and check that
-- row level security, column grants, the XP and quota functions and account deletion behave as designed.
-- Needs a Unix-like psql: result rows are discarded with \o /dev/null.

\set ON_ERROR_STOP on
\set VERBOSITY terse
\set u1 '11111111-1111-1111-1111-111111111111'
\set u2 '22222222-2222-2222-2222-222222222222'
\set u3 '33333333-3333-3333-3333-333333333333'
\set u4 '44444444-4444-4444-4444-444444444444'

-- ---------------------------------------------------------------- helpers
create schema t;
grant usage on schema t to public;

create function t.fails(p_sql text, p_state text) returns void language plpgsql as $$
declare v_ok boolean := false;
begin
  begin
    execute p_sql;
    v_ok := true;
  exception when others then
    if sqlstate <> p_state then
      raise exception 'expected % but got % (%) for: %', p_state, sqlstate, sqlerrm, p_sql;
    end if;
  end;
  if v_ok then
    raise exception 'expected % but the statement succeeded: %', p_state, p_sql;
  end if;
  raise notice 'ok   fails with %: %', p_state, left(p_sql, 80);
end $$;

create function t.eq(p_actual text, p_expected text, p_label text) returns void language plpgsql as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'FAIL %: expected [%], got [%]', p_label, p_expected, p_actual;
  end if;
  raise notice 'ok   %', p_label;
end $$;

-- A read that must reveal nothing: either permission denied (new default) or zero rows (RLS, old default).
create function t.hidden(p_sql text) returns void language plpgsql as $$
declare v_n bigint;
begin
  begin
    execute 'select count(*) from (' || p_sql || ') s' into v_n;
  exception when insufficient_privilege then
    raise notice 'ok   hidden (permission denied): %', left(p_sql, 70);
    return;
  end;
  if v_n <> 0 then
    raise exception 'expected no visible rows but saw % for: %', v_n, p_sql;
  end if;
  raise notice 'ok   hidden (0 rows): %', left(p_sql, 70);
end $$;

-- A write that may be refused outright or silently match no rows; callers check the state afterwards.
create function t.try(p_sql text) returns void language plpgsql as $$
begin
  execute p_sql;
exception when insufficient_privilege then
  null;
end $$;

\o /dev/null

-- ---------------------------------------------------------------- 1. sign-up bootstrap
insert into auth.users (id, email, raw_user_meta_data) values
  (:'u1', 'ann@example.com', '{"full_name":"Ann Lee","avatar_url":"https://lh3.googleusercontent.com/a/x"}'),
  (:'u2', 'bob@example.com', '{}'),
  (:'u3', 'cy@example.com',  '{"name":"Cy","avatar_url":"http://insecure.example/a.png"}'),
  (:'u4', 'dee@example.com', json_build_object('avatar_url', 'https://x.example/' || repeat('a', 600))::jsonb);

select t.eq((select count(*)::text from public.profiles), '4', 'a profile is created for every new user');
select t.eq((select count(*)::text from public.decks where is_default), '4', 'a default deck is created for every new user');
select t.eq((select display_name from public.profiles where id = :'u1'), 'Ann Lee', 'display name comes from full_name');
select t.eq((select display_name from public.profiles where id = :'u2'), 'bob', 'display name falls back to the email name');
select t.eq((select display_name from public.profiles where id = :'u3'), 'Cy', 'display name comes from name');
select t.eq((select avatar_url from public.profiles where id = :'u1'), 'https://lh3.googleusercontent.com/a/x', 'an https avatar is kept');
select t.eq((select coalesce(avatar_url, 'NULL') from public.profiles where id = :'u3'), 'NULL', 'an http avatar is dropped and sign-up still works');
select t.eq((select coalesce(avatar_url, 'NULL') from public.profiles where id = :'u4'), 'NULL', 'an oversized avatar is dropped and sign-up still works');

-- fixtures written as the owner
select id as d2 from public.decks where user_id = :'u2' and is_default \gset
insert into public.cards (user_id, deck_id, word, definition)
  values (:'u2', :'d2', 'borrow', 'take and later return') returning id \gset c2_
insert into public.dictionary_cache (word_key, found, entry, indexable) values ('achieve', true, '{"word":"achieve"}', true);
insert into public.media_clips (topic_type, topic_key, video_id, transcript, attribution, license, approved) values
  ('word', 'achieve', 'dQw4w9WgXcQ', 'we achieved it', 'Someone', 'embed (YouTube ToS)', true),
  ('word', 'achieve', 'aaaaaaaaaaa', 'hidden', 'Someone', 'pending review', false);

-- ---------------------------------------------------------------- 2. signed-out visitors
set role anon;
select t.hidden('select * from public.profiles');
select t.hidden('select * from public.decks');
select t.hidden('select * from public.cards');
select t.hidden('select * from public.review_logs');
select t.hidden('select * from public.grammar_progress');
select t.hidden('select * from public.activities');
select t.hidden('select * from public.ai_usage');
select t.fails('select public.award_xp(''quiz'')', '42501');
select t.fails('select public.consume_ai_quota(5)', '42501');
select t.fails('select public.delete_account()', '42501');
select t.fails('select public.bump_lookup(''achieve'')', '42501');
select t.fails('select public.level_for_xp(1)', '42501');
select t.fails('insert into public.dictionary_cache (word_key, found) values (''x'', false)', '42501');
select t.try('update public.dictionary_cache set found = false');
select t.try('delete from public.dictionary_cache');
select t.eq((select count(*)::text from public.dictionary_cache), '1', 'anon can read the dictionary cache');
select t.eq((select count(*)::text from public.media_clips), '1', 'anon sees approved clips only');
reset role;
select t.eq((select count(*)::text || '/' || bool_and(found)::text from public.dictionary_cache), '1/true', 'anon cannot change or delete cached entries');

-- ---------------------------------------------------------------- 3. signed-in user 1
set role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :'u1', 'role', 'authenticated')::text, false);

select t.eq((select count(*)::text from public.profiles), '1', 'a user sees only their own profile');
select t.eq((select count(*)::text from public.decks), '1', 'a user sees only their own decks');
select t.fails(format('update public.profiles set xp = 9999 where id = %L', :'u1'), '42501');
select t.fails(format('update public.profiles set level = 99 where id = %L', :'u1'), '42501');
select t.fails(format('update public.profiles set streak_current = 99 where id = %L', :'u1'), '42501');
select t.fails(format('update public.profiles set last_active_date = current_date where id = %L', :'u1'), '42501');
select t.fails('insert into public.profiles (id) values (gen_random_uuid())', '42501');

update public.profiles set display_name = 'Ann L.', timezone = 'Asia/Atyrau', daily_goal_xp = 50 where id = :'u1';
select t.eq((select display_name || '/' || timezone || '/' || daily_goal_xp::text from public.profiles), 'Ann L./Asia/Atyrau/50', 'a user can edit their own preferences');
select t.fails(format('update public.profiles set timezone = %L where id = %L', '', :'u1'), '23514');
select t.fails(format('update public.profiles set daily_goal_xp = 4 where id = %L', :'u1'), '23514');
select t.fails(format('update public.profiles set avatar_url = %L where id = %L', 'javascript:alert(1)', :'u1'), '23514');
update public.profiles set display_name = 'hacked' where id = :'u2';

-- cards
insert into public.cards (user_id, deck_id, word, definition)
  select :'u1', id, 'Serendipity', 'a happy accident' from public.decks where is_default;
select t.eq((select count(*)::text from public.cards), '1', 'a user can add a card to their own deck');
select id as c1 from public.cards \gset
select t.fails(format('insert into public.cards (user_id, deck_id, word, definition) values (%L, (select id from public.decks where is_default), %L, %L)', :'u1', 'serendipity ', 'duplicate'), '23505');
select t.fails(format('insert into public.cards (user_id, deck_id, word, definition) values (%L, %L, %L, %L)', :'u1', :'d2', 'steal', 'into another deck'), '42501');
select t.fails(format('insert into public.cards (user_id, deck_id, word, definition) values (%L, (select id from public.decks where is_default), %L, %L)', :'u2', 'forge', 'as another user'), '42501');
select t.fails(format('insert into public.cards (user_id, deck_id, word, definition, ease_factor) values (%L, (select id from public.decks where is_default), %L, %L, 9)', :'u1', 'x', 'bad ease'), '23514');
select t.eq((select count(*)::text from public.cards where user_id = :'u2'), '0', 'another user''s cards are invisible');

-- review logs
insert into public.review_logs (user_id, card_id, rating, state_before, interval_before, interval_after, ease_after)
  values (:'u1', :'c1', 3, 'new', 0, 1, 2.5);
select t.fails(format('insert into public.review_logs (user_id, card_id, rating, state_before, interval_before, interval_after, ease_after) values (%L, %L, 3, %L, 0, 1, 2.5)', :'u1', :'c2_id', 'new'), '42501');
select t.fails(format('insert into public.review_logs (user_id, rating, state_before, interval_before, interval_after, ease_after) values (%L, 5, %L, 0, 1, 2.5)', :'u1', 'new'), '23514');
select t.try('delete from public.review_logs');
select t.try('update public.review_logs set rating = 1');
select t.eq((select count(*)::text || '/' || min(rating)::text from public.review_logs), '1/3', 'review logs are append-only for users');

-- award_xp
select * from public.award_xp('quiz', 'present-simple', 85) \gset r1_
select t.eq(:'r1_r_xp_awarded', '18', 'a quiz at 85% earns 18 XP');
select t.eq(:'r1_r_xp_total', '18', 'xp total is returned');
select t.eq(:'r1_r_level', '1', 'still level 1');
select t.eq(:'r1_r_streak', '1', 'the first activity starts a streak of 1');
select t.eq(:'r1_r_leveled_up', 'f', 'no level-up yet');
select t.eq((select xp::text from public.profiles), '18', 'profile xp is updated by award_xp');
select t.eq((select count(*)::text from public.activities), '1', 'the activity is recorded');

do $$ begin for i in 1..30 loop perform public.award_xp('quiz', 'cap-test', 85); end loop; end $$;
select t.eq((select sum(xp_awarded)::text from public.activities where kind = 'quiz'), '300', 'quizzes are capped at 300 XP a day');
do $$ begin for i in 1..100 loop perform public.award_xp('quiz', 'cap-test', 85); end loop; end $$;
select t.eq((select count(*)::text from public.activities where kind = 'quiz'), '50', 'history rows past the cap are bounded');
select t.eq((select sum(xp_awarded)::text from public.activities where kind = 'quiz'), '300', 'the cap still holds after many more calls');
do $$ begin for i in 1..25 loop perform public.award_xp('lookup'); end loop; end $$;
select t.eq((select sum(xp_awarded)::text from public.activities where kind = 'lookup'), '20', 'lookups are capped at 20 XP a day');

select t.fails('select public.award_xp(''bogus'')', '22023');
select t.fails('select public.award_xp(''quiz'', null, 101)', '22003');
select t.fails('select public.award_xp(''quiz'', null, -1)', '22003');

-- direct writes to server-owned tables
select t.fails('insert into public.activities (user_id, kind) values (auth.uid(), ''quiz'')', '42501');
select t.fails('insert into public.ai_usage (user_id, day, calls) values (auth.uid(), current_date, 0)', '42501');
select t.try('delete from public.activities');
select t.try('update public.activities set xp_awarded = 1000');
select t.eq((select (count(*) > 0)::text || '/' || max(xp_awarded)::text from public.activities), 'true/18', 'activity history cannot be rewritten by the user');
select t.fails('select public.level_for_xp(100)', '42501');
select t.fails('select public.bump_lookup(''achieve'')', '42501');
select t.fails('insert into public.dictionary_cache (word_key, found) values (''y'', false)', '42501');

-- AI quota
select t.eq((select public.consume_ai_quota(3)::text), 'true', 'AI call 1 is allowed');
select t.eq((select public.consume_ai_quota(3)::text), 'true', 'AI call 2 is allowed');
select t.eq((select public.consume_ai_quota(3)::text), 'true', 'AI call 3 is allowed');
select t.eq((select public.consume_ai_quota(3)::text), 'false', 'AI call 4 is refused at a limit of 3');
select t.eq((select calls::text from public.ai_usage), '3', 'the counter stops at the limit');
select t.eq((select public.consume_ai_quota(0)::text), 'false', 'a non-positive limit never allows a call');

-- grammar progress
insert into public.grammar_progress (user_id, topic_slug, best_score, attempts, completed) values (:'u1', 'present-simple', 90, 1, true);
select t.fails(format('insert into public.grammar_progress (user_id, topic_slug) values (%L, %L)', :'u2', 'present-simple'), '42501');
select t.fails(format('insert into public.grammar_progress (user_id, topic_slug, best_score) values (%L, %L, 101)', :'u1', 'x'), '23514');
select t.eq((select count(*)::text from public.grammar_progress), '1', 'grammar progress is private to its owner');

-- streaks, level-up and the time-zone fallback (state is set up as the owner)
reset role;
select t.eq((select display_name from public.profiles where id = :'u2'), 'bob', 'a user cannot update another user''s profile');
update public.profiles set last_active_date = (now() at time zone timezone)::date - 1, streak_current = 1, streak_best = 1 where id = :'u1';
set role authenticated;
select * from public.award_xp('lookup') \gset r2_
select t.eq(:'r2_r_streak', '2', 'activity on the next day extends the streak');
reset role;
update public.profiles set last_active_date = (now() at time zone timezone)::date - 3 where id = :'u1';
set role authenticated;
select * from public.award_xp('lookup') \gset r3_
select t.eq(:'r3_r_streak', '1', 'a gap of more than a day resets the streak');
select t.eq((select streak_best::text from public.profiles), '2', 'the best streak is kept');
reset role;
update public.profiles set timezone = 'Not/AZone', xp = 49, level = 1 where id = :'u1';
set role authenticated;
select * from public.award_xp('dictation', 'a1', 100) \gset r4_
select t.eq(:'r4_r_xp_awarded', '15', 'dictation at 100% earns 15 XP, even with an unknown time zone');
select t.eq(:'r4_r_level', '2', 'crossing 50 XP reaches level 2');
select t.eq(:'r4_r_leveled_up', 't', 'the level-up is reported');

-- no session
select set_config('request.jwt.claims', '', false);
select t.fails('select public.award_xp(''quiz'')', '28000');
select t.eq((select public.consume_ai_quota(10)::text), 'false', 'the AI quota refuses a caller without a session');
reset role;

-- ---------------------------------------------------------------- 4. the server (secret) key
set role service_role;
insert into public.dictionary_cache (word_key, found, entry, indexable) values ('achieve', true, '{"word":"achieve","v":2}', true)
  on conflict (word_key) do update set entry = excluded.entry;
update public.dictionary_cache set enrichment = jsonb_build_object('ru', jsonb_build_object('translation', 'достигать')) where word_key = 'achieve';
select public.bump_lookup('achieve');
select public.bump_lookup('achieve');
select t.eq((select lookup_count::text from public.dictionary_cache where word_key = 'achieve'), '2', 'the server key can bump lookup counts');
select t.eq((select enrichment #>> '{ru,translation}' from public.dictionary_cache where word_key = 'achieve'), 'достигать', 'enrichment round-trips as UTF-8');
select t.eq((select entry ->> 'v' from public.dictionary_cache where word_key = 'achieve'), '2', 'the server key can upsert dictionary entries');
select t.eq((select count(*)::text from public.media_clips), '2', 'the server key sees unapproved clips too');
reset role;

-- cache housekeeping (0002_maintenance.sql): old misses go, fresh misses and every hit stay
insert into public.dictionary_cache (word_key, found, fetched_at) values
  ('old-miss-a', false, now() - interval '10 days'),
  ('old-miss-b', false, now() - interval '4 days'),
  ('fresh-miss', false, now() - interval '2 hours');
insert into public.dictionary_cache (word_key, found, entry, fetched_at) values
  ('old-hit', true, '{"word":"old-hit"}', now() - interval '400 days');
set role service_role;
select public.prune_dictionary_cache(3) as pruned \gset
reset role;
select t.eq(:'pruned', '2', 'prune_dictionary_cache deletes misses older than the cut-off');
select t.eq((select string_agg(word_key, ',' order by word_key) from public.dictionary_cache where word_key in ('old-miss-a', 'old-miss-b', 'fresh-miss', 'old-hit')),
            'fresh-miss,old-hit', 'recent misses and cached hits are kept');
set role service_role;
select t.eq((select public.prune_dictionary_cache(0)::text), '0', 'a cut-off below one day is treated as one day');
reset role;
set role authenticated;
select t.fails('select public.prune_dictionary_cache()', '42501');
reset role;
set role anon;
select t.fails('select public.prune_dictionary_cache()', '42501');
reset role;

-- ---------------------------------------------------------------- 5. account deletion
set role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :'u2', 'role', 'authenticated')::text, false);
select public.delete_account();
reset role;
select t.eq((select count(*)::text from auth.users where id = :'u2'), '0', 'delete_account removes the auth user');
select t.eq((select count(*)::text from public.profiles where id = :'u2'), '0', 'the profile is removed with it');
select t.eq((select count(*)::text from public.decks where user_id = :'u2'), '0', 'decks are removed with it');
select t.eq((select count(*)::text from public.cards where user_id = :'u2'), '0', 'cards are removed with it');
select t.eq((select count(*)::text from public.profiles), '3', 'other users are untouched');

-- ---------------------------------------------------------------- 6. parity and catalog checks
select t.eq(public.level_for_xp(v)::text, e, 'level_for_xp(' || v::text || ') = ' || e)
  from (values (-5, '1'), (0, '1'), (49, '1'), (50, '2'), (199, '2'), (200, '3'), (449, '3'), (450, '4'), (1249, '5'), (1250, '6')) as x(v, e);

select t.eq((select coalesce(string_agg(c.relname, ',' order by c.relname), 'none')
               from pg_class c join pg_namespace n on n.oid = c.relnamespace
              where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
            'none', 'every public table has row level security enabled');
select t.eq((select coalesce(string_agg(p.proname, ',' order by p.proname), 'none')
               from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.prosecdef and has_function_privilege('anon', p.oid, 'execute')),
            'none', 'no security definer function is executable by anon');
select t.eq((select string_agg(p.proname, ',' order by p.proname)
               from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.prosecdef and has_function_privilege('authenticated', p.oid, 'execute')),
            'award_xp,consume_ai_quota,delete_account', 'signed-in users can call exactly three security definer functions');
select t.eq((select coalesce(string_agg(p.proname, ',' order by p.proname), 'none')
               from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.prosecdef and p.proconfig is null),
            'none', 'every security definer function pins its search_path');

\o
\echo ALL ASSERTIONS PASSED

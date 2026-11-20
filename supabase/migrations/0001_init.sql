-- FluentPath: initial schema
-- Apply with `supabase db push`, or paste into the Supabase SQL editor.
--
-- Conventions
--  * Every user-owned table has RLS on. Policies use (select auth.uid()) so Postgres
--    evaluates it once per statement rather than once per row.
--  * XP, level and streak are only ever changed by public.award_xp(); the client cannot
--    write them directly (column-level grants below).
--  * Server-only writes (dictionary cache) go through the service-role / secret key.
--  * Every table and function the Data API may reach is granted explicitly below. Since
--    May 2026 new Supabase projects no longer hand out default privileges on public tables,
--    so nothing here relies on them; on older projects the grants are simply redundant.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Level n starts at 50 * (n-1)^2 XP. Mirrors lib/core/gamification.ts.
create or replace function public.level_for_xp(p_xp integer)
returns integer language sql immutable as $$
  select floor(sqrt(greatest(p_xp, 0) / 50.0))::integer + 1
$$;

-- Internal helpers: not callable through the Data API (award_xp and the triggers run as the owner).
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.level_for_xp(integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  display_name     text check (char_length(display_name) <= 80),
  avatar_url       text check (avatar_url ~ '^https://' and char_length(avatar_url) <= 500),
  native_lang      text not null default 'ru' check (native_lang ~ '^[a-z]{2,3}$'),
  cefr_level       text not null default 'A1' check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  timezone         text not null default 'UTC' check (char_length(timezone) between 1 and 64),
  xp               integer not null default 0 check (xp >= 0),
  level            integer not null default 1,
  streak_current   integer not null default 0,
  streak_best      integer not null default 0,
  last_active_date date,
  daily_goal_xp    integer not null default 30 check (daily_goal_xp between 5 and 500),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Users may edit preferences only. xp / level / streak_* are written by award_xp().
revoke update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_url, native_lang, cefr_level, timezone, daily_goal_xp)
  on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Decks and cards (Anki-style spaced repetition; scheduling lives in lib/core/sm2.ts)
-- ---------------------------------------------------------------------------
create table public.decks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index decks_one_default_per_user on public.decks (user_id) where is_default;

alter table public.decks enable row level security;
create policy "decks: own" on public.decks
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.decks to authenticated;

create table public.cards (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  deck_id          uuid not null references public.decks (id) on delete cascade,
  word             text not null check (char_length(word) between 1 and 80),
  word_key         text generated always as (lower(btrim(word))) stored,
  part_of_speech   text check (char_length(part_of_speech) <= 40),
  definition       text not null check (char_length(definition) <= 600),
  example          text check (char_length(example) <= 400),
  translation      text check (char_length(translation) <= 200),
  audio_url        text,
  source           text not null default 'lookup' check (source in ('lookup','grammar','dictation','custom')),
  -- scheduler state
  state            text not null default 'new' check (state in ('new','learning','review','relearning')),
  learning_step    integer not null default 0 check (learning_step >= 0),
  ease_factor      numeric(4,2) not null default 2.50 check (ease_factor between 1.30 and 3.50),
  interval_days    integer not null default 0 check (interval_days >= 0),
  repetitions      integer not null default 0 check (repetitions >= 0),
  lapses           integer not null default 0 check (lapses >= 0),
  due_at           timestamptz not null default now(),
  last_reviewed_at timestamptz,
  created_at       timestamptz not null default now(),
  unique nulls not distinct (deck_id, word_key, part_of_speech)
);
create index cards_due_idx on public.cards (user_id, due_at);
create index cards_deck_idx on public.cards (deck_id);

alter table public.cards enable row level security;
create policy "cards: own" on public.cards
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.decks d where d.id = deck_id and d.user_id = (select auth.uid()))
  );
grant select, insert, update, delete on public.cards to authenticated;

create table public.review_logs (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  card_id         uuid references public.cards (id) on delete set null,
  rating          smallint not null check (rating between 1 and 4), -- 1 again, 2 hard, 3 good, 4 easy
  state_before    text not null,
  interval_before integer not null,
  interval_after  integer not null,
  ease_after      numeric(4,2) not null,
  reviewed_at     timestamptz not null default now()
);
create index review_logs_user_time on public.review_logs (user_id, reviewed_at desc);

alter table public.review_logs enable row level security;
create policy "review_logs: read own" on public.review_logs
  for select to authenticated using (user_id = (select auth.uid()));
create policy "review_logs: insert own" on public.review_logs
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (card_id is null or exists (
      select 1 from public.cards c where c.id = card_id and c.user_id = (select auth.uid())
    ))
  );
-- Append-only for users; the identity column needs no separate sequence grant.
grant select, insert on public.review_logs to authenticated;

-- ---------------------------------------------------------------------------
-- Dictionary cache (public data; written only by the server with the secret key)
-- ---------------------------------------------------------------------------
create table public.dictionary_cache (
  word_key     text primary key check (word_key = lower(word_key) and char_length(word_key) between 1 and 60),
  found        boolean not null,
  entry        jsonb,                                  -- normalized entry, null when found = false
  source       text not null default 'dictionaryapi.dev',
  indexable    boolean not null default false,         -- passes the thin-content guard (lib/core/dictionary.ts)
  lookup_count integer not null default 0,
  enrichment   jsonb not null default '{}'::jsonb,     -- { "<lang>": { translation, examples[] } }
  fetched_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index dictionary_cache_popular on public.dictionary_cache (lookup_count desc) where indexable;

create trigger dictionary_cache_updated_at before update on public.dictionary_cache
  for each row execute function public.set_updated_at();

alter table public.dictionary_cache enable row level security;
create policy "dictionary_cache: public read" on public.dictionary_cache
  for select to anon, authenticated using (true);
grant select on public.dictionary_cache to anon, authenticated;
grant select, insert, update, delete on public.dictionary_cache to service_role;

create or replace function public.bump_lookup(p_key text)
returns void language sql security definer set search_path = '' as $$
  update public.dictionary_cache set lookup_count = lookup_count + 1 where word_key = p_key;
$$;
revoke execute on function public.bump_lookup(text) from public, anon, authenticated;
grant execute on function public.bump_lookup(text) to service_role;

-- ---------------------------------------------------------------------------
-- Editorial media clips (curated video/audio examples; add rows by hand or via an admin tool)
-- ---------------------------------------------------------------------------
create table public.media_clips (
  id            uuid primary key default gen_random_uuid(),
  topic_type    text not null check (topic_type in ('word','grammar')),
  topic_key     text not null,
  provider      text not null default 'youtube' check (provider in ('youtube','self_hosted')),
  video_id      text not null,
  start_seconds integer not null default 0 check (start_seconds >= 0),
  end_seconds   integer check (end_seconds is null or end_seconds > start_seconds),
  transcript    text not null,
  attribution   text not null,
  license       text not null,        -- record the basis for showing it: 'CC BY 3.0', 'embed (YouTube ToS)', 'licensed'
  approved      boolean not null default false,
  created_at    timestamptz not null default now()
);
create index media_clips_topic on public.media_clips (topic_type, topic_key) where approved;

alter table public.media_clips enable row level security;
create policy "media_clips: public read approved" on public.media_clips
  for select to anon, authenticated using (approved);
grant select on public.media_clips to anon, authenticated;
grant select, insert, update, delete on public.media_clips to service_role;

-- ---------------------------------------------------------------------------
-- Progress: grammar mastery, activity history (test history), AI usage
-- ---------------------------------------------------------------------------
create table public.grammar_progress (
  user_id         uuid not null references public.profiles (id) on delete cascade,
  topic_slug      text not null check (char_length(topic_slug) <= 80),
  best_score      numeric(5,2) not null default 0 check (best_score between 0 and 100),
  attempts        integer not null default 0,
  completed       boolean not null default false,   -- best_score >= 80
  last_attempt_at timestamptz not null default now(),
  primary key (user_id, topic_slug)
);

alter table public.grammar_progress enable row level security;
create policy "grammar_progress: own" on public.grammar_progress
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.grammar_progress to authenticated;

create table public.activities (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       text not null check (kind in ('review','quiz','dictation','speaking','drill','dialogue','lookup','tutor')),
  ref        text,                                   -- topic slug, CEFR level, tense, dialogue slug ...
  score      numeric(5,2) check (score between 0 and 100),
  xp_awarded integer not null default 0,
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint activities_meta_small check (pg_column_size(meta) <= 4096)
);
create index activities_user_time on public.activities (user_id, created_at desc);
create index activities_user_kind on public.activities (user_id, kind, created_at desc);

alter table public.activities enable row level security;
create policy "activities: read own" on public.activities
  for select to authenticated using (user_id = (select auth.uid()));
-- No insert/update/delete policies or grants: rows are created only by award_xp().
grant select on public.activities to authenticated;

create table public.ai_usage (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day     date not null,
  calls   integer not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
create policy "ai_usage: read own" on public.ai_usage
  for select to authenticated using (user_id = (select auth.uid()));
grant select on public.ai_usage to authenticated;

-- ---------------------------------------------------------------------------
-- New-user bootstrap: profile + default deck
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_avatar text := new.raw_user_meta_data ->> 'avatar_url';
begin
  -- A bad value here must never block sign-up, so the avatar is dropped rather than rejected.
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name',
                  new.raw_user_meta_data ->> 'name',
                  split_part(new.email, '@', 1)), 80),
    case when v_avatar ~ '^https://' and char_length(v_avatar) <= 500 then v_avatar end
  );
  insert into public.decks (user_id, name, is_default) values (new.id, 'My words', true);
  return new;
end $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- award_xp: the single write path for XP, level, streak and activity history
-- ---------------------------------------------------------------------------
-- XP is motivational, not competitive. Amounts and daily caps are fixed here, so a
-- tampered client can at most max out its own caps. If you add public leaderboards,
-- move scoring to server-verified paths first.
create or replace function public.award_xp(
  p_kind  text,
  p_ref   text default null,
  p_score numeric default null,
  p_meta  jsonb default '{}'::jsonb
)
returns table (
  r_xp_awarded integer,
  r_xp_total   integer,
  r_level      integer,
  r_streak     integer,
  r_leveled_up boolean
)
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_tz      text;
  v_today   date;
  v_base    integer;
  v_cap     integer;
  v_earned  integer;
  v_count   integer;
  v_xp      integer;
  v_streak  integer;
  v_total   integer;
  v_level   integer;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select
    case p_kind
      when 'review' then 2 when 'quiz' then 20 when 'dictation' then 15
      when 'speaking' then 10 when 'drill' then 15 when 'dialogue' then 15
      when 'lookup' then 1 when 'tutor' then 2
    end,
    case p_kind
      when 'review' then 200 when 'quiz' then 300 when 'dictation' then 300
      when 'speaking' then 200 when 'drill' then 300 when 'dialogue' then 200
      when 'lookup' then 20 when 'tutor' then 40
    end
  into v_base, v_cap;

  if v_base is null then
    raise exception 'unknown activity kind: %', p_kind using errcode = '22023';
  end if;
  if p_score is not null and (p_score < 0 or p_score > 100) then
    raise exception 'score out of range' using errcode = '22003';
  end if;

  select * into v_profile from public.profiles where id = v_uid for update;
  if not found then
    raise exception 'profile missing' using errcode = 'P0002';
  end if;

  v_tz := v_profile.timezone;
  begin
    perform now() at time zone v_tz;
  exception when others then
    v_tz := 'UTC';
  end;
  v_today := (now() at time zone v_tz)::date;

  select coalesce(sum(a.xp_awarded), 0), count(*) into v_earned, v_count
    from public.activities a
   where a.user_id = v_uid
     and a.kind = p_kind
     and (a.created_at at time zone v_tz)::date = v_today;

  v_xp := case
            when v_earned >= v_cap then 0
            when p_score is null then v_base
            else greatest(1, round(v_base * (0.25 + 0.75 * p_score / 100.0))::integer)
          end;
  v_xp := least(v_xp, greatest(v_cap - v_earned, 0));

  if v_profile.last_active_date = v_today then
    v_streak := greatest(v_profile.streak_current, 1);
  elsif v_profile.last_active_date = v_today - 1 then
    v_streak := v_profile.streak_current + 1;
  else
    v_streak := 1;
  end if;

  v_total := v_profile.xp + v_xp;
  v_level := public.level_for_xp(v_total);

  update public.profiles
     set xp = v_total,
         level = v_level,
         streak_current = v_streak,
         streak_best = greatest(streak_best, v_streak),
         last_active_date = v_today
   where id = v_uid;

  -- Past the daily cap a call earns nothing, so keep a bounded amount of history for it
  -- rather than one row per call (a script could otherwise grow this table without limit).
  if v_xp > 0 or v_count < 50 then
    insert into public.activities (user_id, kind, ref, score, xp_awarded, meta)
    values (v_uid, p_kind, left(p_ref, 120), p_score, v_xp, coalesce(p_meta, '{}'::jsonb));
  end if;

  return query select v_xp, v_total, v_level, v_streak, v_level > v_profile.level;
end $$;

revoke execute on function public.award_xp(text, text, numeric, jsonb) from public, anon;
grant execute on function public.award_xp(text, text, numeric, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- consume_ai_quota: atomic daily counter. Returns false once p_limit is reached.
-- ---------------------------------------------------------------------------
create or replace function public.consume_ai_quota(p_limit integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_calls integer;
begin
  if v_uid is null or p_limit is null or p_limit < 1 then
    return false;
  end if;

  insert into public.ai_usage as u (user_id, day, calls)
  values (v_uid, (now() at time zone 'UTC')::date, 1)
  on conflict (user_id, day) do update set calls = u.calls + 1
    where u.calls < p_limit
  returning u.calls into v_calls;

  return v_calls is not null;
end $$;

revoke execute on function public.consume_ai_quota(integer) from public, anon;
grant execute on function public.consume_ai_quota(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- delete_account: self-service erasure. Cascades to every table above.
-- ---------------------------------------------------------------------------
create or replace function public.delete_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;

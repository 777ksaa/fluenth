-- FluentPath: housekeeping for the shared dictionary cache.
--
-- Anyone can request /vocabulary/<anything>. Every unknown word is remembered as a "miss" for a
-- day so the upstream dictionary is not asked again, which means a crawler or a script walking
-- random URLs would otherwise grow dictionary_cache without limit. Misses older than their
-- 24-hour lifetime are useless (a later request just looks the word up again), so delete them
-- on a schedule.
--
-- Schedule it with pg_cron (Supabase: Database > Extensions > pg_cron), for example daily:
--
--   select cron.schedule(
--     'prune-dictionary-cache', '17 3 * * *',
--     $job$ select public.prune_dictionary_cache() $job$
--   );

create index if not exists dictionary_cache_misses
  on public.dictionary_cache (fetched_at)
  where not found;

-- Returns how many rows were deleted. Cached hits are never touched.
create or replace function public.prune_dictionary_cache(p_older_than_days integer default 3)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_deleted integer;
begin
  -- Qualified with an alias: a bare "found" would clash with PL/pgSQL's built-in FOUND variable.
  delete from public.dictionary_cache d
   where not d.found
     and d.fetched_at < now() - make_interval(days => greatest(coalesce(p_older_than_days, 3), 1));
  get diagnostics v_deleted = row_count;
  return v_deleted;
end $$;

revoke execute on function public.prune_dictionary_cache(integer) from public, anon, authenticated;
grant execute on function public.prune_dictionary_cache(integer) to service_role;

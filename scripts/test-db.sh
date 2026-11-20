#!/usr/bin/env bash
# Applies supabase/migrations/*.sql to a throwaway database on a LOCAL PostgreSQL server (15 or
# newer) and runs supabase/tests/assertions.sql against it, twice: once with the new Supabase
# default (no automatic grants on public tables) and once with the old one.
#
# It emulates the few Supabase pieces the migration touches (roles, auth.users, auth.uid()), so it
# needs a superuser connection and creates the roles anon, authenticated and service_role on that
# server if they are missing. Never point it at a real Supabase project.
#
# Connection settings come from the usual libpq variables, for example:
#   PGHOST=localhost PGUSER=postgres PGPASSWORD=postgres npm run test:db
set -uo pipefail
cd "$(dirname "$0")/.."

command -v psql >/dev/null 2>&1 || { echo "psql is required (PostgreSQL 15 or newer)." >&2; exit 2; }

P=(psql -X -q -v ON_ERROR_STOP=1)

apply_migrations() {
  local db=$1 file
  for file in supabase/migrations/*.sql; do
    echo "   applying ${file}"
    "${P[@]}" -d "$db" -f "$file" || return 1
  done
}

run_scenario() {
  local mode=$1 legacy=$2 db="fluentpath_test_$1" out rc=0 oks
  echo "== ${mode} default privileges"
  "${P[@]}" -d postgres -c "set client_min_messages = warning" -c "drop database if exists ${db}" -c "create database ${db}" || return 1

  "${P[@]}" -d "$db" -v legacy="$legacy" -f supabase/tests/setup.sql && apply_migrations "$db" || rc=1

  if [ $rc -eq 0 ]; then
    out=$("${P[@]}" -d "$db" -f supabase/tests/assertions.sql 2>&1) || rc=1
    oks=$(printf '%s\n' "$out" | grep -c 'NOTICE:  ok ' || true)
    printf '%s\n' "$out" | grep -v 'NOTICE:  ok ' | sed 's/^/   /'
    echo "   ${oks} assertions passed"
  fi

  "${P[@]}" -d postgres -c "drop database if exists ${db}" >/dev/null 2>&1 || true
  return $rc
}

status=0
run_scenario new 0 || status=1
run_scenario legacy 1 || status=1

if [ $status -eq 0 ]; then echo "Database tests passed."; else echo "Database tests FAILED." >&2; fi
exit $status

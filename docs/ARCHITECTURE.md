# Architecture

How FluentPath is put together, where the data lives, what protects it, and what is deliberately left out. For setup see the [README](../README.md); for search strategy see [SEO.md](SEO.md).

## 1. Principles

1. **Public pages are cacheable and cookie-free.** Dictionary, grammar, dictation, speaking and drill pages never read the visitor's session on the server. They are static or incrementally regenerated, so they are fast and crawlable. The learner's own state (saved words, XP, translations) is filled in by small client components after load.
2. **The database is the authority for anything that is rewarded.** XP amounts, daily caps, streaks, levels and the AI quota are computed inside Postgres functions. Server actions recompute scores from content they own and hand the result to those functions. The browser cannot invent a level.
3. **Pure logic is separate from I/O.** Scheduling (SM-2), text comparison, speaking scores, drills, quiz grading, XP maths and word normalisation live in `lib/core` with unit tests. Pages and actions only wire them to data.
4. **Cheap by default.** Dictionary data is cached in Postgres, translations are written once, AI is called only on request and capped per account per day, and video loads only after a click.
5. **Honest about trust.** This is a study tool, not a competition. Where a score is self-reported the reward is small and capped, and the docs say so (section 6).

## 2. System overview

```
Browser (React 19)
  - server-rendered pages + small client islands
  - Web Speech API: speak (synthesis) and listen (recognition)
  - YouGlish widget / YouTube embeds, loaded only after a click
        |
        |  GET public pages                      POST server actions, route handlers
        v                                        (cookies carry the Supabase session)
+-------------------------------------------------------------------------------+
| Next.js 16 (Node runtime)                                                     |
|   app/            routes, metadata, JSON-LD, sitemap, robots                  |
|   proxy.ts        refreshes the session and guards private routes             |
|   lib/actions     cards, progress, xp, auth, account, translate               |
|   lib/ai          Anthropic client, prompts, response parsing, quota          |
|   lib/dictionary  cache-first lookup + Datamuse enrichment                    |
+--------+-------------------------+--------------------------+-----------------+
         |                         |                          |
         v                         v                          v
 Supabase Postgres          Supabase Auth             External services
  - tables with RLS          - Google OAuth            - dictionaryapi.dev (Wiktionary)
  - award_xp,                - email + password        - Datamuse (related words)
    consume_ai_quota,                                  - Anthropic Messages API
    delete_account,                                    - YouGlish, YouTube (browser only)
    bump_lookup
```

Three Supabase clients, each with a narrow job (`lib/supabase`):

| Client | Key | Used for |
| --- | --- | --- |
| `createPublicClient()` | publishable, no cookies | Reading the shared cache (`dictionary_cache`, `media_clips`) from cacheable pages, the sitemap and the vocabulary index. |
| `getSessionContext()` / server client | publishable + the visitor's cookies | Everything done on behalf of a signed-in person. Row level security applies. The identity comes from `getClaims()`, which verifies the token signature. |
| `createAdminClient()` | secret key, `server-only` | Writing the shared dictionary cache and calling `bump_lookup`. Nothing else. |

## 3. Rendering and caching

| Route | Rendering | Notes |
| --- | --- | --- |
| `/` | ISR, 1 hour | The word of the day is picked from the date, so the page changes shortly after UTC midnight. |
| `/vocabulary` | ISR, 1 hour | Seed topics plus the most-looked-up indexable words. |
| `/vocabulary/[word]` | ISR on demand, 24 hours | `generateStaticParams` returns nothing; each word is rendered on its first request. Upstream outages throw, so an error is never cached. |
| `/grammar`, `/grammar/[topic]`, `/grammar/[topic]/cheatsheet` | Static at build | `dynamicParams = false`: an unknown topic is a 404. The topic page also revalidates hourly. |
| `/dictation/[level]`, `/speaking/[slug]`, `/drills/[tense]` | Static at build | Same rule for unknown params. |
| `/about`, `/privacy`, index pages | Static | |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/opengraph-image` | Generated | The sitemap revalidates hourly. |
| `/login`, `/dashboard`, `/review`, `/deck`, `/settings`, `/tutor` | Dynamic | `proxy.ts` refreshes the session and redirects signed-out visitors to `/login?next=...`. The pages check again themselves. |
| `/practice` | Static shell | Public to open; the API behind it needs a session. |
| `/api/tutor`, `/api/practice`, `/api/view`, `/auth/callback`, `/auth/confirm`, `/deck/export` | Route handlers | See section 4. |

## 4. Main flows

### Word lookup

1. A request for `/vocabulary/break-the-ice` becomes candidate headwords (`break the ice`, then `break-the-ice`), each checked by `normalizeWord`: letters, apostrophes, hyphens and spaces only, at most 60 characters and 8 words. Anything else never reaches the database, an upstream API or a prompt.
2. `lookupWord` reads `dictionary_cache`. A hit younger than its lifetime is used (hits 30 days, misses 24 hours).
3. Otherwise it asks dictionaryapi.dev. If that has no related words it also asks Datamuse. A found entry is written back with `indexable = isIndexable(entry)`; a miss is written as `found = false`.
4. If the upstream is down it serves a stale row when one exists and otherwise reports `unavailable`.
5. The page redirects permanently to the canonical slug, returns 404 for unknown words and renders the entry, with `noindex` unless it has at least two definitions and one example.
6. After load, `ViewBeacon` posts once per browser session to `/api/view`, which calls `bump_lookup` with the secret key. The count orders the sitemap and the vocabulary index.

### Saving and reviewing words

`SaveWordButton` calls a server action that inserts a `cards` row in the person's default deck. The review screen loads due cards, and each answer calls `reviewCard`, which runs the SM-2 step (`lib/core/sm2.ts`, with Anki-style learning steps), updates the card and appends a `review_logs` row. XP for reviews goes through `award_xp`. `/deck/export` returns the deck as TSV for Anki or a spreadsheet; cells that start with `=`, `+`, `-` or `@` are neutralised so a spreadsheet will not run them as formulas.

### Quizzes, dictation, speaking, drills

The browser scores locally so feedback is instant and works signed out. When someone is signed in, a server action (`lib/actions/progress.ts`) recomputes the score from the content it owns (the quiz answer key, the dictation line, the dialogue line), writes progress and calls `award_xp`. Speaking is the exception: the browser supplies the recognised transcript, because the audio never reaches the server.

### AI features

`/api/tutor`, `/api/practice` and the translation action all do the same four things: require a session, validate the input, call `consume_ai_quota` (a per-account daily counter that refuses once the limit is reached), then call the Anthropic Messages API with plain `fetch`. Model names and the limit come from environment variables. The prompts tell the model to treat user text as data. Generated practice sets are parsed and validated (`lib/ai/parse.ts`) before they reach the browser; translations are cached in `dictionary_cache.enrichment` so each word and language is paid for once.

### Sign-in

- Google: `signInWithOAuth` redirects to Google and back through Supabase to `/auth/callback`, which exchanges the code for a session.
- Email and password: sign-up sends a confirmation email. With the recommended templates the link goes to `/auth/confirm` (token hash, works in any browser); with the default templates it goes through `/auth/callback` (PKCE, same browser only).
- After sign-in the `?next=` value is passed through `safeNextPath`, which only accepts same-site paths.
- A database trigger on `auth.users` creates the profile and a default deck, and never blocks sign-up over a bad avatar URL.
- `delete_account` removes the `auth.users` row; every table cascades from it.

## 5. Data model

Full definitions are in `supabase/migrations/`. Every table has row level security enabled and every grant is explicit.

```
auth.users 1---1 profiles           xp, level, streak, timezone, goals (server-owned columns)
              1---* decks 1---* cards 1---* review_logs
              1---* grammar_progress    best score, attempts, completed per topic
              1---* activities          one row per rewarded action (history, XP by day)
              1---* ai_usage            calls per day

dictionary_cache   shared, one row per headword: entry JSON, found, indexable, lookup_count,
                   enrichment (translations by language), fetched_at
media_clips        curated video clips per word or topic; shown only when approved
```

| Table | Who can do what |
| --- | --- |
| `profiles` | Owner reads. Owner updates only `display_name`, `avatar_url`, `native_lang`, `cefr_level`, `timezone`, `daily_goal_xp` (column grants). XP, level and streak change only inside `award_xp`. |
| `decks`, `cards` | Owner has full access. `cards` has a unique key on deck, normalised word and part of speech (`nulls not distinct`), so a word cannot be saved twice. |
| `review_logs` | Owner reads and appends. No update or delete. |
| `grammar_progress` | Owner has full access (see section 6). |
| `activities`, `ai_usage` | Owner reads. Rows are written only by the security-definer functions. |
| `dictionary_cache` | Anyone reads. Only the secret key writes. |
| `media_clips` | Anyone reads approved rows. Only the secret key writes. |

Functions (all `security definer`, `search_path` pinned to empty, execute granted only to the roles that need it):

| Function | Callable by | Does |
| --- | --- | --- |
| `award_xp(kind, ref, score, meta)` | signed-in users | Validates the kind and score, computes XP from a fixed table, applies the daily cap, updates the streak in the person's time zone, recalculates the level, records the activity, returns the new totals. Past the cap it keeps at most 50 history rows per kind per day. |
| `consume_ai_quota(limit)` | signed-in users | Atomically counts one AI call for today; returns false once the limit is reached. |
| `delete_account()` | signed-in users | Deletes the caller's `auth.users` row. |
| `bump_lookup(key)` | secret key only | Increments `lookup_count`. |
| `prune_dictionary_cache(days)` | secret key and `pg_cron` | Deletes cached misses older than the cut-off. |
| `handle_new_user()`, `set_updated_at()`, `level_for_xp()` | nobody through the API | Trigger and helper functions. |

XP amounts and caps are defined once, in `award_xp`. `XP_AWARDS` in `lib/core/gamification.ts` mirrors them for display, and a test reads the migration and fails if the two differ. Levels start at `50 * (n - 1)^2` XP.

## 6. Security model

**What a hostile signed-in user can and cannot do**

| Attempt | Result |
| --- | --- |
| Read or change another person's rows | Blocked by row level security on every table. |
| Set their own XP, level or streak | Blocked by column grants; only `award_xp` changes them. |
| Earn unlimited XP by repeating a call | Capped per kind per day inside `award_xp` (for example 300 for quizzes, 20 for lookups). |
| Call the AI without limit | `consume_ai_quota` refuses after the daily limit; the check runs before the model is called. |
| Rewrite their history | `activities` and `review_logs` have no update or delete grants. |
| Write to the shared dictionary cache or clip table | No grants for anyone but the secret key. |
| Redirect a victim through `?next=` | `safeNextPath` accepts only single-slash same-site paths. |

**Accepted weaknesses, by design**

- `cards` and `grammar_progress` are writable by their owner, so a person can mark their own lessons complete. They are self-reported, never ranked and never worth XP.
- Quiz and dictation answer keys are in the page payload because scoring runs in the browser too. Anyone can read them. XP is capped, so this is worth a few points a day, not a leaderboard.
- Speaking XP trusts the transcript the browser sends. A person can submit text without speaking. Same caps apply.
- `/api/view` is unauthenticated, so anyone can inflate a word's lookup count. It only changes the order of words that already exist.

**Secrets and validation**

- `SUPABASE_SECRET_KEY` and `ANTHROPIC_API_KEY` are read only in server modules (`server-only`) and never use a `NEXT_PUBLIC_` name.
- Identity on the server comes from `getClaims()`, not from an unverified cookie.
- Every user-supplied string is validated before use: words (`normalizeWord`), AI topics (a character whitelist), quiz answers (type and length), drill totals (integer ranges), redirect targets, email addresses.
- JSON-LD is serialised with `<`, U+2028 and U+2029 escaped, so content cannot close the script tag.
- Response headers: `X-Content-Type-Options: nosniff`, a strict `Referrer-Policy`, and a `Permissions-Policy` that allows the microphone for this origin only and denies camera and geolocation.

**Known gaps to close before a large public launch**

- **No rate limiting.** XP and AI are capped per account, but nothing limits request rates. Put a WAF rule or edge rate limit in front of the site. Without one a script can create many `review_logs` rows through the review action, or walk random `/vocabulary/<word>` URLs. The second case writes cached misses; `prune_dictionary_cache` on a `pg_cron` schedule keeps that table bounded.
- **No Content-Security-Policy.** YouGlish and YouTube need broad script and frame allowances, so a useful policy has to be written and tested against them. A reasonable start is a report-only policy with `frame-src https://www.youtube-nocookie.com https://youglish.com` and `connect-src 'self'` plus the Supabase origin.
- **No monitoring or error reporting** is wired in. `app/error.tsx` and `app/global-error.tsx` show friendly pages but report nothing.
- **Privacy text is a template.** See the README launch checklist.

**Personal data.** Accounts hold an email address, display name, settings, saved words, review history and results. Tutor messages, practice topics and words to translate are sent to Anthropic when a signed-in person uses those features. Speech recognition may send audio to the browser maker's service; the site receives only text. Everything is deleted by `delete_account`.

## 7. Third-party content and terms

| Source | Used for | Obligation |
| --- | --- | --- |
| Wiktionary via dictionaryapi.dev | Definitions, examples, IPA, audio, origins | CC BY-SA 3.0. Every entry links to its source and names the licence (shown in the entry footer). Material derived from it should stay under the same licence. |
| Datamuse | Synonyms and antonyms when Wiktionary has none | Credit in the footer and on the About page. Its documentation announced an API key requirement from 1 February 2027; check the current terms before launch. |
| YouGlish | "Hear it in real videos" widget | Free for non-commercial use; ask for permission for commercial use, or turn it off with `NEXT_PUBLIC_YOUGLISH_ENABLED=false`. The widget is loaded only after a click. |
| YouTube | Curated clip embeds | Embedded through `youtube-nocookie.com` behind a click-to-load facade, under the YouTube Terms of Service. Add only clips you have the right to embed, with attribution recorded in `media_clips`. |
| Anthropic API | Tutor, practice, translations | Billed to your key. Inputs are sent to Anthropic; the privacy page says so. |

## 8. Performance and scaling

- A cached word page does no database or network work. A cold word page costs one Postgres read, and on a miss one upstream request (6 second timeout) and one write.
- Client JavaScript is limited to islands: the search box, speech and review components, forms, the video facade. Fonts load with `display: swap`.
- The sitemap lists the seed words plus up to 45,000 looked-up words, read 1,000 at a time. A single sitemap file may hold 50,000 URLs, so beyond that switch `app/sitemap.ts` to `generateSitemaps()` and split by id ranges.
- The vocabulary index and sitemap order by `lookup_count`. A partial index on `lookup_count` (indexable rows only) serves them, and a partial index on `fetched_at` (misses only) serves the clean-up.
- Server actions are the write path, so connection use scales with active learners, not page views.

## 9. Accessibility and interface decisions

- Corrections are shown as red-pen marks on the learner's own text, and a screen-reader-only sentence describes the same differences (`describeDiff`), so colour is never the only signal.
- Interactive controls are real buttons and links with visible focus; feedback regions use `role="status"` or `aria-live`.
- Dark and light themes follow the system setting, with a toggle that remembers the choice in local storage only.
- Speech features check for browser support and say plainly what is missing (for example Firefox has no recognition).
- Visual language: pen-blue actions, red-pen corrections, highlighter marks and index-card flashcards. It is set in `app/globals.css` with Tailwind v4 theme tokens.

## 10. Testing

| Layer | How | What it covers |
| --- | --- | --- |
| Core logic | `npm test` (Node's built-in runner) | SM-2, text diff, speaking score, drills, quizzes, XP and streaks, word handling, dictionary parsing, JSON-LD, AI response parsing, export, content integrity, and agreement between `XP_AWARDS` and `award_xp`. |
| Database | `npm run test:db` | The migrations applied to a throwaway PostgreSQL. Assertions run as `anon`, `authenticated` and `service_role` and cover row level security, column grants, XP caps, streaks, the AI quota, sign-up, account deletion and cache clean-up, under both Supabase privilege defaults. |
| Types | `npm run typecheck` | The whole codebase. |
| Not covered | | React components, server actions against a live Supabase project, end-to-end browser flows. Add Playwright for sign-in, save-and-review and a dictation round. |

## 11. Not built yet

- Placement test and personalised study plans.
- Leaderboards (the data model deliberately avoids needing trustworthy scores for them).
- More lessons: the curriculum is a starter set of 12 grammar lessons, 6 dictation levels, 6 dialogues and 76 seed words.
- Interface translations and localised URLs with `hreflang`. Translations of definitions are shown on demand and are not indexed.
- Offline use and push reminders.
- Admin tools for approving clips and editing lessons.

# FluentPath

English from A1 to C2 in one place: a dictionary that works for any word, idiom or phrasal verb, grammar lessons with printable cheat sheets, dictation, speaking practice, tense drills, spaced-repetition flashcards and an AI tutor.

Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript and Supabase (Postgres, Auth). No other runtime services are required; the AI features use the Anthropic API when you add a key.

## What is in it

| Area | Routes | How it works |
| --- | --- | --- |
| Dictionary | `/vocabulary`, `/vocabulary/[word]` | Any word or phrase. Definitions by part of speech, IPA and audio, examples, synonyms and antonyms, saved to a shared Postgres cache. Translations into 16 languages written by AI once and cached. Real speech from YouGlish (loaded on click) and curated clips. |
| Grammar | `/grammar`, `/grammar/[topic]`, `/grammar/[topic]/cheatsheet` | 12 starter lessons, two per CEFR level. Rules, examples that can be read aloud, common mistakes, a graded quiz, and a print-ready cheat sheet that saves as PDF from the browser. |
| Dictation | `/dictation`, `/dictation/[level]` | Listen with the browser's speech synthesis, type what you hear, see every error marked in red ink. Tolerates small typos. |
| Speaking | `/speaking`, `/speaking/[slug]` | Six role-play dialogues. You say your lines; the browser's speech recognition scores them. |
| Tense drills | `/drills`, `/drills/[tense]` | Seven tenses. Generated positive, negative and question patterns, drilled until automatic. |
| Flashcards | `/review`, `/deck`, `/deck/export` | SM-2 with Anki-style learning steps. Export to TSV for Anki or a spreadsheet. |
| Practice and tutor | `/practice`, `/tutor` | AI-written exercises and a level-aware tutor. Needs an account and counts against a daily allowance. |
| Accounts | `/login`, `/dashboard`, `/settings` | Google and email sign-in. XP, levels, streaks, history and grammar progress sync across devices. Settings include account deletion. |
| Site | `/`, `/about`, `/privacy`, `sitemap.xml`, `robots.txt` | Home page with a word of the day, data sources, privacy policy template. |

The curriculum is a starter set. The structure is built to grow: adding a lesson is adding one object to a file (see [Adding content](#adding-content)).

## Quick start

You need Node.js 22.18 or newer.

```bash
npm install
cp .env.example .env.local     # then fill in the values, see Configuration
npm run dev                    # http://localhost:3000
```

Without any Supabase variables the public pages still work: dictionary lookups go straight to the upstream source, and grammar, dictation, speaking and drills need no backend. Accounts, saved words, progress and AI need Supabase.

## Set up Supabase

1. Create a project at supabase.com.
2. Create the schema. Either run `supabase link --project-ref <ref>` and `supabase db push`, or paste the two files in `supabase/migrations/` into the SQL editor, in order. Run each once; they are not idempotent.
3. Copy the project URL, the publishable key and the secret key from Project Settings, API Keys into `.env.local`. The secret key is used only on the server.
4. Authentication, URL Configuration: set Site URL to your site (`NEXT_PUBLIC_SITE_URL`) and add redirect URLs `http://localhost:3000/**` and `https://your-domain/**`.
5. Authentication, Providers, Google: enable it. In Google Cloud Console create an OAuth client of type Web application, add `https://<project-ref>.supabase.co/auth/v1/callback` as an authorised redirect URI, then paste the client ID and secret into Supabase.
6. Authentication, Email Templates (recommended): make the links work in any browser by pointing them at `/auth/confirm`.
   - Confirm signup: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard`
   - Reset password: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/settings`
   - Change email address: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/settings`

   With the default templates, sign-in still works through `/auth/callback`, but a link opened in a different browser from the one that asked for it will fail and send the person back to the login page.
7. Schedule the cache cleanup (recommended). Anyone can request `/vocabulary/<anything>`, and unknown words are remembered for a day, so a script walking random URLs would otherwise grow the table. Enable the `pg_cron` extension (Database, Extensions) and run once:

   ```sql
   select cron.schedule('prune-dictionary-cache', '17 3 * * *', $job$ select public.prune_dictionary_cache() $job$);
   ```

The migration grants every table and function explicitly. Supabase stopped granting new `public` tables to the Data API by default in 2026, and nothing here depends on the old behaviour.

## Configuration

| Variable | Needed | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | In production | Canonical URLs, sitemap, OAuth redirects. No trailing slash. |
| `NEXT_PUBLIC_SUPABASE_URL` | For accounts | Project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | For accounts | Public key; row level security protects the data. |
| `SUPABASE_SECRET_KEY` | Recommended | Server only. Writes the shared dictionary cache and counts page views. Without it nothing is kept in Postgres, so every regeneration of a word page asks the upstream dictionary again. |
| `ANTHROPIC_API_KEY` | For AI | Server only. Tutor, practice generator, translations. |
| `ANTHROPIC_MODEL_TUTOR`, `ANTHROPIC_MODEL_FAST` | No | Model names. Defaults are in `.env.example`. |
| `AI_DAILY_LIMIT` | No | AI calls per user per UTC day. Default 30. |
| `NEXT_PUBLIC_YOUGLISH_ENABLED` | No | Set to `false` to hide the YouGlish widget. See the launch checklist. |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | No | Search Console verification token. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | No | Shown on the About and Privacy pages. |

Never put `SUPABASE_SECRET_KEY` or `ANTHROPIC_API_KEY` in a variable that starts with `NEXT_PUBLIC_`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server. |
| `npm run build`, `npm start` | Production build and server. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm test` | Unit tests for the pure logic, using Node's built-in runner (needs Node 22.18+ for TypeScript type stripping). |
| `npm run test:db` | Applies the migration to a throwaway database on a local PostgreSQL 15+ server and runs the SQL assertions twice, with the old and the new Supabase privilege defaults. Needs a superuser connection through the usual `PG*` variables. Never point it at a real project. |
| `npm run gen:types` | Generates `lib/database.types.ts` with the Supabase CLI. Set `SUPABASE_PROJECT_ID` first. |

## Project layout

```
app/              Routes. Public pages are static or ISR; private pages are dynamic.
components/       React components. Files with 'use client' are the interactive islands.
content/          Curriculum data: grammar lessons, dictation, dialogues, seed words.
lib/core/         Pure logic with tests: SM-2, text diff, speaking score, drills, quiz, XP, words.
lib/actions/      Server actions: cards, progress, XP, auth, account, translations.
lib/ai/           Anthropic client, prompts, response parsing, daily quota.
lib/dictionary/   Cache-first dictionary lookup and Datamuse enrichment.
lib/seo/          Site settings, metadata helper, JSON-LD builders, sitemap data.
lib/supabase/     Browser, server, public (cookie-less), admin and proxy clients.
supabase/         migrations/ (schema, cache cleanup) and tests/ (SQL assertions).
proxy.ts          Session refresh and sign-in redirect for private routes.
docs/             ARCHITECTURE.md and SEO.md.
```

## Adding content

- **Grammar lesson:** add a `GrammarTopic` to `content/grammar/a.ts`, `b.ts` or `c.ts` (types in `content/grammar/types.ts`), and remove its title from `PLANNED_TOPICS` in `content/grammar/index.ts`. The page, cheat sheet, quiz, sitemap entry and JSON-LD follow automatically.
- **Dictation line, dialogue, seed word:** edit `content/dictation.ts`, `content/dialogues.ts`, `content/seed-words.ts`. `npm test` checks the content: unique ids and slugs, five dictation lines per level, both roles speaking in every dialogue, and quizzes whose answer key scores 100%.
- **Curated video clip:** insert a row into `media_clips` with `approved = true`, the transcript, the attribution and the licence basis. Pages show only approved rows.
- **Bump `CONTENT_LAST_MODIFIED`** in `lib/seo/sitemap.ts` when lesson text changes, so `lastmod` stays honest.

## Verification status

Checked while building this:

- `npm test`: unit tests for the core logic (scheduling, text comparison, scoring, drills, quizzes, XP, word handling, JSON-LD, export), checks that the curriculum content is consistent, and a check that the XP amounts in TypeScript match the database function. The React components and server actions have no unit tests.
- The whole codebase type-checks against hand-written stand-ins for the Next.js, React and Supabase types.
- `npm run test:db`: the migration applies cleanly on PostgreSQL 16 and its assertions pass under both Supabase privilege defaults. They cover row level security, column grants, XP caps, streaks, the AI quota, account deletion and the sign-up trigger. Breaking the migration on purpose makes them fail.

Not checked, because the build environment had no network access:

- `npm install`, `npm run build` and running the site in a browser. Layout, CSS, hydration, the speech and video integrations, the Google and email sign-in flows and the Anthropic calls have not been run end to end. Expect to fix small things on the first real `npm run typecheck` and `npm run build`.
- Accessibility and Lighthouse audits.

## Deploying

Any host that runs Next.js 16 works; Vercel is the shortest path. Set the environment variables, set `NEXT_PUBLIC_SITE_URL` to the production origin, and add that origin to the Supabase redirect URLs. Word pages are rendered on first request and cached for a day (incremental static regeneration), so the first visit to a new word is slower than the rest.

## Launch checklist

- [ ] Fill in the bracketed operator, hosting and retention details in `app/privacy/page.tsx` and have a lawyer review it for the countries you serve. It describes what this code does; it is a template, not legal advice.
- [ ] **YouGlish:** the free widget is for non-commercial use. If the site earns money, ask YouGlish for permission or set `NEXT_PUBLIC_YOUGLISH_ENABLED=false`.
- [ ] **Datamuse:** its documentation announced that an API key becomes mandatory on 1 February 2027. Check https://www.datamuse.com/api/ and add the key to the two requests in `lib/dictionary/datamuse.ts`. Until then a failure only means fewer related words.
- [ ] Put rate limiting in front of the site (Vercel Firewall, Cloudflare or similar). The app caps XP and AI use per account, but it does not limit how fast a script can call server actions or request unknown words.
- [ ] Set `NEXT_PUBLIC_SITE_URL`, then submit `/sitemap.xml` in Search Console.
- [ ] Run Lighthouse and a keyboard-only pass on the home page, a word page, a lesson and the review screen.
- [ ] Consider a Content-Security-Policy header. None is set yet because YouGlish and YouTube need broad script and frame allowances; see `docs/ARCHITECTURE.md`.

## Data sources and licences

- **Definitions, pronunciations, examples, origins:** Wiktionary through the [Free Dictionary API](https://dictionaryapi.dev), under CC BY-SA 3.0. Each entry links to its source and says so.
- **Synonyms and antonyms:** [Datamuse](https://www.datamuse.com/api/). Attribution is in the footer.
- **Real-speech video:** [YouGlish](https://youglish.com) widget and YouTube embeds, loaded only after a click, under their own terms.
- **Lessons, quizzes, dictation, dialogues, drills:** written for this project.
- **Translations, tutor, practice:** generated by Claude through the Anthropic API.

More detail, including the security model and what a hostile client can and cannot do, is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). The search strategy is in [docs/SEO.md](docs/SEO.md).

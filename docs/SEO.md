# SEO plan

What the site does to be found, what it deliberately does not do, and how to check it after launch. Setup is in the [README](../README.md); the rendering model behind this is in [ARCHITECTURE.md](ARCHITECTURE.md#3-rendering-and-caching).

## 1. Strategy and honest expectations

Two kinds of page carry the search traffic:

- **Dictionary pages** (`/vocabulary/[word]`): one page per word, idiom or phrasal verb, created the first time anyone looks it up. They aim at long-tail queries such as "break the ice meaning" or "give up phrasal verb", where a learner-oriented page with examples, a pronunciation button, opposites and real video can compete.
- **Grammar hubs** (`/grammar/[topic]`, with a printable cheat sheet): evergreen pages organised by CEFR level, plus dictation, speaking and drill pages for people searching for practice material.

The definitions come from Wiktionary, so every other dictionary site can show the same text. The page cannot win on the definition alone. What it adds is the learner layer: highlighted example sentences that can be heard, synonyms and opposites as links, translations on demand, real video, and a one-click save to a flashcard deck. Head terms like "run" or "set" are out of reach; idioms, phrasal verbs and level-specific grammar are the realistic target. Plan for months, not weeks, and judge by impressions and indexed pages first.

The main risk is a pile of near-empty programmatic pages being treated as low-value. The thin-content guard in section 7 is the defence.

## 2. URL design

| URL | Content | Indexable |
| --- | --- | --- |
| `/` | Home, word of the day, module links | yes |
| `/vocabulary` | Dictionary landing, topics, popular words | yes |
| `/vocabulary/break-the-ice` | One entry. Lower-case, hyphen for spaces, percent-encoding where needed | only if the entry passes the quality guard |
| `/grammar`, `/grammar/present-perfect` | Roadmap A1 to C2 and one lesson | yes |
| `/grammar/present-perfect/cheatsheet` | Print-ready summary | yes |
| `/dictation`, `/dictation/b1` | Dictation levels | yes |
| `/speaking`, `/speaking/[slug]` | Dialogues | yes |
| `/drills`, `/drills/[tense]` | Tense drills | yes |
| `/about`, `/privacy` | Data sources, privacy | yes, low priority |
| `/practice` | AI practice generator | no (`noindex`), needs an account to use |
| `/login`, `/dashboard`, `/review`, `/deck`, `/settings`, `/tutor`, `/api/*`, `/auth/*` | Private or functional | no (blocked in `robots.txt`) |

URLs are short, readable, lower-case and stable. A level is always `a1` to `c2`; a topic slug never changes once published.

## 3. Rendering, caching and crawl behaviour

- Everything public is server-rendered HTML. Content is in the first response; no page needs JavaScript to show its text.
- Static or incremental static regeneration keeps responses fast for crawlers. Word pages are generated on first request and cached for 24 hours. Grammar, dictation, speaking and drill pages are built ahead of time, and unknown parameters return 404.
- No public page reads cookies, so the cache is never split by visitor.
- The learner's state (save button, XP, translations) loads after the page. It does not affect what a crawler sees.

## 4. Metadata

Every page gets its tags from one helper (`lib/seo/metadata.ts`), so none forgets a canonical or an Open Graph tag.

| Tag | Rule |
| --- | --- |
| `<title>` | Page title plus the site name from the root template, for example `break the ice: definition, pronunciation and examples \| FluentPath`. |
| `description` | Written per page. For words, `entrySummary` builds one sentence of about 155 characters from the first definition. |
| `canonical` | The page's own clean path. Word pages always use the canonical slug. |
| `robots` | `noindex, follow` for thin dictionary entries and for `/practice`. Everything else is indexable by default. |
| Open Graph, Twitter | Title, description, URL, site name, `en_US`, large-image card. |
| Social image | One default 1200 by 630 card (`app/opengraph-image.tsx`). |
| Page basics | `<html lang="en">`, responsive viewport, light and dark `theme-color`, web app manifest, SVG icon. |
| Verification | `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` adds the Search Console token when set. |

Check on a deployed page that `og:image` is present on pages that set their own Open Graph tags, and add per-page images later if sharing matters.

## 5. Structured data (JSON-LD)

Only what the page actually shows is marked up. Output is escaped so content cannot break out of the script tag.

| Page | Types |
| --- | --- |
| Every page | `WebSite` (name, URL, language) from the root layout |
| Word page | `DefinedTerm` in a `DefinedTermSet` (the site's dictionary), `BreadcrumbList` |
| Grammar lesson | `LearningResource` (lesson, CEFR level, free to access), breadcrumbs |
| Dialogue, dictation level, tense drill | `LearningResource` (dialogue or exercise), breadcrumbs |
| Cheat sheet, index pages, About | `BreadcrumbList` |

What this earns: `BreadcrumbList` can show the path in results. `DefinedTerm` and `LearningResource` are there for clarity to search engines; no special result is promised for them. Not used, on purpose: `FAQPage` and `HowTo` (Google has withdrawn or limited those results), review and rating markup (there are no real reviews), `Course` (there is no enrolment flow), and a `SearchAction` for the sitelinks search box (Google retired that feature). Validate samples with the Rich Results Test and the Schema Markup Validator.

## 6. Sitemap and robots

- `/sitemap.xml` is generated by `app/sitemap.ts` and revalidated hourly. It lists the static pages, every lesson and cheat sheet, dictation levels, dialogues, drills, the seed words, and then the indexable words people have looked up, most popular first, up to 45,000.
- Dictionary URLs carry no `lastmod`, because the data comes from a live source and an invented date is worse than none. Other URLs use `CONTENT_LAST_MODIFIED` in `lib/seo/sitemap.ts`. Update it when lesson text changes; Google uses `lastmod` only when it is reliably accurate.
- `priority` and `changeFrequency` are included for crawlers that read them. Google ignores both.
- A sitemap file may hold 50,000 URLs or 50 MB. Past about 45,000 words, switch to `generateSitemaps()` and split by id range, then list the files in a sitemap index.
- `robots.txt` allows everything except the private and functional paths in section 2 and points to the sitemap. Blocking a URL in `robots.txt` does not remove it from the index. That is fine here, because those pages redirect signed-out visitors to the login page and never carry content. Pages that must be kept out but crawlable, such as thin entries and `/practice`, use `noindex` instead.

## 7. Thin-content policy

An entry is offered to search engines only if `isIndexable` is true: **at least two definitions and at least one example sentence**. Anything thinner still works for learners, but gets `noindex, follow` and stays out of the sitemap. The rule lives in `lib/core/dictionary.ts` and is stored with each cache row, so the sitemap and the page always agree.

Words enter the sitemap by being looked up, so pages exist because someone wanted them. Check the ratio of indexed to submitted URLs in Search Console after launch. If many submitted pages are reported as "crawled, currently not indexed", raise the bar (for example three definitions, or two examples) rather than adding more pages.

Nothing is auto-translated into indexable pages: translations of definitions appear on demand in the browser and are not part of the crawled HTML, so there is no duplicate or machine-translated content to answer for.

## 8. Internal linking

- Breadcrumbs on every content page, matched by `BreadcrumbList` markup.
- Word pages link to synonyms and opposites (each a real dictionary page) and to six more words picked by `exploreWords`. The pick is stable for a given word, so a cached page does not change between rebuilds and crawlers see a steady link graph. The neighbours are spread across the whole seed list, so every word links into a different part of it.
- Grammar lessons link to related lessons and to their cheat sheet; the cheat sheet links back to the lesson and its quiz.
- The home page links to every module and to each CEFR level, and shows a word of the day that changes with the date.
- The footer links to the main modules, to each CEFR level, and to About and Privacy.
- Link text is descriptive ("See the full entry for achieve", "Take the A2 quiz"), not "click here".

## 9. Canonicalisation and status codes

| Situation | Response |
| --- | --- |
| Word found, enough content | 200, indexable, canonical to itself |
| Word found, thin content | 200, `noindex, follow`, not in the sitemap |
| Non-canonical spelling (`Break-The-Ice`, spaces, encodings) | 308 permanent redirect to the canonical slug |
| Word not in the dictionary | 404 with a helpful page and `noindex` |
| Upstream dictionary down and no cached copy | Error page, not cached, `noindex`. The next request retries |
| Unknown grammar topic, level, dialogue or tense | 404 |

## 10. Performance and Core Web Vitals

Targets at the 75th percentile on mobile: LCP 2.5 s or better, INP 200 ms or better, CLS 0.1 or better.

What helps by design:

- Cached HTML and no database or network work on warm requests.
- Few client islands; no UI framework beyond React, and no analytics or ad scripts.
- Fonts use `display: swap`, and are limited to the scripts the site needs (Latin, extended Latin and Cyrillic).
- The video widget and YouTube player are loaded only after a click, so they cost nothing in the page load.
- No images in the content layout, so nothing shifts as it loads; the Open Graph card is generated only for sharing.
- Motion is minimal and switches off under the reduced-motion setting.

Measure on the deployed site with PageSpeed Insights and the Chrome UX Report, then fix what the field data shows. Lab scores from a developer laptop are not a substitute.

## 11. Language and international

The site is English-only: `lang="en"`, `en_US` Open Graph locale, one URL per page. Translations are an on-demand aid for learners, not separate pages. If localised interfaces are added later, give each language its own URL prefix, add `hreflang` annotations in both directions plus `x-default`, and extend the sitemap with the alternates.

## 12. Licensing and attribution that SEO depends on

Search visibility is worth nothing if the content is not allowed to be there.

- **Wiktionary text is CC BY-SA 3.0.** Each entry names the source, links to it and links to the licence. Keep that visible in the entry footer.
- **Datamuse** is credited in the footer and on the About page. Re-check its key requirement before 1 February 2027.
- **YouGlish** is free for non-commercial use only. If the site shows ads or sells anything, get permission or disable it.
- **YouTube clips** are embedded, never copied, and only when you have the right to show them.

## 13. Launch checklist

Before launch

- [ ] `NEXT_PUBLIC_SITE_URL` is the final origin (canonicals, sitemap and Open Graph URLs all depend on it).
- [ ] View source on a word page, a lesson and the home page: one `<h1>`, a title, a description, a canonical, `og:image` and valid JSON-LD.
- [ ] `/robots.txt` and `/sitemap.xml` load on the production domain; the sitemap lists absolute production URLs.
- [ ] A made-up word returns 404; a non-canonical spelling returns a 308 to the canonical slug.
- [ ] A thin entry (look up a rare word) renders with `noindex`.
- [ ] Rich Results Test passes on a lesson and a word page.
- [ ] Mobile Lighthouse run on the home page, a word page and a lesson.
- [ ] Privacy page filled in and reviewed.

Launch week

- [ ] Verify the domain in Search Console and submit `/sitemap.xml`.
- [ ] Inspect a few URLs with the URL Inspection tool and request indexing for the home page, the grammar index and the dictionary index.
- [ ] Put the Datamuse and YouGlish decisions in writing (key, permission or off).

First 90 days

- [ ] Weekly: indexed versus submitted pages, and the reasons Search Console gives for the pages that are not indexed.
- [ ] Monthly: top queries and pages. Write a lesson for every grammar query with impressions and no page; add a curated clip to words that already rank.
- [ ] Review the thin-content threshold against what actually gets indexed.
- [ ] Check Core Web Vitals field data once enough traffic exists.
- [ ] Add edge rate limiting and, if bots hammer unknown words, keep the `prune_dictionary_cache` job running (see the README).

## 14. Measuring success

| Question | Where to look |
| --- | --- |
| Are pages being found? | Search Console: impressions, clicks, average position by page type. |
| Is the quality bar right? | Search Console, Pages: share of submitted URLs that are indexed. |
| Is the site fast for real users? | Core Web Vitals report, Chrome UX Report. |
| Which words do learners want? | `dictionary_cache.lookup_count`, ordered descending. |
| Which lessons convert to accounts? | Sign-ups by landing page, from your analytics of choice. The app ships without analytics; add a privacy-friendly one and update the privacy page. |

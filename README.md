# Good News

**A curated feed of only positive and uplifting news, powered by AI.**

---

## The Problem

Every major news feed is optimised for outrage. Violence, disaster, and political conflict dominate because they get clicks — and the side effect is a population that feels like the world is collapsing. Studies consistently link heavy news consumption to elevated anxiety, helplessness, and a distorted sense of global risk. There is no shortage of good things happening in the world; there is a shortage of products that surface them.

## The Solution

GoodNews is a single-page web app that aggregates articles from multiple news sources, runs each one through an AI classification pipeline, and surfaces only positive or neutral stories in a clean, magazine-quality feed. No login. No ads. No dark patterns.

The user provides their own OpenAI API key (stored only in their browser's `sessionStorage`, never transmitted anywhere except directly to OpenAI). Everything else is handled automatically.

<img width="3840" height="2960" alt="localhost_5173_ (1)" src="https://github.com/user-attachments/assets/80115369-517f-4818-8572-09f7d8a7343a" />

<img width="1440" height="820" alt="Screenshot 2026-03-16 at 7 42 40 PM" src="https://github.com/user-attachments/assets/bdca62d8-8094-4164-9f99-d3ed520e523f" />


---

## Product Overview

### What the app does

- **Pulls articles from three tiers of sources** — curated positive-news publishers (RSS), keyword-filtered results from GNews.io, and section-filtered content from The Guardian API.
- **Classifies each article with AI** — `gpt-4o-mini` rewrites the headline, generates a one-line summary, produces a 3-bullet summary, assigns topic tags, geo-tags the story, and attaches an impact tag (e.g. "Breakthrough", "Kindness", "Hope").
- **Filters out negative content** — articles classified as negative are silently dropped before they ever reach the feed.
- **Caches aggressively** — results are stored in `localStorage` for 7 days and in a shared Supabase table, so repeat visitors (and new users) see articles instantly without burning API quota.
- **Lets users explore by topic** — 12 topic categories with single-select filtering and a dedicated category view with featured article, latest stories, and infinite scroll.
- **Supports geo-filtering** — country-level globally; state, city, and district level for India specifically.
- **Enables social sharing** — one tap generates a 1200×630 canvas image with headline and summary, then shares it via the Web Share API or WhatsApp.

### Key design decisions

| Decision | Reasoning |
|---|---|
| Bring Your Own API Key | Avoids storing user API keys server-side, removes the need for auth, and keeps the app free to run |
| `sessionStorage` for the OpenAI key | Key is wiped when the tab closes — it never persists to disk or leaves the browser except to OpenAI |
| GNews key stored in settings | Moved from `.env` to the settings panel so the app works without any build-time config — users enter it once and it is persisted to `localStorage` |
| Supabase as a shared cache | A single AI result can be reused by all users, dramatically reducing per-user API consumption |
| Tiered source strategy | Tier 1 (RSS from trusted positive publishers) needs no sentiment check; Tier 2/3 needs full AI classification — this halves prompt costs |
| Engagement tracked in localStorage | Like and share counts are stored locally and written to Supabase, powering the "popular" sort without a dedicated analytics backend |
| Single-page, no auth | Lowest possible friction for a casual reader |

---

## How the App Was Built in Cursor

This app was built entirely inside [Cursor](https://cursor.sh) using AI-assisted development, step by step across multiple conversations.

### Step 1 — Problem definition and architecture planning

The session opened with a detailed product brief — problem statement, solution approach, and full feature scope — submitted as a prompt. Cursor's AI was asked to plan the entire codebase before writing a single line of code. The output was a comprehensive plan document covering every layer: project scaffold, TypeScript types, news fetchers, caching strategy, AI pipeline, state management, UI components, and sharing module. Todos were generated from the plan and used to track progress.

### Step 2 — Data and logic layer

With the plan attached, Cursor built the complete non-UI layer:

- **Project scaffold** — Vite + React + TypeScript, Tailwind CSS v4, Zustand, Supabase, OpenAI SDK, font packages.
- **TypeScript types** (`src/lib/types.ts`) — `Article`, `RawArticle`, `CacheEntry`, `FilterState`, `Settings`, and all supporting enums.
- **Constants** (`src/lib/constants.ts`) — RSS feed URLs, topic list, positive-news keywords, API base URLs.
- **News fetchers** (`src/lib/fetchers/`) — three separate modules for RSS (via CORS proxy), GNews API, and Guardian API, merged and deduplicated by `aggregator.ts`.
- **AI pipeline** (`src/lib/ai/`) — `classifyAndSummarize()` calling `gpt-4o-mini` with structured JSON output; separate full and simplified system prompts.
- **Two-layer cache** (`src/lib/cache/`) — `local.ts` for `localStorage` with TTL eviction, `remote.ts` for Supabase batch reads/writes, `manager.ts` orchestrating the local → remote → AI resolution pipeline.
- **Zustand stores** (`src/lib/stores/`) — separate stores for articles, filters (persisted to `localStorage`), and settings (persisted to `sessionStorage`).
- **Share module** (`src/lib/share/`) — canvas-based OG image generator and Web Share API wrapper with WhatsApp fallback.
- **Geo data** (`src/lib/geo/`) — full world country list plus India-specific states, cities, and districts.

### Step 3 — UI components and pages

A separate prompt defined the design direction: *warm, editorial, calm — a quality Sunday magazine, not a breaking news ticker.* DM Sans for UI copy, Lora for article headlines, teal (`#1D9E75`) as the brand accent. Cursor built:

- **ArticleCard** — collapsed and expanded states, sentiment-coded left border, impact tag pill, staggered fade-up animation, Guardian full-text re-fetch on expand.
- **FilterBar** — scrollable topic pills, sort dropdown, geo filter pane.
- **FeedPage** — home view (featured → latest grid → per-category sections) and category view (featured → latest 8 → infinite-scroll "More Stories").
- **SettingsPage** — API key input (always masked), neutral toggle, font size control.
- **Reusable UI primitives** — `Button`, `Badge`, `Input`, `Skeleton`.

Runtime errors that emerged from the first build were debugged and fixed in the same session.

### Step 4 — Wiring, settings reactivity, and quality pass

With components in place, Cursor connected everything:

- **React Router** — two routes: `/` (Feed) and `/settings` (Settings).
- **Settings reactivity** — font size and neutral-news toggle changes apply instantly via a custom browser event (`gn:settings-change`) without any re-render of the whole tree. A `settings-bridge` module subscribes to the event and writes the CSS custom property (`--gn-font-size`) directly to `document.documentElement`.
- **Security audit** — confirmed the API key never appears in logs, error messages, or `localStorage`; all key references scrubbed from console output.
- **Cache integrity** — URL normalisation strips tracking parameters before SHA-256 hashing; Supabase writes are fire-and-forget (failures never block the reader).
- **Accessibility pass** — ARIA labels on all interactive elements, keyboard navigation, screen-reader-friendly card expansion.

### Step 5 — User feedback and feature refinements

After real usage, a batch of product-level fixes was submitted:

- **Cold-start UX** — new users now see up to 50 cached articles from Supabase immediately, before any AI calls, ensuring the feed is never blank on first load.
- **Loading states** — filter and category changes now show skeleton placeholders instantly instead of silently waiting.
- **Single-select categories** — topic pills changed from multi-select to single-select to keep the feed focused.
- **Location filter simplification** — date range removed; India sub-region filters (state → city) now appear conditionally only when India is selected.
- **Explicit save actions** — API key and filter preferences now have visible "Save" buttons with confirmation feedback.
- **Home page restructure** — enforced the featured → latest grid → per-category sections layout with minimum article counts per section.
- **Infinite scroll** — category view "More Stories" loads 10 at a time via `IntersectionObserver`.
- **Module resolution fix** — corrected a broken import path in `cache/manager.ts` after a file rename.

### Step 6 — Debugging the news pipeline

A tricky runtime bug: the app silently showed no articles after the API key was entered. Cursor inspected terminal output, traced the error through the fetcher stack, and identified two root causes:

1. The GNews API key environment variable was being read before Vite had injected `import.meta.env`, so the key read as `undefined`.
2. The RSS CORS proxy route was missing in the Vite dev server plugin configuration, causing `fetch` to fail with a network error.

Both were fixed, and temporary diagnostic logging was cleaned up afterwards.

### Step 7 — Design overhaul

A reference design image (a clean editorial news platform called "Buletin") was attached and Cursor was asked to match it exactly. Changes:

- **Dark mode removed** — light-only theme for a more editorial, print-inspired feel.
- **New brand color** — `#DC2626` (red) replaced the original teal accent, aligned with the reference design.
- **Welcome banner** — added above the feed, introducing the app to first-time visitors.
- **Header and footer** — sticky header with app name, navigation links, and settings access; footer with source attribution links.
- **Single-page layout** — settings moved to a slide-over panel rather than a separate route, keeping the reader in context.
- **App icon** — updated `favicon.svg` to match the reference icon style.

### Step 8 — Engagement, article dialog, and API key management

A batch of product features driven by real usage feedback:

- **Default thumbnail** — created `DefaultThumbnail.tsx`, a branded SVG placeholder with topic-specific icons that renders whenever an article has no image or the image fails to load. Cards always have a consistent visual shape.
- **Article dialog** — clicking any card now opens `ArticleDialog.tsx`, a modal showing the full AI-generated summary, impact tag, source link, and share/like actions. The card itself no longer needs to expand in place.
- **Engagement tracking** — a new `engagement.ts` Zustand store records likes and shares per article in `localStorage` and writes counts to Supabase. The "popular" sort in `articles.ts` now ranks articles by combined like + share count rather than arbitrary recency.
- **Cross-page deduplication** — the home page `homeSections` computation now tracks a `usedInSections` set; multi-topic articles can only appear in one section, preventing the same story from showing up twice in a single scroll.
- **GNews API key moved to settings** — the key was removed from `.env` and added to the settings panel alongside the OpenAI key, persisted to `localStorage`. This means the app works with zero `.env` configuration.
- **Filter persistence** — saving filter preferences dispatches a `goodnews:filters-saved` custom browser event; `FeedPage` listens for this and triggers a re-fetch, making saved preferences apply immediately across all views.

### Step 9 — Location filter correctness

After real testing, location filtering was found to be broken in three distinct ways. Cursor traced the bug through the full filter stack:

- **`filterByCountry` was too permissive** — the condition `!a.geoCountry || ...` allowed every article with a null `geoCountry` to pass through any country filter, flooding the feed with untagged global content.
- **India sub-region filters were never applied** — `applyFilters` called `filterByCountry` but silently ignored `indiaState`, `indiaCity`, and `indiaDistrict` even when they were set.
- **No fallback for empty location results** — if the cache had no articles matching the selected location, the feed showed nothing without explanation.

All three were fixed: `filterByCountry` was replaced by a stricter `filterByGeo` function that enforces country and India sub-region matching; `applyFilters`, `loadCachedArticles`, and `fetchArticles` were all updated to use it. The empty state now shows a location-aware message with a friendly gif and a button to fetch fresh articles when the cache has nothing for the selected location.

---

## Technical Architecture

```
Browser
│
├── src/App.tsx                   Root — mounts Header, FeedPage, SettingsPage (slide-over), Footer
│
├── src/components/
│   ├── FeedPage.tsx              Home view / Category view, orchestrates article store
│   ├── ArticleCard.tsx           Card UI, thumbnail fallback, opens dialog on click
│   ├── ArticleDialog.tsx         Modal: full summary, impact tag, source link, like/share
│   ├── DefaultThumbnail.tsx      Branded SVG placeholder for articles with no image
│   ├── FilterBar.tsx             Topic pills, sort, geo filter
│   ├── SettingsPage.tsx          OpenAI + GNews API keys, neutral toggle, font size
│   ├── WelcomeScreen.tsx         First-visit banner + API key prompt
│   └── EmptyStates.tsx           No results / error / location-aware empty states
│   └── ui/
│       ├── Dialog.tsx            Base modal primitive used by ArticleDialog
│
├── src/lib/
│   ├── fetchers/
│   │   ├── rss.ts                Fetches & parses RSS XML via CORS proxy
│   │   ├── gnews.ts              GNews.io keyword search
│   │   ├── guardian.ts           Guardian section fetch + full-text expand
│   │   └── aggregator.ts         Merges all tiers, dedupes by URL, sorts by date
│   │
│   ├── ai/
│   │   ├── openai.ts             classifyAndSummarize() → structured JSON via gpt-4o-mini
│   │   └── prompts.ts            FULL_SYSTEM_PROMPT (classify + rewrite) / SIMPLIFIED_SYSTEM_PROMPT (rewrite only)
│   │
│   ├── cache/
│   │   ├── local.ts              localStorage, gn: prefix, 7-day TTL, eviction on load
│   │   ├── remote.ts             Supabase articles table, batch read, fire-and-forget write
│   │   └── manager.ts            resolveArticles(): local → remote → AI waterfall
│   │
│   ├── stores/
│   │   ├── articles.ts           Zustand: fetch, filter, sort — single source of truth for feed
│   │   ├── engagement.ts         Zustand persist (localStorage): like/share counts per article → powers popular sort
│   │   ├── filters.ts            Zustand persist (localStorage): topics, sort, country, India geo
│   │   └── settings.ts           Zustand persist (sessionStorage/localStorage): OpenAI + GNews keys, font size
│   │
│   ├── geo/
│   │   ├── countries.ts          ISO country list
│   │   └── india.ts              States, cities, districts
│   │
│   └── share/
│       ├── card.ts               Canvas 1200×630 OG image generator
│       └── share.ts              Web Share API → WhatsApp fallback
```

### Data flow

```
fetchAllArticles(gnewsApiKey)
  ├── fetchRssFeed()        → Tier 1 (The Better India, Positive News, Good News Network)
  ├── fetchGNews()          → Tier 2 (keyword-filtered via GNews.io)
  └── fetchGuardian()       → Tier 3 (section-filtered via Guardian API)
        ↓
    deduplicate by URL
        ↓
    resolveArticles()
      ├── 1. Check localStorage cache (hit → return immediately)
      ├── 2. Batch query Supabase   (hit → return + backfill localStorage)
      └── 3. Call OpenAI            (miss → classify → write both caches)
              ↓
          Filter: sentiment === 'negative' → drop
          Filter: filterByGeo() → enforce country + India sub-region
              ↓
          Zustand articles store → React components
              ↓
          Sort: latest / popular (by engagement score) / relevant
              ↓
          FeedPage: cross-section deduplication (usedInSections set)
              ↓
          ArticleCard → click → ArticleDialog
                                  ├── like   → engagement.ts → Supabase
                                  └── share  → Web Share API → WhatsApp
```

---

## Key Trade-offs

### Browser-side OpenAI calls
**Pro:** No backend needed, no API key storage risk, zero server costs.  
**Con:** The API key is visible in browser DevTools network requests. This is an intentional product decision — the app is a personal tool; users are calling OpenAI on their own account, the same way they would in a notebook or script.

### Supabase as a public shared cache
**Pro:** Every AI result is cached globally. A new user in Mumbai benefits from classifications done by a user in London an hour ago. Cold-start latency drops from ~30s to ~2s once the cache is warm.  
**Con:** The Supabase `anon` key is public. The table is append-only (articles are never updated), so the worst-case abuse is someone inserting garbage rows. Row-level security policies prevent reads of other users' data if auth is ever added.

### Tiered source strategy
Tier 1 RSS feeds are from publishers that *only* publish positive news (The Better India, Positive News, Good News Network). These are passed through a **simplified prompt** that rewrites the headline and generates summaries, but skips sentiment classification — the source itself is the quality signal. Tiers 2 and 3 use the **full prompt** that actually classifies sentiment and can return `negative`, causing the article to be dropped. This roughly halves AI token consumption for the majority of the feed.

### `sessionStorage` for the API key
The key is wiped when the browser tab closes. This means users need to re-enter it on every fresh session. This was chosen over `localStorage` as a deliberate privacy default — the key is never written to disk in a way that persists beyond the session.

### No backend / no auth
The app has zero server-side logic. This makes it trivially deployable (static hosting on Vercel, Netlify, or GitHub Pages), but it means there is no rate-limiting, no user accounts, and no server-side personalisation. These are acceptable trade-offs for the current scope.

### CORS proxy strategy
In development, a Vite plugin intercepts `/api/rss-proxy?url=...` requests and forwards them server-side, bypassing CORS. In production, the app falls back to `allorigins.win`, a public CORS proxy. This is a known fragility point — `allorigins.win` is a third-party service with no SLA. A production hardening step would be to deploy a lightweight proxy on the same domain.

### Engagement tracking without a backend
Like and share counts are stored in `localStorage` and written to the Supabase `articles` table as metadata alongside the cached AI result. This means popularity signals are best-effort — a user who clears their browser storage loses their engagement history, and Supabase writes can fail silently. For a personal reading tool this is acceptable; for a public product it would need a dedicated events table with server-side aggregation.

### Location filtering by AI-generated geo tags
Geo-filtering relies entirely on `geoCountry` and `geoRegion` fields that `gpt-4o-mini` attaches during classification. Articles that were classified before geo-tagging was part of the prompt have `null` values and are excluded when a location filter is active. This means very old cache entries may disappear from filtered views — a deliberate trade-off that avoids showing irrelevant content, at the cost of apparent result count.

---

## Getting Started

### Prerequisites
- Node.js 18+
- An OpenAI account with API access
- (Optional) A Supabase project for shared caching

### Environment variables

Copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=        # Supabase project URL (optional)
VITE_SUPABASE_ANON_KEY=   # Supabase anon key (optional)
```

The **OpenAI API key** and **GNews API key** are not environment variables — enter them in the app's Settings panel. They are stored in your browser's `sessionStorage` / `localStorage` respectively and never sent anywhere except their own APIs.

### Supabase schema

If using Supabase, run the following in the SQL editor:

```sql
create table articles (
  id          text primary key,
  url         text not null,
  cached_at   timestamptz default now(),
  data        jsonb not null
);
create index on articles (cached_at);
```

### Run locally

```bash
npm install
npm run dev
```

### Build for production

```bash
npm run build
```

The output in `dist/` is a fully static site — deploy to any static host.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS v4 |
| State management | Zustand 5 (with `persist` middleware) |
| AI | OpenAI SDK — `gpt-4o-mini` |
| Remote cache | Supabase (optional) |
| Icons | Lucide React |
| Fonts | DM Sans (UI) + Lora (headlines) via `@fontsource` |

---

## News Sources

| Tier | Source | Method |
|---|---|---|
| 1 | The Better India | RSS |
| 1 | Positive News | RSS |
| 1 | Good News Network | RSS |
| 2 | GNews.io | REST API (keyword-filtered) |
| 3 | The Guardian | REST API (section-filtered) |

---

*Built entirely in [Cursor](https://cursor.sh) using AI-assisted development.*

# GoodNews

**A curated feed of only positive and uplifting news, powered by AI.**

---

## The Problem

Every major news feed is optimised for outrage. Violence, disaster, and political conflict dominate because they get clicks — and the side effect is a population that feels like the world is collapsing. Studies consistently link heavy news consumption to elevated anxiety, helplessness, and a distorted sense of global risk. There is no shortage of good things happening in the world; there is a shortage of products that surface them.

## The Solution

GoodNews is a single-page web app that aggregates articles from multiple news sources, runs each one through an AI classification pipeline, and surfaces only positive or neutral stories in a clean, magazine-quality feed. No login. No ads. No dark patterns.

The user provides their own OpenAI API key (stored only in their browser's `sessionStorage`, never transmitted anywhere except directly to OpenAI). Everything else is handled automatically.

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
| `sessionStorage` for the API key | Key is wiped when the tab closes — it never persists to disk or leaves the browser except to OpenAI |
| Supabase as a shared cache | A single AI result can be reused by all users, dramatically reducing per-user API consumption |
| Tiered source strategy | Tier 1 (RSS from trusted positive publishers) needs no sentiment check; Tier 2/3 needs full AI classification — this halves prompt costs |
| Single-page, no auth | Lowest possible friction for a casual reader |

---

## How the App Was Built in Cursor

This app was built entirely inside [Cursor](https://cursor.sh) using AI-assisted development, step by step across multiple conversations.

### Step 1 — Problem definition and architecture planning
*Chat: [Initial concept and full feature spec](938f6a6d-252d-4b7e-ab86-1c44a4ff14c5)*

The session opened with a detailed product brief — problem statement, solution approach, and full feature scope — submitted as a prompt. Cursor's AI was asked to plan the entire codebase before writing a single line of code. The output was a comprehensive plan document covering every layer: project scaffold, TypeScript types, news fetchers, caching strategy, AI pipeline, state management, UI components, and sharing module. Todos were generated from the plan and used to track progress.

### Step 2 — Data and logic layer
*Chat: [Initial concept and full feature spec](938f6a6d-252d-4b7e-ab86-1c44a4ff14c5)*

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
*Chat: [Build all UI components and pages](94bbe5c8-8e41-44f9-96e4-9f970745985c)*

A separate prompt defined the design direction: *warm, editorial, calm — a quality Sunday magazine, not a breaking news ticker.* DM Sans for UI copy, Lora for article headlines, teal (`#1D9E75`) as the brand accent. Cursor built:

- **ArticleCard** — collapsed and expanded states, sentiment-coded left border, impact tag pill, staggered fade-up animation, Guardian full-text re-fetch on expand.
- **FilterBar** — scrollable topic pills, sort dropdown, geo filter pane.
- **FeedPage** — home view (featured → latest grid → per-category sections) and category view (featured → latest 8 → infinite-scroll "More Stories").
- **SettingsPage** — API key input (always masked), neutral toggle, font size control.
- **Reusable UI primitives** — `Button`, `Badge`, `Input`, `Skeleton`.

Runtime errors that emerged from the first build were debugged and fixed in the same session.

### Step 4 — Wiring, settings reactivity, and quality pass
*Chat: [Wire up routing, settings reactivity, full quality pass](c9956705-4f46-46b4-b41a-645f62562831)*

With components in place, Cursor connected everything:

- **React Router** — two routes: `/` (Feed) and `/settings` (Settings).
- **Settings reactivity** — font size and neutral-news toggle changes apply instantly via a custom browser event (`gn:settings-change`) without any re-render of the whole tree. A `settings-bridge` module subscribes to the event and writes the CSS custom property (`--gn-font-size`) directly to `document.documentElement`.
- **Security audit** — confirmed the API key never appears in logs, error messages, or `localStorage`; all key references scrubbed from console output.
- **Cache integrity** — URL normalisation strips tracking parameters before SHA-256 hashing; Supabase writes are fire-and-forget (failures never block the reader).
- **Accessibility pass** — ARIA labels on all interactive elements, keyboard navigation, screen-reader-friendly card expansion.

### Step 5 — User feedback and feature refinements
*Chat: [User-reported fixes and feature improvements](abd504c2-6653-49a9-9219-1c810d3ccb0a)*

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
*Chat: [Debug: app not fetching news after API key set](e44095b5-6430-465f-a1ff-75fbe599032a)*

A tricky runtime bug: the app silently showed no articles after the API key was entered. Cursor inspected terminal output, traced the error through the fetcher stack, and identified two root causes:

1. The GNews API key environment variable was being read before Vite had injected `import.meta.env`, so the key read as `undefined`.
2. The RSS CORS proxy route was missing in the Vite dev server plugin configuration, causing `fetch` to fail with a network error.

Both were fixed, and temporary diagnostic logging was cleaned up afterwards.

### Step 7 — Design overhaul
*Chat: [Redesign to match Buletin-style design system](f99deab7-35d0-411f-ac2b-9bbc00595ae7)*

A reference design image (a clean editorial news platform called "Buletin") was attached and Cursor was asked to match it exactly. Changes:

- **Dark mode removed** — light-only theme for a more editorial, print-inspired feel.
- **New brand color** — `#DC2626` (red) replaced the original teal accent, aligned with the reference design.
- **Welcome banner** — added above the feed, introducing the app to first-time visitors.
- **Header and footer** — sticky header with app name, navigation links, and settings access; footer with source attribution links.
- **Single-page layout** — settings moved to a slide-over panel rather than a separate route, keeping the reader in context.
- **App icon** — updated `favicon.svg` to match the reference icon style.

---

## Technical Architecture

```
Browser
│
├── src/App.tsx                   Root — mounts Header, FeedPage, SettingsPage (slide-over), Footer
│
├── src/components/
│   ├── FeedPage.tsx              Home view / Category view, orchestrates article store
│   ├── ArticleCard.tsx           Card UI, handles expand/collapse, share, Guardian re-fetch
│   ├── FilterBar.tsx             Topic pills, sort, geo filter
│   ├── SettingsPage.tsx          API key, neutral toggle, font size (slide-over panel)
│   ├── WelcomeScreen.tsx         First-visit banner + API key prompt
│   └── EmptyStates.tsx           No results / error / cap reached states
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
│   │   ├── articles.ts           Zustand: fetch, filter, sort, expand — single source of truth for feed
│   │   ├── filters.ts            Zustand persist (localStorage): topics, sort, country, India geo
│   │   └── settings.ts           Zustand persist (sessionStorage): API key, daily cap counter, font size
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
fetchAllArticles()
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
              ↓
          Zustand articles store → React components
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

---

## Getting Started

### Prerequisites
- Node.js 18+
- An OpenAI account with API access
- (Optional) A Supabase project for shared caching

### Environment variables

Copy `.env.example` to `.env` and fill in:

```
VITE_GNEWS_API_KEY=       # GNews.io API key (free tier available)
VITE_SUPABASE_URL=        # Supabase project URL (optional)
VITE_SUPABASE_ANON_KEY=   # Supabase anon key (optional)
```

The OpenAI API key is **not** an environment variable. Enter it in the app's Settings panel — it is stored only in your browser's `sessionStorage`.

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

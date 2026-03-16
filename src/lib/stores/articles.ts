import { create } from 'zustand';
import { resolveArticles } from '../cache/manager';
import { fetchCachedArticles } from '../cache/remote';
import { fetchAllArticles } from '../fetchers/aggregator';
import { fetchGuardianFullText, fetchViaProxy } from '../fetchers/guardian';
import { classifyAndSummarize } from '../ai/openai';
import { TIER1_SOURCES } from '../constants';
import type { Filters, ProcessedArticle, SortOrder, Topic } from '../types';

function sortArticles(
  articles: ProcessedArticle[],
  sortOrder: SortOrder,
  topicFilter: string[],
): ProcessedArticle[] {
  const sorted = [...articles];
  switch (sortOrder) {
    case 'latest':
      sorted.sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() -
          new Date(a.publishedAt).getTime(),
      );
      break;
    case 'popular':
      sorted.sort((a, b) => {
        const aScore = a.impactTag ? 1 : 0;
        const bScore = b.impactTag ? 1 : 0;
        return bScore - aScore;
      });
      break;
    case 'relevant':
      if (topicFilter.length > 0) {
        sorted.sort((a, b) => {
          const aMatch = a.topics.filter((t) => topicFilter.includes(t)).length;
          const bMatch = b.topics.filter((t) => topicFilter.includes(t)).length;
          return bMatch - aMatch;
        });
      }
      break;
  }
  return sorted;
}

function filterByCountry(
  articles: ProcessedArticle[],
  country: string | null,
): ProcessedArticle[] {
  if (!country) return articles;
  return articles.filter(
    (a) =>
      !a.geoCountry ||
      a.geoCountry.toLowerCase().includes(country.toLowerCase()),
  );
}

function filterByTopics(
  articles: ProcessedArticle[],
  topics: Topic[],
): ProcessedArticle[] {
  if (topics.length === 0) return articles;
  return articles.filter((a) =>
    a.topics.some((t) => topics.includes(t)),
  );
}

function dedupeArticles(articles: ProcessedArticle[]): ProcessedArticle[] {
  const seen = new Set<string>();
  return articles.filter((a) => {
    if (seen.has(a.urlHash)) return false;
    seen.add(a.urlHash);
    return true;
  });
}

interface ArticlesState {
  articles: ProcessedArticle[];
  allArticles: ProcessedArticle[];
  isLoading: boolean;
  isFilterLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  cachedArticlesLoaded: boolean;

  fetchArticles: (
    filters: Filters,
    apiKey: string,
    allowNeutral: boolean,
    dailyUsage: number,
    dailyCap: number,
    onUsageIncrement: () => void,
  ) => Promise<void>;

  loadCachedArticles: (filters: Filters) => Promise<boolean>;

  applyFilters: (filters: Filters) => void;

  expandArticle: (
    article: ProcessedArticle,
    apiKey: string,
  ) => Promise<ProcessedArticle>;
}

export const useArticlesStore = create<ArticlesState>()((set, get) => ({
  articles: [],
  allArticles: [],
  isLoading: false,
  isFilterLoading: false,
  error: null,
  lastFetchedAt: null,
  cachedArticlesLoaded: false,

  loadCachedArticles: async (filters) => {
    try {
      const cached = await fetchCachedArticles(100);
      if (cached.length >= 10) {
        const positive = cached.filter(
          (a) => a.sentiment === 'positive' || a.sentiment === 'neutral',
        );
        const filtered = filterByCountry(
          filterByTopics(positive, filters.topics),
          filters.country,
        );
        const sorted = sortArticles(filtered, filters.sortOrder, filters.topics);
        set({
          articles: sorted,
          allArticles: positive,
          cachedArticlesLoaded: true,
          lastFetchedAt: Date.now(),
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  applyFilters: (filters) => {
    const { allArticles } = get();
    if (allArticles.length === 0) return;

    set({ isFilterLoading: true });

    const filtered = filterByCountry(
      filterByTopics(allArticles, filters.topics),
      filters.country,
    );
    const sorted = sortArticles(filtered, filters.sortOrder, filters.topics);

    set({
      articles: sorted,
      isFilterLoading: false,
    });
  },

  fetchArticles: async (
    filters,
    apiKey,
    allowNeutral,
    dailyUsage,
    dailyCap,
    onUsageIncrement,
  ) => {
    set({ isLoading: true, error: null });

    let usageCounter = dailyUsage;
    const trackIncrement = () => {
      usageCounter++;
      onUsageIncrement();
    };

    try {
      const rawArticles = await fetchAllArticles(filters);

      const tier1Raw = rawArticles.filter((a) => TIER1_SOURCES.has(a.source));
      const tier2Raw = rawArticles.filter((a) => !TIER1_SOURCES.has(a.source));

      const tier1Processed = await resolveArticles(tier1Raw, {
        apiKey,
        allowNeutral,
        dailyUsage: usageCounter,
        dailyCap,
        onUsageIncrement: trackIncrement,
      });

      if (tier1Processed.length > 0) {
        const { allArticles: existing } = get();
        const merged = dedupeArticles([...tier1Processed, ...existing]);
        const filtered = filterByCountry(
          filterByTopics(merged, filters.topics),
          filters.country,
        );
        const sorted = sortArticles(filtered, filters.sortOrder, filters.topics);
        set({ articles: sorted, allArticles: merged });
      }

      const tier2Processed = await resolveArticles(tier2Raw, {
        apiKey,
        allowNeutral,
        dailyUsage: usageCounter,
        dailyCap,
        onUsageIncrement: trackIncrement,
      });

      const { allArticles: currentAll } = get();
      const all = dedupeArticles([...tier1Processed, ...tier2Processed, ...currentAll]);
      const filtered = filterByCountry(
        filterByTopics(all, filters.topics),
        filters.country,
      );
      const sorted = sortArticles(filtered, filters.sortOrder, filters.topics);

      set({
        articles: sorted,
        allArticles: all,
        isLoading: false,
        lastFetchedAt: Date.now(),
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Something went wrong while loading articles.';

      const safeMessage = message.includes('sk-')
        ? 'An error occurred. Please check your settings and try again.'
        : message;

      set({
        error: safeMessage,
        isLoading: false,
      });
    }
  },

  expandArticle: async (article, apiKey) => {
    let fullText: string;

    try {
      if (article.source === 'guardian') {
        fullText = await fetchGuardianFullText(article.url);
      } else {
        fullText = await fetchViaProxy(article.url);
      }
    } catch {
      return article;
    }

    if (!fullText || !apiKey) return article;

    const enriched = { ...article, fullText };
    const isTier1 = article.source.startsWith('rss-');

    try {
      const reclassified = await classifyAndSummarize(enriched, apiKey, isTier1);
      reclassified.urlHash = article.urlHash;

      const { articles } = get();
      set({
        articles: articles.map((a) =>
          a.urlHash === article.urlHash ? reclassified : a,
        ),
      });

      return reclassified;
    } catch {
      return article;
    }
  },
}));

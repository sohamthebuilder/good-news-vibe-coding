import { create } from 'zustand';
import { resolveArticles } from '../cache/manager';
import { fetchCachedArticles } from '../cache/remote';
import { fetchAllArticles } from '../fetchers/aggregator';
import { fetchGuardianFullText, fetchViaProxy } from '../fetchers/guardian';
import { classifyAndSummarize } from '../ai/openai';
import { TIER1_SOURCES } from '../constants';
import { useEngagementStore } from './engagement';
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
    case 'popular': {
      const engagements = useEngagementStore.getState().engagements;
      sorted.sort((a, b) => {
        const aEng = engagements[a.urlHash];
        const bEng = engagements[b.urlHash];
        const aScore = (aEng ? aEng.likes + aEng.shares : 0) + (a.impactTag ? 1 : 0);
        const bScore = (bEng ? bEng.likes + bEng.shares : 0) + (b.impactTag ? 1 : 0);
        return bScore - aScore;
      });
      break;
    }
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
  const lc = country.toLowerCase();
  return articles.filter(
    (a) => a.geoCountry && a.geoCountry.toLowerCase().includes(lc),
  );
}

function filterByGeo(
  articles: ProcessedArticle[],
  filters: Pick<Filters, 'country' | 'indiaState' | 'indiaCity' | 'indiaDistrict'>,
): ProcessedArticle[] {
  let result = filterByCountry(articles, filters.country);

  const regionTerms: string[] = [];
  if (filters.indiaState) regionTerms.push(filters.indiaState.toLowerCase());
  if (filters.indiaDistrict) regionTerms.push(filters.indiaDistrict.toLowerCase());
  if (filters.indiaCity) regionTerms.push(filters.indiaCity.toLowerCase());

  if (regionTerms.length > 0) {
    result = result.filter((a) => {
      if (!a.geoRegion) return false;
      const region = a.geoRegion.toLowerCase();
      return regionTerms.some((term) => region.includes(term));
    });
  }

  return result;
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
    gnewsApiKey?: string,
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
        const filtered = filterByGeo(
          filterByTopics(positive, filters.topics),
          filters,
        );
        const sorted = sortArticles(filtered, filters.sortOrder, filters.topics);
        set({
          articles: sorted,
          allArticles: positive,
          cachedArticlesLoaded: true,
          lastFetchedAt: Date.now(),
        });
        return filtered.length > 0;
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

    const filtered = filterByGeo(
      filterByTopics(allArticles, filters.topics),
      filters,
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
    gnewsApiKey,
  ) => {
    set({ isLoading: true, error: null });

    let usageCounter = dailyUsage;
    const trackIncrement = () => {
      usageCounter++;
      onUsageIncrement();
    };

    try {
      const rawArticles = await fetchAllArticles(filters, gnewsApiKey);

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
        const filtered = filterByGeo(
          filterByTopics(merged, filters.topics),
          filters,
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
      const filtered = filterByGeo(
        filterByTopics(all, filters.topics),
        filters,
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

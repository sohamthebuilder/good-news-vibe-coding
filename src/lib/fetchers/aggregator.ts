import { RSS_FEEDS } from '../constants';
import type { Filters, RawArticle } from '../types';
import { normalizeUrl } from '../url';
import { fetchGNews } from './gnews';
import { fetchGuardianSearch } from './guardian';
import { fetchRssFeed } from './rss';

const SOURCE_PRIORITY: Record<string, number> = {
  'rss-tbi': 0,
  'rss-positive-news': 0,
  'rss-gnn': 0,
  'gnews': 1,
  'guardian': 2,
};

export async function fetchAllArticles(
  filters: Filters,
): Promise<RawArticle[]> {
  const rssPromises = RSS_FEEDS.map((feed) => fetchRssFeed(feed));

  const results = await Promise.allSettled([
    ...rssPromises,
    fetchGNews(filters),
    fetchGuardianSearch(filters),
  ]);

  const allArticles: RawArticle[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
    }
  }

  const seen = new Map<string, RawArticle>();
  for (const article of allArticles) {
    const normalized = normalizeUrl(article.url);
    const existing = seen.get(normalized);
    if (
      !existing ||
      (SOURCE_PRIORITY[article.source] ?? 99) < (SOURCE_PRIORITY[existing.source] ?? 99)
    ) {
      seen.set(normalized, article);
    }
  }

  return Array.from(seen.values()).sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

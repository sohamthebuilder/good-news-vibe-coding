import { GNEWS_BASE, GNEWS_POSITIVE_KEYWORDS, TOPIC_KEYWORDS } from '../constants';
import type { Filters, RawArticle, Topic } from '../types';

interface GNewsArticle {
  title: string;
  description: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string; url: string };
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

function buildQuery(filters: Filters): string {
  const parts: string[] = [GNEWS_POSITIVE_KEYWORDS];

  if (filters.topics.length > 0) {
    const topicTerms = filters.topics
      .map((t: Topic) => TOPIC_KEYWORDS[t])
      .filter(Boolean);
    if (topicTerms.length > 0) {
      parts.push(`(${topicTerms.join(' OR ')})`);
    }
  }

  return parts.join(' AND ');
}

export async function fetchGNews(filters: Filters, gnewsApiKey?: string): Promise<RawArticle[]> {
  const apiKey = gnewsApiKey || import.meta.env.VITE_GNEWS_API_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    q: buildQuery(filters),
    lang: 'en',
    max: '10',
    apikey: apiKey,
  });

  if (filters.country) {
    params.set('country', filters.country.toLowerCase());
  }

  if (filters.dateRange.from) {
    params.set('from', filters.dateRange.from);
  }
  if (filters.dateRange.to) {
    params.set('to', filters.dateRange.to);
  }

  let response: Response;
  try {
    response = await fetch(`${GNEWS_BASE}?${params}`);
  } catch {
    return [];
  }

  if (!response.ok) return [];

  let data: GNewsResponse;
  try {
    data = await response.json();
  } catch {
    return [];
  }

  return (data.articles ?? []).map((a) => ({
    title: a.title,
    description: a.description ?? '',
    url: a.url,
    imageUrl: a.image ?? null,
    publishedAt: a.publishedAt,
    source: 'gnews' as const,
    sourceName: a.source.name,
  }));
}

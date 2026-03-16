import {
  CORS_PROXY,
  GNEWS_POSITIVE_KEYWORDS,
  GUARDIAN_BASE,
  TOPIC_TO_GUARDIAN_SECTION,
} from '../constants';
import type { Filters, RawArticle } from '../types';

interface GuardianResult {
  id: string;
  webTitle: string;
  webUrl: string;
  webPublicationDate: string;
  sectionId: string;
  fields?: {
    thumbnail?: string;
    trailText?: string;
    bodyText?: string;
  };
}

interface GuardianResponse {
  response: {
    status: string;
    results: GuardianResult[];
  };
}

export async function fetchGuardianSearch(
  filters: Filters,
): Promise<RawArticle[]> {
  const params = new URLSearchParams({
    q: GNEWS_POSITIVE_KEYWORDS,
    'api-key': 'test',
    'show-fields': 'thumbnail,trailText',
    'page-size': '10',
  });

  if (filters.topics.length > 0) {
    const sections = filters.topics
      .map((t) => TOPIC_TO_GUARDIAN_SECTION[t])
      .filter(Boolean);
    if (sections.length > 0) {
      params.set('section', sections.join('|'));
    }
  }

  if (filters.dateRange.from) {
    params.set('from-date', filters.dateRange.from);
  }
  if (filters.dateRange.to) {
    params.set('to-date', filters.dateRange.to);
  }

  let response: Response;
  try {
    response = await fetch(`${GUARDIAN_BASE}?${params}`);
  } catch {
    return [];
  }

  if (!response.ok) return [];

  let data: GuardianResponse;
  try {
    data = await response.json();
  } catch {
    return [];
  }

  return (data.response?.results ?? []).map((r) => ({
    title: r.webTitle,
    description: r.fields?.trailText ?? '',
    url: r.webUrl,
    imageUrl: r.fields?.thumbnail ?? null,
    publishedAt: r.webPublicationDate,
    source: 'guardian' as const,
    sourceName: 'The Guardian',
  }));
}

export async function fetchGuardianFullText(
  webUrl: string,
): Promise<string> {
  const pathMatch = webUrl.match(/theguardian\.com\/(.+)/);
  if (pathMatch) {
    const apiUrl = `https://content.guardianapis.com/${pathMatch[1]}?api-key=test&show-fields=bodyText`;
    try {
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        const bodyText = data.response?.content?.fields?.bodyText;
        if (bodyText) return bodyText;
      }
    } catch {
      // Fall through to proxy method
    }
  }

  return fetchViaProxy(webUrl);
}

export async function fetchViaProxy(url: string): Promise<string> {
  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;

  let response: Response;
  try {
    response = await fetch(proxyUrl);
  } catch {
    return '';
  }

  if (!response.ok) return '';

  let html: string;
  try {
    html = await response.text();
  } catch {
    return '';
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');

  const selectors = ['article', '[role="main"]', 'main', '.post-content', '.entry-content'];
  for (const sel of selectors) {
    const el = doc.querySelector(sel);
    if (el?.textContent && el.textContent.trim().length > 100) {
      return el.textContent.trim().slice(0, 5000);
    }
  }

  return doc.body?.textContent?.trim().slice(0, 5000) ?? '';
}

import { CORS_PROXY } from '../constants';
import type { RawArticle, RssFeedConfig } from '../types';

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent?.trim() ?? '';
}

function extractImage(item: Element): string | null {
  const mediaContent = item.getElementsByTagNameNS(
    'http://search.yahoo.com/mrss/',
    'content',
  );
  if (mediaContent.length > 0) {
    const url = mediaContent[0].getAttribute('url');
    if (url) return url;
  }

  const enclosure = item.querySelector('enclosure');
  if (enclosure) {
    const type = enclosure.getAttribute('type') ?? '';
    if (type.startsWith('image/')) {
      return enclosure.getAttribute('url');
    }
  }

  const description = item.querySelector('description')?.textContent ?? '';
  const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/);
  if (imgMatch) return imgMatch[1];

  return null;
}

export async function fetchRssFeed(
  feed: RssFeedConfig,
): Promise<RawArticle[]> {
  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(feed.url)}`;

  let response: Response;
  try {
    response = await fetch(proxyUrl);
  } catch {
    return [];
  }

  if (!response.ok) return [];

  let xml: string;
  try {
    xml = await response.text();
  } catch {
    return [];
  }

  const doc = new DOMParser().parseFromString(xml, 'application/xml');

  if (doc.querySelector('parsererror')) return [];

  const items = doc.querySelectorAll('item');
  const articles: RawArticle[] = [];

  items.forEach((item) => {
    const title = item.querySelector('title')?.textContent?.trim();
    const link = item.querySelector('link')?.textContent?.trim();
    const pubDate = item.querySelector('pubDate')?.textContent?.trim();
    const descriptionRaw =
      item.querySelector('description')?.textContent ?? '';

    if (!title || !link) return;

    articles.push({
      title,
      description: stripHtml(descriptionRaw).slice(0, 500),
      url: link,
      imageUrl: extractImage(item),
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      source: feed.source,
      sourceName: feed.name,
    });
  });

  return articles;
}

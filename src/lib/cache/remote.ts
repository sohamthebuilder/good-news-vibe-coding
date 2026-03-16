import { CACHE_TTL_MS } from '../constants';
import { supabase } from '../supabase';
import type { ProcessedArticle } from '../types';

export async function getRemote(
  urlHash: string,
): Promise<ProcessedArticle | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('articles')
      .select('data, expires_at')
      .eq('url_hash', urlHash)
      .single();

    if (error || !data) return null;

    if (new Date(data.expires_at).getTime() < Date.now()) {
      return null;
    }

    return data.data as ProcessedArticle;
  } catch {
    return null;
  }
}

export async function getRemoteBatch(
  hashes: string[],
): Promise<Map<string, ProcessedArticle>> {
  const map = new Map<string, ProcessedArticle>();
  if (!supabase || hashes.length === 0) return map;

  try {
    const { data, error } = await supabase
      .from('articles')
      .select('url_hash, data, expires_at')
      .in('url_hash', hashes);

    if (error || !data) return map;

    const now = Date.now();
    for (const row of data) {
      if (new Date(row.expires_at).getTime() > now) {
        map.set(row.url_hash, row.data as ProcessedArticle);
      }
    }
  } catch {
    // Supabase outage must never block the user
  }

  return map;
}

export async function fetchCachedArticles(
  limit = 100,
): Promise<ProcessedArticle[]> {
  if (!supabase) return [];

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('articles')
      .select('url_hash, data, expires_at')
      .gt('expires_at', now)
      .order('expires_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((row) => {
      const article = row.data as ProcessedArticle;
      article.urlHash = row.url_hash;
      return article;
    });
  } catch {
    return [];
  }
}

export async function setRemote(
  urlHash: string,
  article: ProcessedArticle,
): Promise<void> {
  if (!supabase) return;

  try {
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString();

    await supabase.from('articles').upsert(
      {
        url_hash: urlHash,
        data: article,
        expires_at: expiresAt,
      },
      { onConflict: 'url_hash' },
    );
  } catch {
    // Write failures are non-critical
  }
}

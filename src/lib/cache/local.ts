import { CACHE_TTL_MS } from '../constants';
import type { CachedEntry, ProcessedArticle } from '../types';

const KEY_PREFIX = 'gn:';

export function getLocal(urlHash: string): ProcessedArticle | null {
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${urlHash}`);
    if (!raw) return null;

    const entry: CachedEntry = JSON.parse(raw);
    if (entry.expiresAt < Date.now()) {
      localStorage.removeItem(`${KEY_PREFIX}${urlHash}`);
      return null;
    }

    return entry.article;
  } catch {
    return null;
  }
}

export function setLocal(
  urlHash: string,
  article: ProcessedArticle,
): void {
  try {
    const entry: CachedEntry = {
      article,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    localStorage.setItem(`${KEY_PREFIX}${urlHash}`, JSON.stringify(entry));
  } catch {
    // localStorage may be full — silently skip
  }
}

export function evictExpired(): void {
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(KEY_PREFIX)) continue;

      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const entry: CachedEntry = JSON.parse(raw);
        if (entry.expiresAt < now) {
          keysToRemove.push(key);
        }
      } catch {
        keysToRemove.push(key!);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore errors during eviction
  }
}

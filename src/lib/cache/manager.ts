import { TIER1_SOURCES } from '../constants';
import { classifyAndSummarize } from '../ai/openai';
import type { ProcessedArticle, RawArticle } from '../types';
import { hashUrl } from '../url';
import { getLocal, setLocal } from './local';
import { getRemoteBatch, setRemote } from './remote';

interface ResolveOptions {
  apiKey: string;
  allowNeutral: boolean;
  dailyUsage: number;
  dailyCap: number;
  onUsageIncrement: () => void;
}

function filterBySentiment(
  articles: ProcessedArticle[],
  allowNeutral: boolean,
): ProcessedArticle[] {
  return articles.filter((a) => {
    if (a.sentiment === 'positive') return true;
    if (a.sentiment === 'neutral' && allowNeutral) return true;
    return false;
  });
}

export async function resolveArticles(
  rawArticles: RawArticle[],
  options: ResolveOptions,
): Promise<ProcessedArticle[]> {
  const {
    apiKey,
    allowNeutral,
    dailyCap,
    onUsageIncrement,
  } = options;
  let { dailyUsage } = options;

  const hashMap = new Map<string, { raw: RawArticle; hash: string }>();
  const localHits: ProcessedArticle[] = [];
  const localMissHashes: string[] = [];

  for (const raw of rawArticles) {
    const urlHash = await hashUrl(raw.url);
    hashMap.set(urlHash, { raw, hash: urlHash });

    const cached = getLocal(urlHash);
    if (cached) {
      localHits.push(cached);
    } else {
      localMissHashes.push(urlHash);
    }
  }

  const remoteResults = await getRemoteBatch(localMissHashes);
  const remoteHits: ProcessedArticle[] = [];
  const uncachedHashes: string[] = [];

  for (const hash of localMissHashes) {
    const remote = remoteResults.get(hash);
    if (remote) {
      setLocal(hash, remote);
      remoteHits.push(remote);
    } else {
      uncachedHashes.push(hash);
    }
  }

  const aiResults: ProcessedArticle[] = [];

  for (const hash of uncachedHashes) {
    if (!apiKey) break;
    if (dailyUsage >= dailyCap) break;

    const entry = hashMap.get(hash);
    if (!entry) continue;

    try {
      const isTier1 = TIER1_SOURCES.has(entry.raw.source);
      const processed = await classifyAndSummarize(
        entry.raw,
        apiKey,
        isTier1,
      );
      processed.urlHash = hash;

      setLocal(hash, processed);
      setRemote(hash, processed).catch(() => {});

      dailyUsage++;
      onUsageIncrement();
      aiResults.push(processed);
    } catch {
      // Classification failed for this article — skip it
    }
  }

  const all = [...localHits, ...remoteHits, ...aiResults];
  return filterBySentiment(all, allowNeutral);
}

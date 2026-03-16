import OpenAI from 'openai';
import { IMPACT_TAGS, TOPICS } from '../constants';
import type {
  ImpactTag,
  OpenAIClassification,
  ProcessedArticle,
  RawArticle,
  Sentiment,
  Topic,
} from '../types';
import { FULL_SYSTEM_PROMPT, SIMPLIFIED_SYSTEM_PROMPT } from './prompts';

const VALID_SENTIMENTS = new Set<Sentiment>(['positive', 'neutral', 'negative']);
const VALID_TOPICS = new Set<string>(TOPICS);
const VALID_IMPACT_TAGS = new Set<string>(IMPACT_TAGS);

function validateClassification(raw: unknown): OpenAIClassification | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  if (!VALID_SENTIMENTS.has(obj.sentiment as Sentiment)) return null;
  if (typeof obj.headline !== 'string' || !obj.headline) return null;
  if (typeof obj.summary !== 'string' || !obj.summary) return null;

  if (
    !Array.isArray(obj.summaryPoints) ||
    obj.summaryPoints.length !== 3 ||
    !obj.summaryPoints.every((p: unknown) => typeof p === 'string')
  ) {
    return null;
  }

  const topics = Array.isArray(obj.topics)
    ? (obj.topics as string[]).filter((t) => VALID_TOPICS.has(t))
    : [];

  const impactTag =
    typeof obj.impactTag === 'string' && VALID_IMPACT_TAGS.has(obj.impactTag)
      ? (obj.impactTag as ImpactTag)
      : null;

  return {
    sentiment: obj.sentiment as Sentiment,
    headline: obj.headline as string,
    summary: obj.summary as string,
    summaryPoints: obj.summaryPoints as [string, string, string],
    topics: topics as Topic[],
    geoCountry: typeof obj.geoCountry === 'string' ? obj.geoCountry : null,
    geoRegion: typeof obj.geoRegion === 'string' ? obj.geoRegion : null,
    impactTag,
  };
}

function parseResponse(text: string): OpenAIClassification | null {
  const cleaned = text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return validateClassification(parsed);
  } catch {
    return null;
  }
}

function sanitizeApiError(err: unknown): string {
  if (err instanceof OpenAI.APIError) {
    if (err.status === 401) return 'Invalid API key. Please check your OpenAI key in Settings.';
    if (err.status === 429) return 'Rate limit reached. Please wait a moment and try again.';
    if (err.status === 402) return 'Insufficient OpenAI credits. Check your billing at platform.openai.com.';
    if (err.status && err.status >= 500) return 'OpenAI is temporarily unavailable. Please try again later.';
    return `OpenAI error (${err.status ?? 'unknown'})`;
  }
  if (err instanceof Error) {
    if (err.message.includes('fetch')) return 'Network error while contacting OpenAI.';
    return 'Article classification failed. Please try again.';
  }
  return 'An unexpected error occurred during classification.';
}

export async function classifyAndSummarize(
  article: RawArticle,
  apiKey: string,
  isTier1: boolean,
): Promise<ProcessedArticle> {
  const client = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const systemPrompt = isTier1 ? SIMPLIFIED_SYSTEM_PROMPT : FULL_SYSTEM_PROMPT;
  const userContent = `Title: ${article.title}\n\nDescription: ${article.description}${
    article.fullText ? `\n\nFull text: ${article.fullText.slice(0, 3000)}` : ''
  }`;

  let completion: OpenAI.Chat.Completions.ChatCompletion;
  try {
    completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    });
  } catch (err) {
    throw new Error(sanitizeApiError(err));
  }

  const responseText = completion.choices[0]?.message?.content ?? '';
  const classification = parseResponse(responseText);

  if (!classification) {
    throw new Error('Could not parse the AI response. The article may be in an unsupported format.');
  }

  return {
    ...article,
    urlHash: '',
    sentiment: classification.sentiment,
    headline: classification.headline,
    summary: classification.summary,
    summaryPoints: classification.summaryPoints,
    topics: classification.topics,
    geoCountry: classification.geoCountry,
    geoRegion: classification.geoRegion,
    impactTag: classification.impactTag,
    processedAt: Date.now(),
  };
}

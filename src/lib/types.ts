export type Sentiment = 'positive' | 'neutral' | 'negative';

export type ImpactTag =
  | 'Breakthrough'
  | 'Kindness'
  | 'Hope'
  | 'Progress'
  | 'Justice'
  | 'Recovery'
  | 'Achievement'
  | 'Community';

export type Topic =
  | 'Science'
  | 'Health'
  | 'Climate'
  | 'Technology'
  | 'Community'
  | 'Heroes'
  | 'Animals'
  | 'Sports'
  | 'Culture'
  | 'Business'
  | 'Education'
  | 'Environment';

export type SortOrder = 'latest' | 'popular' | 'relevant';

export type FontSize = 'small' | 'medium' | 'large';

export type ArticleSource =
  | 'rss-tbi'
  | 'rss-positive-news'
  | 'rss-gnn'
  | 'gnews'
  | 'guardian';

export interface RawArticle {
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  publishedAt: string;
  source: ArticleSource;
  sourceName: string;
  fullText?: string;
}

export interface ProcessedArticle extends RawArticle {
  urlHash: string;
  sentiment: Sentiment;
  headline: string;
  summary: string;
  summaryPoints: [string, string, string];
  topics: Topic[];
  geoCountry: string | null;
  geoRegion: string | null;
  impactTag: ImpactTag | null;
  processedAt: number;
}

export interface CachedEntry {
  article: ProcessedArticle;
  expiresAt: number;
}

export interface Settings {
  openaiApiKey: string;
  allowNeutral: boolean;
  dailyCap: number;
  dailyUsage: number;
  dailyUsageDate: string;
  fontSize: FontSize;
}

export interface Filters {
  topics: Topic[];
  sortOrder: SortOrder;
  dateRange: { from: string | null; to: string | null };
  country: string | null;
  indiaState: string | null;
  indiaCity: string | null;
  indiaDistrict: string | null;
}

export interface RssFeedConfig {
  name: string;
  url: string;
  source: ArticleSource;
}

export interface Country {
  name: string;
  code: string;
}

export interface OpenAIClassification {
  sentiment: Sentiment;
  headline: string;
  summary: string;
  summaryPoints: [string, string, string];
  topics: Topic[];
  geoCountry: string | null;
  geoRegion: string | null;
  impactTag: ImpactTag | null;
}

import type { ImpactTag, RssFeedConfig, SortOrder, Topic } from './types';

export const RSS_FEEDS: RssFeedConfig[] = [
  {
    name: 'The Better India',
    url: 'https://www.thebetterindia.com/feed/',
    source: 'rss-tbi',
  },
  {
    name: 'Positive News',
    url: 'https://www.positive.news/feed/',
    source: 'rss-positive-news',
  },
  {
    name: 'Good News Network',
    url: 'https://www.goodnewsnetwork.org/feed/',
    source: 'rss-gnn',
  },
];

export const TOPICS: Topic[] = [
  'Science',
  'Health',
  'Climate',
  'Technology',
  'Community',
  'Heroes',
  'Animals',
  'Sports',
  'Culture',
  'Business',
  'Education',
  'Environment',
];

export const IMPACT_TAGS: ImpactTag[] = [
  'Breakthrough',
  'Kindness',
  'Hope',
  'Progress',
  'Justice',
  'Recovery',
  'Achievement',
  'Community',
];

export const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Popular' },
  { value: 'relevant', label: 'Relevant' },
];

export const CORS_PROXY = import.meta.env.DEV
  ? '/api/rss-proxy?url='
  : 'https://api.allorigins.win/raw?url=';

export const GNEWS_BASE = 'https://gnews.io/api/v4/search';

export const GUARDIAN_BASE = 'https://content.guardianapis.com/search';

export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const GNEWS_POSITIVE_KEYWORDS =
  'breakthrough OR achievement OR community OR rescue OR award OR innovation OR hero OR record OR cure OR solution';

export const TOPIC_KEYWORDS: Record<Topic, string> = {
  Science: 'science OR research OR discovery',
  Health: 'health OR medical OR wellness',
  Climate: 'climate OR renewable OR sustainability',
  Technology: 'technology OR innovation OR AI',
  Community: 'community OR volunteer OR charity',
  Heroes: 'hero OR rescue OR bravery',
  Animals: 'animal OR wildlife OR conservation',
  Sports: 'sports OR athlete OR championship',
  Culture: 'culture OR art OR music',
  Business: 'business OR startup OR economy',
  Education: 'education OR school OR learning',
  Environment: 'environment OR ocean OR forest',
};

export const TOPIC_TO_GUARDIAN_SECTION: Partial<Record<Topic, string>> = {
  Science: 'science',
  Health: 'society',
  Technology: 'technology',
  Sports: 'sport',
  Culture: 'culture',
  Business: 'business',
  Education: 'education',
  Environment: 'environment',
};

export const TIER1_SOURCES = new Set([
  'rss-tbi',
  'rss-positive-news',
  'rss-gnn',
]);

export const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'dclid',
  'msclkid',
  'twclid',
  'igshid',
  'mc_cid',
  'mc_eid',
  '_ga',
  '_gl',
  'ref',
  'source',
];

export const DEFAULT_DAILY_CAP = 50;

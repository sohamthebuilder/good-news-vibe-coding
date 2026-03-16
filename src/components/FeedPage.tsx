import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { RefreshCw, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useArticlesStore } from '../lib/stores/articles';
import { useSettingsStore } from '../lib/stores/settings';
import { useFiltersStore } from '../lib/stores/filters';
import { TOPICS } from '../lib/constants';
import { ArticleCard, ArticleCardSkeleton, ArticleGridSkeleton } from './ArticleCard';
import { WelcomeBanner, ApiKeyBanner } from './WelcomeScreen';
import { FilterBar } from './FilterBar';
import { NoResultsState, ErrorState } from './EmptyStates';
import { Button } from './ui/Button';
import type { ProcessedArticle, Topic } from '../lib/types';

interface FeedPageProps {
  onOpenSettings: () => void;
}

const MORE_STORIES_PAGE_SIZE = 10;

export function FeedPage({ onOpenSettings }: FeedPageProps) {
  const {
    articles,
    isLoading,
    isFilterLoading,
    error,
    lastFetchedAt,
    cachedArticlesLoaded,
    fetchArticles,
    loadCachedArticles,
    applyFilters,
  } = useArticlesStore();
  const { openaiApiKey, gnewsApiKey, allowNeutral, dailyUsage, dailyCap, incrementUsage } = useSettingsStore();
  const { filters, reset: resetFilters } = useFiltersStore();

  const [moreStoriesCount, setMoreStoriesCount] = useState(MORE_STORIES_PAGE_SIZE);
  const loaderRef = useRef<HTMLDivElement>(null);
  const initialLoadDone = useRef(false);

  const hasCategory = filters.topics.length > 0;
  const selectedCategory = filters.topics[0] ?? null;

  const locationLabel = filters.indiaCity
    ?? filters.indiaDistrict
    ?? filters.indiaState
    ?? filters.country
    ?? null;

  // Load cached articles from Supabase on first mount for fast initial render
  useEffect(() => {
    if (!initialLoadDone.current && !cachedArticlesLoaded && articles.length === 0) {
      initialLoadDone.current = true;
      loadCachedArticles(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch fresh articles when API key is available
  useEffect(() => {
    if (openaiApiKey) {
      fetchArticles(filters, openaiApiKey, allowNeutral, dailyUsage, dailyCap, incrementUsage, gnewsApiKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openaiApiKey, allowNeutral, gnewsApiKey]);

  // Apply filters locally (fast) when filters change, only if we have articles.
  // If a location filter is set but yields zero results from the local pool,
  // trigger a fresh fetch so the user sees a loading state → new articles.
  useEffect(() => {
    const hasArticles = articles.length > 0 || useArticlesStore.getState().allArticles.length > 0;
    if (!hasArticles) return;

    applyFilters(filters);
    setMoreStoriesCount(MORE_STORIES_PAGE_SIZE);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const locationChanged = filters.country || filters.indiaState || filters.indiaCity;
    const postFilterCount = useArticlesStore.getState().articles.length;

    if (locationChanged && postFilterCount === 0 && openaiApiKey) {
      fetchArticles(filters, openaiApiKey, allowNeutral, dailyUsage, dailyCap, incrementUsage, gnewsApiKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.topics, filters.sortOrder, filters.country, filters.indiaState, filters.indiaCity, filters.indiaDistrict]);

  // Re-fetch when user explicitly saves filter preferences
  useEffect(() => {
    const handler = () => {
      if (openaiApiKey) {
        fetchArticles(filters, openaiApiKey, allowNeutral, dailyUsage, dailyCap, incrementUsage, gnewsApiKey);
      }
    };
    window.addEventListener('goodnews:filters-saved', handler);
    return () => window.removeEventListener('goodnews:filters-saved', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openaiApiKey, gnewsApiKey, allowNeutral]);

  const handleManualRefresh = () => {
    if (!openaiApiKey) return;
    fetchArticles(filters, openaiApiKey, allowNeutral, dailyUsage, dailyCap, incrementUsage, gnewsApiKey);
  };

  // Infinite scroll for "More Stories"
  const loadMore = useCallback(() => {
    setMoreStoriesCount((prev) => prev + MORE_STORIES_PAGE_SIZE);
  }, []);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // Home page layout: featured, latest 8 (mixed categories), section per category
  const homeSections = useMemo(() => {
    if (hasCategory || articles.length === 0) return null;

    const withImage = articles.filter((a) => a.imageUrl);
    const featured = withImage[0] ?? articles[0];
    const remaining = articles.filter((a) => a.urlHash !== featured.urlHash);

    // Latest news: pick up to 8 from different categories
    const latestByCategory = new Map<string, ProcessedArticle[]>();
    for (const a of remaining) {
      const cat = a.topics[0] ?? 'Other';
      if (!latestByCategory.has(cat)) latestByCategory.set(cat, []);
      latestByCategory.get(cat)!.push(a);
    }
    const latestNews: ProcessedArticle[] = [];
    let round = 0;
    while (latestNews.length < 8 && round < 20) {
      for (const [, catArticles] of latestByCategory) {
        if (round < catArticles.length && latestNews.length < 8) {
          latestNews.push(catArticles[round]);
        }
      }
      round++;
    }

    const latestHashes = new Set(latestNews.map((a) => a.urlHash));
    latestHashes.add(featured.urlHash);
    const afterLatest = remaining.filter((a) => !latestHashes.has(a.urlHash));

    // Category sections — each article appears in at most one section
    const usedInSections = new Set<string>();
    const categorySections: { topic: Topic; articles: ProcessedArticle[] }[] = [];
    for (const topic of TOPICS) {
      const catArticles = afterLatest.filter(
        (a) => a.topics.includes(topic) && !usedInSections.has(a.urlHash),
      );
      if (catArticles.length > 0) {
        const picked = catArticles.slice(0, 8);
        picked.forEach((a) => usedInSections.add(a.urlHash));
        categorySections.push({ topic, articles: picked });
      }
    }

    return { featured, latestNews, categorySections };
  }, [articles, hasCategory]);

  // Category page layout: featured, latest 8, more stories with pagination
  const categoryView = useMemo(() => {
    if (!hasCategory || articles.length === 0) return null;

    const withImage = articles.filter((a) => a.imageUrl);
    const featured = withImage[0] ?? articles[0];
    const remaining = articles.filter((a) => a.urlHash !== featured.urlHash);
    const latestNews = remaining.slice(0, 8);
    const moreStories = remaining.slice(8);

    return { featured, latestNews, moreStories };
  }, [articles, hasCategory]);

  const showFilterLoading = isFilterLoading && !isLoading;
  const showInitialLoading = isLoading && articles.length === 0;

  return (
    <div className="min-h-screen bg-white">
      <WelcomeBanner />

      {!openaiApiKey && <ApiKeyBanner onConfigure={onOpenSettings} />}

      <FilterBar />

      <main id="feed" className="mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6" aria-label="News feed">
        {error ? (
          <div className="py-12">
            <ErrorState error={error} onRetry={handleManualRefresh} />
          </div>
        ) : showInitialLoading ? (
          <div className="space-y-10">
            <ArticleCardSkeleton />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ArticleGridSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Filter loading overlay */}
            {showFilterLoading && (
              <div className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-neutral-50 py-3 text-sm text-neutral-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating articles...
              </div>
            )}

            {/* =================== HOME PAGE VIEW =================== */}
            {!hasCategory && homeSections && (
              <>
                {/* Featured Article */}
                {homeSections.featured && (
                  <section className="mb-12" aria-label="Featured story">
                    <ArticleCard article={homeSections.featured} variant="featured" />
                  </section>
                )}

                {/* Latest News Grid - mixed categories */}
                {homeSections.latestNews.length > 0 && (
                  <section className="mb-12" aria-label="Latest news">
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="font-headline text-2xl font-bold text-neutral-900">
                        Latest News
                      </h2>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {homeSections.latestNews.map((article, i) => (
                        <ArticleCard key={article.urlHash} article={article} index={i} variant="grid" />
                      ))}
                    </div>
                  </section>
                )}

                {/* Category Sections */}
                {homeSections.categorySections.map(({ topic, articles: catArticles }) => (
                  <section key={topic} className="mb-12" aria-label={`${topic} stories`}>
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="font-headline text-2xl font-bold text-neutral-900">{topic}</h2>
                      <button
                        onClick={() => useFiltersStore.getState().setTopic(topic)}
                        className="flex items-center gap-1 text-sm font-medium text-brand transition-colors hover:text-brand-dark"
                      >
                        See all <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {catArticles.slice(0, 8).map((article, i) => (
                        <ArticleCard key={article.urlHash} article={article} index={i} variant="grid" />
                      ))}
                    </div>
                  </section>
                ))}
              </>
            )}

            {/* =================== CATEGORY VIEW =================== */}
            {hasCategory && categoryView && (
              <>
                <div className="mb-8">
                  <h2 className="font-headline text-3xl font-bold text-neutral-900">
                    {selectedCategory}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    Positive stories about {selectedCategory?.toLowerCase()}
                  </p>
                </div>

                {/* Featured */}
                {categoryView.featured && (
                  <section className="mb-12" aria-label="Featured story">
                    <ArticleCard article={categoryView.featured} variant="featured" />
                  </section>
                )}

                {/* Latest 8 */}
                {categoryView.latestNews.length > 0 && (
                  <section className="mb-12" aria-label="Latest news">
                    <div className="mb-6">
                      <h2 className="font-headline text-2xl font-bold text-neutral-900">
                        Latest in {selectedCategory}
                      </h2>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {categoryView.latestNews.map((article, i) => (
                        <ArticleCard key={article.urlHash} article={article} index={i} variant="grid" />
                      ))}
                    </div>
                  </section>
                )}

                {/* More Stories - 2 columns, infinite scroll */}
                {categoryView.moreStories.length > 0 && (
                  <section id="more-stories" className="mb-12" aria-label="More stories">
                    <h2 className="mb-6 font-headline text-2xl font-bold text-neutral-900">
                      More Stories
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                      {categoryView.moreStories.slice(0, moreStoriesCount).map((article, i) => (
                        <ArticleCard key={article.urlHash} article={article} index={i} />
                      ))}
                    </div>

                    {moreStoriesCount < categoryView.moreStories.length && (
                      <div ref={loaderRef} className="mt-8 flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-brand" />
                      </div>
                    )}
                  </section>
                )}
              </>
            )}

            {/* Location-aware loading — fetching articles for a specific place */}
            {articles.length === 0 && isLoading && locationLabel && (
              <div className="space-y-10">
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="mb-4 h-8 w-8 animate-spin text-brand" />
                  <p className="text-sm text-neutral-500">
                    Looking for good news in <span className="font-medium text-neutral-700">{locationLabel}</span>...
                  </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ArticleGridSkeleton key={i} />
                  ))}
                </div>
              </div>
            )}

            {/* No results */}
            {articles.length === 0 && !isLoading && !isFilterLoading && (
              <div className="py-12">
                <NoResultsState onClear={resetFilters} locationLabel={locationLabel} />
              </div>
            )}

            {/* Refresh & Timestamp */}
            {articles.length > 0 && (
              <div className="mt-12 flex flex-col items-center justify-center border-t border-neutral-200 pt-8">
                {lastFetchedAt && (
                  <p className="mb-4 text-xs text-neutral-500">
                    Last updated: {new Date(lastFetchedAt).toLocaleTimeString()}
                  </p>
                )}
                <Button
                  variant="outline"
                  onClick={handleManualRefresh}
                  disabled={isLoading || !openaiApiKey}
                  aria-label={isLoading ? 'Refreshing feed' : 'Refresh feed'}
                >
                  <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
                  {isLoading ? 'Refreshing...' : 'Refresh Feed'}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ExternalLink, Share2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Skeleton } from './ui/Skeleton';
import { useArticlesStore } from '../lib/stores/articles';
import { useSettingsStore } from '../lib/stores/settings';
import type { ProcessedArticle } from '../lib/types';

interface ArticleCardProps {
  article: ProcessedArticle;
  index?: number;
  variant?: 'featured' | 'grid' | 'list';
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hours ago`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function estimateReadTime(text: string): string {
  const words = text.split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

export function ArticleCard({ article, index = 0, variant = 'list' }: ArticleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [localArticle, setLocalArticle] = useState(article);

  const expandArticle = useArticlesStore((s) => s.expandArticle);
  const apiKey = useSettingsStore((s) => s.openaiApiKey);

  useEffect(() => {
    setLocalArticle(article);
  }, [article]);

  const handleExpand = async () => {
    if (!isExpanded) {
      setIsExpanded(true);
      if (localArticle.source === 'guardian' && !localArticle.fullText) {
        setIsExpanding(true);
        try {
          const enriched = await expandArticle(localArticle, apiKey);
          setLocalArticle(enriched);
        } catch {
          // keep existing content
        } finally {
          setIsExpanding(false);
        }
      }
    } else {
      setIsExpanded(false);
    }
  };

  const handleShare = () => {
    const text = `*${localArticle.headline}*\n\n${localArticle.summary}\n\nRead more: ${localArticle.url}`;
    if (navigator.share) {
      navigator.share({ title: localArticle.headline, text: localArticle.summary, url: localArticle.url }).catch(() => {});
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank', 'noopener');
    }
  };

  const readTime = estimateReadTime(localArticle.summary + (localArticle.fullText ?? ''));
  const primaryTopic = localArticle.topics[0] ?? 'News';

  if (variant === 'featured') {
    return (
      <article
        className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 transition-shadow hover:shadow-lg animate-in fade-in duration-500"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="grid md:grid-cols-2">
          {localArticle.imageUrl && (
            <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 md:aspect-auto md:min-h-[320px]">
              <img
                src={localArticle.imageUrl}
                alt={localArticle.headline}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
          <div className="flex flex-col justify-center p-6 sm:p-8">
            <div className="mb-3 flex items-center gap-2 text-sm text-neutral-500">
              <span className="font-semibold text-neutral-900">{localArticle.sourceName}</span>
              <span className="text-neutral-300">&middot;</span>
              <span>{timeAgo(localArticle.publishedAt)}</span>
            </div>

            <h3 className="mb-3 font-headline text-2xl font-bold leading-tight text-neutral-900 sm:text-3xl">
              {localArticle.headline}
            </h3>

            <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-neutral-600">
              {localArticle.summary}
            </p>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-brand">{primaryTopic}</span>
              <span className="text-neutral-300">&middot;</span>
              <span className="flex items-center text-sm text-neutral-500">
                <Clock className="mr-1 h-3.5 w-3.5" />
                {readTime}
              </span>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Button
                variant="default"
                size="sm"
                onClick={() => window.open(localArticle.url, '_blank', 'noopener')}
              >
                Read article <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleShare} aria-label="Share">
                <Share2 className="h-4 w-4 text-neutral-500" />
              </Button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'grid') {
    return (
      <article
        className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-neutral-200 transition-shadow hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        {localArticle.imageUrl && (
          <div className="relative aspect-video overflow-hidden bg-neutral-100">
            <img
              src={localArticle.imageUrl}
              alt={localArticle.headline}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}

        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex items-center gap-2 text-xs text-neutral-500">
            <span className="font-semibold text-neutral-800">{localArticle.sourceName}</span>
            <span className="text-neutral-300">&middot;</span>
            <span>{timeAgo(localArticle.publishedAt)}</span>
          </div>

          <h3 className="mb-2 line-clamp-2 font-headline text-base font-bold leading-snug text-neutral-900">
            {localArticle.headline}
          </h3>

          <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-neutral-600">
            {localArticle.summary}
          </p>

          <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
            <span className="text-xs font-semibold text-brand">{primaryTopic}</span>
            <span className="flex items-center text-xs text-neutral-400">
              <Clock className="mr-1 h-3 w-3" />
              {readTime}
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-neutral-200 transition-all hover:shadow-md',
        'animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both',
      )}
      style={{ animationDelay: `${index * 100}ms` }}
      aria-label={`Article: ${localArticle.headline}`}
    >
      {localArticle.imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden bg-neutral-100">
          <img
            src={localArticle.imageUrl}
            alt={localArticle.headline}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {localArticle.impactTag && (
            <div className="absolute left-4 top-4">
              <Badge variant="brand" className="shadow-sm backdrop-blur-md bg-brand/90">
                {localArticle.impactTag}
              </Badge>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <span className="font-medium text-neutral-900">{localArticle.sourceName}</span>
          <span className="text-neutral-300">&middot;</span>
          <span>{timeAgo(localArticle.publishedAt)}</span>
          <span className="ml-auto flex items-center">
            <Clock className="mr-1 h-3.5 w-3.5" />
            {readTime}
          </span>
        </div>

        <h3 className="font-headline text-xl font-bold leading-snug text-neutral-900">
          {localArticle.headline}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          {localArticle.summary}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {localArticle.topics.slice(0, 3).map((topic) => (
            <Badge key={topic} variant="secondary" className="font-normal">
              {topic}
            </Badge>
          ))}
        </div>

        <div
          className={cn(
            'grid transition-all duration-300 ease-in-out',
            isExpanded ? 'grid-rows-[1fr] opacity-100 mt-5' : 'grid-rows-[0fr] opacity-0'
          )}
        >
          <div className="overflow-hidden">
            <div className="border-t border-neutral-100 pt-4">
              <h4 className="mb-3 text-sm font-semibold text-neutral-900">Key Takeaways</h4>
              {isExpanding ? (
                <div className="space-y-2" role="status" aria-label="Loading takeaways">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              ) : (
                <ul className="space-y-2 text-sm text-neutral-600">
                  {localArticle.summaryPoints?.map((point, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2 mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6 flex items-center gap-3">
                <Button
                  variant="default"
                  className="min-h-[44px] flex-1"
                  onClick={() => window.open(localArticle.url, '_blank', 'noopener')}
                >
                  Read original <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="min-h-[44px] min-w-[44px]"
                  onClick={handleShare}
                  aria-label="Share article"
                >
                  <Share2 className="h-4 w-4 text-brand" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleExpand}
          className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-1 rounded-md py-2 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <>Show less <ChevronUp className="h-4 w-4" /></>
          ) : (
            <>Read more <ChevronDown className="h-4 w-4" /></>
          )}
        </button>
      </div>
    </article>
  );
}

export function ArticleCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white" aria-hidden="true">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
        <Skeleton className="mb-2 h-6 w-full" />
        <Skeleton className="mb-4 h-6 w-3/4" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ArticleGridSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white" aria-hidden="true">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex flex-1 flex-col p-4">
        <Skeleton className="mb-2 h-3 w-24" />
        <Skeleton className="mb-1 h-5 w-full" />
        <Skeleton className="mb-3 h-5 w-3/4" />
        <Skeleton className="mb-2 h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  );
}

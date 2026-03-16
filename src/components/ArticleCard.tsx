import { useState, useEffect } from 'react';
import { Clock, Heart, Share2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from './ui/Badge';
import { Skeleton } from './ui/Skeleton';
import { DefaultThumbnail } from './DefaultThumbnail';
import { ArticleDialog } from './ArticleDialog';
import { useEngagementStore } from '../lib/stores/engagement';
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

function ArticleImage({ article, className }: { article: ProcessedArticle; className?: string }) {
  const [imgError, setImgError] = useState(false);

  if (!article.imageUrl || imgError) {
    return (
      <DefaultThumbnail
        className={cn('h-full w-full', className)}
        topic={article.topics[0]}
      />
    );
  }

  return (
    <img
      src={article.imageUrl}
      alt={article.headline}
      className={cn('h-full w-full object-cover transition-transform duration-500 group-hover:scale-105', className)}
      loading="lazy"
      onError={() => setImgError(true)}
    />
  );
}

export function ArticleCard({ article, index = 0, variant = 'list' }: ArticleCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [localArticle, setLocalArticle] = useState(article);

  const engagement = useEngagementStore((s) => s.engagements[article.urlHash]);
  const likeCount = engagement?.likes ?? 0;

  useEffect(() => {
    setLocalArticle(article);
  }, [article]);

  const readTime = estimateReadTime(localArticle.summary + (localArticle.fullText ?? ''));
  const primaryTopic = localArticle.topics[0] ?? 'News';

  const handleCardClick = () => {
    setDialogOpen(true);
  };

  if (variant === 'featured') {
    return (
      <>
        <article
          className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 transition-shadow hover:shadow-lg animate-in fade-in duration-500"
          style={{ animationDelay: `${index * 100}ms` }}
          onClick={handleCardClick}
        >
          <div className="grid md:grid-cols-2 md:h-[300px]">
            <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 md:aspect-auto md:h-full">
              <ArticleImage article={localArticle} />
            </div>
            <div className="flex flex-col justify-center overflow-hidden p-6 sm:p-8">
              <div className="mb-3 flex items-center gap-2 text-sm text-neutral-500">
                <span className="font-semibold text-neutral-900">{localArticle.sourceName}</span>
                <span className="text-neutral-300">&middot;</span>
                <span>{timeAgo(localArticle.publishedAt)}</span>
              </div>

              <h3 className="mb-3 line-clamp-2 font-headline text-2xl font-bold leading-tight text-neutral-900 sm:text-3xl">
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
                {likeCount > 0 && (
                  <>
                    <span className="text-neutral-300">&middot;</span>
                    <span className="flex items-center text-sm text-neutral-500">
                      <Heart className="mr-1 h-3.5 w-3.5 fill-brand/30 text-brand" />
                      {likeCount}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </article>

        <ArticleDialog
          article={localArticle}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      </>
    );
  }

  if (variant === 'grid') {
    return (
      <>
        <article
          className="group flex cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-neutral-200 transition-shadow hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
          style={{ animationDelay: `${index * 80}ms` }}
          onClick={handleCardClick}
        >
          <div className="relative aspect-video overflow-hidden bg-neutral-100">
            <ArticleImage article={localArticle} />
          </div>

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
              <div className="flex items-center gap-2">
                {likeCount > 0 && (
                  <span className="flex items-center text-xs text-neutral-400">
                    <Heart className="mr-0.5 h-3 w-3 fill-brand/30 text-brand" />
                    {likeCount}
                  </span>
                )}
                <span className="flex items-center text-xs text-neutral-400">
                  <Clock className="mr-1 h-3 w-3" />
                  {readTime}
                </span>
              </div>
            </div>
          </div>
        </article>

        <ArticleDialog
          article={localArticle}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <article
        className={cn(
          'group relative flex cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-neutral-200 transition-all hover:shadow-md',
          'animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both',
        )}
        style={{ animationDelay: `${index * 100}ms` }}
        aria-label={`Article: ${localArticle.headline}`}
        onClick={handleCardClick}
      >
        <div className="relative aspect-video w-full overflow-hidden bg-neutral-100">
          <ArticleImage article={localArticle} />
          {localArticle.impactTag && (
            <div className="absolute left-4 top-4">
              <Badge variant="brand" className="shadow-sm backdrop-blur-md bg-brand/90">
                {localArticle.impactTag}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
            <span className="font-medium text-neutral-900">{localArticle.sourceName}</span>
            <span className="text-neutral-300">&middot;</span>
            <span>{timeAgo(localArticle.publishedAt)}</span>
            <span className="ml-auto flex items-center gap-2">
              {likeCount > 0 && (
                <span className="flex items-center">
                  <Heart className="mr-0.5 h-3.5 w-3.5 fill-brand/30 text-brand" />
                  {likeCount}
                </span>
              )}
              <span className="flex items-center">
                <Clock className="mr-1 h-3.5 w-3.5" />
                {readTime}
              </span>
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
        </div>
      </article>

      <ArticleDialog
        article={localArticle}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
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

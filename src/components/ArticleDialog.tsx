import { ExternalLink, Share2, Heart, Clock } from 'lucide-react';
import { Dialog } from './ui/Dialog';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { DefaultThumbnail } from './DefaultThumbnail';
import { useEngagementStore } from '../lib/stores/engagement';
import type { ProcessedArticle } from '../lib/types';

interface ArticleDialogProps {
  article: ProcessedArticle | null;
  open: boolean;
  onClose: () => void;
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

export function ArticleDialog({ article, open, onClose }: ArticleDialogProps) {
  const { likeArticle, unlikeArticle, recordShare, isLiked, engagements } =
    useEngagementStore();

  if (!article) return null;

  const liked = isLiked(article.urlHash);
  const engagement = engagements[article.urlHash];
  const likeCount = engagement?.likes ?? 0;
  const shareCount = engagement?.shares ?? 0;
  const readTime = estimateReadTime(article.summary + (article.fullText ?? ''));

  const handleLike = () => {
    if (liked) {
      unlikeArticle(article.urlHash);
    } else {
      likeArticle(article.urlHash);
    }
  };

  const handleShare = () => {
    recordShare(article.urlHash);
    const text = `*${article.headline}*\n\n${article.summary}\n\nRead more: ${article.url}`;
    if (navigator.share) {
      navigator.share({
        title: article.headline,
        text: article.summary,
        url: article.url,
      }).catch(() => {});
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank', 'noopener');
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      {article.imageUrl ? (
        <div className="relative aspect-video w-full overflow-hidden bg-neutral-100">
          <img
            src={article.imageUrl}
            alt={article.headline}
            className="h-full w-full object-cover"
          />
          {article.impactTag && (
            <div className="absolute left-4 top-4">
              <Badge variant="brand" className="shadow-sm backdrop-blur-md bg-brand/90">
                {article.impactTag}
              </Badge>
            </div>
          )}
        </div>
      ) : (
        <div className="relative aspect-video w-full overflow-hidden">
          <DefaultThumbnail
            className="h-full w-full"
            topic={article.topics[0]}
          />
          {article.impactTag && (
            <div className="absolute left-4 top-4">
              <Badge variant="brand" className="shadow-sm backdrop-blur-md bg-brand/90">
                {article.impactTag}
              </Badge>
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <span className="font-semibold text-neutral-900">{article.sourceName}</span>
          <span className="text-neutral-300">&middot;</span>
          <span>{timeAgo(article.publishedAt)}</span>
          <span className="text-neutral-300">&middot;</span>
          <span className="flex items-center">
            <Clock className="mr-1 h-3 w-3" />
            {readTime}
          </span>
        </div>

        <h2 className="mb-4 font-headline text-2xl font-bold leading-tight text-neutral-900">
          {article.headline}
        </h2>

        <p className="mb-5 text-sm leading-relaxed text-neutral-600">
          {article.summary}
        </p>

        {article.summaryPoints && article.summaryPoints.length > 0 && (
          <div className="mb-5 rounded-xl bg-neutral-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-neutral-900">Key Takeaways</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              {article.summaryPoints.map((point, i) => (
                <li key={i} className="flex items-start">
                  <span className="mr-2 mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-5 flex flex-wrap items-center gap-2">
          {article.topics.map((topic) => (
            <Badge key={topic} variant="secondary" className="font-normal">
              {topic}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-neutral-100 pt-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              liked
                ? 'bg-red-50 text-brand ring-1 ring-brand/20'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
            aria-label={liked ? 'Unlike article' : 'Like article'}
            aria-pressed={liked}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-brand' : ''}`} />
            {likeCount > 0 && <span>{likeCount}</span>}
            {likeCount === 0 && 'Like'}
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200"
            aria-label="Share article"
          >
            <Share2 className="h-4 w-4" />
            {shareCount > 0 ? shareCount : 'Share'}
          </button>

          <div className="ml-auto">
            <Button
              variant="default"
              size="sm"
              onClick={() => window.open(article.url, '_blank', 'noopener')}
            >
              Read source <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

import type { ProcessedArticle } from '../types';
import { generateShareCard } from './card';

export async function shareArticle(
  article: ProcessedArticle,
): Promise<void> {
  const shareText = `${article.headline}\n\n${article.summary}`;
  const shareUrl = article.url;

  try {
    const blob = await generateShareCard(article);
    const file = new File([blob], 'goodnews-share.png', { type: 'image/png' });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: article.headline,
        text: shareText,
        url: shareUrl,
        files: [file],
      });
      return;
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return;
  }

  const whatsappText = `${article.headline}\n\nRead more: ${shareUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
  window.open(whatsappUrl, '_blank');
}

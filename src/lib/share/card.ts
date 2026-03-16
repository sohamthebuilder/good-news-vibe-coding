import type { ProcessedArticle } from '../types';

const WIDTH = 1200;
const HEIGHT = 630;
const PADDING = 60;
const TEXT_WIDTH = WIDTH - PADDING * 2;

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  _lineHeight: number,
  maxLines: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines) break;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    const trimmed = last.length > 60 ? last.slice(0, 57) + '...' : last;
    lines[maxLines - 1] = trimmed;
  }

  return lines;
}

export async function generateShareCard(
  article: ProcessedArticle,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(0.5, '#1e293b');
  gradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const accentGradient = ctx.createLinearGradient(0, 0, WIDTH, 0);
  accentGradient.addColorStop(0, '#22c55e');
  accentGradient.addColorStop(1, '#16a34a');
  ctx.fillStyle = accentGradient;
  ctx.fillRect(0, 0, WIDTH, 4);

  if (article.impactTag) {
    ctx.font = '600 16px "DM Sans", sans-serif';
    const tagText = article.impactTag.toUpperCase();
    const tagWidth = ctx.measureText(tagText).width + 24;
    const tagHeight = 32;
    const tagX = PADDING;
    const tagY = PADDING;

    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, tagWidth, tagHeight, 6);
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    ctx.fillText(tagText, tagX + 12, tagY + 22);
  }

  let y = article.impactTag ? PADDING + 56 : PADDING;

  ctx.font = '700 36px "Lora", Georgia, serif';
  ctx.fillStyle = '#f8fafc';
  const headlineLines = wrapText(ctx, article.headline, TEXT_WIDTH, 44, 3);
  for (const line of headlineLines) {
    ctx.fillText(line, PADDING, y + 36);
    y += 44;
  }

  y += 20;

  ctx.font = '400 20px "DM Sans", sans-serif';
  ctx.fillStyle = '#94a3b8';
  const summaryLines = wrapText(ctx, article.summary, TEXT_WIDTH, 28, 3);
  for (const line of summaryLines) {
    ctx.fillText(line, PADDING, y + 20);
    y += 28;
  }

  ctx.font = '600 18px "DM Sans", sans-serif';
  ctx.fillStyle = '#22c55e';
  ctx.fillText('goodnews', PADDING, HEIGHT - PADDING + 10);

  ctx.font = '400 14px "DM Sans", sans-serif';
  ctx.fillStyle = '#64748b';
  const sourceText = article.sourceName;
  const sourceWidth = ctx.measureText(sourceText).width;
  ctx.fillText(sourceText, WIDTH - PADDING - sourceWidth, HEIGHT - PADDING + 10);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob!),
      'image/png',
    );
  });
}

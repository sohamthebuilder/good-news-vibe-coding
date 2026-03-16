import { TRACKING_PARAMS } from './constants';

export function normalizeUrl(raw: string): string {
  try {
    const url = new URL(raw.toLowerCase());
    TRACKING_PARAMS.forEach((p) => url.searchParams.delete(p));
    let pathname = url.pathname;
    if (pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    return `${url.origin}${pathname}${url.search}`;
  } catch {
    return raw.toLowerCase().replace(/\/+$/, '');
  }
}

export async function hashUrl(raw: string): Promise<string> {
  const normalized = normalizeUrl(raw);
  const encoded = new TextEncoder().encode(normalized);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h3 className="font-headline text-xl font-bold text-brand">GoodNews</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              Your daily dose of positive, AI-curated news from trusted sources around the world.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-neutral-900">Quick Links</h4>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li><a href="#feed" className="transition-colors hover:text-neutral-900">Stories</a></li>
              <li><a href="#topics" className="transition-colors hover:text-neutral-900">Topics</a></li>
              <li><a href="#settings-section" className="transition-colors hover:text-neutral-900">Configure</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-neutral-900">Sources</h4>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li><a href="https://www.thebetterindia.com" target="_blank" rel="noopener" className="transition-colors hover:text-neutral-900">The Better India</a></li>
              <li><a href="https://www.positive.news" target="_blank" rel="noopener" className="transition-colors hover:text-neutral-900">Positive News</a></li>
              <li><a href="https://www.goodnewsnetwork.org" target="_blank" rel="noopener" className="transition-colors hover:text-neutral-900">Good News Network</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center border-t border-neutral-100 pt-6 text-sm text-neutral-400">
          <span className="flex items-center gap-1">
            Made with <Heart className="h-3.5 w-3.5 fill-brand text-brand" /> for a better world
          </span>
        </div>
      </div>
    </footer>
  );
}

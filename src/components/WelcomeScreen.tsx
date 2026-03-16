export function WelcomeBanner() {
  return (
    <section className="border-b border-neutral-100 bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-10 text-center sm:px-6 sm:py-14">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
          Welcome to GoodNews
        </p>
        <h2 className="mx-auto max-w-2xl font-headline text-2xl font-bold leading-snug text-neutral-900 sm:text-3xl">
          Curated stories that ignite{' '}
          <span className="text-brand">inspiration</span>,{' '}
          <span className="text-brand">knowledge</span>, and{' '}
          <span className="text-brand">hope</span>
        </h2>
      </div>
    </section>
  );
}

export function ApiKeyBanner({ onConfigure }: { onConfigure: () => void }) {
  return (
    <section className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div>
          <p className="text-sm font-medium text-amber-900">
            Add your OpenAI API key to get started
          </p>
          <p className="text-xs text-amber-700">
            We use AI to filter and summarize the best positive news for you. Your key stays in your browser.
          </p>
        </div>
        <button
          onClick={onConfigure}
          className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
        >
          Add API Key
        </button>
      </div>
    </section>
  );
}

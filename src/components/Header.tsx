import { Newspaper, Settings, Bell } from 'lucide-react';

interface HeaderProps {
  onSettingsToggle: () => void;
  settingsOpen: boolean;
}

export function Header({ onSettingsToggle, settingsOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-2" aria-label="Go to home">
            <h1 className="font-headline text-2xl font-bold text-brand">
              GoodNews
            </h1>
          </a>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
            <a href="#feed" className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900">
              Stories
            </a>
            <a href="#topics" className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900">
              Topics
            </a>
            <a href="#settings-section" className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900">
              Configure
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            onClick={onSettingsToggle}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              settingsOpen
                ? 'bg-brand/10 text-brand'
                : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
            aria-label={settingsOpen ? 'Close settings' : 'Open settings'}
            aria-expanded={settingsOpen}
          >
            <Settings className="h-5 w-5" />
          </button>
          <div className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
            <Newspaper className="h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  );
}

import { useState } from 'react';
import { Eye, EyeOff, Trash2, ShieldAlert, X, Check } from 'lucide-react';
import { useSettingsStore } from '../lib/stores/settings';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { cn } from '../lib/utils';

const CACHE_PREFIX = 'gn:';

function countCachedEntries(): number {
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i)?.startsWith(CACHE_PREFIX)) count++;
  }
  return count;
}

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const settings = useSettingsStore();
  const [showKey, setShowKey] = useState(false);
  const [showGnewsKey, setShowGnewsKey] = useState(false);
  const [cacheSize, setCacheSize] = useState(countCachedEntries);
  const [apiKeyDraft, setApiKeyDraft] = useState(settings.openaiApiKey);
  const [gnewsKeyDraft, setGnewsKeyDraft] = useState(settings.gnewsApiKey);
  const [keySaved, setKeySaved] = useState(false);
  const [gnewsKeySaved, setGnewsKeySaved] = useState(false);

  const handleSaveKey = () => {
    settings.setApiKey(apiKeyDraft.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleSaveGnewsKey = () => {
    settings.setGnewsApiKey(gnewsKeyDraft.trim());
    setGnewsKeySaved(true);
    setTimeout(() => setGnewsKeySaved(false), 2000);
  };

  const handleClearCache = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    setCacheSize(0);
  };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/20 transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        id="settings-section"
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal={open}
        aria-label="Settings"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="font-headline text-xl font-bold text-neutral-900">Settings</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <section aria-labelledby="settings-apikey-heading">
            <h3 id="settings-apikey-heading" className="mb-3 text-sm font-semibold text-neutral-900">
              OpenAI API Key
            </h3>
            <div className="relative mb-3">
              <Input
                type={showKey ? 'text' : 'password'}
                value={apiKeyDraft}
                onChange={(e) => {
                  setApiKeyDraft(e.target.value);
                  setKeySaved(false);
                }}
                placeholder="sk-..."
                className="pr-10"
                aria-label="OpenAI API key"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              variant={keySaved ? 'default' : 'outline'}
              size="sm"
              onClick={handleSaveKey}
              disabled={!apiKeyDraft.trim()}
              className={cn(
                'mb-3 w-full transition-all',
                keySaved && 'bg-green-600 hover:bg-green-700',
              )}
            >
              {keySaved ? (
                <>
                  <Check className="mr-2 h-3.5 w-3.5" />
                  API Key Saved!
                </>
              ) : (
                'Save API Key'
              )}
            </Button>
            <div className="flex items-start gap-2 text-xs text-neutral-500">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
              <p>Your key is stored locally in your browser and never sent to any server other than OpenAI.</p>
            </div>
          </section>

          <section aria-labelledby="settings-gnews-heading">
            <h3 id="settings-gnews-heading" className="mb-3 text-sm font-semibold text-neutral-900">
              GNews API Key
            </h3>
            <div className="relative mb-3">
              <Input
                type={showGnewsKey ? 'text' : 'password'}
                value={gnewsKeyDraft}
                onChange={(e) => {
                  setGnewsKeyDraft(e.target.value);
                  setGnewsKeySaved(false);
                }}
                placeholder="Enter GNews API key..."
                className="pr-10"
                aria-label="GNews API key"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowGnewsKey(!showGnewsKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
                aria-label={showGnewsKey ? 'Hide API key' : 'Show API key'}
              >
                {showGnewsKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              variant={gnewsKeySaved ? 'default' : 'outline'}
              size="sm"
              onClick={handleSaveGnewsKey}
              disabled={!gnewsKeyDraft.trim()}
              className={cn(
                'mb-3 w-full transition-all',
                gnewsKeySaved && 'bg-green-600 hover:bg-green-700',
              )}
            >
              {gnewsKeySaved ? (
                <>
                  <Check className="mr-2 h-3.5 w-3.5" />
                  GNews Key Saved!
                </>
              ) : (
                'Save GNews Key'
              )}
            </Button>
            <div className="flex items-start gap-2 text-xs text-neutral-500">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
              <p>Get your free API key from gnews.io. Stored locally in your browser.</p>
            </div>
          </section>

          <section aria-labelledby="settings-prefs-heading">
            <h3 id="settings-prefs-heading" className="mb-4 text-sm font-semibold text-neutral-900">
              Preferences
            </h3>

            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-neutral-900">Show Neutral News</div>
                  <div className="text-xs text-neutral-500">
                    Include informative stories that aren't strictly positive.
                  </div>
                </div>
                <button
                  onClick={settings.toggleNeutral}
                  role="switch"
                  aria-checked={settings.allowNeutral}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors',
                    settings.allowNeutral ? 'bg-brand' : 'bg-neutral-200',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
                      settings.allowNeutral ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </button>
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-neutral-900">Font Size</legend>
                <div className="flex gap-2" role="radiogroup" aria-label="Font size">
                  {(['small', 'medium', 'large'] as const).map((s) => (
                    <Button
                      key={s}
                      variant={settings.fontSize === s ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => settings.setFontSize(s)}
                      className="flex-1 capitalize"
                      role="radio"
                      aria-checked={settings.fontSize === s}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </fieldset>
            </div>
          </section>

          <section className="rounded-xl border border-red-100 bg-red-50/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-red-900">Data Management</h3>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-neutral-900">Clear Article Cache</div>
                <div className="text-xs text-neutral-500">{cacheSize} articles stored locally</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
                disabled={cacheSize === 0}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                aria-label={`Clear ${cacheSize} cached articles`}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Clear
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

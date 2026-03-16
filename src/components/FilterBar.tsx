import { useState } from 'react';
import { SlidersHorizontal, MapPin, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { useFiltersStore } from '../lib/stores/filters';
import { TOPICS, SORT_OPTIONS } from '../lib/constants';
import { COUNTRIES } from '../lib/geo/countries';
import { INDIA_STATES, INDIA_CITIES } from '../lib/geo/india';
import type { SortOrder } from '../lib/types';
import { Button } from './ui/Button';

export function FilterBar() {
  const { filters, toggleTopic, setSortOrder, setCountry, setIndiaGeo, saveFilterPreferences } = useFiltersStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedState = INDIA_STATES.find((s) => s.name === filters.indiaState);
  const citiesForState = selectedState ? INDIA_CITIES[selectedState.code] ?? [] : [];

  const handleSave = () => {
    saveFilterPreferences();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div id="topics" className="w-full border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <nav aria-label="Topic filters">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" role="list">
            <button
              role="listitem"
              onClick={() => useFiltersStore.getState().setTopic(null)}
              className={cn(
                'min-h-[44px] whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
                filters.topics.length === 0
                  ? 'bg-brand text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
              )}
              aria-pressed={filters.topics.length === 0}
              aria-label="Show all topics"
            >
              All
            </button>
            {TOPICS.map((topic) => {
              const isActive = filters.topics.includes(topic);
              return (
                <button
                  key={topic}
                  role="listitem"
                  onClick={() => toggleTopic(topic)}
                  className={cn(
                    'min-h-[44px] whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
                  )}
                  aria-pressed={isActive}
                  aria-label={`Filter by ${topic}`}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="mt-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 min-h-[44px] px-2 text-xs text-neutral-500 sm:min-h-0"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-controls="expanded-filters"
          >
            <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
            {isExpanded ? 'Hide filters' : 'More filters'}
          </Button>

          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-xs text-neutral-500">
              Sort by:
            </label>
            <select
              id="sort-select"
              value={filters.sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="min-h-[44px] bg-transparent text-sm font-medium text-neutral-900 outline-none sm:min-h-0"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isExpanded && (
          <div
            id="expanded-filters"
            className="mt-4 space-y-4 border-t border-neutral-100 pt-4"
          >
            <div className="space-y-3">
              <label className="flex items-center text-xs font-medium text-neutral-500">
                <MapPin className="mr-1.5 h-3.5 w-3.5" />
                Location
              </label>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="country-select" className="mb-1 block text-xs text-neutral-500">
                    Country
                  </label>
                  <select
                    id="country-select"
                    value={filters.country ?? ''}
                    onChange={(e) => setCountry(e.target.value || null)}
                    className="min-h-[44px] w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
                  >
                    <option value="">All Countries</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {filters.country === 'India' && (
                  <>
                    <div>
                      <label htmlFor="state-select" className="mb-1 block text-xs text-neutral-500">
                        State
                      </label>
                      <select
                        id="state-select"
                        value={filters.indiaState ?? ''}
                        onChange={(e) =>
                          setIndiaGeo(e.target.value || null, null, null)
                        }
                        className="min-h-[44px] w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
                      >
                        <option value="">All States</option>
                        {INDIA_STATES.map((s) => (
                          <option key={s.code} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {filters.indiaState && citiesForState.length > 0 && (
                      <div>
                        <label htmlFor="city-select" className="mb-1 block text-xs text-neutral-500">
                          City
                        </label>
                        <select
                          id="city-select"
                          value={filters.indiaCity ?? ''}
                          onChange={(e) =>
                            setIndiaGeo(
                              filters.indiaState,
                              filters.indiaDistrict,
                              e.target.value || null,
                            )
                          }
                          className="min-h-[44px] w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm"
                        >
                          <option value="">All Cities</option>
                          {citiesForState.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant={saved ? 'default' : 'outline'}
                size="sm"
                onClick={handleSave}
                className={cn(
                  'min-w-[140px] transition-all',
                  saved && 'bg-green-600 hover:bg-green-700',
                )}
              >
                {saved ? (
                  <>
                    <Check className="mr-2 h-3.5 w-3.5" />
                    Saved!
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

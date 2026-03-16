import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Filters, SortOrder, Topic } from '../types';

interface FiltersState {
  filters: Filters;
  setTopic: (topic: Topic | null) => void;
  toggleTopic: (topic: Topic) => void;
  setSortOrder: (order: SortOrder) => void;
  setCountry: (country: string | null) => void;
  setIndiaGeo: (state: string | null, district: string | null, city: string | null) => void;
  saveFilterPreferences: () => void;
  reset: () => void;
}

const defaultFilters: Filters = {
  topics: [],
  sortOrder: 'latest',
  dateRange: { from: null, to: null },
  country: null,
  indiaState: null,
  indiaDistrict: null,
  indiaCity: null,
};

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set, get) => ({
      filters: defaultFilters,

      setTopic: (topic) =>
        set((s) => ({
          filters: { ...s.filters, topics: topic ? [topic] : [] },
        })),

      toggleTopic: (topic) =>
        set((s) => {
          const isSelected = s.filters.topics.includes(topic);
          return {
            filters: {
              ...s.filters,
              topics: isSelected ? [] : [topic],
            },
          };
        }),

      setSortOrder: (sortOrder) =>
        set((s) => ({ filters: { ...s.filters, sortOrder } })),

      setCountry: (country) =>
        set((s) => ({
          filters: {
            ...s.filters,
            country,
            indiaState: country === 'India' ? s.filters.indiaState : null,
            indiaDistrict: null,
            indiaCity: country === 'India' ? s.filters.indiaCity : null,
          },
        })),

      setIndiaGeo: (indiaState, indiaDistrict, indiaCity) =>
        set((s) => ({
          filters: { ...s.filters, indiaState, indiaDistrict, indiaCity },
        })),

      saveFilterPreferences: () => {
        window.dispatchEvent(new CustomEvent('goodnews:filters-saved', {
          detail: get().filters,
        }));
      },

      reset: () => set({ filters: defaultFilters }),
    }),
    {
      name: 'goodnews-filters',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

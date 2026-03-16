import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_DAILY_CAP } from '../constants';
import type { FontSize } from '../types';

interface SettingsState {
  openaiApiKey: string;
  gnewsApiKey: string;
  allowNeutral: boolean;
  dailyCap: number;
  dailyUsage: number;
  dailyUsageDate: string;
  fontSize: FontSize;

  setApiKey: (key: string) => void;
  setGnewsApiKey: (key: string) => void;
  toggleNeutral: () => void;
  setDailyCap: (cap: number) => void;
  incrementUsage: () => void;
  setFontSize: (size: FontSize) => void;
  clearSession: () => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      openaiApiKey: '',
      gnewsApiKey: '',
      allowNeutral: true,
      dailyCap: DEFAULT_DAILY_CAP,
      dailyUsage: 0,
      dailyUsageDate: todayISO(),
      fontSize: 'medium',

      setApiKey: (key) => set({ openaiApiKey: key }),

      setGnewsApiKey: (key) => set({ gnewsApiKey: key }),

      toggleNeutral: () => set((s) => ({ allowNeutral: !s.allowNeutral })),

      setDailyCap: (cap) => set({ dailyCap: cap }),

      incrementUsage: () => {
        const state = get();
        const today = todayISO();
        if (state.dailyUsageDate !== today) {
          set({ dailyUsage: 1, dailyUsageDate: today });
        } else {
          set({ dailyUsage: state.dailyUsage + 1 });
        }
      },

      setFontSize: (fontSize) => set({ fontSize }),

      clearSession: () => {
        sessionStorage.clear();
        set({
          openaiApiKey: '',
          gnewsApiKey: '',
          allowNeutral: true,
          dailyCap: DEFAULT_DAILY_CAP,
          dailyUsage: 0,
          dailyUsageDate: todayISO(),
          fontSize: 'medium',
        });
      },
    }),
    {
      name: 'goodnews-settings',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ArticleEngagement {
  likes: number;
  shares: number;
}

interface EngagementState {
  engagements: Record<string, ArticleEngagement>;
  likedArticles: Set<string>;

  likeArticle: (urlHash: string) => void;
  unlikeArticle: (urlHash: string) => void;
  recordShare: (urlHash: string) => void;
  isLiked: (urlHash: string) => boolean;
  getScore: (urlHash: string) => number;
}

export const useEngagementStore = create<EngagementState>()(
  persist(
    (set, get) => ({
      engagements: {},
      likedArticles: new Set<string>(),

      likeArticle: (urlHash) =>
        set((s) => {
          const current = s.engagements[urlHash] ?? { likes: 0, shares: 0 };
          const newLiked = new Set(s.likedArticles);
          newLiked.add(urlHash);
          return {
            engagements: {
              ...s.engagements,
              [urlHash]: { ...current, likes: current.likes + 1 },
            },
            likedArticles: newLiked,
          };
        }),

      unlikeArticle: (urlHash) =>
        set((s) => {
          const current = s.engagements[urlHash] ?? { likes: 0, shares: 0 };
          const newLiked = new Set(s.likedArticles);
          newLiked.delete(urlHash);
          return {
            engagements: {
              ...s.engagements,
              [urlHash]: { ...current, likes: Math.max(0, current.likes - 1) },
            },
            likedArticles: newLiked,
          };
        }),

      recordShare: (urlHash) =>
        set((s) => {
          const current = s.engagements[urlHash] ?? { likes: 0, shares: 0 };
          return {
            engagements: {
              ...s.engagements,
              [urlHash]: { ...current, shares: current.shares + 1 },
            },
          };
        }),

      isLiked: (urlHash) => get().likedArticles.has(urlHash),

      getScore: (urlHash) => {
        const e = get().engagements[urlHash];
        if (!e) return 0;
        return e.likes + e.shares;
      },
    }),
    {
      name: 'goodnews-engagement',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        engagements: state.engagements,
        likedArticles: Array.from(state.likedArticles),
      }),
      merge: (persisted, current) => {
        const p = persisted as { engagements?: Record<string, ArticleEngagement>; likedArticles?: string[] };
        return {
          ...current,
          engagements: p?.engagements ?? {},
          likedArticles: new Set(p?.likedArticles ?? []),
        };
      },
    },
  ),
);

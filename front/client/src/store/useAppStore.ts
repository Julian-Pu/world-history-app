import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, Difficulty } from '../types/history';
import type { AuthUser } from '../utils/auth';
import { safeStorage } from '../utils/safeStorage';

type PublicAuthUser = Omit<AuthUser, 'passwordHash'>;

interface AppState extends AppSettings {
  currentUser: PublicAuthUser | null;
  setDifficulty: (d: Difficulty) => void;
  setTheme: (t: 'light' | 'dark') => void;
  setFontSize: (s: 'small' | 'medium' | 'large') => void;
  setStorageMode: (m: 'local' | 'cloud') => void;
  setCurrentUser: (user: PublicAuthUser | null) => void;
  addSearchHistory: (q: string) => void;
  clearSearchHistory: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      difficulty: 'elementary',
      theme: 'light',
      fontSize: 'medium',
      storageMode: 'local',
      searchHistory: [],
      setDifficulty: (d: Difficulty) => set({ difficulty: d }),
      setTheme: (t: 'light' | 'dark') => {
        set({ theme: t });
        if (t === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      currentUser: null,
      setFontSize: (s: 'small' | 'medium' | 'large') => {
        set({ fontSize: s });
        const root = document.documentElement;
        root.classList.remove('text-sm', 'text-base', 'text-lg');
        root.classList.add(s === 'small' ? 'text-sm' : s === 'large' ? 'text-lg' : 'text-base');
      },
      setStorageMode: (m: 'local' | 'cloud') => set({ storageMode: m }),
      setCurrentUser: (user: PublicAuthUser | null) => set({ currentUser: user }),
      addSearchHistory: (q: string) => {
        const history = get().searchHistory.filter(h => h !== q);
        set({ searchHistory: [q, ...history].slice(0, 20) });
      },
      clearSearchHistory: () => set({ searchHistory: [] }),
    }),
    {
      name: 'history-app-settings',
      storage: safeStorage,
    },
  ),
);

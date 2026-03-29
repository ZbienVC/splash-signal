import React, { createContext, useContext } from 'react';
import { useWatchlist, WatchlistEntry } from '../lib/useWatchlist';
import { DexToken } from '../services/dexscreenerClient';

export type { WatchlistEntry };

interface WatchlistContextValue {
  entries: WatchlistEntry[];
  liveData: Record<string, DexToken>;
  refreshing: boolean;
  lastRefreshed: Date | null;
  addToken: (token: WatchlistEntry) => void;
  removeToken: (address: string) => void;
  isWatched: (address: string) => boolean;
  forceRefresh: () => void;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const watchlist = useWatchlist();
  return (
    <WatchlistContext.Provider value={watchlist}>
      {children}
    </WatchlistContext.Provider>
  );
};

export function useWatchlistContext(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlistContext must be used inside WatchlistProvider');
  return ctx;
}

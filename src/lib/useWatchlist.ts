import { useState, useEffect, useCallback } from 'react';
import { getTokenByAddress, DexToken } from '../services/dexscreenerClient';

export interface WatchlistEntry {
  address: string;
  symbol: string;
  name: string;
  chain: string;
  addedAt: number;
  signal?: string;
  alphaScore?: number;
}

const STORAGE_KEY = 'splashsignal_watchlist';
const REFRESH_INTERVAL = 30000; // 30s

function loadWatchlist(): WatchlistEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WatchlistEntry[]) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(entries: WatchlistEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useWatchlist() {
  const [entries, setEntries] = useState<WatchlistEntry[]>(() => loadWatchlist());
  const [liveData, setLiveData] = useState<Record<string, DexToken>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const addToken = useCallback((token: WatchlistEntry) => {
    setEntries(prev => {
      if (prev.some(e => e.address === token.address)) return prev;
      const next = [{ ...token, addedAt: Date.now() }, ...prev];
      saveWatchlist(next);
      return next;
    });
  }, []);

  const removeToken = useCallback((address: string) => {
    setEntries(prev => {
      const next = prev.filter(e => e.address !== address);
      saveWatchlist(next);
      return next;
    });
  }, []);

  const isWatched = useCallback(
    (address: string) => entries.some(e => e.address === address),
    [entries]
  );

  const fetchLiveData = useCallback(async (list: WatchlistEntry[]) => {
    if (!list.length) return;
    setRefreshing(true);
    try {
      const results = await Promise.all(
        list.map(e => getTokenByAddress(e.address))
      );
      const map: Record<string, DexToken> = {};
      results.forEach((token, i) => {
        if (token) map[list[i].address] = token;
      });
      setLiveData(map);
      setLastRefreshed(new Date());
    } catch {
      // silent fail
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Initial fetch + 30s interval
  useEffect(() => {
    if (entries.length > 0) {
      fetchLiveData(entries);
    }
    const id = setInterval(() => {
      if (entries.length > 0) fetchLiveData(entries);
    }, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [entries, fetchLiveData]);

  return {
    entries,
    liveData,
    refreshing,
    lastRefreshed,
    addToken,
    removeToken,
    isWatched,
    forceRefresh: () => fetchLiveData(entries),
  };
}

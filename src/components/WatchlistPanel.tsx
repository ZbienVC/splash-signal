import React from 'react';
import { Star, RefreshCw, ExternalLink, X, TrendingUp, TrendingDown } from 'lucide-react';
import { useWatchlistContext } from '../contexts/WatchlistContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

function fmt(n: number): string {
  if (!n) return '$0';
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(4)}`;
}

function fmtPrice(n: number): string {
  if (!n) return '$—';
  if (n >= 1) return `$${n.toFixed(3)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  if (n >= 0.0001) return `$${n.toFixed(6)}`;
  return `$${n.toExponential(3)}`;
}

interface WatchlistPanelProps {
  onSelectToken?: (view: string, address: string) => void;
}

export const WatchlistPanel: React.FC<WatchlistPanelProps> = ({ onSelectToken }) => {
  const { entries, liveData, refreshing, lastRefreshed, removeToken, forceRefresh } = useWatchlistContext();

  if (entries.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-50/40 via-white to-white">
        <div className="flex items-center gap-2">
          <Star size={13} className="text-amber-500 fill-amber-400" />
          <span className="text-sm font-semibold text-slate-900">Watchlist</span>
          <span className="text-xs text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded-full">
            {entries.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lastRefreshed && (
            <span className="text-[10px] text-slate-400 font-mono">
              {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            onClick={forceRefresh}
            disabled={refreshing}
            title="Refresh prices"
            className="p-1 rounded hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <RefreshCw size={12} className={cn(refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Token Rows */}
      <div className="divide-y divide-slate-100">
        <AnimatePresence initial={false}>
          {entries.map(entry => {
            const live = liveData[entry.address];
            const change1h = live?.priceChange.h1 ?? null;
            const isUp = change1h !== null && change1h >= 0;

            return (
              <motion.div
                key={entry.address}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-4 py-2.5 flex items-center gap-3 group hover:bg-slate-50 transition-colors">
                  {/* Symbol + Name */}
                  <button
                    onClick={() => onSelectToken?.('solana-intel', entry.address)}
                    className="flex items-center gap-2 min-w-0 flex-1 text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                      {entry.symbol.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">${entry.symbol}</div>
                      <div className="text-[10px] text-slate-400 truncate">{entry.name}</div>
                    </div>
                  </button>

                  {/* Price */}
                  <div className="text-right shrink-0 w-24">
                    <div className="text-sm font-mono font-semibold text-slate-800">
                      {live ? fmtPrice(live.price) : <span className="text-slate-300 animate-pulse">…</span>}
                    </div>
                    {change1h !== null ? (
                      <div className={cn(
                        'text-[10px] font-mono flex items-center justify-end gap-0.5',
                        isUp ? 'text-green-600' : 'text-red-500'
                      )}>
                        {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                        {isUp ? '+' : ''}{change1h.toFixed(1)}% 1h
                      </div>
                    ) : null}
                  </div>

                  {/* Volume */}
                  {live && (
                    <div className="text-right shrink-0 w-20 hidden sm:block">
                      <div className="text-[10px] text-slate-500 font-mono">{fmt(live.volume.h1)}</div>
                      <div className="text-[9px] text-slate-400">1h vol</div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={live?.url ?? `https://dexscreener.com/solana/${entry.address}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      title="Open on DexScreener"
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <ExternalLink size={11} />
                    </a>
                    <button
                      onClick={() => removeToken(entry.address)}
                      title="Remove from watchlist"
                      className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Live refresh footer */}
      <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-1.5 bg-slate-50/50">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[9px] font-mono text-slate-400">AUTO-REFRESH EVERY 30s · DEXSCREENER</span>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ExternalLink, Loader2, Zap, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { ViewId } from '../types';

interface TrendingToken {
  address: string;
  name: string;
  symbol: string;
  icon?: string;
  chainId: string;
  url?: string;
  priceUsd?: number;
  priceChange24h?: number;
  volume24h?: number;
  liquidity?: number;
  source: 'boost' | 'profile';
}

function fmt(n: number): string {
  if (!n) return '–';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtPrice(p: number): string {
  if (!p) return '–';
  if (p < 0.0001) return `$${p.toFixed(8)}`;
  if (p < 0.01)   return `$${p.toFixed(6)}`;
  if (p < 1)      return `$${p.toFixed(4)}`;
  return `$${p.toFixed(2)}`;
}

const CHAIN_LABELS: Record<string, string> = {
  solana:   'SOL',
  ethereum: 'ETH',
  base:     'BASE',
  bsc:      'BNB',
  arbitrum: 'ARB',
  polygon:  'POL',
};

interface Props {
  onNavigate?: (view: ViewId, mint?: string) => void;
}

export const DexTrendingFeed: React.FC<Props> = ({ onNavigate }) => {
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTrending = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch boosts + profiles in parallel
      const [boostRes, profileRes] = await Promise.all([
        fetch('https://api.dexscreener.com/token-boosts/top/v1'),
        fetch('https://api.dexscreener.com/token-profiles/latest/v1'),
      ]);

      const seen = new Set<string>();
      const merged: TrendingToken[] = [];

      if (boostRes.ok) {
        const boostData = await boostRes.json();
        const boosts: any[] = Array.isArray(boostData) ? boostData : (boostData.data ?? boostData.tokenBoosts ?? []);
        for (const item of boosts.slice(0, 15)) {
          const addr = item.tokenAddress ?? item.address;
          if (!addr || seen.has(addr)) continue;
          seen.add(addr);
          merged.push({
            address: addr,
            name:    item.name    ?? item.baseToken?.name   ?? addr.slice(0, 8),
            symbol:  item.symbol  ?? item.baseToken?.symbol ?? '?',
            icon:    item.icon    ?? item.imageUrl ?? item.logo,
            chainId: item.chainId ?? 'unknown',
            url:     item.url,
            source:  'boost',
          });
        }
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        const profiles: any[] = Array.isArray(profileData) ? profileData : (profileData.data ?? profileData.tokenProfiles ?? []);
        for (const item of profiles.slice(0, 15)) {
          const addr = item.tokenAddress ?? item.address;
          if (!addr || seen.has(addr)) continue;
          seen.add(addr);
          merged.push({
            address: addr,
            name:    item.name   ?? item.baseToken?.name   ?? addr.slice(0, 8),
            symbol:  item.symbol ?? item.baseToken?.symbol ?? '?',
            icon:    item.icon   ?? item.imageUrl ?? item.logo,
            chainId: item.chainId ?? 'unknown',
            url:     item.url,
            source:  'profile',
          });
        }
      }

      // Enrich top 10 with live pair data from DexScreener
      const top10 = merged.slice(0, 10);
      const enriched = await Promise.all(
        top10.map(async (token) => {
          try {
            const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token.address}`);
            if (!r.ok) return token;
            const d = await r.json();
            const pair = (d.pairs ?? []).sort((a: any, b: any) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
            if (!pair) return token;
            return {
              ...token,
              name:          pair.baseToken?.name   ?? token.name,
              symbol:        pair.baseToken?.symbol ?? token.symbol,
              priceUsd:      parseFloat(pair.priceUsd ?? '0'),
              priceChange24h: pair.priceChange?.h24 ?? 0,
              volume24h:     pair.volume?.h24  ?? 0,
              liquidity:     pair.liquidity?.usd ?? 0,
              chainId:       pair.chainId ?? token.chainId,
              url:           pair.url ?? token.url,
            };
          } catch {
            return token;
          }
        })
      );

      setTokens(enriched.filter(t => t.name && t.symbol));
      setLastUpdated(new Date());
    } catch (e: any) {
      setError('Failed to load trending data');
      console.error('[DexTrending]', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();
    const interval = setInterval(fetchTrending, 120_000); // refresh every 2 min
    return () => clearInterval(interval);
  }, []);

  const handleCardClick = (token: TrendingToken) => {
    if (onNavigate && token.chainId === 'solana') {
      onNavigate('solana-intel', token.address);
    } else if (token.url) {
      window.open(token.url, '_blank', 'noopener noreferrer');
    }
  };

  return (
    <div className="bg-slate-panel border border-slate-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30">
            <TrendingUp size={16} />
          </div>
          <div>
            <h2 className="text-base font-display font-bold text-slate-900">Trending on DexScreener</h2>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Top Boosted &amp; Featured Tokens</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[9px] text-slate-600 font-mono">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchTrending}
            disabled={loading}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-500 hover:text-slate-900 hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading && tokens.length === 0 ? (
        <div className="flex items-center justify-center py-12 gap-3">
          <Loader2 size={20} className="text-primary animate-spin" />
          <span className="text-slate-500 text-xs font-mono uppercase tracking-widest">Fetching trending tokens...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12 text-red-400 gap-2 text-sm">
          <span>{error}</span>
          <button onClick={fetchTrending} className="underline text-xs">Retry</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-0 divide-x divide-y divide-white/5">
          {tokens.slice(0, 10).map((token, i) => {
            const isUp = (token.priceChange24h ?? 0) >= 0;
            const isSolana = token.chainId === 'solana';
            const chainLabel = CHAIN_LABELS[token.chainId] ?? token.chainId.toUpperCase().slice(0, 4);

            return (
              <button
                key={token.address}
                onClick={() => handleCardClick(token)}
                className="group relative p-4 text-left hover:bg-white/[0.03] transition-all flex flex-col gap-2"
              >
                {/* Rank */}
                <div className="absolute top-3 right-3 text-[9px] font-mono text-slate-700">#{i + 1}</div>

                {/* Token identity */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center text-primary font-bold text-xs">
                    {token.icon ? (
                      <img src={token.icon} alt={token.symbol} className="w-full h-full object-cover" referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : token.symbol[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 group-hover:text-primary transition-colors truncate leading-tight">{token.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono text-primary">${token.symbol}</span>
                      <span className={cn(
                        'px-1 py-0.5 rounded text-[8px] font-bold uppercase',
                        isSolana ? 'bg-violet-500/20 text-violet-400' :
                        token.chainId === 'ethereum' ? 'bg-blue-500/20 text-blue-400' :
                        token.chainId === 'base' ? 'bg-sky-500/20 text-sky-400' :
                        'bg-blue-100 text-slate-500'
                      )}>{chainLabel}</span>
                      {token.source === 'boost' && (
                        <span className="px-1 py-0.5 bg-amber-500/20 text-amber-400 text-[8px] font-bold rounded uppercase">
                          <Zap size={7} className="inline" /> Boost
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-1">
                  {token.priceUsd ? (
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Price</span>
                      <span className="text-xs font-mono font-bold text-slate-900">{fmtPrice(token.priceUsd)}</span>
                    </div>
                  ) : null}
                  {token.priceChange24h !== undefined ? (
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">24h</span>
                      <span className={cn("text-xs font-mono font-bold flex items-center gap-0.5", isUp ? 'text-emerald-400' : 'text-red-400')}>
                        {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {isUp ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                      </span>
                    </div>
                  ) : null}
                  {token.volume24h ? (
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Vol</span>
                      <span className="text-[10px] font-mono text-slate-600">{fmt(token.volume24h)}</span>
                    </div>
                  ) : null}
                </div>

                {/* CTA */}
                <div className={cn(
                  "mt-auto flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity",
                  isSolana ? 'text-primary' : 'text-slate-500'
                )}>
                  {isSolana ? (
                    <><Zap size={10} /> Analyze</>
                  ) : (
                    <><ExternalLink size={10} /> View</>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

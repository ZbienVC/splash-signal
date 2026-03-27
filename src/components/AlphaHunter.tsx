import React, { useState, useEffect } from 'react';
import { Flame, Copy, Check, RefreshCw, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { getTrendingPairs, getNewPairs, DexToken } from '../services/dexscreenerClient';
import { LiveIndicator } from './ui/LiveIndicator';

interface AlphaToken {
  symbol: string;
  name: string;
  address: string;
  chain: string;
  age: string;
  alphaScore: number;
  riskScore: number;
  signal: 'ENTRY' | 'HOLD' | 'EXIT' | 'WATCH';
  mcap: string;
  volume1h: string;
  volumeChange: string;
  holders: number;
  holderChange: string;
  smartWallets: number;
}

const MOCK_ALPHA_TOKENS: AlphaToken[] = [
  {
    symbol: 'PEPE2', name: 'Pepe The Second', address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', chain: 'SOL',
    age: '2h', alphaScore: 87, riskScore: 34, signal: 'ENTRY', mcap: '$89K', volume1h: '$234K', volumeChange: '+847%',
    holders: 342, holderChange: '+67', smartWallets: 3,
  },
  {
    symbol: 'MOON9', name: 'MoonBase Nine', address: '3mNqXvK8wP2sLjF5dTaBcRy7hUoEpGnZqM1iAsDfKL4', chain: 'SOL',
    age: '5h', alphaScore: 74, riskScore: 41, signal: 'ENTRY', mcap: '$142K', volume1h: '$98K', volumeChange: '+312%',
    holders: 512, holderChange: '+48', smartWallets: 2,
  },
  {
    symbol: 'DOGE2', name: 'Doge Reborn', address: '9nKmPoq4XwZtLrB2vYsCdEfHuiJ3OpNqGaWxTkMsVb8', chain: 'SOL',
    age: '1d', alphaScore: 61, riskScore: 55, signal: 'HOLD', mcap: '$567K', volume1h: '$45K', volumeChange: '+78%',
    holders: 1204, holderChange: '+12', smartWallets: 1,
  },
  {
    symbol: 'FROG', name: 'Frog Capital', address: '5bJxKqNmRvPwQoE8yFhT1cDgZiLaS7HuXnApCdMeRt2', chain: 'SOL',
    age: '3h', alphaScore: 43, riskScore: 72, signal: 'WATCH', mcap: '$34K', volume1h: '$19K', volumeChange: '+145%',
    holders: 189, holderChange: '+23', smartWallets: 0,
  },
  {
    symbol: 'WIF2', name: 'Dog Wif Hat 2', address: '2pQsJaXkYnMvBrDo9uFhN6cLgPwRiT4kZmEsAqVoCb7', chain: 'SOL',
    age: '4h', alphaScore: 79, riskScore: 29, signal: 'ENTRY', mcap: '$211K', volume1h: '$312K', volumeChange: '+524%',
    holders: 876, holderChange: '+94', smartWallets: 4,
  },
];

const SIGNAL_STYLE: Record<string, string> = {
  ENTRY: 'text-green-700 bg-green-50 border border-green-200',
  EXIT:  'text-red-700 bg-red-50 border border-red-200',
  WATCH: 'text-amber-700 bg-amber-50 border border-amber-200',
  HOLD:  'text-blue-700 bg-blue-50 border border-blue-200',
};

const scoreColor = (score: number, invert = false) => {
  if (invert) {
    if (score > 70) return 'text-red-600';
    if (score > 40) return 'text-amber-600';
    return 'text-green-600';
  }
  if (score > 70) return 'text-green-600';
  if (score > 40) return 'text-amber-600';
  return 'text-red-600';
};

const scoreDot = (score: number, invert = false) => {
  if (invert) {
    if (score > 70) return 'bg-red-500';
    if (score > 40) return 'bg-amber-500';
    return 'bg-green-500';
  }
  if (score > 70) return 'bg-green-500';
  if (score > 40) return 'bg-amber-500';
  return 'bg-red-500';
};

const CopyAddress: React.FC<{ address: string }> = ({ address }) => {
  const [copied, setCopied] = useState(false);
  const short = `${address.slice(0, 4)}...${address.slice(-4)}`;
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-slate-600 transition-colors">
      {short}
      {copied ? <Check size={10} className="text-green-600" /> : <Copy size={10} />}
    </button>
  );
};

// ── Scoring helpers ──────────────────────────────────────────────────────────

function computeAlphaScore(pair: DexToken): number {
  let score = 0;
  if (pair.priceChange.h1 > 200) score += 30;
  else if (pair.priceChange.h1 > 100) score += 20;
  else if (pair.priceChange.h1 > 50) score += 10;

  const h1Ratio = pair.txns.h1.buys / Math.max(pair.txns.h1.sells, 1);
  if (h1Ratio > 2) score += 20;
  else if (h1Ratio > 1.5) score += 12;
  else if (h1Ratio > 1) score += 5;

  if (pair.ageMinutes < 120) score += 25;
  else if (pair.ageMinutes < 360) score += 15;
  else if (pair.ageMinutes < 1440) score += 5;

  if (pair.liquidity > 50000) score += 10;
  else if (pair.liquidity > 20000) score += 7;
  else if (pair.liquidity > 5000) score += 3;

  const volMcRatio = pair.volume.h1 / Math.max(pair.marketCap, 1);
  if (volMcRatio > 0.5) score += 15;
  else if (volMcRatio > 0.2) score += 8;

  return Math.min(score, 100);
}

function computeRiskScore(pair: DexToken): number {
  let score = 0;
  if (pair.liquidity < 5000) score += 40;
  else if (pair.liquidity < 15000) score += 20;
  else if (pair.liquidity < 30000) score += 10;

  const h1Ratio = pair.txns.h1.buys / Math.max(pair.txns.h1.sells, 1);
  if (h1Ratio < 0.5) score += 30;
  else if (h1Ratio < 0.8) score += 15;

  if (pair.ageMinutes < 30) score += 20;
  else if (pair.ageMinutes < 60) score += 10;

  if (pair.priceChange.h1 > 500) score += 15;

  return Math.min(score, 100);
}

function deriveSignal(alpha: number, risk: number): 'ENTRY' | 'HOLD' | 'EXIT' | 'WATCH' {
  if (alpha > 65 && risk < 45) return 'ENTRY';
  if (risk > 70) return 'EXIT';
  if (alpha > 45 && risk < 60) return 'WATCH';
  return 'HOLD';
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatPercent(n: number): string {
  return n >= 0 ? `+${n.toFixed(0)}%` : `${n.toFixed(0)}%`;
}

// ────────────────────────────────────────────────────────────────────────────

type SortMode = 'alpha' | 'risk' | 'volume';

interface AlphaHunterProps {
  onSelectToken?: (view: string, address: string) => void;
}

export const AlphaHunter: React.FC<AlphaHunterProps> = ({ onSelectToken }) => {
  const [tokens, setTokens] = useState<AlphaToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveData, setIsLiveData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined);
  const [timeFilter, setTimeFilter] = useState<'5m' | '1h' | '6h' | '24h'>('1h');
  const [minAlpha, setMinAlpha] = useState(40);
  const [chainFilter, setChainFilter] = useState<'ALL' | 'SOL' | 'ETH' | 'BSC'>('ALL');
  const [sortMode, setSortMode] = useState<SortMode>('alpha');

  const fetchTokens = async () => {
    setLoading(true);
    try {
      let pairs: DexToken[] = [];

      if (timeFilter === '5m' || timeFilter === '1h') {
        pairs = await getNewPairs(5000);
      } else {
        pairs = await getTrendingPairs('solana');
      }

      if (pairs.length > 0) {
        const alphaTokens = pairs.map(pair => {
          const alpha = computeAlphaScore(pair);
          const risk  = computeRiskScore(pair);
          return {
            symbol: pair.symbol,
            name: pair.name,
            address: pair.address,
            chain: pair.chainLabel,
            age: pair.ageLabel,
            alphaScore: alpha,
            riskScore: risk,
            signal: deriveSignal(alpha, risk),
            mcap: formatUsd(pair.marketCap),
            volume1h: formatUsd(pair.volume.h1),
            volumeChange: formatPercent(pair.priceChange.h1),
            holders: 0,
            holderChange: '-',
            smartWallets: 0,
          } satisfies AlphaToken;
        });

        setTokens(alphaTokens.filter(t => t.alphaScore >= minAlpha));
        setIsLiveData(true);
        setLastUpdated(new Date());
      } else {
        setTokens(MOCK_ALPHA_TOKENS);
        setIsLiveData(false);
      }
    } catch {
      setTokens(MOCK_ALPHA_TOKENS);
      setIsLiveData(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchTokens(); }, [minAlpha, timeFilter]);

  const filtered = tokens
    .filter(t => t.alphaScore >= minAlpha)
    .filter(t => chainFilter === 'ALL' || t.chain === chainFilter)
    .sort((a, b) => {
      if (sortMode === 'risk')   return b.riskScore - a.riskScore;
      if (sortMode === 'volume') return parseFloat(b.volumeChange) - parseFloat(a.volumeChange);
      return b.alphaScore - a.alphaScore;
    });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="p-6 flex flex-col gap-4 min-h-[calc(100vh-52px)]"
    >
      {/* Main card — fills remaining height */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex-1 flex flex-col">
        {/* Blue gradient header */}
        <div className="px-6 py-4 bg-gradient-to-r from-white via-blue-50/20 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-500/30">
              <Flame size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Alpha Hunter</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <LiveIndicator isLive={isLiveData} lastUpdated={lastUpdated} />
              </div>
            </div>
          </div>
          <button
            onClick={() => { void fetchTokens(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3 flex-wrap">
          <select
            value={timeFilter}
            onChange={e => setTimeFilter(e.target.value as typeof timeFilter)}
            className="h-7 px-2 text-xs bg-white border border-slate-200 rounded text-slate-600 focus:outline-none focus:border-blue-400"
          >
            {(['5m', '1h', '6h', '24h'] as const).map(t => (
              <option key={t} value={t}>Time: {t}</option>
            ))}
          </select>

          <select
            value={minAlpha}
            onChange={e => setMinAlpha(Number(e.target.value))}
            className="h-7 px-2 text-xs bg-white border border-slate-200 rounded text-slate-600 focus:outline-none focus:border-blue-400"
          >
            {[0, 20, 40, 60, 80].map(v => (
              <option key={v} value={v}>Min Alpha: {v}+</option>
            ))}
          </select>

          <select
            value={chainFilter}
            onChange={e => setChainFilter(e.target.value as typeof chainFilter)}
            className="h-7 px-2 text-xs bg-white border border-slate-200 rounded text-slate-600 focus:outline-none focus:border-blue-400"
          >
            {(['ALL', 'SOL', 'ETH', 'BSC'] as const).map(c => (
              <option key={c} value={c}>Chain: {c}</option>
            ))}
          </select>

          <select
            value={sortMode}
            onChange={e => setSortMode(e.target.value as SortMode)}
            className="h-7 px-2 text-xs bg-white border border-slate-200 rounded text-slate-600 focus:outline-none focus:border-blue-400"
          >
            <option value="alpha">Sort: Alpha</option>
            <option value="risk">Sort: Risk</option>
            <option value="volume">Sort: Volume</option>
          </select>

          <span className="ml-auto text-xs text-slate-400">Showing {filtered.length} tokens</span>
        </div>

        {/* Table area — flex-1 fills remaining */}
        {loading ? (
          <div className="p-4 space-y-2 flex-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded animate-skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="border border-dashed border-slate-300 rounded-lg p-12 text-center w-full max-w-sm">
              <p className="text-sm text-slate-500">No tokens match your filters</p>
              <button
                onClick={() => { setMinAlpha(0); setChainFilter('ALL'); }}
                className="mt-3 px-3 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Reset filters
              </button>
            </div>
          </div>
        ) : (
        <div className="flex-1 overflow-auto">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['TOKEN', 'SIGNAL', 'α SCORE', 'RISK', 'MC', 'VOL 1H', 'Δ VOL', 'HOLDERS', 'SMART $', ''].map(col => (
                    <th key={col} className="px-4 py-2.5 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((token) => (
                  <tr
                    key={token.address}
                    onClick={() => onSelectToken?.('solana-intel', token.address)}
                    className="border-b border-slate-100 last:border-0 table-row-hover cursor-pointer transition-colors"
                  >
                    {/* TOKEN */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">${token.symbol}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400">{token.age}</span>
                          <CopyAddress address={token.address} />
                        </div>
                      </div>
                    </td>

                    {/* SIGNAL */}
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold font-mono', SIGNAL_STYLE[token.signal])}>
                        {token.signal}
                      </span>
                    </td>

                    {/* α SCORE */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', scoreDot(token.alphaScore))} />
                        <span className={cn('text-sm font-bold num', scoreColor(token.alphaScore))}>
                          {token.alphaScore}
                        </span>
                      </div>
                    </td>

                    {/* RISK */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', scoreDot(token.riskScore, true))} />
                        <span className={cn('text-sm font-bold num', scoreColor(token.riskScore, true))}>
                          {token.riskScore}
                        </span>
                      </div>
                    </td>

                    {/* MC */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-slate-700 num">{token.mcap}</span>
                    </td>

                    {/* VOL 1H */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-slate-700 num">{token.volume1h}</span>
                    </td>

                    {/* Δ VOL */}
                    <td className="px-4 py-3">
                      <span className={cn('text-sm font-medium num', token.volumeChange.startsWith('+') ? 'text-green-600' : 'text-red-600')}>
                        {token.volumeChange}
                      </span>
                    </td>

                    {/* HOLDERS */}
                    <td className="px-4 py-3">
                      {token.holders > 0 ? (
                        <>
                          <span className="text-sm text-slate-700 num">{token.holders.toLocaleString()}</span>
                          <span className="text-[10px] text-green-600 ml-1">{token.holderChange}</span>
                        </>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>

                    {/* SMART $ */}
                    <td className="px-4 py-3">
                      {token.smartWallets > 0 ? (
                        <span className="text-sm text-slate-700 num">{token.smartWallets}</span>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>

                    {/* ACTION */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-0.5 text-xs text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap">
                        View <ChevronRight size={12} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {filtered.map((token) => (
              <div
                key={token.address}
                onClick={() => onSelectToken?.('solana-intel', token.address)}
                className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-bold text-slate-900">${token.symbol}</span>
                    <span className="text-xs text-slate-400 ml-2">{token.age}</span>
                  </div>
                  <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold', SIGNAL_STYLE[token.signal])}>
                    {token.signal}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>α <span className={scoreColor(token.alphaScore)}>{token.alphaScore}</span></span>
                  <span>Risk <span className={scoreColor(token.riskScore, true)}>{token.riskScore}</span></span>
                  <span>{token.mcap}</span>
                  <span className="ml-auto text-blue-600">View →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
    </motion.div>
  );
};

export default AlphaHunter;

import React, { useState, useEffect } from 'react';
import { Flame, Copy, Check, RefreshCw, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

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
  ENTRY: 'text-green-400 bg-green-900/30',
  EXIT:  'text-red-400 bg-red-900/30',
  WATCH: 'text-amber-400 bg-amber-900/30',
  HOLD:  'text-blue-400 bg-blue-900/30',
};

const scoreColor = (score: number, invert = false) => {
  if (invert) {
    if (score > 70) return 'text-red-400';
    if (score > 40) return 'text-amber-400';
    return 'text-green-400';
  }
  if (score > 70) return 'text-green-400';
  if (score > 40) return 'text-amber-400';
  return 'text-red-400';
};

const scoreDot = (score: number, invert = false) => {
  if (invert) {
    if (score > 70) return 'bg-red-400';
    if (score > 40) return 'bg-amber-400';
    return 'bg-green-400';
  }
  if (score > 70) return 'bg-green-400';
  if (score > 40) return 'bg-amber-400';
  return 'bg-red-400';
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
    <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] font-mono text-[#475569] hover:text-[#94A3B8] transition-colors">
      {short}
      {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
    </button>
  );
};

type SortMode = 'alpha' | 'risk' | 'volume';

interface AlphaHunterProps {
  onSelectToken?: (view: string, address: string) => void;
}

export const AlphaHunter: React.FC<AlphaHunterProps> = ({ onSelectToken }) => {
  const [tokens, setTokens] = useState<AlphaToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'5m' | '1h' | '6h' | '24h'>('1h');
  const [minAlpha, setMinAlpha] = useState(40);
  const [chainFilter, setChainFilter] = useState<'ALL' | 'SOL' | 'ETH' | 'BSC'>('ALL');
  const [sortMode, setSortMode] = useState<SortMode>('alpha');

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tokens/discover?minAlpha=${minAlpha}&limit=50`);
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      setTokens(data);
    } catch {
      setTokens(MOCK_ALPHA_TOKENS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTokens(); }, [minAlpha]);

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
      className="p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-[#94A3B8]" />
          <h1 className="text-base font-semibold text-[#F1F5F9]">Alpha Hunter</h1>
        </div>
        <button
          onClick={fetchTokens}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] border border-[#1E2A3A] rounded-lg text-xs text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={timeFilter}
          onChange={e => setTimeFilter(e.target.value as typeof timeFilter)}
          className="h-7 px-2 text-xs bg-[#111827] border border-[#1E2A3A] rounded text-[#94A3B8] focus:outline-none focus:border-blue-500"
        >
          {(['5m', '1h', '6h', '24h'] as const).map(t => (
            <option key={t} value={t}>Time: {t}</option>
          ))}
        </select>

        <select
          value={minAlpha}
          onChange={e => setMinAlpha(Number(e.target.value))}
          className="h-7 px-2 text-xs bg-[#111827] border border-[#1E2A3A] rounded text-[#94A3B8] focus:outline-none focus:border-blue-500"
        >
          {[0, 20, 40, 60, 80].map(v => (
            <option key={v} value={v}>Min Alpha: {v}+</option>
          ))}
        </select>

        <select
          value={chainFilter}
          onChange={e => setChainFilter(e.target.value as typeof chainFilter)}
          className="h-7 px-2 text-xs bg-[#111827] border border-[#1E2A3A] rounded text-[#94A3B8] focus:outline-none focus:border-blue-500"
        >
          {(['ALL', 'SOL', 'ETH', 'BSC'] as const).map(c => (
            <option key={c} value={c}>Chain: {c}</option>
          ))}
        </select>

        <select
          value={sortMode}
          onChange={e => setSortMode(e.target.value as SortMode)}
          className="h-7 px-2 text-xs bg-[#111827] border border-[#1E2A3A] rounded text-[#94A3B8] focus:outline-none focus:border-blue-500"
        >
          <option value="alpha">Sort: Alpha</option>
          <option value="risk">Sort: Risk</option>
          <option value="volume">Sort: Volume</option>
        </select>

        <span className="ml-auto text-xs text-[#475569]">Showing {filtered.length} tokens</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-[#111827] rounded animate-skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-[#1E2A3A] rounded-lg p-12 text-center">
          <p className="text-sm text-[#475569]">No tokens match your filters</p>
          <button
            onClick={() => { setMinAlpha(0); setChainFilter('ALL'); }}
            className="mt-3 px-3 py-1.5 text-xs text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition-colors"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="bg-[#111827] border border-[#1E2A3A] rounded-lg overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1E2A3A]">
                  {['TOKEN', 'SIGNAL', 'α SCORE', 'RISK', 'MC', 'VOL 1H', 'Δ VOL', 'HOLDERS', 'SMART $', ''].map(col => (
                    <th key={col} className="px-4 py-2.5 text-left text-[10px] font-medium text-[#475569] uppercase tracking-wide whitespace-nowrap">
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
                    className="border-b border-[#1E2A3A] last:border-0 table-row-hover cursor-pointer transition-colors"
                  >
                    {/* TOKEN */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#F1F5F9]">${token.symbol}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-[#475569]">{token.age}</span>
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
                      <span className="text-sm text-[#F1F5F9] num">{token.mcap}</span>
                    </td>

                    {/* VOL 1H */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-[#F1F5F9] num">{token.volume1h}</span>
                    </td>

                    {/* Δ VOL */}
                    <td className="px-4 py-3">
                      <span className={cn('text-sm font-medium num', token.volumeChange.startsWith('+') ? 'text-green-400' : 'text-red-400')}>
                        {token.volumeChange}
                      </span>
                    </td>

                    {/* HOLDERS */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-[#F1F5F9] num">{token.holders.toLocaleString()}</span>
                      <span className="text-[10px] text-green-400 ml-1">{token.holderChange}</span>
                    </td>

                    {/* SMART $ */}
                    <td className="px-4 py-3">
                      {token.smartWallets > 0 ? (
                        <span className="text-sm text-[#F1F5F9] num">{token.smartWallets}</span>
                      ) : (
                        <span className="text-sm text-[#475569]">—</span>
                      )}
                    </td>

                    {/* ACTION */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-0.5 text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap">
                        View <ChevronRight size={12} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-[#1E2A3A]">
            {filtered.map((token) => (
              <div
                key={token.address}
                onClick={() => onSelectToken?.('solana-intel', token.address)}
                className="p-4 cursor-pointer hover:bg-[#1A2234] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-bold text-[#F1F5F9]">${token.symbol}</span>
                    <span className="text-xs text-[#475569] ml-2">{token.age}</span>
                  </div>
                  <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold', SIGNAL_STYLE[token.signal])}>
                    {token.signal}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
                  <span>α <span className={scoreColor(token.alphaScore)}>{token.alphaScore}</span></span>
                  <span>Risk <span className={scoreColor(token.riskScore, true)}>{token.riskScore}</span></span>
                  <span>{token.mcap}</span>
                  <span className="ml-auto text-blue-400">View →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AlphaHunter;

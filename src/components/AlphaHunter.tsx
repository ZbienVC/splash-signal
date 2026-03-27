import React, { useState, useEffect } from 'react';
import { Flame, Eye, TrendingUp, Shield, Zap, Copy, Check, RefreshCw } from 'lucide-react';
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
    symbol: 'PEPE2',
    name: 'Pepe The Second',
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    chain: 'SOL',
    age: '2h old',
    alphaScore: 87,
    riskScore: 34,
    signal: 'ENTRY',
    mcap: '$89K',
    volume1h: '$234K',
    volumeChange: '+847%',
    holders: 342,
    holderChange: '+67 in 1h',
    smartWallets: 3,
  },
  {
    symbol: 'MOON9',
    name: 'MoonBase Nine',
    address: '3mNqXvK8wP2sLjF5dTaBcRy7hUoEpGnZqM1iAsDfKL4',
    chain: 'SOL',
    age: '5h old',
    alphaScore: 74,
    riskScore: 41,
    signal: 'ENTRY',
    mcap: '$142K',
    volume1h: '$98K',
    volumeChange: '+312%',
    holders: 512,
    holderChange: '+48 in 1h',
    smartWallets: 2,
  },
  {
    symbol: 'DOGE2',
    name: 'Doge Reborn',
    address: '9nKmPoq4XwZtLrB2vYsCdEfHuiJ3OpNqGaWxTkMsVb8',
    chain: 'SOL',
    age: '1d old',
    alphaScore: 61,
    riskScore: 55,
    signal: 'HOLD',
    mcap: '$567K',
    volume1h: '$45K',
    volumeChange: '+78%',
    holders: 1204,
    holderChange: '+12 in 1h',
    smartWallets: 1,
  },
  {
    symbol: 'FROG',
    name: 'Frog Capital',
    address: '5bJxKqNmRvPwQoE8yFhT1cDgZiLaS7HuXnApCdMeRt2',
    chain: 'SOL',
    age: '3h old',
    alphaScore: 43,
    riskScore: 72,
    signal: 'WATCH',
    mcap: '$34K',
    volume1h: '$19K',
    volumeChange: '+145%',
    holders: 189,
    holderChange: '+23 in 1h',
    smartWallets: 0,
  },
  {
    symbol: 'WIF2',
    name: 'Dog Wif Hat 2',
    address: '2pQsJaXkYnMvBrDo9uFhN6cLgPwRiT4kZmEsAqVoCb7',
    chain: 'SOL',
    age: '4h old',
    alphaScore: 79,
    riskScore: 29,
    signal: 'ENTRY',
    mcap: '$211K',
    volume1h: '$312K',
    volumeChange: '+524%',
    holders: 876,
    holderChange: '+94 in 1h',
    smartWallets: 4,
  },
];

const getAlphaColor = (score: number) =>
  score > 70 ? 'text-emerald-400' : score > 40 ? 'text-amber-400' : 'text-red-400';

const getRiskColor = (score: number) =>
  score > 70 ? 'text-red-400' : score > 40 ? 'text-amber-400' : 'text-emerald-400';

const SIGNAL_CONFIG = {
  ENTRY: { emoji: '🔥', label: 'ENTRY', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  HOLD:  { emoji: '✅', label: 'HOLD',  cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  EXIT:  { emoji: '🚨', label: 'EXIT',  cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  WATCH: { emoji: '👀', label: 'WATCH', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
};

const CHAIN_COLORS: Record<string, string> = {
  SOL: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  ETH: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  BSC: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
};

interface AlphaHunterProps {
  onSelectToken?: (view: string, address: string) => void;
}

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
    <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors">
      {short}
      {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
    </button>
  );
};

export const AlphaHunter: React.FC<AlphaHunterProps> = ({ onSelectToken }) => {
  const [tokens, setTokens] = useState<AlphaToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'5m' | '1h' | '6h' | '24h'>('1h');
  const [minAlpha, setMinAlpha] = useState(40);
  const [chainFilter, setChainFilter] = useState<'ALL' | 'SOL' | 'ETH' | 'BSC'>('ALL');

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
    .sort((a, b) => b.alphaScore - a.alphaScore);

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Flame size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">Alpha Hunter</h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Early momentum detection</p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchTokens}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:border-primary/50 transition-all"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          REFRESH
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-900/50 border border-slate-700 rounded-2xl">
        {/* Time Filter */}
        <div className="flex items-center gap-1">
          {(['5m', '1h', '6h', '24h'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all',
                timeFilter === t ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-300'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-slate-700" />

        {/* Alpha Score Slider */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Min Alpha</span>
          <input
            type="range"
            min={0}
            max={90}
            step={5}
            value={minAlpha}
            onChange={e => setMinAlpha(Number(e.target.value))}
            className="w-28 accent-primary"
          />
          <span className={cn('text-sm font-bold font-mono', getAlphaColor(minAlpha))}>{minAlpha}</span>
        </div>

        <div className="h-5 w-px bg-slate-700" />

        {/* Chain Filter */}
        <div className="flex items-center gap-1">
          {(['ALL', 'SOL', 'ETH', 'BSC'] as const).map(c => (
            <button
              key={c}
              onClick={() => setChainFilter(c)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all',
                chainFilter === c ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-300'
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="ml-auto text-[10px] font-mono text-slate-500">
          {filtered.length} tokens
        </div>
      </div>

      {/* Token Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-800/50 rounded-2xl animate-pulse border border-slate-700" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((token, i) => {
            const sig = SIGNAL_CONFIG[token.signal];
            return (
              <motion.div
                key={token.address}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onSelectToken?.('solana-intel', token.address)}
                className="bg-slate-900/60 border border-slate-700 rounded-2xl p-5 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                {/* Token Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-display font-bold text-white">${token.symbol}</span>
                      <span className={cn('px-2 py-0.5 rounded border text-[9px] font-bold uppercase', CHAIN_COLORS[token.chain] ?? 'bg-slate-700 text-slate-400')}>
                        {token.chain}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <CopyAddress address={token.address} />
                      <span className="text-[9px] text-slate-600 font-mono">• {token.age}</span>
                    </div>
                  </div>
                  <span className={cn('px-2.5 py-1 rounded-lg border text-[10px] font-bold', sig.cls)}>
                    {sig.emoji} {sig.label}
                  </span>
                </div>

                {/* Alpha + Risk Scores */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-black/20 rounded-xl p-3 text-center">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Alpha Score</div>
                    <div className={cn('text-2xl font-display font-bold', getAlphaColor(token.alphaScore))}>
                      {token.alphaScore}
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-xl p-3 text-center">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Risk Score</div>
                    <div className={cn('text-2xl font-display font-bold', getRiskColor(token.riskScore))}>
                      {token.riskScore}
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div>
                    <div className="text-[9px] text-slate-600 uppercase tracking-wide">MCap</div>
                    <div className="text-xs font-bold text-white">{token.mcap}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-600 uppercase tracking-wide">Vol 1h</div>
                    <div className="text-xs font-bold text-white">{token.volume1h}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-600 uppercase tracking-wide">Vol Δ</div>
                    <div className="text-xs font-bold text-emerald-400">{token.volumeChange}</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-700/50 text-[10px] text-slate-500">
                  <span>{token.holders.toLocaleString()} holders <span className="text-emerald-400">{token.holderChange}</span></span>
                  {token.smartWallets > 0 && (
                    <span className="flex items-center gap-1 text-primary font-bold">
                      <Shield size={10} />
                      {token.smartWallets} smart {token.smartWallets === 1 ? 'wallet' : 'wallets'} in
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AlphaHunter;

import React, { useState } from 'react';
import { Radio, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SignalItem {
  emoji: string;
  title: string;
  token: string;
  description: string;
  action: 'ENTRY' | 'EXIT' | 'WATCH' | 'WARNING';
  confidence: number;
  timeAgo: string;
  chain: string;
  address?: string;
}

const MOCK_SIGNALS: SignalItem[] = [
  {
    emoji: '🔥',
    title: 'Early Entry Signal',
    token: '$PEPE2',
    description: '3 smart wallets entered + volume up 847% in 1h',
    action: 'ENTRY',
    confidence: 0.87,
    timeAgo: '2 min ago',
    chain: 'SOL',
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  },
  {
    emoji: '🚨',
    title: 'Dump Risk Increasing',
    token: '$RUGME',
    description: 'Dev sold $12K, top 3 holders reducing positions',
    action: 'EXIT',
    confidence: 0.91,
    timeAgo: '5 min ago',
    chain: 'SOL',
    address: '3mNqXvK8wP2sLjF5dTaBcRy7hUoEpGnZqM1iAsDfKL4',
  },
  {
    emoji: '⚠️',
    title: 'Whale Distribution',
    token: '$MOON',
    description: 'Top whale reduced position by 23% in past 4 hours',
    action: 'WATCH',
    confidence: 0.72,
    timeAgo: '12 min ago',
    chain: 'ETH',
    address: '9nKmPoq4XwZtLrB2vYsCdEfHuiJ3OpNqGaWxTkMsVb8',
  },
  {
    emoji: '✅',
    title: 'Smart Money Entry',
    token: '$DOGE2',
    description: '2 high-scoring wallets entered at $45K market cap',
    action: 'ENTRY',
    confidence: 0.78,
    timeAgo: '18 min ago',
    chain: 'SOL',
    address: '5bJxKqNmRvPwQoE8yFhT1cDgZiLaS7HuXnApCdMeRt2',
  },
  {
    emoji: '⚠️',
    title: 'Sniper Exit Warning',
    token: '$FOMO',
    description: '4 sniper wallets exiting simultaneously — possible exit liquidity',
    action: 'WATCH',
    confidence: 0.65,
    timeAgo: '24 min ago',
    chain: 'SOL',
    address: '2pQsJaXkYnMvBrDo9uFhN6cLgPwRiT4kZmEsAqVoCb7',
  },
  {
    emoji: '🔥',
    title: 'Volume Surge Detected',
    token: '$WIF2',
    description: 'Volume up 524% with holder growth — narrative forming',
    action: 'ENTRY',
    confidence: 0.81,
    timeAgo: '31 min ago',
    chain: 'SOL',
    address: '4fRmXvK8wP2sLjF5dTaBcRy7hUoEpGnZqM1iAsDfKL5',
  },
  {
    emoji: '🚨',
    title: 'LP Removal Risk',
    token: '$FROG',
    description: 'Locked LP expires in 4h — dev wallet activity spiking',
    action: 'EXIT',
    confidence: 0.88,
    timeAgo: '44 min ago',
    chain: 'SOL',
    address: '6cSnKpL9xQ3tMmD4eUbFy8hViJkOpNqGbWzTlMtPa7c',
  },
];

type FilterType = 'ALL' | 'ENTRY' | 'EXIT' | 'WARNING' | 'WATCH';

const FILTER_TABS: { id: FilterType; label: string; emoji: string }[] = [
  { id: 'ALL',     label: 'ALL',     emoji: '' },
  { id: 'ENTRY',   label: 'ENTRY',   emoji: '🔥' },
  { id: 'EXIT',    label: 'EXIT',    emoji: '🚨' },
  { id: 'WARNING', label: 'WARNING', emoji: '⚠️' },
  { id: 'WATCH',   label: 'WATCH',   emoji: '👀' },
];

const CARD_STYLES: Record<string, string> = {
  ENTRY:   'border-l-emerald-500 shadow-[inset_2px_0_0_0_rgba(16,185,129,0.5)]',
  EXIT:    'border-l-red-500 shadow-[inset_2px_0_0_0_rgba(239,68,68,0.5)]',
  WATCH:   'border-l-blue-500 shadow-[inset_2px_0_0_0_rgba(59,130,246,0.5)]',
  WARNING: 'border-l-amber-500 shadow-[inset_2px_0_0_0_rgba(245,158,11,0.5)]',
};

const CHAIN_BADGE: Record<string, string> = {
  SOL: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  ETH: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  BSC: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
};

interface SignalFeedProps {
  onSelectToken?: (view: string, address: string) => void;
}

export const SignalFeed: React.FC<SignalFeedProps> = ({ onSelectToken }) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  const filtered = MOCK_SIGNALS.filter(s => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'WARNING') return s.action === 'WATCH';
    return s.action === activeFilter;
  });

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Radio size={22} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-white">Signal Feed</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">LIVE</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Real-time trading intelligence</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1.5',
              activeFilter === tab.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
            )}
          >
            {tab.emoji && <span>{tab.emoji}</span>}
            {tab.label}
          </button>
        ))}
        <span className="ml-auto text-[10px] font-mono text-slate-500">{filtered.length} signals</span>
      </div>

      {/* Signal Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((signal, i) => (
            <motion.div
              key={`${signal.token}-${signal.timeAgo}`}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                'bg-slate-900/60 border border-slate-700 border-l-4 rounded-2xl p-5 transition-all hover:bg-slate-800/40',
                CARD_STYLES[signal.action] ?? CARD_STYLES.WATCH
              )}
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-0.5">{signal.emoji}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{signal.title}</span>
                        <span className="text-sm font-bold text-primary">{signal.token}</span>
                        <span className={cn('px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase', CHAIN_BADGE[signal.chain] ?? 'bg-slate-700 text-slate-400')}>
                          {signal.chain}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{signal.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-slate-500 font-mono">{signal.timeAgo}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {Math.round(signal.confidence * 100)}% conf
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Confidence bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-600 uppercase tracking-widest">Confidence</span>
                      <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            signal.confidence > 0.8 ? 'bg-emerald-500' : signal.confidence > 0.6 ? 'bg-amber-400' : 'bg-slate-500'
                          )}
                          style={{ width: `${signal.confidence * 100}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => signal.address && onSelectToken?.('solana-intel', signal.address)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white hover:border-primary/50 transition-all"
                    >
                      Investigate <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SignalFeed;

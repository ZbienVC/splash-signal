import React, { useState } from 'react';
import { Radio, ArrowRight, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { DistributionStateBadge, DistributionState } from './ui/DistributionStateBadge';

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
  expiresAt?: string; // e.g. "in 47m"
  reasons?: string[];
  distributionState?: DistributionState;
}

const MOCK_SIGNALS: SignalItem[] = [
  {
    emoji: '🔥', title: 'Early Entry Signal', token: '$PEPE2', description: '3 smart wallets entered + volume up 847% in 1h',
    action: 'ENTRY', confidence: 0.87, timeAgo: '2 min ago', chain: 'SOL', address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    expiresAt: 'in 58m', distributionState: 'HEALTHY_ACCUMULATION',
    reasons: ['3 smart wallets entered simultaneously', 'Volume up 847% vs 1h average', 'Holder count growing +67 in 1h', 'No dev wallet activity detected'],
  },
  {
    emoji: '🚨', title: 'Dump Risk Increasing', token: '$RUGME', description: 'Dev sold $12K, top 3 holders reducing positions',
    action: 'EXIT', confidence: 0.91, timeAgo: '5 min ago', chain: 'SOL', address: '3mNqXvK8wP2sLjF5dTaBcRy7hUoEpGnZqM1iAsDfKL4',
    expiresAt: 'in 25m', distributionState: 'HIGH_DUMP_RISK',
    reasons: ['Dev wallet transferred $12K to fresh address', 'Top 3 holders reduced by 18% combined', 'Buy/sell ratio dropped to 0.31', 'Volume down 34% from peak'],
  },
  {
    emoji: '⚠️', title: 'Whale Distribution', token: '$MOON', description: 'Top whale reduced position by 23% in past 4 hours',
    action: 'WATCH', confidence: 0.72, timeAgo: '12 min ago', chain: 'ETH', address: '9nKmPoq4XwZtLrB2vYsCdEfHuiJ3OpNqGaWxTkMsVb8',
    distributionState: 'EARLY_DISTRIBUTION',
    reasons: ['Top whale (rank #2) sold 23% of position', 'No other whales distributing yet', 'Volume still stable'],
  },
  {
    emoji: '✅', title: 'Smart Money Entry', token: '$DOGE2', description: '2 high-scoring wallets entered at $45K market cap',
    action: 'ENTRY', confidence: 0.78, timeAgo: '18 min ago', chain: 'SOL', address: '5bJxKqNmRvPwQoE8yFhT1cDgZiLaS7HuXnApCdMeRt2',
    expiresAt: 'in 42m', distributionState: 'WATCH_FOR_ROTATION',
    reasons: ['Wallet #1 (score 94) bought $8K', 'Wallet #2 (score 88) bought $5.2K', 'MC still at $45K — early entry window'],
  },
  {
    emoji: '⚠️', title: 'Sniper Exit Warning', token: '$FOMO', description: '4 sniper wallets exiting simultaneously — possible exit liquidity',
    action: 'WATCH', confidence: 0.65, timeAgo: '24 min ago', chain: 'SOL', address: '2pQsJaXkYnMvBrDo9uFhN6cLgPwRiT4kZmEsAqVoCb7',
    distributionState: 'ACTIVE_DISTRIBUTION',
    reasons: ['4 sniper wallets exiting same block', 'Pattern matches coordinated exit', 'Retail buy pressure still present'],
  },
  {
    emoji: '🔥', title: 'Volume Surge Detected', token: '$WIF2', description: 'Volume up 524% with holder growth — narrative forming',
    action: 'ENTRY', confidence: 0.81, timeAgo: '31 min ago', chain: 'SOL', address: '4fRmXvK8wP2sLjF5dTaBcRy7hUoEpGnZqM1iAsDfKL5',
    expiresAt: 'in 29m', distributionState: 'HEALTHY_ACCUMULATION',
    reasons: ['Volume 524% above 1h average', 'Holder count +94 in last hour', '4 smart wallets holding positions', 'No exit signals detected'],
  },
  {
    emoji: '🚨', title: 'LP Removal Risk', token: '$FROG', description: 'Locked LP expires in 4h — dev wallet activity spiking',
    action: 'EXIT', confidence: 0.88, timeAgo: '44 min ago', chain: 'SOL', address: '6cSnKpL9xQ3tMmD4eUbFy8hViJkOpNqGbWzTlMtPa7c',
    distributionState: 'HIGH_DUMP_RISK',
    reasons: ['LP lock expires in 4h 12m', 'Dev wallet made 3 transactions in last hour', 'Top holders reducing positions'],
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
  ENTRY:   'border-l-emerald-500 bg-emerald-500/[0.03]',
  EXIT:    'border-l-red-500 bg-red-500/[0.03]',
  WATCH:   'border-l-amber-500 bg-amber-500/[0.03]',
  WARNING: 'border-l-amber-500 bg-amber-500/[0.03]',
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
  const [expandedReasons, setExpandedReasons] = useState<Set<string>>(new Set());
  const [seenSignals, setSeenSignals] = useState<Set<string>>(new Set());

  const filtered = MOCK_SIGNALS.filter(s => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'WARNING') return s.action === 'WATCH';
    return s.action === activeFilter;
  });

  const toggleReasons = (key: string) => {
    setExpandedReasons(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const markSeen = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSeenSignals(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-[#00D2FF]/10 text-[#00D2FF] flex items-center justify-center">
          <Radio size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-[#E6EDF3] tracking-tight">Signal Feed</h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">LIVE</span>
            </div>
          </div>
          <p className="text-xs text-[#484F58] uppercase tracking-[0.12em] font-mono">Real-time trading intelligence</p>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1.5 border',
              activeFilter === tab.id
                ? tab.id === 'ENTRY' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : tab.id === 'EXIT' ? 'bg-red-500/15 text-red-400 border-red-500/30'
                : tab.id === 'WARNING' || tab.id === 'WATCH' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-[#161B22] text-[#E6EDF3] border-[#30363D]'
                : 'bg-transparent text-[#484F58] border-[#21262D] hover:text-[#8B949E] hover:border-[#30363D]'
            )}
          >
            {tab.emoji && <span>{tab.emoji}</span>}
            {tab.label}
          </button>
        ))}
        <span className="ml-auto text-[10px] font-mono text-[#484F58]">{filtered.length} signals</span>
      </div>

      {/* Signal Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((signal, i) => {
            const key = `${signal.token}-${signal.timeAgo}`;
            const reasonsOpen = expandedReasons.has(key);
            const isSeen = seenSignals.has(key);

            return (
              <motion.div
                key={key}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  'bg-[#0D1117] border border-[#21262D] border-l-4 rounded-xl p-5 transition-all',
                  isSeen ? 'opacity-60' : 'hover:border-[#30363D] hover:bg-[#161B22]/50',
                  CARD_STYLES[signal.action] ?? CARD_STYLES.WATCH
                )}
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl mt-0.5">{signal.emoji}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-[#E6EDF3]">{signal.title}</span>
                          <span className="text-sm font-semibold text-[#00D2FF]">{signal.token}</span>
                          <span className={cn('px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase', CHAIN_BADGE[signal.chain] ?? 'bg-[#1C2128] text-[#8B949E]')}>
                            {signal.chain}
                          </span>
                          {signal.distributionState && (
                            <DistributionStateBadge state={signal.distributionState} size="sm" />
                          )}
                        </div>
                        <p className="text-xs text-[#8B949E] mt-1 leading-relaxed">{signal.description}</p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <div className="text-[10px] text-[#484F58] font-mono">{signal.timeAgo}</div>
                        {signal.expiresAt && (
                          <div className="text-[9px] font-bold text-amber-500 font-mono">⏱ expires {signal.expiresAt}</div>
                        )}
                        {/* Mark as seen */}
                        <button
                          onClick={e => markSeen(key, e)}
                          title="Mark as seen"
                          className={cn(
                            'w-6 h-6 rounded-full border flex items-center justify-center transition-all',
                            isSeen
                              ? 'bg-emerald-900/30 border-emerald-600/40 text-emerald-400'
                              : 'bg-[#161B22] border-[#30363D] text-[#484F58] hover:border-[#484F58] hover:text-[#8B949E]'
                          )}
                        >
                          <Check size={10} />
                        </button>
                      </div>
                    </div>

                    {/* Confidence bar */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[9px] text-[#484F58] uppercase tracking-widest whitespace-nowrap">Confidence</span>
                      <div className="flex-1 h-1 bg-[#1C2128] rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            signal.confidence > 0.8 ? 'bg-emerald-500' : signal.confidence > 0.6 ? 'bg-amber-400' : 'bg-[#484F58]'
                          )}
                          style={{ width: `${signal.confidence * 100}%` }}
                        />
                      </div>
                      <span className={cn(
                        'text-[10px] font-bold font-mono shrink-0',
                        signal.confidence > 0.8 ? 'text-emerald-400' : signal.confidence > 0.6 ? 'text-amber-400' : 'text-[#8B949E]'
                      )}>
                        {Math.round(signal.confidence * 100)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 gap-2">
                      {/* Reasons toggle */}
                      {signal.reasons && signal.reasons.length > 0 && (
                        <button
                          onClick={() => toggleReasons(key)}
                          className="flex items-center gap-1 text-[10px] font-bold text-[#484F58] hover:text-[#8B949E] transition-colors"
                        >
                          {reasonsOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          {reasonsOpen ? 'Hide reasons' : `${signal.reasons.length} reasons`}
                        </button>
                      )}

                      <button
                        onClick={() => signal.address && onSelectToken?.('solana-intel', signal.address)}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#161B22] border border-[#30363D] rounded-lg text-[10px] font-bold text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#00D2FF]/50 transition-all"
                      >
                        Investigate <ArrowRight size={10} />
                      </button>
                    </div>

                    {/* Expandable reasons */}
                    <AnimatePresence>
                      {reasonsOpen && signal.reasons && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <ul className="mt-3 space-y-1 pl-2 border-l border-[#21262D]">
                            {signal.reasons.map((r, ri) => (
                              <li key={ri} className="flex items-start gap-1.5 text-[11px] text-[#8B949E] font-mono">
                                <span className="text-[#484F58] mt-0.5 shrink-0">›</span>
                                {r}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SignalFeed;

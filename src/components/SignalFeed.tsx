import React, { useState } from 'react';
import { Radio, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface SignalItem {
  title: string;
  token: string;
  description: string;
  action: 'ENTRY' | 'EXIT' | 'WATCH';
  confidence: number;
  timeAgo: string;
  address?: string;
  reasons?: string[];
}

const MOCK_SIGNALS: SignalItem[] = [
  {
    title: 'Early Entry Signal', token: '$PEPE2', description: '3 smart wallets entered + volume up 847% in 1h',
    action: 'ENTRY', confidence: 0.87, timeAgo: '2m ago', address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    reasons: ['3 smart wallets entered simultaneously', 'Volume up 847% vs 1h average', 'Holder count growing +67 in 1h', 'No dev wallet activity detected'],
  },
  {
    title: 'Dump Risk Increasing', token: '$RUGME', description: 'Dev sold $12K, top 3 holders reducing positions',
    action: 'EXIT', confidence: 0.91, timeAgo: '5m ago', address: '3mNqXvK8wP2sLjF5dTaBcRy7hUoEpGnZqM1iAsDfKL4',
    reasons: ['Dev wallet transferred $12K to fresh address', 'Top 3 holders reduced by 18% combined', 'Buy/sell ratio dropped to 0.31'],
  },
  {
    title: 'Whale Distribution', token: '$MOON', description: 'Top whale reduced position by 23% in past 4 hours',
    action: 'WATCH', confidence: 0.72, timeAgo: '12m ago', address: '9nKmPoq4XwZtLrB2vYsCdEfHuiJ3OpNqGaWxTkMsVb8',
    reasons: ['Top whale (rank #2) sold 23% of position', 'No other whales distributing yet', 'Volume still stable'],
  },
  {
    title: 'Smart Money Entry', token: '$DOGE2', description: '2 high-scoring wallets entered at $45K market cap',
    action: 'ENTRY', confidence: 0.78, timeAgo: '18m ago', address: '5bJxKqNmRvPwQoE8yFhT1cDgZiLaS7HuXnApCdMeRt2',
    reasons: ['Wallet #1 (score 94) bought $8K', 'Wallet #2 (score 88) bought $5.2K', 'MC still at $45K — early entry window'],
  },
  {
    title: 'Sniper Exit Warning', token: '$FOMO', description: '4 sniper wallets exiting simultaneously',
    action: 'WATCH', confidence: 0.65, timeAgo: '24m ago', address: '2pQsJaXkYnMvBrDo9uFhN6cLgPwRiT4kZmEsAqVoCb7',
    reasons: ['4 sniper wallets exiting same block', 'Pattern matches coordinated exit'],
  },
  {
    title: 'Volume Surge Detected', token: '$WIF2', description: 'Volume up 524% with holder growth — narrative forming',
    action: 'ENTRY', confidence: 0.81, timeAgo: '31m ago', address: '4fRmXvK8wP2sLjF5dTaBcRy7hUoEpGnZqM1iAsDfKL5',
    reasons: ['Volume 524% above 1h average', 'Holder count +94 in last hour', '4 smart wallets holding positions'],
  },
  {
    title: 'LP Removal Risk', token: '$FROG', description: 'Locked LP expires in 4h — dev wallet activity spiking',
    action: 'EXIT', confidence: 0.88, timeAgo: '44m ago', address: '6cSnKpL9xQ3tMmD4eUbFy8hViJkOpNqGbWzTlMtPa7c',
    reasons: ['LP lock expires in 4h 12m', 'Dev wallet made 3 transactions in last hour'],
  },
];

type FilterType = 'ALL' | 'ENTRY' | 'EXIT' | 'WATCH';

const DOT_COLOR: Record<string, string> = {
  ENTRY: 'bg-green-500',
  EXIT:  'bg-red-500',
  WATCH: 'bg-amber-500',
};

const ACTION_COLOR: Record<string, string> = {
  ENTRY: 'text-green-600',
  EXIT:  'text-red-600',
  WATCH: 'text-amber-600',
};

interface SignalFeedProps {
  onSelectToken?: (view: string, address: string) => void;
}

export const SignalFeed: React.FC<SignalFeedProps> = ({ onSelectToken }) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  const filtered = MOCK_SIGNALS.filter(s =>
    activeFilter === 'ALL' || s.action === activeFilter
  );

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
          <Radio size={16} className="text-slate-500" />
          <h1 className="text-base font-semibold text-slate-900">Signal Feed</h1>
          <div className="flex items-center gap-1.5 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-live" />
            <span className="text-xs text-slate-500">Live</span>
          </div>
        </div>
        <span className="text-xs text-slate-400">{filtered.length} signals</span>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {(['ALL', 'ENTRY', 'EXIT', 'WATCH'] as FilterType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={cn(
              'px-3 pb-2 text-xs font-medium transition-colors',
              activeFilter === tab
                ? 'text-slate-900 border-b-2 border-blue-500 -mb-px'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Signal rows */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.map((signal, idx) => {
          const key = `${signal.token}-${signal.timeAgo}`;
          const confPct = Math.round(signal.confidence * 100);

          return (
            <div
              key={key}
              className={cn(
                'flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group cursor-pointer',
                idx < filtered.length - 1 ? 'border-b border-slate-100' : ''
              )}
              onClick={() => signal.address && onSelectToken?.('solana-intel', signal.address)}
              title={signal.reasons?.join(' • ')}
            >
              {/* Dot */}
              <span className={cn('w-2 h-2 rounded-full shrink-0', DOT_COLOR[signal.action])} />

              {/* Signal type */}
              <span className={cn('text-[10px] font-mono font-medium w-10 shrink-0', ACTION_COLOR[signal.action])}>
                {signal.action}
              </span>

              {/* Token */}
              <span className="text-sm font-medium text-slate-900 w-16 shrink-0">{signal.token}</span>

              {/* Description */}
              <span className="text-sm text-slate-500 flex-1 truncate">{signal.description}</span>

              {/* Confidence */}
              <span className="text-xs text-slate-400 shrink-0">{confPct}% conf</span>

              {/* Time */}
              <span className="text-xs text-slate-400 w-14 text-right shrink-0">{signal.timeAgo}</span>

              {/* Arrow */}
              <ChevronRight size={13} className="text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default SignalFeed;

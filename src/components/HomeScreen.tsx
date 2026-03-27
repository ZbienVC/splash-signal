import React, { useState, useEffect } from 'react';
import {
  Flame,
  AlertTriangle,
  Trophy,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { ViewId } from '../types';
import { cn } from '../lib/utils';
import { DexTrendingFeed } from './DexTrendingFeed';
import { motion } from 'motion/react';

type SuggestedAction = 'ENTRY' | 'EXIT' | 'WATCH';

interface NowPanelItem {
  headline: string;
  token: string;
  timeAgo: string;
  action: SuggestedAction;
  address?: string;
}

const ACTION_COLOR: Record<SuggestedAction, string> = {
  ENTRY: 'text-green-400',
  EXIT:  'text-red-400',
  WATCH: 'text-amber-400',
};

const ACTION_BORDER: Record<SuggestedAction, string> = {
  ENTRY: 'border-l-green-500/50',
  EXIT:  'border-l-red-500/50',
  WATCH: 'border-l-amber-500/50',
};

const MOCK_NOW_ITEMS: NowPanelItem[] = [
  { headline: 'Smart wallets entering + vol +847%', token: '$PEPE2', timeAgo: '2m ago', action: 'ENTRY', address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' },
  { headline: 'Dev sold $12K — dump risk rising', token: '$RUGME', timeAgo: '5m ago', action: 'EXIT',  address: '3mNqXvK8wP2sLjF5dTaBcRy7hUoEpGnZqM1iAsDfKL4' },
  { headline: 'Whale reduced 23% — watch for follow-through', token: '$MOON', timeAgo: '12m ago', action: 'WATCH', address: '9nKmPoq4XwZtLrB2vYsCdEfHuiJ3OpNqGaWxTkMsVb8' },
];

interface HomeScreenProps {
  onNavigate: (view: ViewId) => void;
  onSelectToken?: (view: string, address: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, onSelectToken }) => {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setLastRefresh(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const quickAccess = [
    {
      id: 'alpha-hunter',
      icon: Flame,
      title: 'Alpha Hunter',
      desc: 'Early momentum detection — highest alpha tokens now',
    },
    {
      id: 'dump-detector',
      icon: AlertTriangle,
      title: 'Dump Detector',
      desc: 'Risk & exit signal monitoring — active dump threats',
    },
    {
      id: 'wallet-ranking',
      icon: Trophy,
      title: 'Wallet Rankings',
      desc: 'Top smart wallets by win rate and average multiple',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="p-6 space-y-6"
    >
      {/* Now Panel */}
      <div className="bg-[#111827] border border-[#1E2A3A] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1E2A3A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-live" />
            <span className="text-sm font-medium text-[#F1F5F9]">Now</span>
          </div>
          <button
            onClick={() => onNavigate('signal-feed' as ViewId)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all →
          </button>
        </div>

        <div className="divide-y divide-[#1E2A3A]">
          {MOCK_NOW_ITEMS.map((item, i) => (
            <button
              key={i}
              onClick={() => item.address && onSelectToken?.('solana-intel', item.address)}
              className={cn(
                'w-full px-4 py-2.5 flex items-center gap-4 text-left hover:bg-[#1A2234] transition-colors border-l-2',
                ACTION_BORDER[item.action]
              )}
            >
              <span className={cn('text-[10px] font-mono font-medium w-10 shrink-0', ACTION_COLOR[item.action])}>
                {item.action}
              </span>
              <span className="text-sm font-medium text-[#F1F5F9] w-14 shrink-0">{item.token}</span>
              <span className="text-sm text-[#94A3B8] flex-1">{item.headline}</span>
              <span className="text-xs text-[#475569] shrink-0">{item.timeAgo}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {quickAccess.map(card => (
          <button
            key={card.id}
            onClick={() => onNavigate(card.id as ViewId)}
            className="bg-[#111827] border border-[#1E2A3A] rounded-lg p-4 text-left hover:bg-[#1A2234] hover:border-[#2D3748] transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <card.icon size={14} className="text-[#94A3B8]" />
                <span className="text-sm font-medium text-[#F1F5F9]">{card.title}</span>
              </div>
              <ChevronRight size={13} className="text-[#475569] group-hover:text-[#94A3B8] transition-colors" />
            </div>
            <p className="text-xs text-[#475569]">{card.desc}</p>
          </button>
        ))}
      </div>

      {/* Trending */}
      <DexTrendingFeed onNavigate={onNavigate} />
    </motion.div>
  );
};

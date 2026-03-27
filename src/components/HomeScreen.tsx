import React, { useState, useEffect } from 'react';
import {
  Flame,
  AlertTriangle,
  Trophy,
  ChevronRight,
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
  ENTRY: 'text-green-600',
  EXIT:  'text-red-600',
  WATCH: 'text-amber-600',
};

const ACTION_BORDER: Record<SuggestedAction, string> = {
  ENTRY: 'border-l-green-400',
  EXIT:  'border-l-red-400',
  WATCH: 'border-l-amber-400',
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

  void lastRefresh; // suppress unused warning

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
      className="p-6 space-y-6 bg-[#F8FAFC] min-h-full"
    >
      {/* Now Panel */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-live" />
            <span className="text-sm font-medium text-slate-900">Now</span>
          </div>
          <button
            onClick={() => onNavigate('signal-feed' as ViewId)}
            className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
          >
            View all →
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {MOCK_NOW_ITEMS.map((item, i) => (
            <button
              key={i}
              onClick={() => item.address && onSelectToken?.('solana-intel', item.address)}
              className={cn(
                'w-full px-4 py-2.5 flex items-center gap-4 text-left hover:bg-slate-50 transition-colors border-l-2',
                ACTION_BORDER[item.action]
              )}
            >
              <span className={cn('text-[10px] font-mono font-medium w-10 shrink-0', ACTION_COLOR[item.action])}>
                {item.action}
              </span>
              <span className="text-sm font-medium text-slate-900 w-14 shrink-0">{item.token}</span>
              <span className="text-sm text-slate-500 flex-1">{item.headline}</span>
              <span className="text-xs text-slate-400 shrink-0">{item.timeAgo}</span>
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
            className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-blue-200 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                  <card.icon size={14} className="text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-900">{card.title}</span>
              </div>
              <ChevronRight size={13} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
            <p className="text-xs text-slate-500">{card.desc}</p>
          </button>
        ))}
      </div>

      {/* Trending */}
      <DexTrendingFeed onNavigate={onNavigate} />
    </motion.div>
  );
};

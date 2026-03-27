import React, { useState } from 'react';
import { Trophy, Copy, Check, ChevronDown, ChevronUp, Wallet } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface RecentTrade {
  token: string;
  action: 'BUY' | 'SELL';
  mcAtEntry: string;
  pnl: string;
  pnlPositive: boolean;
}

interface WalletEntry {
  rank: number;
  address: string;
  classification: 'SMART_MONEY' | 'WHALE' | 'SNIPER';
  score: number;
  winRate: number;
  avgMultiple: number;
  trades: number;
  recentTrades: RecentTrade[];
}

const MOCK_WALLETS: WalletEntry[] = [
  {
    rank: 1, address: '9x4KWqPmR7sLjF2dTaBcZy8hUoEpGnZqM3iAsDfKL9x', classification: 'SMART_MONEY', score: 94, winRate: 87, avgMultiple: 12.4, trades: 47,
    recentTrades: [
      { token: '$PEPE2', action: 'BUY',  mcAtEntry: '$45K',  pnl: '+$12.4K', pnlPositive: true  },
      { token: '$WIF2',  action: 'BUY',  mcAtEntry: '$89K',  pnl: '+$8.1K',  pnlPositive: true  },
      { token: '$MOON',  action: 'SELL', mcAtEntry: '$320K', pnl: '+$4.7K',  pnlPositive: true  },
      { token: '$FROG',  action: 'SELL', mcAtEntry: '$22K',  pnl: '-$0.8K',  pnlPositive: false },
      { token: '$DOGE2', action: 'BUY',  mcAtEntry: '$67K',  pnl: '+$6.2K',  pnlPositive: true  },
    ],
  },
  {
    rank: 2, address: '4mRpXvK8wQ3sLjF5dTaBcRy6hUoEpGnZqM2iAsDfKL4', classification: 'SMART_MONEY', score: 91, winRate: 83, avgMultiple: 9.7, trades: 62,
    recentTrades: [
      { token: '$FOMO',  action: 'BUY',  mcAtEntry: '$31K',  pnl: '+$9.3K', pnlPositive: true },
      { token: '$SOG',   action: 'SELL', mcAtEntry: '$145K', pnl: '+$3.2K', pnlPositive: true },
      { token: '$PEPE2', action: 'BUY',  mcAtEntry: '$55K',  pnl: '+$7.8K', pnlPositive: true },
      { token: '$MOON',  action: 'BUY',  mcAtEntry: '$89K',  pnl: '+$5.1K', pnlPositive: true },
      { token: '$WIF2',  action: 'SELL', mcAtEntry: '$210K', pnl: '+$2.4K', pnlPositive: true },
    ],
  },
  {
    rank: 3, address: '7bJxNqL9xR2tMmD4eUbFy5hViJkOpNqGbWzTlMtPa8b', classification: 'WHALE', score: 88, winRate: 79, avgMultiple: 7.2, trades: 28,
    recentTrades: [
      { token: '$DOGE2', action: 'BUY',  mcAtEntry: '$120K', pnl: '+$18K',  pnlPositive: true  },
      { token: '$FROG',  action: 'BUY',  mcAtEntry: '$28K',  pnl: '+$4.4K', pnlPositive: true  },
      { token: '$MOON',  action: 'SELL', mcAtEntry: '$450K', pnl: '+$9.1K', pnlPositive: true  },
      { token: '$RUGME', action: 'SELL', mcAtEntry: '$78K',  pnl: '-$2.1K', pnlPositive: false },
      { token: '$WIF2',  action: 'BUY',  mcAtEntry: '$95K',  pnl: '+$6.8K', pnlPositive: true  },
    ],
  },
  {
    rank: 4, address: '2cQtKpM8wP1sNjG5eFaBcRy4hUoEpGnZqM9iAsDfKL2', classification: 'SNIPER', score: 85, winRate: 76, avgMultiple: 15.3, trades: 91,
    recentTrades: [
      { token: '$PEPE2', action: 'BUY',  mcAtEntry: '$12K',  pnl: '+$23.1K', pnlPositive: true  },
      { token: '$WIF2',  action: 'BUY',  mcAtEntry: '$18K',  pnl: '+$14.7K', pnlPositive: true  },
      { token: '$FOMO',  action: 'SELL', mcAtEntry: '$67K',  pnl: '+$5.2K',  pnlPositive: true  },
      { token: '$SOG',   action: 'BUY',  mcAtEntry: '$9K',   pnl: '-$1.4K',  pnlPositive: false },
      { token: '$DOGE2', action: 'SELL', mcAtEntry: '$180K', pnl: '+$8.9K',  pnlPositive: true  },
    ],
  },
  {
    rank: 5, address: '8dSuLqN7vO4tMmE3eVbFy9hWiKlRpOqGcXzUmNuQb6d', classification: 'SMART_MONEY', score: 82, winRate: 74, avgMultiple: 6.8, trades: 38,
    recentTrades: [
      { token: '$MOON',  action: 'BUY',  mcAtEntry: '$56K',  pnl: '+$7.3K', pnlPositive: true  },
      { token: '$FROG',  action: 'BUY',  mcAtEntry: '$18K',  pnl: '+$3.8K', pnlPositive: true  },
      { token: '$PEPE2', action: 'SELL', mcAtEntry: '$234K', pnl: '+$4.1K', pnlPositive: true  },
      { token: '$WIF2',  action: 'SELL', mcAtEntry: '$310K', pnl: '+$2.9K', pnlPositive: true  },
      { token: '$RUGME', action: 'BUY',  mcAtEntry: '$45K',  pnl: '-$1.8K', pnlPositive: false },
    ],
  },
  {
    rank: 6, address: '3eRvMrK6uN5sMnF4fWcGz7iXjLmSpPrHdYaVnOvRc5e', classification: 'WHALE', score: 79, winRate: 71, avgMultiple: 5.4, trades: 19,
    recentTrades: [
      { token: '$DOGE2', action: 'BUY',  mcAtEntry: '$200K', pnl: '+$12.4K', pnlPositive: true  },
      { token: '$FOMO',  action: 'BUY',  mcAtEntry: '$47K',  pnl: '+$5.7K',  pnlPositive: true  },
      { token: '$MOON',  action: 'SELL', mcAtEntry: '$580K', pnl: '+$7.2K',  pnlPositive: true  },
      { token: '$SOG',   action: 'BUY',  mcAtEntry: '$23K',  pnl: '-$3.1K',  pnlPositive: false },
      { token: '$PEPE2', action: 'SELL', mcAtEntry: '$120K', pnl: '+$4.5K',  pnlPositive: true  },
    ],
  },
  {
    rank: 7, address: '6fTwNsL5tM6rNoG7gXdHz4jYkMnTqQsIeZbWpPwSd8f', classification: 'SNIPER', score: 76, winRate: 68, avgMultiple: 11.2, trades: 104,
    recentTrades: [
      { token: '$WIF2',  action: 'BUY',  mcAtEntry: '$8K',   pnl: '+$18.3K', pnlPositive: true  },
      { token: '$FROG',  action: 'BUY',  mcAtEntry: '$7K',   pnl: '+$8.9K',  pnlPositive: true  },
      { token: '$RUGME', action: 'SELL', mcAtEntry: '$92K',  pnl: '-$4.2K',  pnlPositive: false },
      { token: '$PEPE2', action: 'BUY',  mcAtEntry: '$24K',  pnl: '+$11.1K', pnlPositive: true  },
      { token: '$DOGE2', action: 'SELL', mcAtEntry: '$440K', pnl: '+$6.4K',  pnlPositive: true  },
    ],
  },
  {
    rank: 8, address: '1gUxOpM4uL7sOpH8hYeIa5kZlNoUrRtJfAcXqQxTe3g', classification: 'SMART_MONEY', score: 73, winRate: 65, avgMultiple: 5.9, trades: 53,
    recentTrades: [
      { token: '$MOON',  action: 'BUY',  mcAtEntry: '$78K',  pnl: '+$5.1K', pnlPositive: true  },
      { token: '$FOMO',  action: 'SELL', mcAtEntry: '$198K', pnl: '+$3.4K', pnlPositive: true  },
      { token: '$SOG',   action: 'BUY',  mcAtEntry: '$34K',  pnl: '+$2.8K', pnlPositive: true  },
      { token: '$WIF2',  action: 'SELL', mcAtEntry: '$512K', pnl: '+$4.7K', pnlPositive: true  },
      { token: '$FROG',  action: 'BUY',  mcAtEntry: '$41K',  pnl: '-$1.1K', pnlPositive: false },
    ],
  },
  {
    rank: 9, address: '5hVyPqN3tK8tPqI9iZfJb6lAmOpVsSuKgBdYrRyUf9h', classification: 'WHALE', score: 70, winRate: 62, avgMultiple: 4.3, trades: 14,
    recentTrades: [
      { token: '$PEPE2', action: 'BUY',  mcAtEntry: '$340K', pnl: '+$9.2K',  pnlPositive: true  },
      { token: '$DOGE2', action: 'BUY',  mcAtEntry: '$290K', pnl: '+$6.1K',  pnlPositive: true  },
      { token: '$RUGME', action: 'SELL', mcAtEntry: '$120K', pnl: '-$7.8K',  pnlPositive: false },
      { token: '$MOON',  action: 'BUY',  mcAtEntry: '$410K', pnl: '+$4.3K',  pnlPositive: true  },
      { token: '$FOMO',  action: 'SELL', mcAtEntry: '$298K', pnl: '+$3.9K',  pnlPositive: true  },
    ],
  },
  {
    rank: 10, address: '4iWzQrO2sJ9uQrJ0jAgKc7mBnPqWtTvLhCeZsSwVg2i', classification: 'SNIPER', score: 67, winRate: 59, avgMultiple: 8.1, trades: 78,
    recentTrades: [
      { token: '$SOG',   action: 'BUY',  mcAtEntry: '$6K',   pnl: '+$14.7K', pnlPositive: true  },
      { token: '$FROG',  action: 'SELL', mcAtEntry: '$67K',  pnl: '+$3.2K',  pnlPositive: true  },
      { token: '$MOON',  action: 'BUY',  mcAtEntry: '$12K',  pnl: '+$9.8K',  pnlPositive: true  },
      { token: '$WIF2',  action: 'SELL', mcAtEntry: '$89K',  pnl: '-$2.3K',  pnlPositive: false },
      { token: '$PEPE2', action: 'BUY',  mcAtEntry: '$19K',  pnl: '+$7.4K',  pnlPositive: true  },
    ],
  },
];

const CLASS_BADGE: Record<string, string> = {
  SMART_MONEY: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  WHALE:       'bg-blue-500/20 text-blue-400 border-blue-500/30',
  SNIPER:      'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const RANK_TROPHY: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const CopyButton: React.FC<{ address: string }> = ({ address }) => {
  const [copied, setCopied] = useState(false);
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return (
    <button
      onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(address).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors"
    >
      {short}
      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
    </button>
  );
};

const scoreColor = (score: number) =>
  score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';

interface WalletRankingProps {
  onSelectWallet?: (view: string, address: string) => void;
}

export const WalletRanking: React.FC<WalletRankingProps> = ({ onSelectWallet }) => {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [tracked, setTracked] = useState<Set<string>>(new Set());

  const totalWallets = 1847;
  const avgWinRate = Math.round(MOCK_WALLETS.reduce((s, w) => s + w.winRate, 0) / MOCK_WALLETS.length);
  const bestPerformer = MOCK_WALLETS[0];

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <Trophy size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Smart Wallet Rankings</h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Updated every hour</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tracked Wallets', value: totalWallets.toLocaleString(), color: 'text-primary' },
          { label: 'Avg Win Rate', value: `${avgWinRate}%`, color: 'text-emerald-400' },
          { label: 'Best This Week', value: `${bestPerformer.avgMultiple}x avg`, color: 'text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-900/50 border border-slate-700 rounded-2xl p-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</div>
            <div className={cn('text-xl font-display font-bold', stat.color)}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Rankings */}
      <div className="space-y-2">
        {MOCK_WALLETS.map(wallet => (
          <div key={wallet.rank} className="bg-slate-900/60 border border-slate-700 rounded-2xl overflow-hidden">
            {/* Main Row */}
            <div
              className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
              onClick={() => setExpanded(expanded === wallet.rank ? null : wallet.rank)}
            >
              {/* Rank */}
              <div className="w-8 text-center shrink-0">
                {RANK_TROPHY[wallet.rank] ? (
                  <span className="text-lg">{RANK_TROPHY[wallet.rank]}</span>
                ) : (
                  <span className="text-sm font-bold text-slate-500">#{wallet.rank}</span>
                )}
              </div>

              {/* Address */}
              <div className="w-36 shrink-0">
                <CopyButton address={wallet.address} />
              </div>

              {/* Class */}
              <div className="w-32 shrink-0">
                <span className={cn('px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wide', CLASS_BADGE[wallet.classification])}>
                  {wallet.classification.replace('_', ' ')}
                </span>
              </div>

              {/* Stats */}
              <div className="flex-1 grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-[9px] text-slate-600 uppercase tracking-wide">Score</div>
                  <div className={cn('text-sm font-bold', scoreColor(wallet.score))}>{wallet.score}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-600 uppercase tracking-wide">Win Rate</div>
                  <div className="text-sm font-bold text-white">{wallet.winRate}%</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-600 uppercase tracking-wide">Avg Mult</div>
                  <div className="text-sm font-bold text-primary">{wallet.avgMultiple}x</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-600 uppercase tracking-wide">Trades</div>
                  <div className="text-sm font-bold text-white">{wallet.trades}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setTracked(prev => {
                      const next = new Set(prev);
                      next.has(wallet.address) ? next.delete(wallet.address) : next.add(wallet.address);
                      return next;
                    });
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border',
                    tracked.has(wallet.address)
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  )}
                >
                  {tracked.has(wallet.address) ? 'Tracked ✓' : 'Track'}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onSelectWallet?.('wallet-behavior', wallet.address); }}
                  className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                >
                  <Wallet size={13} />
                </button>
                {expanded === wallet.rank ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
              </div>
            </div>

            {/* Expanded Trades */}
            <AnimatePresence>
              {expanded === wallet.rank && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-slate-700/50"
                >
                  <div className="px-5 py-4 bg-slate-950/30">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Last 5 Trades</div>
                    <div className="grid grid-cols-5 gap-2 text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-2">
                      <span>Token</span>
                      <span>Action</span>
                      <span>MC at Entry</span>
                      <span>Est. PnL</span>
                    </div>
                    {wallet.recentTrades.map((trade, ti) => (
                      <div key={ti} className="grid grid-cols-5 gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/40 transition-colors">
                        <span className="text-xs font-bold text-white">{trade.token}</span>
                        <span className={cn('text-[10px] font-bold uppercase', trade.action === 'BUY' ? 'text-emerald-400' : 'text-red-400')}>
                          {trade.action}
                        </span>
                        <span className="text-[10px] text-slate-400">{trade.mcAtEntry}</span>
                        <span className={cn('text-[10px] font-bold', trade.pnlPositive ? 'text-emerald-400' : 'text-red-400')}>
                          {trade.pnl}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WalletRanking;

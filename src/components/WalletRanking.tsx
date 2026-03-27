import React, { useState } from 'react';
import { Trophy, Copy, Check, ChevronDown, ChevronUp, Wallet, Medal, Award } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { WalletBadge, WalletClassification } from './ui/WalletBadge';
import { ScorePill } from './ui/ScorePill';

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
  classification: WalletClassification;
  score: number;
  winRate: number;
  avgMultiple: number;
  trades: number;
  recentTrades: RecentTrade[];
  streak?: number;        // consecutive wins
  newEntry?: boolean;     // entered a token in last hour
  perfHistory?: number[]; // 5 recent P&L values for sparkline (normalized 0-100)
}

const MOCK_WALLETS: WalletEntry[] = [
  {
    rank: 1, address: '9x4KWqPmR7sLjF2dTaBcZy8hUoEpGnZqM3iAsDfKL9x', classification: 'SMART_MONEY', score: 94, winRate: 87, avgMultiple: 12.4, trades: 47,
    streak: 5, newEntry: true, perfHistory: [40, 60, 55, 75, 90],
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
    streak: 3, newEntry: false, perfHistory: [50, 65, 70, 60, 80],
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
    streak: 2, newEntry: false, perfHistory: [35, 55, 45, 65, 75],
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
    streak: 7, newEntry: true, perfHistory: [60, 70, 80, 85, 95],
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
    streak: 1, newEntry: false, perfHistory: [30, 50, 40, 55, 65],
    recentTrades: [
      { token: '$MOON',  action: 'BUY',  mcAtEntry: '$56K',  pnl: '+$7.3K', pnlPositive: true  },
      { token: '$FROG',  action: 'BUY',  mcAtEntry: '$18K',  pnl: '+$3.8K', pnlPositive: true  },
      { token: '$PEPE2', action: 'SELL', mcAtEntry: '$234K', pnl: '+$4.1K', pnlPositive: true  },
      { token: '$WIF2',  action: 'SELL', mcAtEntry: '$310K', pnl: '+$2.9K', pnlPositive: true  },
      { token: '$RUGME', action: 'BUY',  mcAtEntry: '$45K',  pnl: '-$1.8K', pnlPositive: false },
    ],
  },
];

const RANK_ICON: Record<number, React.ReactNode> = {
  1: <Medal size={18} className="text-yellow-400" />,
  2: <Medal size={18} className="text-[#E6EDF3]" />,
  3: <Award size={18} className="text-amber-600" />,
};

// Simple SVG sparkline with fill
const Sparkline: React.FC<{ values: number[]; positive?: boolean }> = ({ values, positive = true }) => {
  const W = 56, H = 24;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    y: H - (v / 100) * H,
  }));
  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const fillD = `${lineD} L ${W} ${H} L 0 ${H} Z`;
  const color = positive ? '#10b981' : '#ef4444';
  return (
    <svg width={W} height={H} className="shrink-0">
      <path d={fillD} fill={color} fillOpacity="0.08" />
      <path d={lineD} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

const CopyButton: React.FC<{ address: string }> = ({ address }) => {
  const [copied, setCopied] = useState(false);
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return (
    <button
      onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(address).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="flex items-center gap-1.5 text-xs font-mono text-[#484F58] hover:text-[#E6EDF3] transition-colors"
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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <Trophy size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#E6EDF3] tracking-tight">Smart Wallet Rankings</h1>
          <p className="text-xs text-[#484F58] uppercase tracking-[0.12em] font-mono">Updated every hour</p>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tracked Wallets', value: totalWallets.toLocaleString(), color: 'text-primary' },
          { label: 'Avg Win Rate', value: `${avgWinRate}%`, color: 'text-emerald-400' },
          { label: 'Best This Week', value: `${bestPerformer.avgMultiple}x avg`, color: 'text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0D1117] border border-[#21262D] rounded-xl p-4">
            <div className="text-[10px] font-bold text-[#484F58] uppercase tracking-widest mb-1">{stat.label}</div>
            <div className={cn('text-xl font-display font-bold', stat.color)}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Rankings */}
      <div className="space-y-2">
        {MOCK_WALLETS.map(wallet => (
          <div key={wallet.rank} className="bg-[#0D1117] border border-[#21262D] rounded-xl overflow-hidden">
            {/* Main Row */}
            <div
              className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#161B22]/30 transition-colors"
              onClick={() => setExpanded(expanded === wallet.rank ? null : wallet.rank)}
            >
              {/* Rank */}
              <div className="w-8 flex items-center justify-center shrink-0">
                {RANK_ICON[wallet.rank] ? (
                  RANK_ICON[wallet.rank]
                ) : (
                  <span className="text-sm font-mono font-bold text-[#484F58]">#{wallet.rank}</span>
                )}
              </div>

              {/* Address */}
              <div className="w-36 shrink-0">
                <CopyButton address={wallet.address} />
              </div>

              {/* Class — using WalletBadge */}
              <div className="w-32 shrink-0 flex items-center gap-2">
                <WalletBadge classification={wallet.classification} size="md" />
                {wallet.newEntry && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00D2FF]/10 border border-[#00D2FF]/30 text-[#00D2FF] text-[8px] font-bold tracking-widest animate-pulse">
                    NEW
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex-1 grid grid-cols-5 gap-2 items-center">
                {/* ScorePill for wallet score */}
                <div className="flex justify-center">
                  <ScorePill label="Score" score={wallet.score} type="wallet" size="sm" />
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-[#484F58] uppercase tracking-wide">Win Rate</div>
                  <div className="text-sm font-bold text-white">{wallet.winRate}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-[#484F58] uppercase tracking-wide">Avg Mult</div>
                  <div className="text-sm font-bold text-primary">{wallet.avgMultiple}x</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-[#484F58] uppercase tracking-wide">Trades</div>
                  <div className="text-sm font-bold text-white">{wallet.trades}</div>
                </div>
                {/* Sparkline + streak */}
                <div className="flex flex-col items-center gap-1">
                  {wallet.perfHistory && (
                    <Sparkline values={wallet.perfHistory} positive={wallet.winRate >= 60} />
                  )}
                  {wallet.streak && wallet.streak >= 2 && (
                    <span className="text-[9px] text-amber-400 font-bold font-mono">🔥 {wallet.streak}W streak</span>
                  )}
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
                      : 'bg-[#161B22] border-[#21262D] text-[#8B949E] hover:text-white'
                  )}
                >
                  {tracked.has(wallet.address) ? 'Tracked ✓' : 'Track'}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onSelectWallet?.('wallet-behavior', wallet.address); }}
                  className="w-8 h-8 rounded-lg bg-[#161B22] border border-[#21262D] text-[#8B949E] hover:text-white flex items-center justify-center transition-all"
                >
                  <Wallet size={13} />
                </button>
                {expanded === wallet.rank ? <ChevronUp size={14} className="text-[#484F58]" /> : <ChevronDown size={14} className="text-[#484F58]" />}
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
                  className="overflow-hidden border-t border-[#21262D]/50"
                >
                  <div className="px-5 py-4 bg-[#080B11]/50">
                    <div className="text-[10px] font-bold text-[#484F58] uppercase tracking-widest mb-3">Last 5 Trades</div>
                    <div className="grid grid-cols-5 gap-2 text-[9px] font-bold text-[#484F58] uppercase tracking-widest mb-2 px-2">
                      <span>Token</span>
                      <span>Action</span>
                      <span>MC at Entry</span>
                      <span>Est. PnL</span>
                    </div>
                    {wallet.recentTrades.map((trade, ti) => (
                      <div key={ti} className="grid grid-cols-5 gap-2 px-2 py-1.5 rounded-lg hover:bg-[#161B22]/40 transition-colors">
                        <span className="text-xs font-bold text-white">{trade.token}</span>
                        <span className={cn('text-[10px] font-bold uppercase', trade.action === 'BUY' ? 'text-emerald-400' : 'text-red-400')}>
                          {trade.action}
                        </span>
                        <span className="text-[10px] text-[#8B949E]">{trade.mcAtEntry}</span>
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

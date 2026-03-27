import React, { useState } from 'react';
import { Trophy, Copy, Check, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

type WalletClassification = 'SMART_MONEY' | 'WHALE' | 'SNIPER' | 'DEV' | 'BOT' | 'BUNDLE_PARTICIPANT' | 'RETAIL';

interface WalletEntry {
  rank: number;
  address: string;
  classification: WalletClassification;
  score: number;
  winRate: number;
  avgMultiple: number;
  trades: number;
  streak?: number;
  newEntry?: boolean;
}

const MOCK_WALLETS: WalletEntry[] = [
  { rank: 1, address: '9x4KWqPmR7sLjF2dTaBcZy8hUoEpGnZqM3iAsDfKL9x', classification: 'SMART_MONEY', score: 94, winRate: 87, avgMultiple: 12.4, trades: 47, streak: 5, newEntry: true },
  { rank: 2, address: '4mRpXvK8wQ3sLjF5dTaBcRy6hUoEpGnZqM2iAsDfKL4', classification: 'SMART_MONEY', score: 91, winRate: 83, avgMultiple: 9.7,  trades: 62, streak: 3, newEntry: false },
  { rank: 3, address: '7bJxNqL9xR2tMmD4eUbFy5hViJkOpNqGbWzTlMtPa8b', classification: 'WHALE',       score: 88, winRate: 79, avgMultiple: 7.2,  trades: 28, streak: 2, newEntry: false },
  { rank: 4, address: '2cQtKpM8wP1sNjG5eFaBcRy4hUoEpGnZqM9iAsDfKL2', classification: 'SNIPER',      score: 85, winRate: 76, avgMultiple: 15.3, trades: 91, streak: 7, newEntry: true },
  { rank: 5, address: '8dSuLqN7vO4tMmE3eVbFy9hWiKlRpOqGcXzUmNuQb6d', classification: 'SMART_MONEY', score: 82, winRate: 74, avgMultiple: 6.8,  trades: 38, streak: 1, newEntry: false },
];

const TYPE_LABEL: Record<WalletClassification, string> = {
  SMART_MONEY: 'Smart $',
  WHALE: 'Whale',
  SNIPER: 'Sniper',
  DEV: 'Dev',
  BOT: 'Bot',
  BUNDLE_PARTICIPANT: 'Bundle',
  RETAIL: 'Retail',
};

const scoreColor = (score: number) =>
  score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-600';

const CopyButton: React.FC<{ address: string }> = ({ address }) => {
  const [copied, setCopied] = useState(false);
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return (
    <button
      onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(address).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-slate-700 transition-colors"
    >
      {short}
      {copied ? <Check size={10} className="text-green-600" /> : <Copy size={10} />}
    </button>
  );
};

interface WalletRankingProps {
  onSelectWallet?: (view: string, address: string) => void;
}

export const WalletRanking: React.FC<WalletRankingProps> = ({ onSelectWallet }) => {
  const [tracked, setTracked] = useState<Set<string>>(new Set());

  const totalWallets = 1847;
  const avgWinRate = Math.round(MOCK_WALLETS.reduce((s, w) => s + w.winRate, 0) / MOCK_WALLETS.length);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Trophy size={16} className="text-slate-500" />
        <h1 className="text-base font-semibold text-slate-900">Wallet Rankings</h1>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Tracked</span>
          <span className="text-sm font-bold text-slate-900 ml-2 num">{totalWallets.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Avg Win Rate</span>
          <span className="text-sm font-bold text-green-600 ml-2 num">{avgWinRate}%</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">Best Avg Multiple</span>
          <span className="text-sm font-bold text-amber-600 ml-2 num">{MOCK_WALLETS[0].avgMultiple}x</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['RANK', 'WALLET', 'TYPE', 'SCORE', 'WIN %', 'AVG X', 'TRADES', 'STREAK', ''].map(col => (
                <th key={col} className="px-4 py-2.5 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_WALLETS.map(wallet => (
              <tr
                key={wallet.rank}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
              >
                {/* RANK */}
                <td className="px-4 py-3">
                  <span className={cn('text-sm font-mono font-bold', wallet.rank <= 3 ? 'text-slate-900' : 'text-slate-400')}>
                    #{wallet.rank}
                  </span>
                </td>

                {/* WALLET */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <CopyButton address={wallet.address} />
                    {wallet.newEntry && (
                      <span className="text-[9px] font-bold text-blue-600 border border-blue-200 bg-blue-50 px-1 rounded">NEW</span>
                    )}
                  </div>
                </td>

                {/* TYPE */}
                <td className="px-4 py-3">
                  <span className="text-xs text-slate-500">{TYPE_LABEL[wallet.classification]}</span>
                </td>

                {/* SCORE */}
                <td className="px-4 py-3">
                  <span className={cn('text-sm font-bold num', scoreColor(wallet.score))}>{wallet.score}</span>
                </td>

                {/* WIN % */}
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-700 num">{wallet.winRate}%</span>
                </td>

                {/* AVG X */}
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-700 num">{wallet.avgMultiple}x</span>
                </td>

                {/* TRADES */}
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-700 num">{wallet.trades}</span>
                </td>

                {/* STREAK */}
                <td className="px-4 py-3">
                  {wallet.streak && wallet.streak > 2 ? (
                    <span className="text-xs text-amber-600 num">🔥 {wallet.streak}W</span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>

                {/* ACTION */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTracked(prev => {
                        const next = new Set(prev);
                        next.has(wallet.address) ? next.delete(wallet.address) : next.add(wallet.address);
                        return next;
                      })}
                      className={cn(
                        'bg-blue-600 text-white hover:bg-blue-700 text-xs px-3 py-1 rounded-md transition-colors',
                        tracked.has(wallet.address) && 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      )}
                    >
                      {tracked.has(wallet.address) ? 'Tracking' : 'Track'}
                    </button>
                    <button
                      onClick={() => onSelectWallet?.('wallet-behavior', wallet.address)}
                      className="text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default WalletRanking;

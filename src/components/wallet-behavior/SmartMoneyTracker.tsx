import React, { useState, useEffect } from 'react';
import { Trophy, Activity, TrendingUp, Zap, ExternalLink, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface WalletStats {
  address: string;
  tier: string;
  total_trades: number;
  profitable_trades: number;
  early_entries: number;
  pnl_usd: number;
  win_rate: number;
  score: number;
  last_seen: number;
}

interface WalletActivity {
  id: string;
  wallet_address: string;
  token_mint: string;
  token_symbol: string;
  type: 'BUY' | 'SELL';
  amount_usd: number;
  market_cap_at_event: number;
  timestamp: number;
}

const SmartMoneyTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'activity'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<WalletStats[]>([]);
  const [activity, setActivity] = useState<WalletActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [lbRes, actRes] = await Promise.all([
          fetch('/api/wallets/leaderboard'),
          fetch('/api/wallets/activity')
        ]);
        if (lbRes.ok) setLeaderboard(await lbRes.json());
        if (actRes.ok) setActivity(await actRes.json());
      } catch (e) {
        console.error('Failed to fetch wallet data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  const formatUSD = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  const formatMC = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val.toFixed(0)}`;
  };

  // Detect empty/zero data state
  const isEmptyData = leaderboard.length === 0 ||
    leaderboard.every(w => w.score <= 20 && w.win_rate === 0);

  const getTierBadge = (tier: string) => {
    if (tier === 'Legend' || tier === 'Smart') {
      return 'bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2 py-0.5 rounded-full';
    }
    if (tier === 'Whale') {
      return 'bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded-full';
    }
    return 'bg-slate-100 text-slate-500 border border-slate-200 text-xs px-2 py-0.5 rounded-full';
  };

  const getRowClass = (idx: number) => {
    if (idx === 0) return 'bg-amber-50/60';
    if (idx === 1) return 'bg-slate-50';
    if (idx === 2) return 'bg-slate-50/50';
    return '';
  };

  const getRankClass = (idx: number) => {
    if (idx === 0) return 'text-amber-700 font-bold';
    if (idx === 1) return 'text-slate-600 font-semibold';
    return 'text-slate-500';
  };

  return (
    <div className="space-y-0 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-white to-blue-50/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Smart Money Leaderboard</h2>
            <p className="text-xs text-slate-500">Ranked by win rate, PnL, and early entry speed</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 bg-white px-6">
        {(['leaderboard', 'activity'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {tab === 'leaderboard' ? 'LEADERBOARD' : 'LIVE ACTIVITY'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'leaderboard' ? (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {!loading && isEmptyData ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-slate-700 font-medium">Wallet rankings loading</p>
                <p className="text-slate-400 text-sm mt-1">Connect Birdeye or Helius API to track smart wallet performance</p>
                <a
                  href="https://birdeye.so"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-blue-600 text-sm hover:underline"
                >
                  Get Birdeye API key →
                </a>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b-2 border-slate-200">
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Wallet</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Win Rate</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">PnL (Est)</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Early Entries</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaderboard.map((wallet, idx) => (
                      <tr key={wallet.address} className={cn('hover:bg-blue-50/20 transition-colors group', getRowClass(idx))}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className={cn('text-xs font-mono w-4', getRankClass(idx))}>{idx + 1}</span>
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                              <Wallet size={14} className="text-slate-500" />
                            </div>
                            <div className="text-sm font-mono text-slate-700 group-hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1">
                              {formatAddress(wallet.address)}
                              <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={cn('text-sm font-bold', wallet.score >= 60 ? 'text-blue-600' : 'text-slate-500')}>
                            {wallet.score.toFixed(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={cn('text-sm font-mono font-bold', wallet.win_rate > 50 ? 'text-green-600' : 'text-slate-500')}>
                            {wallet.win_rate.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-mono font-bold text-slate-600">{formatUSD(wallet.pnl_usd)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <Zap size={12} className="text-amber-400" />
                            <span className="text-sm font-mono font-bold text-slate-600">{wallet.early_entries}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={getTierBadge(wallet.tier)}>{wallet.tier}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-6 space-y-4"
          >
            {activity.length === 0 && !loading && (
              <div className="text-center py-12 text-slate-500 text-sm">
                Waiting for live activity...
              </div>
            )}
            {activity.map((item) => (
              <div key={item.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between group hover:border-blue-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    item.type === 'BUY' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                  )}>
                    <TrendingUp size={20} className={item.type === 'SELL' ? 'rotate-180' : ''} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-blue-600 font-bold">{formatAddress(item.wallet_address)}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                        {item.type === 'BUY' ? 'Bought' : 'Sold'}
                      </span>
                      <span className="text-sm font-bold text-slate-900">${item.token_symbol}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-3">
                      <span>MC at event: <span className="text-slate-600">{formatMC(item.market_cap_at_event)}</span></span>
                      <span>Value: <span className="text-slate-600">{formatUSD(item.amount_usd)}</span></span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartMoneyTracker;

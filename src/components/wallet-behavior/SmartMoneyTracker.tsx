import React, { useState, useEffect } from 'react';
import { Trophy, Activity, TrendingUp, Zap, Shield, ExternalLink, Wallet } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white/50 p-1 rounded-2xl border border-white/5 w-fit mx-auto">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
            activeTab === 'leaderboard' ? "bg-primary text-black shadow-lg shadow-primary/20" : "text-slate-500 hover:text-slate-900"
          )}
        >
          <Trophy size={14} />
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
            activeTab === 'activity' ? "bg-primary text-black shadow-lg shadow-primary/20" : "text-slate-500 hover:text-slate-900"
          )}
        >
          <Activity size={14} />
          Live Activity
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'leaderboard' ? (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-panel border border-slate-border rounded-[32px] overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-white/5 bg-black/20">
              <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
                <Shield className="text-primary" size={20} />
                Smart Money Leaderboard
              </h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Ranked by Win Rate, PnL, and Early Entry Speed</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/40">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Wallet</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Win Rate</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">PnL (Est)</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Early Entries</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leaderboard.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                        No smart money detected yet...
                      </td>
                    </tr>
                  )}
                  {leaderboard.map((wallet, idx) => (
                    <tr key={wallet.address} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-600 w-4">{idx + 1}</span>
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-white/10 flex items-center justify-center">
                            <Wallet size={14} className="text-slate-500" />
                          </div>
                          <div className="text-sm font-mono text-slate-900 group-hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
                            {formatAddress(wallet.address)}
                            <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-display font-black text-primary">{wallet.score.toFixed(1)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono font-bold text-emerald-400">{wallet.win_rate.toFixed(1)}%</div>
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
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter",
                          wallet.tier === 'Legend' ? "bg-amber-400 text-black" :
                          wallet.tier === 'Smart' ? "bg-primary text-black" :
                          "bg-slate-100 text-slate-500"
                        )}>
                          {wallet.tier}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {activity.length === 0 && !loading && (
              <div className="bg-slate-panel border border-slate-border p-12 rounded-[32px] text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                Waiting for live activity...
              </div>
            )}
            {activity.map((item) => (
              <div key={item.id} className="bg-slate-panel border border-slate-border p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    item.type === 'BUY' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                  )}>
                    {item.type === 'BUY' ? <TrendingUp size={20} /> : <TrendingUp size={20} className="rotate-180" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary font-bold">{formatAddress(item.wallet_address)}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                        {item.type === 'BUY' ? 'Bought' : 'Sold'}
                      </span>
                      <span className="text-sm font-bold text-slate-900">${item.token_symbol}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <TrendingUp size={10} className="text-slate-600" />
                        MC at event: <span className="text-slate-600">{formatMC(item.market_cap_at_event)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap size={10} className="text-slate-600" />
                        Value: <span className="text-slate-600">{formatUSD(item.amount_usd)}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-600 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                  <button className="mt-2 text-[9px] font-bold text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-auto">
                    View Tx <ExternalLink size={8} />
                  </button>
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

import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Search,
  Loader2,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { LiquidityHealthCard } from './LiquidityHealthCard';
import { LiquidityTimeline } from './LiquidityTimeline';
import { LPWalletTracker } from './LPWalletTracker';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LiquidityIntelligenceProps {
  mint?: string;
}

export const LiquidityIntelligence: React.FC<LiquidityIntelligenceProps> = ({ mint: initialMint }) => {
  const [mint, setMint] = useState(initialMint || '');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  const fetchLiquidityData = async (targetMint: string, silent: boolean = false) => {
    if (!targetMint) return;
    if (!silent) setLoading(true);
    try {
      const [intelRes, eventsRes] = await Promise.all([
        fetch(`/api/liquidity-intel/${targetMint}`),
        fetch(`/api/liquidity-events/${targetMint}`)
      ]);
      
      if (intelRes.ok && eventsRes.ok) {
        const intelData = await intelRes.json();
        const eventsData = await eventsRes.json();
        setData(intelData);
        setEvents(eventsData);
      }
    } catch (error) {
      console.error('Failed to fetch liquidity data:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (initialMint) {
      fetchLiquidityData(initialMint);
      const interval = setInterval(() => fetchLiquidityData(initialMint, true), 30000);
      return () => clearInterval(interval);
    }
  }, [initialMint]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLiquidityData(mint);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-3">
            <Droplets className="text-primary" size={32} />
            Liquidity Intelligence
          </h1>
          <p className="text-slate-500 text-sm mt-1">Deep forensic analysis of pool stability and LP behavior patterns.</p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            value={mint}
            onChange={(e) => setMint(e.target.value)}
            placeholder="Enter Token Mint Address..." 
            className="w-full bg-slate-panel border border-slate-border rounded-xl py-2 pl-10 pr-24 text-sm focus:outline-none focus:border-primary/50 transition-all"
          />
          <button 
            type="submit"
            disabled={loading || !mint}
            className="absolute right-1.5 top-1.5 bottom-1.5 bg-primary text-white px-3 rounded-lg text-[10px] font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
            ANALYZE
          </button>
        </form>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-96 flex flex-col items-center justify-center space-y-4"
          >
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Scanning Liquidity Pools...</p>
          </motion.div>
        ) : data ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <LiquidityHealthCard 
                score={data.stabilityIndex} 
                metrics={data.metrics} 
              />
              
              <div className="lg:col-span-2 bg-slate-panel border border-slate-border rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold">Liquidity Depth History</h3>
                    <p className="text-xs text-slate-500">Historical USD value across tracked pools</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <TrendingUp size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-500">+{data.metrics.growthRate}% GROWTH</span>
                  </div>
                </div>
                
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.history}>
                      <defs>
                        <linearGradient id="colorLiq" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#137fec" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#137fec" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis 
                        dataKey="timestamp" 
                        hide 
                      />
                      <YAxis 
                        stroke="#475569" 
                        fontSize={10} 
                        tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                        itemStyle={{ color: '#137fec' }}
                        labelFormatter={(label) => new Date(label).toLocaleString()}
                        formatter={(value: any) => [`$${value.toLocaleString()}`, 'Liquidity']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="liquidity_usd" 
                        stroke="#137fec" 
                        fillOpacity={1} 
                        fill="url(#colorLiq)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LPWalletTracker wallets={data.lpWallets} />
              <LiquidityTimeline events={events} />
            </div>
          </motion.div>
        ) : (
          <div className="h-96 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-slate-border rounded-2xl">
            <Droplets size={48} className="text-slate-700" />
            <div>
              <h3 className="text-lg font-bold text-slate-500">No Liquidity Data Loaded</h3>
              <p className="text-sm text-slate-600 max-w-xs mx-auto">Enter a token mint address above to begin deep liquidity forensics.</p>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

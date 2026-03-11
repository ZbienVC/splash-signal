import React from 'react';
import { ShieldCheck, AlertTriangle, Activity, TrendingUp, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LiquidityHealthCardProps {
  score: number;
  metrics: {
    growthRate: number;
    volatility: number;
    concentration: number;
    walletChurn: number;
  };
}

export const LiquidityHealthCard: React.FC<LiquidityHealthCardProps> = ({ score, metrics }) => {
  const getStatusColor = (s: number) => {
    if (s >= 80) return 'text-emerald-500';
    if (s >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getStatusBg = (s: number) => {
    if (s >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
    if (s >= 60) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="bg-slate-panel border border-slate-border rounded-2xl p-6 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold">Liquidity Stability Index</h3>
          <p className="text-xs text-slate-500">Composite forensic health score</p>
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", getStatusBg(score))}>
          {score >= 80 ? <ShieldCheck className={getStatusColor(score)} /> : <AlertTriangle className={getStatusColor(score)} />}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center py-4">
        <div className={cn("text-6xl font-display font-bold mb-2", getStatusColor(score))}>
          {score}
        </div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stability Rating</div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="p-3 rounded-xl bg-black/20 border border-white/5">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <TrendingUp size={12} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Growth</span>
          </div>
          <div className="text-sm font-bold text-emerald-500">+{metrics.growthRate}%</div>
        </div>
        <div className="p-3 rounded-xl bg-black/20 border border-white/5">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Activity size={12} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Volatility</span>
          </div>
          <div className="text-sm font-bold text-amber-500">{metrics.volatility}%</div>
        </div>
        <div className="p-3 rounded-xl bg-black/20 border border-white/5">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Info size={12} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Concentration</span>
          </div>
          <div className="text-sm font-bold text-slate-300">{metrics.concentration}%</div>
        </div>
        <div className="p-3 rounded-xl bg-black/20 border border-white/5">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Activity size={12} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Churn</span>
          </div>
          <div className="text-sm font-bold text-slate-300">{metrics.walletChurn} Wallets</div>
        </div>
      </div>
    </div>
  );
};

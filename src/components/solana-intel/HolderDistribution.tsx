import React from 'react';
import { 
  Users, 
  Shield, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  BarChart3
} from 'lucide-react';
import { HolderAnalysis } from '../../types/signalos';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export const HolderDistribution: React.FC<{ holders: HolderAnalysis }> = ({ holders }) => {
  return (
    <div className="bg-slate-panel border border-slate-border rounded-2xl p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-display font-bold">Holder Concentration</h3>
          <div className="flex items-center gap-2 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-[10px] font-bold text-primary">
            TOP 10
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users size={14} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-400">{holders.holders.length} TOTAL</span>
        </div>
      </div>

      {/* Concentration Bar */}
      <div className="mb-8 space-y-2">
        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <span>Top 10 Wallets</span>
          <span className="text-primary">{holders.top10Percentage}% of Supply</span>
        </div>
        <div className="h-2 bg-black/40 rounded-full overflow-hidden flex">
          <div className="h-full bg-primary rounded-l-full" style={{ width: `${holders.top10Percentage}%` }}></div>
          <div className="h-full bg-slate-700/50 rounded-r-full flex-1"></div>
        </div>
        <div className="flex justify-between text-[9px] text-slate-600">
          <span>Concentrated</span>
          <span>Distributed</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
        {holders.holders.map((holder, i) => (
          <div key={i} className="flex items-center justify-between group">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5",
                holder.isCreator ? "bg-red-500/10 text-red-500" : "bg-slate-700/30 text-slate-400"
              )}>
                {holder.isCreator ? <Shield size={16} /> : <Users size={16} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-300 truncate max-w-[120px] group-hover:text-primary transition-colors">
                    {holder.address}
                  </span>
                  {holder.isCreator && <span className="px-1 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-bold rounded border border-red-500/20 uppercase tracking-tighter">DEV</span>}
                  {holder.percentage > 5 && !holder.isCreator && <span className="px-1 py-0.5 bg-primary/10 text-primary text-[8px] font-bold rounded border border-primary/20 uppercase tracking-tighter">WHALE</span>}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-widest">
                  {holder.percentage.toFixed(2)}% of Supply
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-white">${(parseFloat(holder.balance) * 0.05).toLocaleString()}</div>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <div className="h-1 w-12 bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${holder.percentage * 2}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <BarChart3 size={20} />
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gini Coefficient</div>
          <div className="text-lg font-display font-bold">{holders.giniCoefficient}</div>
          <div className="text-[9px] text-primary font-bold uppercase tracking-widest">High Concentration Risk</div>
        </div>
      </div>
    </div>
  );
};

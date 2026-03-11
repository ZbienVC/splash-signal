import React from 'react';
import { motion } from 'motion/react';
import { Package, Users, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BundleAnalysisProps {
  data: {
    bundlePercentage: number;
    bundleWallets: string[];
    bundleTime: string;
    isBundled: boolean;
  };
}

export const BundleAnalysis: React.FC<BundleAnalysisProps> = ({ data }) => {
  const { bundlePercentage, bundleWallets, bundleTime, isBundled } = data;

  return (
    <div className="bg-slate-panel border border-slate-border rounded-2xl p-6 flex flex-col h-full relative overflow-hidden group">
      {/* Background Glow */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-colors",
        isBundled ? "bg-red-500/10" : "bg-emerald-500/10"
      )} />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            isBundled ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
          )}>
            <Package size={20} />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold">Bundle Analysis</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Launch Coordination Audit</p>
          </div>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
          isBundled 
            ? "bg-red-500/10 text-red-500 border-red-500/20" 
            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
        )}>
          {isBundled ? "Bundled Launch Detected" : "Organic Launch Detected"}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
        <div className="p-3 bg-black/20 rounded-xl border border-white/5">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Bundle %</div>
          <div className={cn(
            "text-xl font-display font-bold",
            bundlePercentage > 20 ? "text-red-500" : "text-emerald-500"
          )}>
            {bundlePercentage.toFixed(1)}%
          </div>
        </div>
        <div className="p-3 bg-black/20 rounded-xl border border-white/5">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Wallets</div>
          <div className="text-xl font-display font-bold text-white">
            {bundleWallets.length}
          </div>
        </div>
        <div className="p-3 bg-black/20 rounded-xl border border-white/5">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Timeframe</div>
          <div className="text-sm font-display font-bold text-white mt-1">
            {bundleTime}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 relative z-10">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <Users size={12} /> Detected Bundle Wallets
        </div>
        <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 scrollbar-hide">
          {bundleWallets.map((wallet, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-black/40 rounded-lg border border-white/5 text-[10px] font-mono">
              <span className="text-slate-400">{wallet.slice(0, 8)}...{wallet.slice(-8)}</span>
              <span className="text-primary font-bold">MEMBER_{i+1}</span>
            </div>
          ))}
          {bundleWallets.length === 0 && (
            <div className="text-center py-4 text-slate-600 text-[10px] uppercase font-bold italic">
              No coordinated bundles detected
            </div>
          )}
        </div>
      </div>

      <div className={cn(
        "mt-6 p-3 rounded-lg flex gap-3 items-start",
        isBundled ? "bg-red-500/5 border border-red-500/10" : "bg-emerald-500/5 border border-emerald-500/10"
      )}>
        {isBundled ? <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" /> : <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />}
        <p className="text-[10px] text-slate-400 leading-tight">
          {isBundled 
            ? `High-risk launch detected. ${bundleWallets.length} wallets coordinated to buy ${bundlePercentage}% of supply within ${bundleTime}. High probability of coordinated dump.` 
            : "Launch appears organic. No significant coordinated buy clusters detected during the initial liquidity event."}
        </p>
      </div>
    </div>
  );
};

import React from 'react';
import { motion } from 'motion/react';
import { Zap, TrendingUp, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NarrativeMomentumCardProps {
  velocityScore: number;
  growthRate: number;
  saturation: number;
  freshness: number;
}

export const NarrativeMomentumCard: React.FC<NarrativeMomentumCardProps> = ({ 
  velocityScore, 
  growthRate, 
  saturation, 
  freshness 
}) => {
  return (
    <div className="bg-slate-panel border border-slate-border rounded-xl p-6 flex flex-col h-full relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Zap size={20} />
        </div>
        <div>
          <h3 className="text-lg font-display font-bold">Narrative Velocity</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Propagation Speed Engine</p>
        </div>
      </div>

      <div className="space-y-6 flex-1 relative z-10">
        {/* Momentum Gauge */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                className="text-slate-800 stroke-current"
                strokeWidth="8"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
              />
              <motion.circle
                className="text-primary stroke-current"
                strokeWidth="8"
                strokeLinecap="round"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                initial={{ strokeDasharray: "0 251.2" }}
                animate={{ strokeDasharray: `${(velocityScore / 100) * 251.2} 251.2` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-display font-bold">{velocityScore.toFixed(0)}</span>
              <span className="text-[8px] text-slate-500 font-bold uppercase">Score</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] font-bold text-emerald-500 flex items-center gap-1">
            <TrendingUp size={10} /> +{growthRate.toFixed(1)}% Growth
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-black/20 border border-white/5">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Saturation</div>
            <div className="flex items-end gap-2">
              <span className="text-lg font-display font-bold">{saturation.toFixed(0)}%</span>
              <div className="h-1 flex-1 bg-slate-800 rounded-full mb-1.5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${saturation}%` }}
                  className={cn(
                    "h-full rounded-full",
                    saturation > 80 ? "bg-red-500" : saturation > 50 ? "bg-amber-500" : "bg-emerald-500"
                  )}
                />
              </div>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-black/20 border border-white/5">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Freshness</div>
            <div className="flex items-end gap-2">
              <span className="text-lg font-display font-bold">{freshness.toFixed(0)}%</span>
              <div className="h-1 flex-1 bg-slate-800 rounded-full mb-1.5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${freshness}%` }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 bg-primary/5 border border-primary/10 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
            <Activity size={12} /> Narrative Score
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            {velocityScore.toFixed(0)} / 100
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[8px] text-slate-500 uppercase font-bold">
            <span>Search Velocity</span>
            <span className="text-slate-300">{(velocityScore * 0.4).toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-[8px] text-slate-500 uppercase font-bold">
            <span>Media Mentions</span>
            <span className="text-slate-300">{(velocityScore * 0.35).toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-[8px] text-slate-500 uppercase font-bold">
            <span>Social Amplification</span>
            <span className="text-slate-300">{(velocityScore * 0.25).toFixed(0)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-black/40 rounded-lg border border-white/5">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
          <Activity size={12} /> Velocity Insight
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          {velocityScore > 70 
            ? "Narrative is in hyper-growth phase. High probability of mainstream breakout." 
            : velocityScore > 40 
            ? "Steady accumulation of interest. Monitoring for volatility spike." 
            : "Dormant or early-stage narrative. Low immediate impact."}
        </p>
      </div>
    </div>
  );
};

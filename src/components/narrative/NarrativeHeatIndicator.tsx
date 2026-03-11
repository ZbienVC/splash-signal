import React from 'react';
import { motion } from 'motion/react';
import { Activity, Shield, Target, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NarrativeHeatIndicatorProps {
  retailAttention: number;
  recentArticles: { title: string; url: string; source: string }[];
}

export const NarrativeHeatIndicator: React.FC<NarrativeHeatIndicatorProps> = ({ 
  retailAttention, 
  recentArticles 
}) => {
  return (
    <div className="bg-slate-panel border border-slate-border rounded-xl p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold">Heat Score Indicator</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Retail Attention Index</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-400">SECURE FEED</span>
        </div>
      </div>

      <div className="flex-1 space-y-6">
        {/* Heat Score Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <span>Retail Attention Surge</span>
            <span className={cn(
              "font-mono",
              retailAttention > 70 ? "text-red-500" : retailAttention > 40 ? "text-amber-500" : "text-emerald-500"
            )}>{retailAttention.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-black/40 rounded-full overflow-hidden flex">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${retailAttention}%` }}
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                retailAttention > 70 ? "bg-red-500" : retailAttention > 40 ? "bg-amber-500" : "bg-emerald-500"
              )}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-600 font-bold uppercase tracking-widest">
            <span>Low Interest</span>
            <span>FOMO Zone</span>
          </div>
        </div>

        {/* Recent Articles Feed */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Target size={12} className="text-primary" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent Media Mentions</span>
          </div>
          <div className="space-y-2">
            {recentArticles.map((article, i) => (
              <a 
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg bg-black/20 border border-white/5 hover:border-primary/30 transition-all group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="text-[11px] font-bold text-slate-300 group-hover:text-primary transition-colors leading-tight">
                    {article.title}
                  </div>
                  <ExternalLink size={12} className="text-slate-600 shrink-0 group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-2 text-[9px] text-slate-500 font-mono uppercase tracking-widest">
                  Source: {article.source}
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
        <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">
          <Activity size={12} /> Heat Insight
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          {retailAttention > 70 
            ? "Retail FOMO is peaking. High risk of local top formation." 
            : retailAttention > 40 
            ? "Growing retail interest detected. Monitoring for search volume surge." 
            : "Retail is largely unaware of this narrative. Early accumulation phase."}
        </p>
      </div>
    </div>
  );
};

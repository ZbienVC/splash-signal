import React from 'react';
import { WalletBehaviorData } from '../../services/walletBehaviorService';
import { StrategyTypeIndicator } from './StrategyTypeIndicator';
import { Clock, Zap, Target, BarChart3, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface WalletBehaviorCardProps {
  data: WalletBehaviorData;
}

export const WalletBehaviorCard: React.FC<WalletBehaviorCardProps> = ({ data }) => {
  return (
    <div className="bg-slate-panel border border-slate-border rounded-2xl p-6 flex flex-col h-full relative overflow-hidden group">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
      
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-display font-bold">{data.strategyType}</h3>
            <StrategyTypeIndicator type={data.traderType} />
          </div>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">Behavioral Profile: {data.address.slice(0, 6)}...{data.address.slice(-4)}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-display font-bold text-primary">{data.successRate.toFixed(0)}%</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Success Rate</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1 relative z-10">
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-black/20 border border-white/5">
            <div className="flex items-center gap-2 mb-3 text-slate-500">
              <Clock size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Avg Hold Time</span>
            </div>
            <div className="text-lg font-display font-bold">{data.avgHoldTime}</div>
          </div>

          <div className="p-4 rounded-xl bg-black/20 border border-white/5">
            <div className="flex items-center gap-2 mb-3 text-slate-500">
              <Target size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Typical Entry Phase</span>
            </div>
            <div className="text-lg font-display font-bold">{data.typicalEntryPhase}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>Profit Ratio</span>
              <span className="text-emerald-500">{data.metrics.profitRatio.toFixed(1)}x</span>
            </div>
            <div className="h-1 bg-black/40 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (data.metrics.profitRatio / 5) * 100)}%` }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>Entry Timing</span>
              <span className="text-primary">{data.metrics.entryTimingScore.toFixed(0)}/100</span>
            </div>
            <div className="h-1 bg-black/40 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${data.metrics.entryTimingScore}%` }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-slate-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position Patterns</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed italic">"{data.metrics.positionSizePattern}"</p>
            
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-slate-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Frequency</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed italic">"{data.metrics.tradingFrequency}"</p>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-primary/5 border border-primary/10 rounded-xl flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Zap size={20} />
        </div>
        <div>
          <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Behavioral Insight</div>
          <p className="text-[11px] text-slate-400 leading-tight">
            This wallet exhibits high-conviction entries during the {data.typicalEntryPhase.toLowerCase()} phase. 
            The {data.metrics.winRate}% win rate suggests a sophisticated {data.traderType.toLowerCase()} strategy.
          </p>
        </div>
      </div>
    </div>
  );
};

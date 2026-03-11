import React from 'react';
import { 
  Zap, 
  Activity, 
  Clock, 
  ExternalLink,
  Shield,
  Target,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { DevActivity } from '../../types/signalos';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export const DevActivityTimeline: React.FC<{ activity: DevActivity[] }> = ({ activity }) => {
  return (
    <div className="bg-slate-panel border border-slate-border rounded-2xl p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-display font-bold">Developer Activity Timeline</h3>
          <div className="flex items-center gap-2 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[10px] font-bold text-red-500">
            TRACKING
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-red-500" />
          <span className="text-xs font-bold text-slate-400">DEV WALLET</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide">
        {activity.map((item, i) => (
          <div key={i} className="relative pl-8 group">
            {/* Timeline Line */}
            {i !== activity.length - 1 && (
              <div className="absolute left-[15px] top-8 bottom-[-24px] w-px bg-slate-border group-hover:bg-primary/30 transition-colors"></div>
            )}
            
            {/* Timeline Dot */}
            <div className={cn(
              "absolute left-0 top-1.5 w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 border-slate-panel transition-all",
              item.action.includes('Sell') ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-primary/10 text-primary border-primary/20"
            )}>
              {item.action.includes('Deploy') ? <Zap size={14} /> : 
               item.action.includes('Add') ? <TrendingUp size={14} /> : 
               item.action.includes('Sell') ? <TrendingDown size={14} /> : <Activity size={14} />}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-start">
                <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">{item.action}</div>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest flex items-center gap-1">
                  <Clock size={10} /> {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                <span className="text-primary">{item.wallet}</span>
                <span className="h-2 w-px bg-slate-border"></span>
                <span>{item.amount} Tokens</span>
              </div>
              <div className="flex items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a 
                  href={`https://solscan.io/tx/${item.txHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[9px] font-bold text-slate-500 flex items-center gap-1 hover:text-primary transition-colors"
                >
                  TX: {item.txHash} <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-red-500/5 rounded-xl border border-red-500/10 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
          <AlertTriangle size={20} />
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alert Status</div>
          <div className="text-lg font-display font-bold text-red-500">Active Selling Detected</div>
          <div className="text-[9px] text-red-400 font-bold uppercase tracking-widest">Dev has sold 5% of total supply in last hour</div>
        </div>
      </div>
    </div>
  );
};

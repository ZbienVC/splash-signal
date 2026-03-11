import React from 'react';
import { Clock, Plus, Minus, Lock, Unlock, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LiquidityEvent {
  id: string;
  type: 'ADD' | 'REMOVE' | 'MIGRATE' | 'LOCK' | 'UNLOCK';
  wallet: string;
  amount_usd: number;
  timestamp: number;
}

interface LiquidityTimelineProps {
  events: LiquidityEvent[];
}

export const LiquidityTimeline: React.FC<LiquidityTimelineProps> = ({ events }) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ADD': return <Plus size={14} className="text-emerald-500" />;
      case 'REMOVE': return <Minus size={14} className="text-red-500" />;
      case 'LOCK': return <Lock size={14} className="text-primary" />;
      case 'UNLOCK': return <Unlock size={14} className="text-amber-500" />;
      default: return <ArrowRight size={14} className="text-slate-500" />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'ADD': return 'Liquidity Added';
      case 'REMOVE': return 'Liquidity Removed';
      case 'LOCK': return 'LP Locked';
      case 'UNLOCK': return 'LP Unlocked';
      case 'MIGRATE': return 'Liquidity Migrated';
      default: return type;
    }
  };

  return (
    <div className="bg-slate-panel border border-slate-border rounded-2xl p-6 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Clock size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold">Liquidity Timeline</h3>
          <p className="text-xs text-slate-500">Historical event log for tracked pools</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
        {events.length === 0 ? (
          <div className="text-center py-10 text-slate-600 text-sm">No recent events detected.</div>
        ) : (
          events.map((event, i) => (
            <div key={event.id} className="relative pl-6 pb-4 last:pb-0">
              {/* Timeline Line */}
              {i < events.length - 1 && (
                <div className="absolute left-[7px] top-[20px] bottom-0 w-px bg-slate-800" />
              )}
              
              {/* Timeline Dot */}
              <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center z-10">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  event.type === 'ADD' ? "bg-emerald-500" : 
                  event.type === 'REMOVE' ? "bg-red-500" : 
                  event.type === 'LOCK' ? "bg-primary" : "bg-amber-500"
                )} />
              </div>

              <div className="bg-black/20 border border-white/5 rounded-xl p-3 hover:border-white/10 transition-all">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{getEventLabel(event.type)}</span>
                    <span className="text-[10px] font-mono text-slate-500">{event.wallet}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm font-bold text-slate-300">
                    ${event.amount_usd.toLocaleString()}
                  </div>
                  <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                    {new Date(event.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Zap, 
  Activity, 
  Clock, 
  Target,
  AlertCircle,
  TrendingDown,
  Users
} from 'lucide-react';
import { RiskSignal } from '../../types/signalos';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { SourceChip } from '../common/SourceChip';

export const RiskSignalsPanel: React.FC<{ signals: RiskSignal[] }> = ({ signals }) => {
  return (
    <div className="bg-slate-panel border border-slate-border rounded-2xl p-6 flex flex-col h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-display font-bold">Risk Signal Panel</h3>
          <div className="flex items-center gap-2 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] font-bold text-amber-500">
            REAL-TIME
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-400">{signals.length} SIGNALS</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
        {signals.map((signal, i) => (
          <div key={signal.id} className={cn(
            "p-4 rounded-xl border transition-all group relative overflow-hidden",
            signal.status === 'critical' ? "bg-red-500/10 border-red-500/30" : 
            signal.status === 'high' ? "bg-amber-500/10 border-amber-500/30" : 
            signal.status === 'medium' ? "bg-blue-500/10 border-blue-500/30" : "bg-slate-700/10 border-white/5"
          )}>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                signal.status === 'critical' ? "bg-red-500/20 text-red-500" : 
                signal.status === 'high' ? "bg-amber-500/20 text-amber-500" : 
                signal.status === 'medium' ? "bg-blue-500/20 text-blue-500" : "bg-slate-700/30 text-slate-400"
              )}>
                {signal.status === 'critical' ? <AlertTriangle size={18} /> : 
                 signal.status === 'high' ? <AlertCircle size={18} /> : 
                 signal.status === 'medium' ? <Activity size={18} /> : <Shield size={18} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-white group-hover:text-primary transition-colors uppercase tracking-tight">{signal.label}</div>
                  <SourceChip evidence={signal.sourcedEvidence || { sources: [] }} title={signal.label} />
                </div>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest flex items-center gap-1">
                  <Clock size={10} /> {new Date(signal.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed font-mono">
              {signal.evidence}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-black/40 rounded-xl border border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Target size={12} className="text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Inference Engine v4.2</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          Signals are derived from real-time on-chain heuristics and behavioral pattern matching.
        </p>
      </div>
    </div>
  );
};

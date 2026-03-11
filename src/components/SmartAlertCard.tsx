import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  TrendingUp, 
  Droplets, 
  Cpu, 
  Clock, 
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { SmartAlert } from '../services/smartAlertService';
import { motion } from 'motion/react';
import { SourceChip } from './common/SourceChip';

interface SmartAlertCardProps {
  alert: SmartAlert;
}

const ALERT_ICONS: Record<string, any> = {
  'Narrative Spike': Zap,
  'Dev Selling': ShieldAlert,
  'Whale Accumulation': TrendingUp,
  'Liquidity Collapse': Droplets,
  'Bot Swarm': Cpu,
};

export const SmartAlertCard: React.FC<SmartAlertCardProps> = ({ alert }) => {
  const Icon = ALERT_ICONS[alert.type] || AlertTriangle;
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "relative bg-slate-panel border rounded-xl p-4 flex gap-4 group transition-all overflow-hidden",
        alert.severity === 'critical' ? "border-red-500/40 bg-red-500/[0.02]" : 
        alert.severity === 'high' ? "border-amber-500/40 bg-amber-500/[0.02]" : 
        "border-primary/40 bg-primary/[0.02]"
      )}
    >
      {/* Indicator Bar */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1",
        alert.severity === 'critical' ? "bg-red-500" : 
        alert.severity === 'high' ? "bg-amber-500" : 
        "bg-primary"
      )} />

      {/* Background Glow */}
      <div className={cn(
        "absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -mr-12 -mt-12 opacity-10",
        alert.severity === 'critical' ? "bg-red-500" : 
        alert.severity === 'high' ? "bg-amber-500" : 
        "bg-primary"
      )} />

      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
        alert.severity === 'critical' ? "bg-red-500/20 text-red-500" : 
        alert.severity === 'high' ? "bg-amber-500/20 text-amber-500" : 
        "bg-primary/20 text-primary"
      )}>
        <Icon size={24} />
      </div>

      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest",
              alert.severity === 'critical' ? "bg-red-500 text-white" : 
              alert.severity === 'high' ? "bg-amber-500 text-black" : 
              "bg-primary text-white"
            )}>
              {alert.type}
            </span>
            <SourceChip evidence={alert.evidence || { sources: [] }} title={alert.type} />
            {alert.targetAsset && (
              <span className="text-[10px] font-mono font-bold text-slate-300 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                ${alert.targetAsset}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
            <Clock size={10} />
            {new Date(alert.timeDetected).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>

        <h3 className="text-lg font-display font-bold group-hover:text-primary transition-colors">
          {alert.description}
        </h3>

        <div className="mt-3 grid grid-cols-2 gap-4">
          <div className="p-2 rounded-lg bg-black/30 border border-white/5">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Trigger Condition</div>
            <div className="text-xs font-mono font-bold text-slate-200">{alert.triggerData}</div>
          </div>
          <div className="p-2 rounded-lg bg-black/30 border border-white/5">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Confidence</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full",
                    alert.confidence > 90 ? "bg-emerald-500" : alert.confidence > 70 ? "bg-primary" : "bg-amber-500"
                  )} 
                  style={{ width: `${alert.confidence}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-300">{alert.confidence}%</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Smart Alert Engine Active</span>
          </div>
          <button className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-1">
            VIEW FORENSICS <ArrowUpRight size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

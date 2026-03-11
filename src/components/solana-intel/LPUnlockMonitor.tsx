import React from 'react';
import { LPStatus } from '../../services/forensicService';
import { Lock, Unlock, ShieldCheck, AlertTriangle, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LPUnlockMonitorProps {
  status: LPStatus;
}

export const LPUnlockMonitor: React.FC<LPUnlockMonitorProps> = ({ status }) => {
  return (
    <div className="bg-slate-panel border border-slate-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          status.isLocked ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
        )}>
          {status.isLocked ? <Lock size={20} /> : <Unlock size={20} />}
        </div>
        <div>
          <h3 className="text-lg font-display font-bold">LP Unlock Detection</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Liquidity Provision Status</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <div className="text-4xl font-display font-bold">{status.percentLocked}%</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Liquidity Locked</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-slate-300">{status.provider}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Locker Provider</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-black/20 border border-white/5">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">LP Owner</div>
          <div className="text-[10px] font-mono text-primary truncate">{status.owner}</div>
        </div>

        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full", status.isLocked ? "bg-emerald-500" : "bg-red-500")} 
            style={{ width: `${status.percentLocked}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-black/20 border border-white/5">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Calendar size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Unlock Date</span>
            </div>
            <div className="text-sm font-bold">{status.unlockTime || 'N/A (Unlocked)'}</div>
          </div>
          <div className="p-3 rounded-xl bg-black/20 border border-white/5">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <ShieldCheck size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Security Grade</span>
            </div>
            <div className={cn(
              "text-sm font-bold",
              status.isLocked ? "text-emerald-500" : "text-red-500"
            )}>
              {status.isLocked ? 'SECURE' : 'CRITICAL'}
            </div>
          </div>
        </div>

        {!status.isLocked && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-500 shrink-0" />
            <p className="text-[10px] text-red-400 leading-tight font-bold uppercase tracking-wider">
              Warning: Liquidity is not locked. Developer can remove LP at any time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

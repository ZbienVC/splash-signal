import React from 'react';
import { Users, Fingerprint, Activity, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ClusterRelationshipViewProps {
  clusters: { id: string; members: string[]; coordinationScore: number }[];
}

export const ClusterRelationshipView: React.FC<ClusterRelationshipViewProps> = ({ clusters }) => {
  return (
    <div className="bg-slate-panel border border-slate-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
          <Users size={20} />
        </div>
        <div>
          <h3 className="text-lg font-display font-bold">Cluster Relationships</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Coordinated Behavior Detection</p>
        </div>
      </div>

      <div className="space-y-4">
        {clusters.map((cluster, i) => (
          <div key={i} className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Fingerprint size={14} className="text-purple-500" />
                <span className="text-xs font-bold uppercase tracking-widest">Cluster {cluster.id}</span>
              </div>
              <div className={cn(
                "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest",
                cluster.coordinationScore > 80 ? "bg-red-500 text-white" : "bg-purple-500/20 text-purple-500"
              )}>
                {cluster.coordinationScore}% Coordination
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {cluster.members.map((member, j) => (
                <div key={j} className="px-2 py-1 bg-black/40 border border-white/5 rounded text-[10px] font-mono text-slate-400">
                  {(member || '').slice(0, 4)}...{(member || '').slice(-4)}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <Activity size={12} />
                <span>Simultaneous Buy/Sell Detected</span>
              </div>
              <button className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                EXPAND <ArrowRight size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

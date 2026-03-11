
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  ExternalLink, 
  Info, 
  Shield, 
  AlertCircle,
  ChevronRight,
  Clock,
  DollarSign,
  Users,
  Activity
} from 'lucide-react';
import { 
  ComposedChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Scatter,
  ZAxis
} from 'recharts';
import { cn } from '../lib/utils';
import { ClusterIntelligence, ClusterEvidence } from '../types/signalos';

interface ClusterIntelligenceSystemProps {
  clusters: ClusterIntelligence[];
  priceData: any[];
}

export const ClusterIntelligenceSystem: React.FC<ClusterIntelligenceSystemProps> = ({ clusters, priceData }) => {
  const [selectedCluster, setSelectedCluster] = useState<ClusterIntelligence | null>(null);

  const clusterMarkers = useMemo(() => {
    return clusters.map(cluster => {
      // Find closest price point for the marker
      const closestPoint = priceData.reduce((prev, curr) => {
        return Math.abs(curr.timestamp - cluster.startTime) < Math.abs(prev.timestamp - cluster.startTime) ? curr : prev;
      }, priceData[0]);

      return {
        ...cluster,
        x: cluster.startTime,
        y: closestPoint?.price || 0,
        z: cluster.totalVolume
      };
    });
  }, [clusters, priceData]);

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'Whale Accumulation': return '#10b981'; // green
      case 'Distribution': return '#ef4444'; // red
      case 'Bot Activity': return '#8b5cf6'; // purple
      default: return '#64748b';
    }
  };

  const getMarkerShape = (type: string) => {
    switch (type) {
      case 'Whale Accumulation': return 'triangle';
      case 'Distribution': return 'triangle';
      case 'Bot Activity': return 'hexagon';
      default: return 'circle';
    }
  };

  const CustomMarker = (props: any) => {
    const { cx, cy, payload } = props;
    const color = getMarkerColor(payload.clusterType);
    const shape = getMarkerShape(payload.clusterType);

    return (
      <g 
        onClick={() => setSelectedCluster(payload)}
        className="cursor-pointer hover:filter hover:brightness-125 transition-all"
      >
        {shape === 'triangle' ? (
          <path 
            d={payload.clusterType === 'Whale Accumulation' 
              ? `M ${cx} ${cy-8} L ${cx+8} ${cy+8} L ${cx-8} ${cy+8} Z` 
              : `M ${cx} ${cy+8} L ${cx+8} ${cy-8} L ${cx-8} ${cy-8} Z`}
            fill={color}
            stroke="#fff"
            strokeWidth={1}
          />
        ) : (
          <path 
            d={`M ${cx} ${cy-8} L ${cx+7} ${cy-4} L ${cx+7} ${cy+4} L ${cx} ${cy+8} L ${cx-7} ${cy+4} L ${cx-7} ${cy-4} Z`}
            fill={color}
            stroke="#fff"
            strokeWidth={1}
          />
        )}
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* Price Chart with Cluster Markers */}
      <div className="bg-slate-panel border border-slate-border rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-display font-bold flex items-center gap-2">
            <Activity className="text-primary" size={20} />
            Cluster Intelligence Chart
          </h3>
          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-sm rotate-45" />
              <span className="text-emerald-500">Accumulation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-red-500 rounded-sm rotate-[225deg]" />
              <span className="text-red-500">Distribution</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-violet-500 rounded-sm" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
              <span className="text-violet-500">Bot Swarm</span>
            </div>
          </div>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4b" vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                type="number"
                domain={['auto', 'auto']}
                tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                stroke="#4b5563" 
                fontSize={10} 
              />
              <YAxis 
                dataKey="price" 
                domain={['auto', 'auto']}
                stroke="#4b5563" 
                fontSize={10} 
                tickFormatter={(v) => `$${v.toFixed(4)}`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1c2632', border: '1px solid #2d3a4b', borderRadius: '8px' }}
                labelFormatter={(t) => new Date(t).toLocaleString()}
                formatter={(v: any) => [`$${v.toFixed(6)}`, 'Price']}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#137fec" 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 4, fill: '#137fec' }}
              />
              <Scatter 
                data={clusterMarkers} 
                shape={<CustomMarker />}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cluster List (Simplified View) */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Recent Signals</h3>
          <div className="space-y-3">
            {clusters.length === 0 ? (
              <div className="bg-slate-panel/50 border border-slate-border rounded-xl p-8 text-center">
                <p className="text-slate-500 text-xs italic">No clusters detected in recent window</p>
              </div>
            ) : (
              clusters.map((cluster) => (
                <button
                  key={cluster.id}
                  onClick={() => setSelectedCluster(cluster)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all duration-300 group",
                    selectedCluster?.id === cluster.id 
                      ? "bg-primary/10 border-primary shadow-lg shadow-primary/5" 
                      : "bg-slate-panel border-slate-border hover:border-slate-500"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        cluster.clusterType === 'Whale Accumulation' ? "bg-emerald-500/20 text-emerald-500" :
                        cluster.clusterType === 'Distribution' ? "bg-red-500/20 text-red-500" :
                        "bg-violet-500/20 text-violet-500"
                      )}>
                        {cluster.clusterType === 'Whale Accumulation' ? <TrendingUp size={14} /> :
                         cluster.clusterType === 'Distribution' ? <TrendingDown size={14} /> :
                         <Zap size={14} />}
                      </div>
                      <span className="font-display font-bold text-sm">{cluster.clusterType}</span>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                      cluster.signalStrength === 'High' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                      cluster.signalStrength === 'Medium' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                      "bg-slate-500/10 text-slate-500 border-slate-500/20"
                    )}>
                      {cluster.signalStrength}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="text-[10px] text-slate-500">
                      <span className="font-bold text-white">${(cluster.totalVolume / 1000).toFixed(1)}k</span> volume
                    </div>
                    <div className="text-[10px] text-slate-500">
                      <span className="font-bold text-white">{cluster.wallets.length}</span> wallets
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{new Date(cluster.startTime).toLocaleTimeString()}</span>
                    <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Cluster Detail Panel */}
        <div className="lg:col-span-2">
          {selectedCluster ? (
            <div className="bg-slate-panel border border-slate-border rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className={cn(
                "p-6 border-b border-slate-border flex justify-between items-center",
                selectedCluster.clusterType === 'Whale Accumulation' ? "bg-emerald-500/5" :
                selectedCluster.clusterType === 'Distribution' ? "bg-red-500/5" :
                "bg-violet-500/5"
              )}>
                <div>
                  <h2 className="text-xl font-display font-bold flex items-center gap-3">
                    {selectedCluster.clusterType}
                    <span className="text-xs font-mono text-slate-500 font-normal">ID: {selectedCluster.id.slice(0, 8)}</span>
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">{selectedCluster.interpretation}</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Confidence</div>
                  <div className="text-2xl font-display font-bold text-primary">{(selectedCluster.confidence * 100).toFixed(0)}%</div>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <DollarSign size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Total Volume</span>
                    </div>
                    <div className="text-lg font-display font-bold text-white">${selectedCluster.totalVolume.toLocaleString()}</div>
                  </div>
                  <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Users size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Wallets</span>
                    </div>
                    <div className="text-lg font-display font-bold text-white">{selectedCluster.wallets.length}</div>
                  </div>
                  <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Clock size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Duration</span>
                    </div>
                    <div className="text-lg font-display font-bold text-white">
                      {Math.ceil((selectedCluster.endTime - selectedCluster.startTime) / 1000)}s
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Shield size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Status</span>
                    </div>
                    <div className="text-lg font-display font-bold text-emerald-500">Verified</div>
                  </div>
                </div>

                {/* Evidence Panel */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Info size={14} />
                      Raw Transaction Evidence
                    </h3>
                    <span className="text-[10px] text-slate-500 italic">Verifiable on Solana Mainnet</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-border">
                          <th className="pb-3 pl-2">Wallet</th>
                          <th className="pb-3">Amount</th>
                          <th className="pb-3">USD Value</th>
                          <th className="pb-3">Time</th>
                          <th className="pb-3 pr-2 text-right">Signature</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {selectedCluster.evidence.map((ev, i) => (
                          <tr key={i} className="group hover:bg-white/5 transition-colors">
                            <td className="py-3 pl-2">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400">
                                  {ev.wallet.slice(0, 2)}
                                </div>
                                <span className="text-xs font-mono text-slate-300 group-hover:text-white transition-colors">
                                  {ev.wallet.slice(0, 4)}...{ev.wallet.slice(-4)}
                                </span>
                              </div>
                            </td>
                            <td className="py-3">
                              <span className={cn(
                                "text-xs font-mono font-bold",
                                ev.amount > 0 ? "text-emerald-500" : "text-red-500"
                              )}>
                                {ev.amount > 0 ? '+' : ''}{ev.amount.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="text-xs font-mono text-slate-400">${ev.usdValue.toLocaleString()}</span>
                            </td>
                            <td className="py-3">
                              <span className="text-xs text-slate-500">{new Date(ev.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                            </td>
                            <td className="py-3 pr-2 text-right">
                              <a 
                                href={`https://solscan.io/tx/${ev.signature}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                              >
                                VIEW <ExternalLink size={10} />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-panel/30 border border-slate-border border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-12">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-600 mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-lg font-display font-bold text-slate-400 mb-2">No Cluster Selected</h3>
              <p className="text-sm text-slate-500 max-w-xs">
                Click on a marker in the chart or a signal in the list to inspect the raw on-chain evidence.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  TrendingUp, 
  Activity, 
  Clock, 
  ExternalLink, 
  Zap, 
  Search,
  ArrowUpRight,
  Shield,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { NarrativeIntelligence, NarrativeToken, NarrativeSignal } from '../types/signalos';

interface NarrativeIntelligencePanelProps {
  // We'll fetch data internally or pass it down
}

export const NarrativeIntelligencePanel: React.FC<NarrativeIntelligencePanelProps> = () => {
  const [data, setData] = useState<NarrativeIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNarrativeId, setSelectedNarrativeId] = useState<string | null>(null);

  const fetchIntelligence = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/narrative-intelligence');
      if (!response.ok) throw new Error('Failed to fetch');
      const json = await response.json();
      setData(json.payload);
      if (json.payload.signals.length > 0 && !selectedNarrativeId) {
        setSelectedNarrativeId(json.payload.signals[0].id);
      }
    } catch (e) {
      console.error('Narrative Intelligence fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
    const interval = setInterval(fetchIntelligence, 60000);
    return () => clearInterval(interval);
  }, []);

  const selectedNarrative = data?.signals.find(s => s.id === selectedNarrativeId);
  const associatedTokens = data?.tokens.filter(t => t.narrativeId === selectedNarrativeId) || [];

  if (loading && !data) {
    return (
      <div className="bg-slate-panel border border-slate-border rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-primary mb-4" size={32} />
        <p className="text-sm font-mono text-slate-500">SCANNING GLOBAL NARRATIVE VECTORS...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-panel border border-slate-border rounded-2xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
            <Globe className="text-indigo-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-slate-900">Narrative Intelligence Feed</h3>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Cross-Source Trend Detection & Token Matching</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-black/40 border border-white/10 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-500 uppercase">Live Pipeline</span>
          </div>
          <button 
            onClick={fetchIntelligence}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <RefreshCw size={14} className={cn(loading && "animate-spin text-primary")} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar: Narrative Signals */}
        <div className="w-1/3 border-r border-white/5 overflow-y-auto bg-black/10">
          <div className="p-4 space-y-3">
            {data?.signals.map((signal) => (
              <button
                key={signal.id}
                onClick={() => setSelectedNarrativeId(signal.id)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all group relative overflow-hidden",
                  selectedNarrativeId === signal.id 
                    ? "bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
                    : "bg-black/20 border-white/5 hover:border-white/20"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-300 transition-colors">{signal.name}</span>
                  <div className={cn(
                    "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase",
                    signal.momentumScore === 'High' ? "bg-emerald-500/20 text-emerald-500" :
                    signal.momentumScore === 'Medium' ? "bg-amber-500/20 text-amber-500" :
                    "bg-slate-500/20 text-slate-500"
                  )}>
                    {signal.momentumScore}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                  {signal.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {signal.keywords.slice(0, 2).map(k => (
                      <span key={k} className="text-[8px] font-mono text-indigo-400/60">#{k}</span>
                    ))}
                  </div>
                  <div className="text-[9px] font-mono text-slate-600">
                    {signal.momentumValue}% VEL
                  </div>
                </div>
                {selectedNarrativeId === signal.id && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content: Token Matching */}
        <div className="flex-1 overflow-y-auto bg-black/5">
          {selectedNarrative ? (
            <div className="p-6">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">{selectedNarrative.name}</h2>
                  <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                    {selectedNarrative.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Detection Confidence</div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedNarrative.momentumValue}%` }}
                        className="h-full bg-indigo-500"
                      />
                    </div>
                    <span className="text-xs font-bold text-indigo-400">{selectedNarrative.momentumValue}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-black/20 border border-white/5 rounded-2xl">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Activity size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Social Velocity</span>
                  </div>
                  <div className="text-xl font-display font-bold text-slate-900">+{selectedNarrative.momentumValue * 4}% <span className="text-[10px] text-emerald-500 font-mono ml-1">SPIKE</span></div>
                </div>
                <div className="p-4 bg-black/20 border border-white/5 rounded-2xl">
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Zap size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Token Correlation</span>
                  </div>
                  <div className="text-xl font-display font-bold text-slate-900">{associatedTokens.length} Detected</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Associated Tokens</h4>
                  <div className="text-[9px] text-slate-600 font-mono">MATCHED VIA KEYWORD CLUSTERING</div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {associatedTokens.length > 0 ? (
                    associatedTokens.map((token) => (
                      <div 
                        key={token.id}
                        className="group p-4 bg-black/30 border border-white/5 rounded-xl hover:border-indigo-500/30 transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-lg font-bold text-slate-900 border border-white/10 group-hover:border-indigo-500/20 transition-colors">
                            {token.symbol[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{token.name}</span>
                              <span className="text-[10px] font-mono text-slate-500">{token.symbol}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <BarChart3 size={10} />
                                MC: ${(token.marketCap / 1000).toFixed(1)}K
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Activity size={10} />
                                VOL: ${(token.volume24h / 1000).toFixed(1)}K
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Zap size={10} />
                                LIQ: ${(token.liquidity / 1000).toFixed(1)}K
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(token.launchTime).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className={cn(
                              "text-sm font-mono font-bold",
                              token.change24h >= 0 ? "text-emerald-500" : "text-red-500"
                            )}>
                              {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(1)}%
                            </div>
                            <div className="text-[9px] text-slate-600 font-mono uppercase">24H Performance</div>
                          </div>
                          <a 
                            href={token.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 bg-white/5 hover:bg-indigo-500/20 text-slate-500 hover:text-indigo-400 rounded-lg transition-all"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center">
                      <Search className="text-slate-700 mb-3" size={24} />
                      <p className="text-xs text-slate-500 font-mono">NO TOKENS DETECTED FOR THIS NARRATIVE YET</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12">
              <Globe className="text-slate-800 mb-4 animate-pulse" size={48} />
              <h3 className="text-lg font-display font-bold text-slate-500 mb-2">Select a Narrative Vector</h3>
              <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                Choose a detected trend from the sidebar to analyze associated token launches and market sentiment.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 bg-black/40 flex justify-between items-center">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
            <Shield size={10} />
            AI CLUSTERING: <span className="text-indigo-400">ACTIVE</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
            <Activity size={10} />
            SCAN RATE: <span className="text-indigo-400">1.2s</span>
          </div>
        </div>
        <div className="text-[9px] text-slate-600 font-mono">
          DATA SOURCES: GOOGLE TRENDS, TWITTER, GDELT, DEXSCREENER
        </div>
      </div>
    </div>
  );
};

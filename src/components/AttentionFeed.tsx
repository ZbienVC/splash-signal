import React, { useEffect, useState } from 'react';
import { 
  AlertCircle, 
  Zap, 
  Droplets, 
  MessageSquare, 
  ArrowUpRight, 
  Filter,
  MoreHorizontal,
  Loader2,
  RefreshCw,
  Globe,
  TrendingUp,
  Shield,
  Sparkles,
  Users,
  Flame,
  Newspaper,
  ShieldAlert,
  Coins,
  ExternalLink,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { NarrativeIntelligence, NarrativeSignal, NewsIntelligence, NarrativeToken } from '../types/signalos';
import { AppLink } from './common/AppLink';
import { Tooltip } from './common/Tooltip';
import { FreshnessIndicator, ViewSource } from './common/SignalUI';
import { motion, AnimatePresence } from 'framer-motion';

export const AttentionFeed: React.FC = () => {
  const [intelligence, setIntelligence] = useState<NarrativeIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [activeNarrative, setActiveNarrative] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  const fetchIntelligence = async (isRefresh: boolean = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch(`/api/narrative-intelligence${isRefresh ? '?refresh=true' : ''}`);
      if (response.ok) {
        const json = await response.json();
        setIntelligence(json.payload);
        setLastRefreshed(new Date(json.fetchedAt));
      }
    } catch (error) {
      console.error('Failed to fetch narrative intelligence:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      if (response.ok) {
        const json = await response.json();
        // Filter for narrative alerts
        const narrativeAlerts = json.filter((a: any) => a.type === 'narrative_surge');
        setAlerts(narrativeAlerts);
      }
    } catch (e) {
      console.error('Failed to fetch alerts:', e);
    }
  };

  useEffect(() => {
    fetchIntelligence();
    fetchAlerts();
    const interval = setInterval(() => {
      fetchIntelligence(true);
      fetchAlerts();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !intelligence) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse w-6 h-6" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-display font-bold">Initializing Narrative Discovery Engine</h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">Clustering global social signals, news mentions, and detecting emerging crypto narratives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight">Narrative Discovery Engine</h1>
          <div className="flex items-center gap-3 text-slate-500 mt-2 text-sm">
            <FreshnessIndicator status={refreshing ? "UPDATING" : "LIVE"} />
            <div className="flex items-center gap-1">
              <RefreshCw size={14} className={cn((loading || refreshing) && "animate-spin")} />
              {lastRefreshed ? `Last updated: ${lastRefreshed.toLocaleTimeString()}` : 'Syncing...'}
            </div>
            {refreshing && <span className="text-primary animate-pulse flex items-center gap-1 ml-2"><Sparkles size={12} /> Live Scanning...</span>}
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fetchIntelligence(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-panel border border-slate-border rounded-xl text-xs font-bold hover:bg-white/5 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={cn(refreshing && "animate-spin")} /> {refreshing ? 'SCANNING...' : 'SCAN NARRATIVES'}
          </button>
        </div>
      </div>

      {/* Early Narrative Alerts */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 px-2">
              <ShieldAlert size={16} className="text-red-500" />
              <Tooltip content="Critical surges in social activity or volume detected in early-stage narratives.">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest cursor-help">Early Narrative Alerts</h2>
              </Tooltip>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap size={40} className="text-red-500" />
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center border border-red-500/30">
                        <Flame className="text-red-500" size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white uppercase">{alert.token.name}</div>
                        <div className="text-[10px] text-red-500 font-mono font-bold">SURGE DETECTED</div>
                      </div>
                    </div>
                    <div className="px-2 py-0.5 bg-red-500/20 rounded text-[9px] font-bold text-red-500 border border-red-500/30">
                      CRITICAL
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {alert.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-red-500/10">
                    <div className="text-[9px] font-mono text-slate-500 uppercase">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <ViewSource links={[{ label: 'DexScreener', url: alert.token.link }]} />
                      <button className="text-[10px] font-bold text-red-500 hover:text-white flex items-center gap-1 transition-colors">
                        INVESTIGATE <ArrowUpRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Section 1: Narrative Discovery */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-primary" />
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Narrative Discovery</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-600">{intelligence?.signals.length} ACTIVE</span>
          </div>

          <div className="space-y-4">
            {intelligence?.signals.map((signal) => (
              <motion.div
                key={signal.id}
                layoutId={signal.id}
                onClick={() => setActiveNarrative(activeNarrative === signal.id ? null : signal.id)}
                className={cn(
                  "bg-slate-panel border border-slate-border rounded-2xl p-5 cursor-pointer transition-all hover:border-primary/40 group relative overflow-hidden",
                  activeNarrative === signal.id && "border-primary ring-1 ring-primary/20 bg-primary/[0.02]"
                )}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{signal.name}</h3>
                  <div className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    signal.momentumValue > 80 ? "bg-emerald-500/10 text-emerald-500" :
                    signal.momentumValue > 50 ? "bg-amber-500/10 text-amber-500" :
                    "bg-blue-500/10 text-blue-500"
                  )}>
                    {signal.momentumValue}% Velocity
                  </div>
                </div>
                
                <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">{signal.description}</p>
                
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                    <div className="text-[8px] text-slate-500 uppercase font-bold mb-1">Social Velocity</div>
                    <div className="flex items-center gap-1">
                      <TrendingUp size={10} className="text-emerald-500" />
                      <span className="text-[10px] font-mono font-bold text-emerald-500">+{signal.momentumValue}%</span>
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                    <div className="text-[8px] text-slate-500 uppercase font-bold mb-1">News Mentions</div>
                    <div className="flex items-center gap-1">
                      <Newspaper size={10} className="text-blue-500" />
                      <span className="text-[10px] font-mono font-bold text-blue-400">{signal.socialMentions}</span>
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                    <div className="text-[8px] text-slate-500 uppercase font-bold mb-1">Tokens</div>
                    <div className="flex items-center gap-1">
                      <Coins size={10} className="text-primary" />
                      <span className="text-[10px] font-mono font-bold text-white">{intelligence?.tokens.filter(t => t.narrativeId === signal.name).length}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="text-[9px] font-bold text-slate-600 uppercase">Cluster</div>
                    <div className="flex flex-wrap gap-1">
                      {signal.keywords.map((kw, i) => (
                        <div key={i} className="px-1.5 py-0.5 bg-primary/5 border border-primary/10 rounded text-[8px] text-primary/70 font-mono">
                          {kw}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex -space-x-2">
                    {signal.sources.map((src, i) => (
                      <div key={i} className="w-5 h-5 rounded-full bg-slate-800 border border-slate-border flex items-center justify-center text-[8px] font-bold text-slate-400" title={src.name}>
                        {src.name[0]}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Section 2: News Intelligence */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Newspaper size={16} className="text-blue-500" />
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">News Intelligence</h2>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {intelligence?.news
                .filter(n => !activeNarrative || n.narrativeId === activeNarrative)
                .map((news) => (
                  <motion.div
                    key={news.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-panel border border-slate-border rounded-2xl p-5 hover:border-blue-500/40 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] font-mono text-blue-400 uppercase tracking-widest">{news.source}</span>
                      <span className="text-[9px] font-mono text-slate-600">
                        {new Date(news.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold mb-2 leading-snug group-hover:text-blue-400 transition-colors">{news.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">{news.summary}</p>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          news.sentiment === 'positive' ? "bg-emerald-500" : news.sentiment === 'negative' ? "bg-red-500" : "bg-slate-500"
                        )} />
                        <span className="text-[10px] text-slate-500 capitalize">{news.sentiment} Sentiment</span>
                      </div>
                      <a 
                        href={news.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-blue-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        READ ARTICLE <ExternalLink size={10} />
                      </a>
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Section 3: Narrative Tokens */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Coins size={16} className="text-primary" />
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Discovered Tokens</h2>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {intelligence?.tokens
                .filter(t => !activeNarrative || t.narrativeId === activeNarrative)
                .map((token) => (
                  <motion.div
                    key={token.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-panel border border-slate-border rounded-2xl p-5 hover:border-primary/40 transition-all group"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {token.symbol[0]}
                        </div>
                        <div>
                          <div className="text-sm font-bold">{token.name}</div>
                          <div className="text-[10px] font-mono text-slate-500">{token.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold">${token.priceUsd.toFixed(4)}</div>
                        <div className={cn(
                          "text-[10px] font-mono font-bold",
                          token.change24h > 0 ? "text-emerald-500" : "text-red-500"
                        )}>
                          {token.change24h > 0 ? '+' : ''}{token.change24h.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-2 bg-black/20 rounded-lg border border-white/5">
                        <div className="text-[8px] text-slate-600 uppercase font-bold mb-1">Market Cap</div>
                        <div className="text-[10px] font-mono text-slate-300">${(token.marketCap / 1000).toFixed(1)}K</div>
                      </div>
                      <div className="p-2 bg-black/20 rounded-lg border border-white/5">
                        <div className="text-[8px] text-slate-600 uppercase font-bold mb-1">Volume 24H</div>
                        <div className="text-[10px] font-mono text-slate-300">${(token.volume24h / 1000).toFixed(1)}K</div>
                      </div>
                      <div className="p-2 bg-black/20 rounded-lg border border-white/5">
                        <div className="text-[8px] text-slate-600 uppercase font-bold mb-1">Liquidity</div>
                        <div className="text-[10px] font-mono text-slate-300">${(token.liquidity / 1000).toFixed(1)}K</div>
                      </div>
                      <div className="p-2 bg-black/20 rounded-lg border border-white/5">
                        <div className="text-[8px] text-slate-600 uppercase font-bold mb-1">Launchpad</div>
                        <div className="text-[10px] font-mono text-primary uppercase font-bold">{token.source}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4 p-2 bg-primary/5 rounded-lg border border-primary/10">
                      <Zap size={12} className="text-primary shrink-0" />
                      <p className="text-[10px] text-slate-400 leading-tight">{token.matchReason}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-white/5 flex items-center justify-center">
                          <Globe size={10} className="text-slate-500" />
                        </div>
                        <span className="text-[9px] text-slate-500 uppercase font-bold">SOLANA</span>
                      </div>
                      <a 
                        href={token.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-primary hover:text-white flex items-center gap-1 transition-colors"
                      >
                        VIEW TOKEN <ArrowUpRight size={12} />
                      </a>
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

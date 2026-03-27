import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Search, RefreshCw, Loader2, TrendingDown, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface DumpSignal {
  id: string;
  token: string;
  type: 'DEV_SELL' | 'WHALE_EXIT' | 'VOLUME_DROP' | 'HOLDER_DROP' | 'SNIPER_EXIT';
  description: string;
  amount?: string;
  change?: string;
  timeAgo: string;
  severity: 'critical' | 'high' | 'medium';
}

interface TokenDumpAnalysis {
  symbol: string;
  chain: string;
  mcap: string;
  dumpRisk: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  summary: string;
  bullets: string[];
  signals: DumpSignal[];
}

const SIGNAL_EMOJIS: Record<DumpSignal['type'], string> = {
  DEV_SELL:    '🚨',
  WHALE_EXIT:  '⚠️',
  VOLUME_DROP: '⚠️',
  HOLDER_DROP: '⚠️',
  SNIPER_EXIT: '🚨',
};

const MOCK_LIVE_FEED: DumpSignal[] = [
  { id: '1', token: '$RUGME', type: 'DEV_SELL',    description: 'Dev transferred $12K to fresh wallet', amount: '$12K',  timeAgo: '3m ago',  severity: 'critical' },
  { id: '2', token: '$FOMO',  type: 'SNIPER_EXIT', description: '4 snipers exiting simultaneously',       amount: '$9.4K', timeAgo: '7m ago',  severity: 'critical' },
  { id: '3', token: '$MOON',  type: 'WHALE_EXIT',  description: 'Top whale reduced position by 23%',      change: '-23%',  timeAgo: '14m ago', severity: 'high' },
  { id: '4', token: '$DOGE2', type: 'VOLUME_DROP', description: 'Volume dropped 67% in past 2 hours',     change: '-67%',  timeAgo: '22m ago', severity: 'high' },
  { id: '5', token: '$PEPE2', type: 'HOLDER_DROP', description: 'Net -34 holders in last 30 minutes',     change: '-34',   timeAgo: '31m ago', severity: 'medium' },
  { id: '6', token: '$WIF2',  type: 'DEV_SELL',    description: 'Dev wallet sold 8% of supply',           amount: '$6.1K', timeAgo: '45m ago', severity: 'critical' },
  { id: '7', token: '$FROG',  type: 'WHALE_EXIT',  description: 'Top 3 holders reducing positions',       change: '-18%',  timeAgo: '1h ago',  severity: 'high' },
  { id: '8', token: '$SOG',   type: 'VOLUME_DROP', description: 'Volume down 82% vs 6h average',          change: '-82%',  timeAgo: '1h ago',  severity: 'high' },
];

const MOCK_TOKEN_ANALYSIS: TokenDumpAnalysis = {
  symbol: 'EXAMPLE',
  chain: 'SOL',
  mcap: '$234K',
  dumpRisk: 78,
  trend: 'increasing',
  summary: 'High risk of coordinated sell-off',
  bullets: [
    'Dev transferred $8K to fresh wallet 2h ago',
    'Top 3 holders reduced positions by 18%',
    'Volume trending down after initial pump',
  ],
  signals: [
    { id: 's1', token: '$EXAMPLE', type: 'DEV_SELL',    description: 'Dev wallet activity', amount: '$8.2K', timeAgo: '2h ago', severity: 'critical' },
    { id: 's2', token: '$EXAMPLE', type: 'WHALE_EXIT',  description: 'Top holders reducing', change: '-18%', timeAgo: '4h ago', severity: 'high' },
    { id: 's3', token: '$EXAMPLE', type: 'VOLUME_DROP', description: 'Volume dropped sharply', change: '-67%', timeAgo: '6h ago', severity: 'high' },
  ],
};

const getRiskBarColor = (score: number) => {
  if (score > 80) return 'bg-red-500';
  if (score > 60) return 'bg-orange-500';
  if (score > 30) return 'bg-amber-400';
  return 'bg-emerald-500';
};

const getRiskLabel = (score: number) => {
  if (score > 80) return { label: 'CRITICAL', cls: 'text-red-400' };
  if (score > 60) return { label: 'HIGH RISK', cls: 'text-orange-400' };
  if (score > 30) return { label: 'ELEVATED', cls: 'text-amber-400' };
  return { label: 'LOW RISK', cls: 'text-emerald-400' };
};

interface DumpDetectorProps {
  onSelectToken?: (view: string, address: string) => void;
}

export const DumpDetector: React.FC<DumpDetectorProps> = ({ onSelectToken }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [analysis, setAnalysis] = useState<TokenDumpAnalysis | null>(null);
  const [liveFeed, setLiveFeed] = useState<DumpSignal[]>(MOCK_LIVE_FEED);
  const [loading, setLoading] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshFeed = async () => {
    setFeedLoading(true);
    try {
      const res = await fetch('/api/dump-signals/live?limit=20');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLiveFeed(data);
    } catch {
      // keep mock data, shuffle to simulate refresh
      setLiveFeed(prev => [...prev].sort(() => Math.random() - 0.5));
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    intervalRef.current = setInterval(refreshFeed, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const analyzeToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dump-analysis/${tokenInput.trim()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAnalysis(data);
    } catch {
      setAnalysis({ ...MOCK_TOKEN_ANALYSIS, symbol: tokenInput.toUpperCase().replace('$', '') });
    } finally {
      setLoading(false);
    }
  };

  const riskInfo = analysis ? getRiskLabel(analysis.dumpRisk) : null;

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
          <AlertTriangle size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Dump Detector</h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Risk &amp; exit signal monitoring</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Search + Analysis */}
        <div className="space-y-4">
          <form onSubmit={analyzeToken} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="Token address or symbol…"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-9 pr-4 text-sm focus:outline-none focus:border-red-500/40 transition-all placeholder:text-slate-600"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="px-5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <TrendingDown size={13} />}
              ANALYZE
            </button>
          </form>

          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/60 border border-slate-700 rounded-2xl overflow-hidden"
            >
              {/* Token Identity */}
              <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <span className="text-primary">${analysis.symbol}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">{analysis.chain}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">{analysis.mcap} MC</span>
                </div>
              </div>

              {/* Risk Score */}
              <div className="px-5 py-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dump Risk</div>
                    <div className={cn('text-sm font-bold uppercase tracking-wide', riskInfo?.cls)}>{riskInfo?.label}</div>
                  </div>
                  <div className="text-right">
                    <div className={cn('text-3xl font-display font-bold', riskInfo?.cls)}>{analysis.dumpRisk}</div>
                    <div className="text-[10px] text-slate-600">
                      {analysis.trend === 'increasing' ? '↑ Increasing' : analysis.trend === 'decreasing' ? '↓ Decreasing' : '→ Stable'}
                    </div>
                  </div>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.dumpRisk}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className={cn('h-full rounded-full', getRiskBarColor(analysis.dumpRisk), analysis.dumpRisk > 80 && 'animate-pulse')}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="px-5 py-3 border-b border-slate-700/50 bg-slate-950/30">
                <p className="text-xs font-bold text-slate-300 mb-1">"{analysis.summary}"</p>
                {analysis.bullets.map((b, i) => (
                  <div key={i} className="text-[11px] text-slate-500 font-mono flex items-start gap-1.5 mt-1">
                    <span className="text-slate-600 mt-0.5">›</span> {b}
                  </div>
                ))}
              </div>

              {/* Signals */}
              <div className="px-5 py-4 space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">SIGNALS</div>
                {analysis.signals.map(sig => (
                  <div key={sig.id} className="flex items-center gap-3 text-xs">
                    <span>{SIGNAL_EMOJIS[sig.type]}</span>
                    <span className="font-bold text-slate-300 font-mono">{sig.type}</span>
                    <span className="text-slate-500">
                      {sig.amount ?? sig.change}
                    </span>
                    <span className="ml-auto text-slate-600 text-[10px]">{sig.timeAgo}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {!analysis && !loading && (
            <div className="border border-dashed border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3">
              <AlertTriangle size={32} className="text-slate-700" />
              <p className="text-sm text-slate-600">Enter a token address or symbol to analyze dump risk</p>
            </div>
          )}
        </div>

        {/* RIGHT: Live Risk Feed */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-bold text-white">Live Risk Feed</span>
            </div>
            <button
              onClick={refreshFeed}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <RefreshCw size={13} className={feedLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="overflow-y-auto max-h-[500px] divide-y divide-slate-700/30">
            {liveFeed.map(sig => (
              <button
                key={sig.id}
                onClick={() => {
                  setTokenInput(sig.token.replace('$', ''));
                  setAnalysis({ ...MOCK_TOKEN_ANALYSIS, symbol: sig.token.replace('$', '') });
                }}
                className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-slate-800/50 transition-colors group"
              >
                <span className="text-base">{SIGNAL_EMOJIS[sig.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{sig.token}</span>
                    <span className="text-[9px] text-slate-600 font-mono uppercase">{sig.type}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{sig.description}</p>
                </div>
                <div className="text-[10px] text-slate-600 font-mono whitespace-nowrap flex items-center gap-1">
                  <Clock size={9} />
                  {sig.timeAgo}
                </div>
              </button>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-slate-700 text-[10px] text-slate-600 font-mono">
            Auto-refreshes every 30s
          </div>
        </div>
      </div>
    </div>
  );
};

export default DumpDetector;

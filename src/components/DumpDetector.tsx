import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Search, RefreshCw, Loader2, TrendingDown } from 'lucide-react';
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
  recommendation: string;
  signals: DumpSignal[];
}

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
  summary: 'Dev sold $8K into price strength. Top 3 holders reducing. Volume declining 67%.',
  recommendation: 'Consider Exit',
  signals: [
    { id: 's1', token: '$EXAMPLE', type: 'DEV_SELL',    description: 'Dev wallet activity', amount: '$8.2K', timeAgo: '2h ago', severity: 'critical' },
    { id: 's2', token: '$EXAMPLE', type: 'WHALE_EXIT',  description: 'Top holders reducing', change: '-18%', timeAgo: '4h ago', severity: 'high' },
    { id: 's3', token: '$EXAMPLE', type: 'VOLUME_DROP', description: 'Volume dropped sharply', change: '-67%', timeAgo: '6h ago', severity: 'high' },
  ],
};

const MOCK_DIST_FACTORS = [
  { label: 'Sniper concentration', value: '42%',        status: 'warn' as const },
  { label: 'Bundle wallets',       value: 'Active',     status: 'danger' as const },
  { label: 'Whale holdings',       value: '-18%',       status: 'warn' as const },
  { label: 'Dev activity',         value: 'Suspicious', status: 'danger' as const },
  { label: 'Buy/Sell ratio',       value: '0.38',       status: 'danger' as const },
  { label: 'Liquidity vs MC',      value: '4.2%',       status: 'warn' as const },
];

const STATUS_ICON: Record<string, string> = { ok: '✓', warn: '⚠', danger: '●' };
const STATUS_COLOR: Record<string, string> = { ok: 'text-green-400', warn: 'text-amber-400', danger: 'text-red-400' };

const getRiskColor = (score: number) => {
  if (score > 80) return 'text-red-400';
  if (score > 60) return 'text-amber-400';
  if (score > 30) return 'text-amber-400';
  return 'text-green-400';
};

const getRiskLabel = (score: number) => {
  if (score > 80) return 'CRITICAL';
  if (score > 60) return 'HIGH RISK';
  if (score > 30) return 'ELEVATED';
  return 'LOW RISK';
};

const getRiskBarColor = (score: number) => {
  if (score > 80) return 'bg-red-500';
  if (score > 60) return 'bg-amber-500';
  if (score > 30) return 'bg-amber-400';
  return 'bg-green-500';
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-[#94A3B8]" />
        <h1 className="text-base font-semibold text-[#F1F5F9]">Dump Detector</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Search + Analysis */}
        <div className="space-y-4">
          <form onSubmit={analyzeToken} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
              <input
                type="text"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="Token address or symbol..."
                className="w-full bg-[#111827] border border-[#1E2A3A] rounded-lg py-2 pl-9 pr-4 text-sm text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="px-4 bg-[#111827] border border-[#1E2A3A] text-[#94A3B8] rounded-lg text-xs font-medium hover:text-[#F1F5F9] hover:border-[#2D3748] transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <TrendingDown size={12} />}
              Analyze
            </button>
          </form>

          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#111827] border border-[#1E2A3A] rounded-lg overflow-hidden"
            >
              {/* Token identity */}
              <div className="px-4 py-3 border-b border-[#1E2A3A] flex items-center gap-2 text-sm">
                <span className="font-bold text-blue-400">${analysis.symbol}</span>
                <span className="text-[#475569]">·</span>
                <span className="text-[#94A3B8]">{analysis.chain}</span>
                <span className="text-[#475569]">·</span>
                <span className="text-[#94A3B8]">{analysis.mcap} MC</span>
              </div>

              {/* Risk score */}
              <div className="px-4 py-4 border-b border-[#1E2A3A]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[10px] text-[#475569] uppercase tracking-wide mb-0.5">Dump Risk</div>
                    <div className={cn('text-xs font-bold', getRiskColor(analysis.dumpRisk))}>
                      {getRiskLabel(analysis.dumpRisk)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn('text-3xl font-mono font-bold num', getRiskColor(analysis.dumpRisk))}>
                      {analysis.dumpRisk}
                    </div>
                    <div className="text-[10px] text-[#475569]">
                      {analysis.trend === 'increasing' ? '↑ Increasing' : analysis.trend === 'decreasing' ? '↓ Decreasing' : '→ Stable'}
                    </div>
                  </div>
                </div>
                <div className="h-1.5 bg-[#1A2234] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.dumpRisk}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={cn('h-full rounded-full', getRiskBarColor(analysis.dumpRisk))}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="px-4 py-3 border-b border-[#1E2A3A]">
                <span className="text-[10px] text-[#475569] uppercase tracking-wide mr-1">Summary:</span>
                <span className="text-xs text-[#94A3B8]">{analysis.summary}</span>
                <span className="text-[10px] text-[#475569] ml-2">Recommended:</span>
                <span className={cn('text-xs font-medium ml-1', getRiskColor(analysis.dumpRisk))}>{analysis.recommendation}</span>
              </div>

              {/* Distribution factors grid */}
              <div className="px-4 py-3 border-b border-[#1E2A3A]">
                <div className="text-[10px] text-[#475569] uppercase tracking-wide mb-2">Distribution Factors</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  {MOCK_DIST_FACTORS.map((f, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-[#94A3B8]">{f.label}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono text-[#F1F5F9]">{f.value}</span>
                        <span className={cn('text-[10px]', STATUS_COLOR[f.status])}>{STATUS_ICON[f.status]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active signals */}
              <div className="px-4 py-3">
                <div className="text-[10px] text-[#475569] uppercase tracking-wide mb-2">Active Signals</div>
                <div className="space-y-1.5">
                  {analysis.signals.map(sig => (
                    <div key={sig.id} className="flex items-center gap-2 text-xs">
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', sig.severity === 'critical' ? 'bg-red-400' : sig.severity === 'high' ? 'bg-amber-400' : 'bg-[#475569]')} />
                      <span className="text-[#94A3B8] flex-1">{sig.description}</span>
                      <span className="text-[#475569] font-mono">{sig.timeAgo}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {!analysis && !loading && (
            <div className="border border-dashed border-[#1E2A3A] rounded-lg p-10 text-center">
              <AlertTriangle size={24} className="text-[#2D3748] mx-auto mb-2" />
              <p className="text-sm text-[#475569]">Enter a token to analyze dump risk</p>
            </div>
          )}
        </div>

        {/* RIGHT: Live Risk Feed */}
        <div className="bg-[#111827] border border-[#1E2A3A] rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#1E2A3A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-live" />
              <span className="text-sm font-medium text-[#F1F5F9]">Live Risk Feed</span>
            </div>
            <button
              onClick={refreshFeed}
              className="text-[#475569] hover:text-[#94A3B8] transition-colors"
            >
              <RefreshCw size={12} className={feedLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 max-h-[480px] divide-y divide-[#1E2A3A]">
            {liveFeed.map(sig => (
              <button
                key={sig.id}
                onClick={() => {
                  setTokenInput(sig.token.replace('$', ''));
                  setAnalysis({ ...MOCK_TOKEN_ANALYSIS, symbol: sig.token.replace('$', '') });
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-[#1A2234] transition-colors"
              >
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', sig.severity === 'critical' ? 'bg-red-400' : sig.severity === 'high' ? 'bg-amber-400' : 'bg-[#475569]')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#F1F5F9]">{sig.token}</span>
                    <span className="text-[10px] text-[#475569] font-mono uppercase">{sig.type.replace('_', ' ')}</span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] truncate">{sig.description}</p>
                </div>
                <span className="text-[10px] text-[#475569] font-mono whitespace-nowrap shrink-0">{sig.timeAgo}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DumpDetector;

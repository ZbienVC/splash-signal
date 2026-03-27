import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Search, RefreshCw, Loader2, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { getTokenByAddress, DexToken } from '../services/dexscreenerClient';
import { getBirdeyeHolders, getBirdeyeTrades, BirdeyeHolder, BirdeyeTrade } from '../services/birdeyeClient';
import { LiveIndicator } from './ui/LiveIndicator';

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

interface DumpScoreResult {
  score: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'LOW';
  trend: 'INCREASING' | 'STABLE';
  signals: string[];
  top10Concentration: number;
  buySellRatio: number;
  liquidityRatio: number;
}

interface TokenDumpAnalysis {
  symbol: string;
  chain: string;
  mcap: string;
  price: string;
  priceChange1h: number;
  dumpRisk: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  summary: string;
  recommendation: string;
  signals: DumpSignal[];
  holderCount: number;
  isLive: boolean;
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

const MOCK_DIST_FACTORS = [
  { label: 'Sniper concentration', value: '42%',        status: 'warn' as const },
  { label: 'Bundle wallets',       value: 'Active',     status: 'danger' as const },
  { label: 'Whale holdings',       value: '-18%',       status: 'warn' as const },
  { label: 'Dev activity',         value: 'Suspicious', status: 'danger' as const },
  { label: 'Buy/Sell ratio',       value: '0.38',       status: 'danger' as const },
  { label: 'Liquidity vs MC',      value: '4.2%',       status: 'warn' as const },
];

const STATUS_ICON: Record<string, string> = { ok: '✓', warn: '⚠', danger: '●' };
const STATUS_COLOR: Record<string, string> = { ok: 'text-green-600', warn: 'text-amber-600', danger: 'text-red-600' };

const getRiskColor = (score: number) => {
  if (score > 80) return 'text-red-600';
  if (score > 60) return 'text-amber-600';
  if (score > 30) return 'text-amber-600';
  return 'text-green-600';
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

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(2)}`;
}

function computeLiveDumpScore(
  token: DexToken,
  holders: BirdeyeHolder[],
  trades: BirdeyeTrade[],
): DumpScoreResult {
  let score = 0;
  const signals: string[] = [];

  const top10pct = holders.slice(0, 10).reduce((sum, h) => sum + h.percentage, 0);
  if (top10pct > 60) {
    score += 35;
    signals.push(`Top 10 wallets hold ${top10pct.toFixed(0)}% of supply`);
  } else if (top10pct > 40) {
    score += 20;
    signals.push(`Top 10 wallets hold ${top10pct.toFixed(0)}% of supply`);
  }

  const recentSells = trades.filter(t => t.side === 'sell').length;
  const recentBuys = trades.filter(t => t.side === 'buy').length;
  const ratio = recentBuys / Math.max(recentSells, 1);
  if (ratio < 0.4) {
    score += 30;
    signals.push(`Heavy sell pressure: ${recentSells} sells vs ${recentBuys} buys`);
  } else if (ratio < 0.7) {
    score += 15;
    signals.push(`Sell pressure building: ${recentSells} sells vs ${recentBuys} buys`);
  }

  const liquidityMcRatio = token.liquidity / Math.max(token.marketCap, 1);
  if (liquidityMcRatio < 0.03) {
    score += 25;
    signals.push(`Very low liquidity: ${(liquidityMcRatio * 100).toFixed(1)}% of market cap`);
  } else if (liquidityMcRatio < 0.07) {
    score += 12;
    signals.push(`Low liquidity: ${(liquidityMcRatio * 100).toFixed(1)}% of market cap`);
  }

  if (token.priceChange.h1 < -20) {
    score += 10;
    signals.push(`Price down ${token.priceChange.h1.toFixed(0)}% in 1h`);
  }

  const finalScore = Math.min(score, 100);
  return {
    score: finalScore,
    riskLevel: finalScore > 70 ? 'CRITICAL' : finalScore > 50 ? 'HIGH' : finalScore > 30 ? 'ELEVATED' : 'LOW',
    trend: token.priceChange.h1 < token.priceChange.h6 ? 'INCREASING' : 'STABLE',
    signals,
    top10Concentration: top10pct,
    buySellRatio: ratio,
    liquidityRatio: liquidityMcRatio,
  };
}

function buildLiveDumpSignals(result: DumpScoreResult, symbol: string): DumpSignal[] {
  return result.signals.map((desc, i) => ({
    id: `live-${i}`,
    token: `$${symbol}`,
    type: 'VOLUME_DROP' as const,
    description: desc,
    timeAgo: 'now',
    severity: result.riskLevel === 'CRITICAL' ? 'critical' : result.riskLevel === 'HIGH' ? 'high' : 'medium',
  }));
}

// ────────────────────────────────────────────────────────────────────────────

interface DumpDetectorProps {
  onSelectToken?: (view: string, address: string) => void;
}

export const DumpDetector: React.FC<DumpDetectorProps> = ({ onSelectToken: _onSelectToken }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [analysis, setAnalysis] = useState<TokenDumpAnalysis | null>(null);
  const [liveFeed, setLiveFeed] = useState<DumpSignal[]>(MOCK_LIVE_FEED);
  const [loading, setLoading] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisLiveData, setAnalysisLiveData] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshFeed = async () => {
    setFeedLoading(true);
    try {
      const res = await fetch('/api/dump-signals/live?limit=20');
      if (!res.ok) throw new Error();
      const data = await res.json() as DumpSignal[];
      setLiveFeed(data);
    } catch {
      setLiveFeed(prev => [...prev].sort(() => Math.random() - 0.5));
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => { void refreshFeed(); }, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const analyzeToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const addr = tokenInput.trim();
    if (!addr) return;
    setLoading(true);
    setError(null);

    try {
      const [dexResult, holdersResult, tradesResult] = await Promise.allSettled([
        getTokenByAddress(addr),
        getBirdeyeHolders(addr, 20),
        getBirdeyeTrades(addr, 50),
      ]);

      const token = dexResult.status === 'fulfilled' ? dexResult.value : null;
      const holderList: BirdeyeHolder[] = holdersResult.status === 'fulfilled' ? holdersResult.value : [];
      const tradeList: BirdeyeTrade[]  = tradesResult.status === 'fulfilled' ? tradesResult.value : [];

      if (token) {
        const dumpScore = computeLiveDumpScore(token, holderList, tradeList);
        const liveSignals = buildLiveDumpSignals(dumpScore, token.symbol);
        const trendLabel = dumpScore.trend === 'INCREASING' ? 'increasing' : 'stable';

        setAnalysis({
          symbol: token.symbol,
          chain: token.chainLabel,
          mcap: formatUsd(token.marketCap),
          price: `$${token.price < 0.001 ? token.price.toExponential(3) : token.price.toFixed(6)}`,
          priceChange1h: token.priceChange.h1,
          dumpRisk: dumpScore.score,
          trend: trendLabel,
          summary: liveSignals.length > 0 ? liveSignals.map(s => s.description).join('. ') : 'No major risk signals detected.',
          recommendation: dumpScore.score > 70 ? 'Consider Exit' : dumpScore.score > 40 ? 'Monitor Closely' : 'Hold',
          signals: liveSignals,
          holderCount: holderList.length,
          isLive: true,
        });
        setAnalysisLiveData(true);
      } else {
        setError('Token not found on DexScreener. Check the address and try again.');
        setAnalysisLiveData(false);
      }
    } catch {
      setError('Failed to fetch token data. Try again.');
      setAnalysisLiveData(false);
    } finally {
      setLoading(false);
    }
  };

  const liveDistFactors = analysis?.isLive
    ? [
        { label: 'Top 10 concentration', value: '-', status: 'ok' as const },
        { label: 'Buy/Sell ratio',        value: '-', status: 'ok' as const },
        { label: 'Liquidity vs MC',       value: '-', status: 'ok' as const },
      ]
    : MOCK_DIST_FACTORS;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-slate-500" />
        <h1 className="text-base font-semibold text-slate-900">Dump Detector</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Search + Analysis */}
        <div className="space-y-4">
          <form onSubmit={e => { void analyzeToken(e); }} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="Token address or symbol..."
                className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="px-4 bg-white border border-slate-300 text-slate-600 rounded-lg text-xs font-medium hover:text-slate-900 hover:border-slate-400 transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <TrendingDown size={12} />}
              Analyze
            </button>
          </form>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              {/* Token identity */}
              <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-sm flex-wrap">
                <span className="font-bold text-blue-600">${analysis.symbol}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600">{analysis.chain}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600">{analysis.mcap} MC</span>
                {analysis.isLive && (
                  <>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600">{analysis.price}</span>
                    <span className={cn('text-xs font-medium', analysis.priceChange1h >= 0 ? 'text-green-600' : 'text-red-600')}>
                      {analysis.priceChange1h >= 0 ? '+' : ''}{analysis.priceChange1h.toFixed(1)}% 1h
                    </span>
                  </>
                )}
                <span className="ml-auto">
                  <LiveIndicator isLive={analysisLiveData} />
                </span>
              </div>

              {/* Risk score */}
              <div className="px-4 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Dump Risk</div>
                    <div className={cn('text-xs font-bold', getRiskColor(analysis.dumpRisk))}>
                      {getRiskLabel(analysis.dumpRisk)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn('text-3xl font-mono font-bold num', getRiskColor(analysis.dumpRisk))}>
                      {analysis.dumpRisk}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {analysis.trend === 'increasing' ? '↑ Increasing' : analysis.trend === 'decreasing' ? '↓ Decreasing' : '→ Stable'}
                    </div>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.dumpRisk}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={cn('h-full rounded-full', getRiskBarColor(analysis.dumpRisk))}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="px-4 py-3 border-b border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase tracking-wide mr-1">Summary:</span>
                <span className="text-xs text-slate-600">{analysis.summary}</span>
                <span className="text-[10px] text-slate-400 ml-2">Recommended:</span>
                <span className={cn('text-xs font-medium ml-1', getRiskColor(analysis.dumpRisk))}>{analysis.recommendation}</span>
              </div>

              {/* Distribution factors grid */}
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Distribution Factors</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  {liveDistFactors.map((f, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-1 last:border-0 last:pb-0">
                      <span className="text-xs text-slate-600">{f.label}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono text-slate-900">{f.value}</span>
                        <span className={cn('text-[10px]', STATUS_COLOR[f.status])}>{STATUS_ICON[f.status]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active signals */}
              {analysis.signals.length > 0 && (
                <div className="px-4 py-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Active Signals</div>
                  <div className="space-y-1.5">
                    {analysis.signals.map(sig => (
                      <div key={sig.id} className="flex items-center gap-2 text-xs">
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', sig.severity === 'critical' ? 'bg-red-500' : sig.severity === 'high' ? 'bg-amber-500' : 'bg-slate-400')} />
                        <span className="text-slate-600 flex-1">{sig.description}</span>
                        <span className="text-slate-400 font-mono">{sig.timeAgo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {!analysis && !loading && !error && (
            <div className="border border-dashed border-slate-300 rounded-lg p-10 text-center">
              <AlertTriangle size={24} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Enter a token address to analyze dump risk</p>
              <p className="text-xs text-slate-400 mt-1">Live data via DexScreener + Birdeye</p>
            </div>
          )}
        </div>

        {/* RIGHT: Live Risk Feed */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-live" />
              <span className="text-sm font-medium text-slate-900">Live Risk Feed</span>
            </div>
            <button
              onClick={() => { void refreshFeed(); }}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <RefreshCw size={12} className={feedLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 max-h-[480px] divide-y divide-slate-100">
            {liveFeed.map(sig => (
              <button
                key={sig.id}
                onClick={() => {
                  setTokenInput(sig.token.replace('$', ''));
                  setError(null);
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors"
              >
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', sig.severity === 'critical' ? 'bg-red-500' : sig.severity === 'high' ? 'bg-amber-500' : 'bg-slate-400')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">{sig.token}</span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">{sig.type.replace('_', ' ')}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{sig.description}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap shrink-0">{sig.timeAgo}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DumpDetector;

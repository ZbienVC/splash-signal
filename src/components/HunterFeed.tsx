import React, { useState, useEffect } from 'react';
import {
  Zap,
  Search,
  Loader2,
  AlertTriangle,
  Activity,
  Clock,
  TrendingUp,
  Shield,
  ExternalLink,
  Copy,
  Check,
  Pause,
  Play,
  Flame,
  UserCheck,
  Trophy,
  SortAsc,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence, useSpring, useTransform } from 'motion/react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { HunterToken } from '../types/signalos';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

type SortKey = 'age' | 'risk' | 'volume' | 'liquidity';
type FilterKey = 'all' | 'lowrisk' | 'highrisk' | 'pumpfun' | 'new' | 'trending';

// Mini sparkline derived from token signals (price history approximation)
const Sparkline: React.FC<{ token: HunterToken }> = ({ token }) => {
  const points = React.useMemo(() => {
    const base = token.market?.priceUsd ?? 0;
    if (base === 0) return [];
    // Use MOMENTUM_SPIKE signals to reconstruct relative price moves
    const sorted = [...token.signals].sort((a, b) => a.timestamp - b.timestamp);
    let price = base * 0.5; // start at half current
    const data: { v: number }[] = [{ v: price }];
    for (const s of sorted.slice(-8)) {
      const change = s.type === 'MOMENTUM_SPIKE'
        ? (s.payload?.priceChange ?? 5) / 100
        : s.type === 'NEW_ATH' ? 0.08
        : s.type === 'WHALE_BUY' ? 0.03
        : -0.01;
      price = price * (1 + change);
      data.push({ v: price });
    }
    // Ensure last point is current price
    data.push({ v: base });
    return data.slice(-10);
  }, [token]);

  if (points.length < 2) return null;
  const isUp = points[points.length - 1].v >= points[0].v;

  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={points}>
        <Line
          type="monotone" dataKey="v" dot={false}
          stroke={isUp ? '#10b981' : '#ef4444'}
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const RiskBadge: React.FC<{ score: number }> = ({ score }) => {
  const { label, cls } = score <= 30
    ? { label: 'High Risk', cls: 'bg-red-500/15 border-red-500/30 text-red-400' }
    : score <= 60
    ? { label: 'Medium', cls: 'bg-amber-500/15 border-amber-500/30 text-amber-400' }
    : score <= 80
    ? { label: 'Low Risk', cls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' }
    : { label: 'Strong', cls: 'bg-blue-500/15 border-blue-500/30 text-blue-400' };
  return (
    <span className={cn('px-2 py-0.5 rounded-lg border text-[9px] font-bold uppercase tracking-tight flex items-center gap-1', cls)}>
      <Shield size={9} /> {label}
    </span>
  );
};

function fmtPrice(p: number): string {
  if (!p || p === 0) return '–';
  if (p < 0.0001) return `$${p.toFixed(8)}`;
  if (p < 0.01)   return `$${p.toFixed(6)}`;
  if (p < 1)      return `$${p.toFixed(4)}`;
  return `$${p.toFixed(2)}`;
}

const SmoothCounter: React.FC<{ value: number; prefix?: string; className?: string }> = ({ value, prefix = '', className }) => {
  const motionValue = useSpring(value, { stiffness: 100, damping: 20 });
  const display = useTransform(motionValue as any, (latest: any) => {
    const val = Math.floor(Number(latest));
    if (val >= 1000000) return `${prefix}${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `${prefix}${(val / 1000).toFixed(1)}K`;
    return `${prefix}${val.toFixed(0)}`;
  });

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return <motion.span className={className}>{display}</motion.span>;
};

const TokenCard: React.FC<{ token: HunterToken; isHighConviction?: boolean; isNewest?: boolean }> = ({ token, isHighConviction, isNewest }) => {
  const [copied, setCopied] = useState(false);
  const [prevMc, setPrevMc] = useState(token.market?.fdv || 0);
  const [mcFlash, setMcFlash] = useState<'up' | 'down' | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const ageMs = now - token.createdAt;
  const updateMs = now - token.updatedAt;
  const isJustLaunched = ageMs < 1000 * 60 * 2; // 2 minutes
  const hasRecentActivity = updateMs < 1000 * 10; // 10 seconds
  
  const mc = token.market?.fdv || 0;
  const vol = token.market?.volume24h || 0;
  const liq = token.market?.liquidity || 0;
  const ath = token.athMc || mc;
  const pumpScore = token.pumpProbability || 0;
  const bondingProgress = token.bondingCurveProgress || 0;

  useEffect(() => {
    if (mc > prevMc) {
      setMcFlash('up');
      setTimeout(() => setMcFlash(null), 1000);
    } else if (mc < prevMc) {
      setMcFlash('down');
      setTimeout(() => setMcFlash(null), 1000);
    }
    setPrevMc(mc);
  }, [mc]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(token.mint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRatingColor = (label?: string) => {
    switch (label) {
      case 'S': return 'bg-amber-400/5 border-amber-400/30 shadow-amber-400/5';
      case 'A': return 'bg-emerald-500/5 border-emerald-500/30 shadow-emerald-500/5';
      case 'B': return 'bg-blue-500/5 border-blue-500/30 shadow-blue-500/5';
      case 'C': return 'bg-slate-800/40 border-slate-700/50';
      case 'D': return 'bg-slate-900/20 border-slate-800/50 opacity-60 grayscale-[0.5]';
      default: return 'bg-slate-900/40 border-slate-800';
    }
  };

  const getRatingBadge = (label?: string) => {
    switch (label) {
      case 'S': return 'bg-amber-400 text-black';
      case 'A': return 'bg-emerald-500 text-white';
      case 'B': return 'bg-blue-500 text-white';
      case 'C': return 'bg-slate-600 text-white';
      case 'D': return 'bg-red-600 text-white';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  const athProgress = ath > 0 ? (mc / ath) * 100 : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: 0,
        transition: {
          type: "spring",
          stiffness: 500,
          damping: 35,
          mass: 0.5
        }
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.95, 
        transition: { duration: 0.2 } 
      }}
      whileHover={{ 
        y: -4, 
        transition: { duration: 0.2 } 
      }}
      className={cn(
        "group relative flex flex-col backdrop-blur-xl border rounded-[24px] p-5 transition-all duration-500 h-full",
        getRatingColor(token.alphaRating?.label),
        hasRecentActivity && "ring-1 ring-primary/30 shadow-lg shadow-primary/5",
        isHighConviction && "border-amber-400/40 bg-amber-400/[0.03]",
        isNewest && "ring-2 ring-primary/50 shadow-2xl shadow-primary/20"
      )}
    >
      {/* Shake animation for the newest token only */}
      {isNewest && (
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: [-1, 1, -1, 1, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 1 }}
          className="absolute inset-0 pointer-events-none rounded-[24px] border-2 border-primary/40 z-10"
        />
      )}
      {/* New Badge */}
      {isJustLaunched && (
        <div className="absolute -top-2 -left-2 px-2 py-0.5 bg-primary text-white text-[9px] font-black uppercase rounded-full shadow-lg z-20 animate-pulse">
          New
        </div>
      )}

      {/* Rating Badge */}
      <div className={cn(
        "absolute -top-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center font-display font-black text-sm shadow-xl z-10 border border-black/50",
        getRatingBadge(token.alphaRating?.label)
      )}>
        {token.alphaRating?.label || 'D'}
      </div>

      <div className="flex items-start gap-4 mb-4">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-primary font-display font-bold text-2xl border border-white/10 overflow-hidden shadow-inner">
            {token.image ? (
              <img src={token.image} alt={token.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              token.symbol[0]
            )}
          </div>
          {hasRecentActivity && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-bold text-lg truncate group-hover:text-primary transition-colors leading-tight">{token.name}</h3>
            {/* Chain badge */}
            <span className="px-1.5 py-0.5 bg-violet-500/15 border border-violet-500/30 text-violet-400 text-[8px] font-bold rounded uppercase tracking-widest">SOL</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs font-mono text-primary font-bold tracking-tight">${token.symbol}</span>
            <span className="text-[10px] font-mono text-slate-600">•</span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-white transition-colors"
            >
              {token.mint.slice(0, 6)}...{token.mint.slice(-4)}
              {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
            </button>
          </div>
          {/* Price + Risk badge row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-sm font-mono font-bold text-white">{fmtPrice(token.market?.priceUsd ?? 0)}</span>
            {token.risk?.score !== undefined && <RiskBadge score={100 - (token.risk.score ?? 50)} />}
          </div>
        </div>
      </div>

      {/* Quick Chart Sparkline */}
      {token.signals.length > 1 && (
        <div className="mb-3 -mx-1">
          <Sparkline token={token} />
        </div>
      )}

      {/* Bonding Curve Progress Bar */}
      <div className="mb-4 space-y-1">
        <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-slate-500">
          <span>Bonding Curve</span>
          <span className={cn(bondingProgress >= 100 ? "text-emerald-400" : "text-slate-300")}>
            {bondingProgress.toFixed(1)}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, bondingProgress)}%` }}
            className={cn(
              "h-full transition-all duration-1000",
              bondingProgress >= 100 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-primary"
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className={cn(
          "bg-black/40 rounded-2xl p-3 border border-white/5 flex flex-col justify-center transition-colors duration-300 relative overflow-hidden",
          mcFlash === 'up' && "bg-emerald-500/20 border-emerald-500/30",
          mcFlash === 'down' && "bg-red-500/20 border-red-500/30"
        )}>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Market Cap</div>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-mono text-slate-600">
                {updateMs < 1000 ? 'now' : `${Math.floor(updateMs / 1000)}s ago`}
              </span>
              {hasRecentActivity && <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />}
            </div>
          </div>
          <div className="text-sm font-mono font-bold text-white leading-none">
            <SmoothCounter value={mc} prefix="$" />
          </div>
        </div>
        <div className="bg-black/40 rounded-2xl p-3 border border-white/5 flex flex-col justify-center">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Liquidity</div>
          <div className="text-sm font-mono font-bold text-slate-300 leading-none">
            <SmoothCounter value={liq} prefix="$" />
          </div>
        </div>
        <div className="bg-black/40 rounded-2xl p-3 border border-white/5 flex flex-col justify-center">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Volume</div>
          <div className="text-sm font-mono font-bold text-emerald-400 leading-none">
            <SmoothCounter value={vol} prefix="$" />
          </div>
        </div>
      </div>

      {/* Pump Probability & Intelligence */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-900/50 rounded-xl p-2 border border-white/5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Pump Score</span>
            <Flame size={10} className={cn(pumpScore > 70 ? "text-orange-500" : "text-slate-600")} />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-1000",
                  pumpScore > 70 ? "bg-orange-500" : pumpScore > 40 ? "bg-amber-500" : "bg-slate-600"
                )} 
                style={{ width: `${pumpScore}%` }} 
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-white">{pumpScore}</span>
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-2 border border-white/5 flex flex-col justify-center">
          <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Developer</div>
          <div className="flex items-center gap-1">
            <UserCheck size={10} className={cn(
              token.devReputation?.label === 'Trusted' ? "text-emerald-500" : 
              token.devReputation?.label === 'Suspicious' ? "text-amber-500" : 
              token.devReputation?.label === 'Rugger' ? "text-red-500" : "text-slate-500"
            )} />
            <span className={cn(
              "text-[10px] font-bold truncate",
              token.devReputation?.label === 'Trusted' ? "text-emerald-500" : 
              token.devReputation?.label === 'Suspicious' ? "text-amber-400" :
              token.devReputation?.label === 'Rugger' ? "text-red-500" : "text-white"
            )}>
              {token.devReputation?.label || 'Neutral'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {token.smartWalletSignals && token.smartWalletSignals.count > 0 && (
          <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-[9px] font-bold rounded-lg border border-purple-500/20 uppercase tracking-tighter flex items-center gap-1">
            <Trophy size={10} /> {token.smartWalletSignals.tier} Wallets ({token.smartWalletSignals.count})
          </span>
        )}
        {token.signals.some(s => (s.type === 'MOMENTUM_SPIKE' || s.type === 'WHALE_BUY') && (Date.now() - s.timestamp < 1000 * 60 * 30)) && (
          <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[9px] font-bold rounded-lg border border-amber-500/20 uppercase tracking-tighter flex items-center gap-1">
            <TrendingUp size={10} /> Momentum
          </span>
        )}
        {token.alphaRating?.reasoning.slice(0, 2).map((reason, i) => (
          <span key={i} className="px-2 py-1 bg-primary/5 text-primary text-[9px] font-bold rounded-lg border border-primary/10 uppercase tracking-tighter truncate max-w-[120px]">
            {reason}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <a href={`https://pump.fun/${token.mint}`} target="_blank" rel="noreferrer"
            className="p-1.5 bg-white/5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-all" title="Pump.fun">
            <Zap size={13} />
          </a>
          <a href={`https://solscan.io/token/${token.mint}`} target="_blank" rel="noreferrer"
            className="p-1.5 bg-white/5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-all" title="Solscan">
            <ExternalLink size={13} />
          </a>
          <a href={`https://dexscreener.com/solana/${token.market?.pairAddress || token.mint}`} target="_blank" rel="noreferrer"
            className="p-1.5 bg-white/5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-all" title="DexScreener">
            <TrendingUp size={13} />
          </a>
          <a href={`https://birdeye.so/token/${token.mint}?chain=solana`} target="_blank" rel="noreferrer"
            className="px-2 py-1 bg-white/5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 transition-all text-[9px] font-bold" title="Birdeye">
            BIRD
          </a>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
            <Clock size={8} /> {updateMs < 5000 ? 'Live' : updateMs < 60000 ? `${Math.floor(updateMs / 1000)}s` : `${Math.floor(updateMs / 60000)}m`}
          </span>
          <div className="text-[10px] font-mono text-slate-400">
            {token.createdAt < Date.now() - 3600000 ? `${Math.floor(ageMs / 3600000)}h ago` : `${Math.floor(ageMs / 60000)}m ago`}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const useColumns = () => {
  const [cols, setCols] = useState(1);
  
  useEffect(() => {
    const updateCols = () => {
      const width = window.innerWidth;
      // Matching Tailwind grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4
      if (width >= 1536) setCols(4);
      else if (width >= 1280) setCols(3);
      else if (width >= 640) setCols(2);
      else setCols(1);
    };
    
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);
  
  return cols;
};

const AlphaRankingLeaderboard: React.FC<{ tokens: HunterToken[] }> = ({ tokens }) => {
  return (
    <div className="bg-slate-panel border border-slate-border rounded-[32px] overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
        <div>
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Trophy className="text-amber-400" size={20} />
            Alpha Ranking Engine
          </h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Institutional Grade Token Scoring</p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded-full text-[9px] font-bold text-amber-400 uppercase tracking-widest">
            Top 10 Ranked
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Token</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Market Cap</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Volume (24h)</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Alpha Score</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Dev Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tokens.map((token, idx) => (
              <tr key={token.mint} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-600 w-4">{idx + 1}</span>
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 overflow-hidden shrink-0">
                      {token.image ? (
                        <img src={token.image} alt={token.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary font-bold">{token.symbol[0]}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">{token.name}</div>
                      <div className="text-[10px] font-mono text-slate-500 tracking-tight">${token.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-mono font-bold text-slate-300">
                    <SmoothCounter value={token.market?.fdv || 0} prefix="$" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-mono font-bold text-emerald-400">
                    <SmoothCounter value={token.market?.volume24h || 0} prefix="$" />
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex flex-col items-center">
                    <div className={cn(
                      "text-lg font-display font-black leading-none",
                      (token.alphaRating?.score || 0) > 75 ? "text-amber-400" : (token.alphaRating?.score || 0) > 50 ? "text-emerald-400" : "text-slate-400"
                    )}>
                      {token.alphaRating?.score || 0}
                    </div>
                    <div className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter mt-1">
                      Grade {token.alphaRating?.label || 'D'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest",
                    token.devReputation?.label === 'Trusted' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                    token.devReputation?.label === 'Suspicious' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                    "bg-red-500/10 border-red-500/20 text-red-500"
                  )}>
                    <Shield size={10} />
                    {token.devReputation?.label || 'Unknown'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const HunterFeed: React.FC = () => {
  const [tokens, setTokens] = useState<HunterToken[]>([]);
  const [rankedTokens, setRankedTokens] = useState<HunterToken[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [buffer, setBuffer] = useState<HunterToken[]>([]);
  const tokensRef = React.useRef<HunterToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sortKey, setSortKey] = useState<SortKey>('age');
  const [classifying, setClassifying] = useState<Set<string>>(new Set());
  const [isQuotaExhausted, setIsQuotaExhausted] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [totalPool, setTotalPool] = useState(0);
  const classificationQueue = React.useRef<string[]>([]);
  const isProcessingQueue = React.useRef(false);

  const processQueue = async () => {
    if (isProcessingQueue.current || isQuotaExhausted || classificationQueue.current.length === 0) return;
    isProcessingQueue.current = true;

    while (classificationQueue.current.length > 0 && !isQuotaExhausted) {
      const mint = classificationQueue.current.shift();
      if (!mint) continue;

      const token = tokensRef.current.find(t => t.mint === mint);
      if (token) {
        await classifyToken(token);
        // Wait 12 seconds between requests (5 RPM) to be extremely safe
        await new Promise(resolve => setTimeout(resolve, 12000));
      }
    }

    isProcessingQueue.current = false;
  };

  const fetchTokens = async () => {
    try {
      const [feedRes, rankedRes] = await Promise.all([
        fetch(`/api/hunter/feed?t=${Date.now()}`),
        fetch(`/api/hunter/ranked?t=${Date.now()}`)
      ]);
      
      const data: HunterToken[] = await feedRes.json();
      const rankedData: HunterToken[] = await rankedRes.json();
      
      setRankedTokens(rankedData);
      setTotalPool(data.length);
      tokensRef.current = data;
      setLastSync(new Date());

      if (isPaused) {
        // If paused, just update the buffer with new tokens we don't have yet
        const existingMints = new Set(tokens.map(t => t.mint));
        const newTokens = data.filter(t => !existingMints.has(t.mint));
        setBuffer(prev => {
          const bufferMints = new Set(prev.map(t => t.mint));
          const uniqueNew = newTokens.filter(t => !bufferMints.has(t.mint));
          return [...uniqueNew, ...prev].slice(0, 50);
        });
      } else {
        // If not paused, update tokens directly
        setTokens(data);
      }
      
      // Auto-classify high-potential unknown tokens
      const newToQueue: string[] = [];
      data.forEach((token) => {
        const isUnknown = token.classification?.category === 'UNKNOWN';
        // Raise threshold to A-tier (72+) to drastically reduce API calls
        const isHighPotential = (token.alphaRating?.score || 0) >= 72; 
        const isNotQueued = !classificationQueue.current.includes(token.mint) && !classifying.has(token.mint);

        if (isUnknown && isHighPotential && isNotQueued) {
          // Local Heuristic Check: Skip AI for obvious memes
          const name = token.name.toLowerCase();
          const symbol = token.symbol.toLowerCase();
          const memeKeywords = ['pepe', 'dog', 'inu', 'cat', 'moon', 'pump', 'elon', 'trump', 'shib', 'wif', 'chill', 'guy', 'base', 'sol'];
          const isObviousMeme = memeKeywords.some(k => name.includes(k) || symbol.includes(k));

          if (isObviousMeme) {
            // Apply local classification immediately without calling AI
            const localClassification = { 
              category: 'MEME', 
              confidence: 0.8, 
              reasoning: 'Classified via local heuristic (Meme keywords detected)' 
            };
            persistClassification(token.mint, localClassification);
          } else {
            newToQueue.push(token.mint);
          }
        }
      });

      if (newToQueue.length > 0 && !isQuotaExhausted) {
        classificationQueue.current = [...classificationQueue.current, ...newToQueue];
        processQueue();
      }
    } catch (e) {
      console.error('Failed to fetch hunter feed:', e);
    } finally {
      setLoading(false);
    }
  };

  const resumeFeed = () => {
    setIsPaused(false);
    if (buffer.length > 0) {
      setTokens(prev => {
        const existingMints = new Set(prev.map(t => t.mint));
        const uniqueBuffer = buffer.filter(t => !existingMints.has(t.mint));
        return [...uniqueBuffer, ...prev].slice(0, 200);
      });
      setBuffer([]);
    }
  };

  const persistClassification = async (mint: string, classification: any) => {
    try {
      await fetch(`/api/hunter/token/${mint}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classification })
      });
      setTokens(prev => prev.map(t => t.mint === mint ? { ...t, classification } : t));
    } catch (e) {
      console.error('Failed to persist classification:', e);
    }
  };

  const classifyToken = async (token: HunterToken, retryCount = 0) => {
    if (isQuotaExhausted) return;
    if (classifying.has(token.mint) && retryCount === 0) return;
    setClassifying(prev => new Set(prev).add(token.mint));

    try {
      const ai = new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY as string) });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Classify this crypto token: Name: ${token.name}, Symbol: ${token.symbol}, Description: ${token.description || 'N/A'}. 
        Categories: [utility, meme, ai, defi, gaming, infrastructure, culture, unknown]. 
        Return JSON: { "category": string, "confidence": number, "reasoning": string }`,
        config: { responseMimeType: "application/json" }
      });

      const classification = JSON.parse(response.text);
      await persistClassification(token.mint, classification);
    } catch (e: any) {
      const errorMsg = e?.message || '';
      const isRateLimit = errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota');
      
      if (isRateLimit) {
        if (retryCount < 1) {
          console.warn(`[Hunter] Rate limited for ${token.symbol}, retrying in 30s...`);
          await new Promise(resolve => setTimeout(resolve, 30000));
          return classifyToken(token, retryCount + 1);
        } else {
          // Circuit Breaker: Stop all AI calls for 10 minutes
          console.warn('[Hunter] Quota exhausted. Pausing AI classification for 10 minutes.');
          setIsQuotaExhausted(true);
          classificationQueue.current = []; // Clear queue
          setTimeout(() => {
            setIsQuotaExhausted(false);
            console.log('[Hunter] Quota cooldown finished. Resuming AI classification.');
          }, 10 * 60 * 1000);
        }
      } else {
        console.error(`[Hunter] AI Classification failed for ${token.symbol}:`, e);
      }
    } finally {
      setClassifying(prev => {
        const next = new Set(prev);
        next.delete(token.mint);
        return next;
      });
    }
  };

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(fetchTokens, 1500);
    return () => clearInterval(interval);
  }, []);

  const cols = useColumns();
  const filteredTokens = React.useMemo(() => {
    const now = Date.now();

    const list = tokens.filter(t => {
      const mc = t.market?.fdv || 0;
      const vol = t.market?.volume24h || 0;
      const liq = t.market?.liquidity || 0;
      const ageMs = now - t.createdAt;
      const isNew = ageMs < 3_600_000; // 1 hour
      const riskScore = t.risk?.score ?? 50; // higher = worse in hunterService

      // Garbage filter
      if (ageMs > 600_000 && vol === 0 && mc < 2000) return false;
      if (isNew) {
        const meets = [mc > 1000, liq > 500, (t.alphaRating?.score || 0) > 30].filter(Boolean).length;
        if (meets < 1 && mc < 1500) return false;
      } else {
        const meets = [mc > 1000, liq > 500, vol > 100, (t.alphaRating?.score || 0) > 30,
          t.devReputation?.label === 'Trusted', (t.smartWalletSignals?.count || 0) > 0].filter(Boolean).length;
        if (meets < 2) return false;
      }

      // Filter key
      if (filter === 'lowrisk')  return riskScore < 40;
      if (filter === 'highrisk') return riskScore >= 70;
      if (filter === 'pumpfun')  return t.lifecycle.stage === 'PUMPFUN_LAUNCH' || t.lifecycle.stage === 'DISCOVERED';
      if (filter === 'new')      return isNew;
      if (filter === 'trending')
        return t.signals.some(s => (s.type === 'MOMENTUM_SPIKE' || s.type === 'WHALE_BUY') && now - s.timestamp < 600_000);
      return true; // 'all'
    });

    // Sort
    list.sort((a, b) => {
      if (sortKey === 'age')       return b.createdAt - a.createdAt;
      if (sortKey === 'risk')      return (a.risk?.score ?? 50) - (b.risk?.score ?? 50);
      if (sortKey === 'volume')    return (b.market?.volume24h ?? 0) - (a.market?.volume24h ?? 0);
      if (sortKey === 'liquidity') return (b.market?.liquidity ?? 0) - (a.market?.liquidity ?? 0);
      return 0;
    });

    return list;
  }, [tokens, filter, sortKey]);

  const snakeOrderedTokens = React.useMemo(() => {
    if (cols <= 1) return filteredTokens;
    
    const result: HunterToken[] = [];
    const rows = Math.ceil(filteredTokens.length / cols);
    
    for (let r = 0; r < rows; r++) {
      const rowTokens = filteredTokens.slice(r * cols, (r + 1) * cols);
      if (r % 2 === 1) {
        // Odd row: reverse it to create the snake effect
        result.push(...rowTokens.reverse());
      } else {
        // Even row: keep it standard
        result.push(...rowTokens);
      }
    }
    return result;
  }, [filteredTokens, cols]);

  if (loading && tokens.length === 0) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Scanning Solana Mainnet for new launches...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
              <Zap size={18} />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tight bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">Alpha Hunter</h1>
          </div>
          <p className="text-slate-500 text-xs max-w-xl">Real-time forensic analysis of Solana launches.</p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Live Scanner</span>
            </div>
            <button
              onClick={() => isPaused ? resumeFeed() : setIsPaused(true)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[9px] font-bold uppercase tracking-wider",
                isPaused 
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20" 
                  : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
              )}
            >
              {isPaused ? <><Play size={10} /> Resume Feed ({buffer.length})</> : <><Pause size={10} /> Pause Feed</>}
            </button>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase tracking-wider">Live</span>
              <span className="text-[9px] font-mono text-slate-500 ml-1">{lastSync.toLocaleTimeString()}</span>
              <span className="text-[9px] font-mono text-slate-500 ml-2 border-l border-white/10 pl-2">Pool: {totalPool}</span>
            </div>
            {/* Sort controls */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 border border-slate-border rounded-lg">
              <SortAsc size={12} className="text-slate-500" />
              {(['age', 'risk', 'volume', 'liquidity'] as SortKey[]).map((s) => (
                <button key={s} onClick={() => setSortKey(s)}
                  className={cn("px-2 py-1 text-[9px] font-bold uppercase rounded transition-all",
                    sortKey === s ? "bg-primary text-white" : "text-slate-500 hover:text-slate-300")}>
                  {s}
                </button>
              ))}
            </div>
            {/* Filter controls */}
            <div className="flex items-center bg-black/40 backdrop-blur-md border border-slate-border rounded-lg p-1 shadow-xl">
              {([
                ['all',      'All'],
                ['lowrisk',  'Low Risk'],
                ['highrisk', 'High Risk'],
                ['pumpfun',  'Pump.fun'],
                ['new',      'New <1h'],
                ['trending', 'Trending'],
              ] as [FilterKey, string][]).map(([key, label]) => (
                <button key={key} onClick={() => setFilter(key)}
                  className={cn("px-2.5 py-1.5 text-[9px] font-bold uppercase rounded-md transition-all duration-300",
                    filter === key ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-slate-300 hover:bg-white/5")}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-[8px] font-bold uppercase tracking-widest text-slate-600">
            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> S-Tier</div>
            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> A-Tier</div>
            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> B-Tier</div>
            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-600" /> C-Tier</div>
            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-600" /> D-Tier</div>
          </div>
        </div>
      </div>

      {rankedTokens.length > 0 && (
        <div className="mt-4">
          <AlphaRankingLeaderboard tokens={rankedTokens.slice(0, 10)} />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Activity className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-display font-bold uppercase tracking-widest text-slate-500">Live Feed</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-slate-500/20 to-transparent ml-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout" initial={false}>
            {snakeOrderedTokens.map((token, index) => (
              <TokenCard 
                key={token.mint} 
                token={token} 
                isNewest={token.mint === filteredTokens[0]?.mint && (Date.now() - token.createdAt < 1000 * 30)} // Shake only the first item if < 30s old
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {filteredTokens.length === 0 && (
        <div className="text-center py-32 bg-slate-panel/20 border-2 border-dashed border-slate-border rounded-[40px] animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-6 text-slate-600">
            <Search size={40} />
          </div>
          <h3 className="text-2xl font-display font-bold text-slate-400">No Alpha Detected</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            {totalPool > 0 
              ? `Found ${totalPool} tokens in the pool, but none met the current filters. Try relaxing your criteria.`
              : "Scanning Solana Mainnet for new launches... No tokens found in the pool yet."}
          </p>
        </div>
      )}
    </div>
  );
};

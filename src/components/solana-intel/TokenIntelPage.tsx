import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  Search,
  Loader2,
  AlertTriangle,
  Shield,
  CheckCircle2,
  XCircle,
  MinusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TokenHeader } from './TokenHeader';
import { LiveChartPanel } from './LiveChartPanel';
import { TransactionFeed } from './TransactionFeed';
import { HolderDistribution } from './HolderDistribution';
import { DevActivityTimeline } from './DevActivityTimeline';
import { RiskSignalsPanel } from './RiskSignalsPanel';
import { SolanaTokenIntel, RiskSignal } from '../../types/signalos';
import { ForensicTransactionGraph } from './ForensicTransactionGraph';
import { FundingChainAnalysis } from './FundingChainAnalysis';
import { LPUnlockMonitor } from './LPUnlockMonitor';
import { ClusterRelationshipView } from './ClusterRelationshipView';
import { fetchForensicData, ForensicData } from '../../services/forensicService';
import { cn } from '../../lib/utils';

// ── Data Sources Indicator ──────────────────────────────────────────────────
type DataStatus = 'live' | 'estimated' | 'unavailable';
interface DataSource { label: string; status: DataStatus; note?: string; }

const StatusDot: React.FC<{ status: DataStatus }> = ({ status }) => {
  if (status === 'live')        return <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live" />;
  if (status === 'estimated')   return <div className="w-2 h-2 rounded-full bg-amber-400" title="Estimated" />;
  return <div className="w-2 h-2 rounded-full bg-red-500/60" title="Unavailable" />;
};

const DataSourcesPanel: React.FC<{ sources: DataSource[] }> = ({ sources }) => (
  <div className="bg-slate-panel/50 border border-slate-border rounded-xl p-4">
    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Data Sources</div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {sources.map(src => (
        <div key={src.label} className="flex items-center gap-2">
          <StatusDot status={src.status} />
          <div>
            <div className="text-[10px] font-bold text-slate-300">{src.label}</div>
            {src.note && <div className="text-[9px] text-slate-600">{src.note}</div>}
          </div>
        </div>
      ))}
    </div>
    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 text-[9px] text-slate-600">
      <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live API</span>
      <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Estimated</span>
      <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500/60" /> Unavailable</span>
    </div>
  </div>
);

export const TokenIntelPage: React.FC = () => {
  const [mint, setMint] = useState('');
  const [activeMint, setActiveMint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deepMode, setDeepMode] = useState(false);
  const [forensicLoading, setForensicLoading] = useState(false);
  const [forensicData, setForensicData] = useState<ForensicData | null>(null);
  const [intel, setIntel] = useState<SolanaTokenIntel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [allPairs, setAllPairs] = useState<any[]>([]);

  const fetchIntel = useCallback(async (targetMint: string) => {
    setLoading(true);
    setError(null);
    setForensicData(null);
    setAllPairs([]);
    try {
      // Core backend fetches
      const [intelRes, txRes, holderRes, devRes] = await Promise.all([
        fetch(`/api/token-intel/${targetMint}`),
        fetch(`/api/token-transactions/${targetMint}`),
        fetch(`/api/token-holders/${targetMint}`),
        fetch(`/api/dev-activity/${targetMint}`)
      ]);

      if (!intelRes.ok) throw new Error('Token not found or API error');

      const intelData = await intelRes.json();
      const txData    = await txRes.json();
      const holderData = await holderRes.json();
      const devData   = await devRes.json();

      // ── DexScreener: fetch all trading pairs ────────────────────────────
      let dexPairs: any[] = [];
      let dexStatus: DataStatus = 'unavailable';
      try {
        const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${targetMint}`);
        if (dexRes.ok) {
          const dexJson = await dexRes.json();
          dexPairs = dexJson.pairs ?? [];
          if (dexPairs.length > 0) dexStatus = 'live';
        }
      } catch { /* non-fatal */ }
      setAllPairs(dexPairs);

      // ── Jupiter Price API (Solana only) ──────────────────────────────────
      let jupPrice: number | null = null;
      let jupStatus: DataStatus = 'unavailable';
      try {
        const jupRes = await fetch(`https://price.jup.ag/v6/price?ids=${targetMint}`);
        if (jupRes.ok) {
          const jupJson = await jupRes.json();
          jupPrice = jupJson?.data?.[targetMint]?.price ?? null;
          if (jupPrice !== null) jupStatus = 'live';
        }
      } catch { /* non-fatal */ }

      // Merge Jupiter price into pair if available
      if (jupPrice && intelData.pair) {
        intelData.pair.priceUsd = String(jupPrice);
      }

      // ── Data Sources tracking ─────────────────────────────────────────────
      const sources: DataSource[] = [
        { label: 'DexScreener',  status: dexStatus, note: dexPairs.length > 0 ? `${dexPairs.length} pair(s)` : undefined },
        { label: 'Jupiter Price', status: jupStatus, note: jupPrice ? `$${jupPrice.toFixed(6)}` : undefined },
        { label: 'Solana RPC',   status: txData.length > 0 ? 'live' : 'estimated', note: `${txData.length} txns` },
        { label: 'Holder Data',  status: holderData.holders?.length > 0 ? 'live' : 'estimated', note: `${holderData.holders?.length ?? 0} holders` },
        { label: 'Dev Activity', status: devData.length > 0 ? 'live' : 'estimated' },
        { label: 'Liquidity',    status: (intelData.pair?.liquidity?.usd ?? 0) > 0 ? 'live' : 'estimated' },
      ];
      setDataSources(sources);

      // ── Risk Signals ─────────────────────────────────────────────────────
      const liqUsd = intelData.pair?.liquidity?.usd ?? 0;
      const riskSignals: RiskSignal[] = [
        {
          id: '1',
          label: 'Holder Concentration',
          status: holderData.top10Percentage > 80 ? 'critical' : holderData.top10Percentage > 50 ? 'high' : holderData.top10Percentage > 30 ? 'medium' : 'low',
          evidence: `Top 10 holders own ${holderData.top10Percentage?.toFixed(1) ?? '?'}%`,
          timestamp: Date.now(),
          sourcedEvidence: {
            summary: `Top 10 wallets control ${holderData.top10Percentage?.toFixed(1) ?? '?'}% of total supply.`,
            sources: [{ label: 'Solscan Holder List', url: `https://solscan.io/token/${targetMint}#holders`, kind: 'solscan' }]
          }
        },
        {
          id: '2',
          label: 'Liquidity Depth',
          status: liqUsd < 5_000 ? 'critical' : liqUsd < 20_000 ? 'high' : liqUsd < 100_000 ? 'medium' : 'low',
          evidence: `$${liqUsd.toLocaleString()} total liquidity`,
          timestamp: Date.now(),
          sourcedEvidence: {
            summary: `Current liquidity pool depth is $${liqUsd.toLocaleString()} across all monitored DEXes. ${dexPairs.length} trading pairs found.`,
            sources: [{ label: 'DexScreener API', url: intelData.pair?.url ?? `https://dexscreener.com/solana/${targetMint}`, kind: 'dexscreener' }]
          }
        },
        {
          id: '3',
          label: 'Dev Activity',
          status: devData.some((a: any) => a.action?.includes('Sell')) ? 'medium' : 'low',
          evidence: devData.length > 0 ? `${devData.filter((a: any) => a.action?.includes('Sell')).length} sell event(s) detected` : 'No dev sells detected',
          timestamp: Date.now(),
          sourcedEvidence: {
            summary: 'Developer wallet activity monitoring via Solana RPC forensic analysis.',
            sources: [{ label: 'Solana RPC Forensic', url: `https://solscan.io/account/${intelData.metadata?.deployer}`, kind: 'rpc' }]
          }
        },
        ...(jupPrice ? [{
          id: '4',
          label: 'Jupiter Price',
          status: 'low' as const,
          evidence: `Jupiter quotes $${jupPrice.toFixed(6)} per token`,
          timestamp: Date.now(),
          sourcedEvidence: {
            summary: `Jupiter aggregator confirms token is tradeable at $${jupPrice.toFixed(6)}.`,
            sources: [{ label: 'Jupiter Price API', url: `https://jup.ag/swap/SOL-${targetMint}`, kind: 'other' as const }]
          }
        }] : []),
      ];

      setIntel({
        ...intelData,
        transactions: txData,
        holders: holderData,
        devActivity: devData,
        riskSignals
      });
      setActiveMint(targetMint);
    } catch (err: any) {
      setError(err.message);
      setIntel(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeMint) {
      const interval = setInterval(() => {
        fetchIntel(activeMint);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [activeMint, fetchIntel]);

  useEffect(() => {
    if (deepMode && activeMint && !forensicData && !forensicLoading) {
      const getForensic = async () => {
        setForensicLoading(true);
        const data = await fetchForensicData(activeMint);
        setForensicData(data);
        setForensicLoading(false);
      };
      getForensic();
    }
  }, [deepMode, activeMint, forensicData, forensicLoading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (mint.trim()) {
      fetchIntel(mint.trim());
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-background-dark text-slate-200">
      {/* Search Bar & Mode Toggle */}
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              activeMint ? "bg-emerald-500 animate-pulse" : "bg-slate-700"
            )} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {activeMint ? `Monitoring: ${activeMint.slice(0, 8)}...` : 'Terminal Standby'}
            </span>
          </div>
          
          <button 
            onClick={() => setDeepMode(!deepMode)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all",
              deepMode 
                ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20" 
                : "bg-slate-panel border-slate-border text-slate-500 hover:text-slate-300"
            )}
          >
            <Shield size={14} className={cn(deepMode && "animate-pulse")} />
            Deep Investigation Mode {deepMode ? 'ON' : 'OFF'}
          </button>
        </div>

        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-500 group-focus-within:text-primary transition-colors" />
          </div>
          <input 
            type="text"
            value={mint}
            onChange={(e) => setMint(e.target.value)}
            placeholder="Paste Solana Mint Address (e.g. 6p6W5...)"
            className="w-full bg-slate-panel/50 border border-slate-border rounded-2xl py-4 pl-12 pr-32 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-600"
          />
          <button 
            type="submit"
            disabled={loading || !mint.trim()}
            className="absolute right-2 top-2 bottom-2 px-6 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            ANALYZE
          </button>
        </form>
      </div>

      <AnimatePresence mode="wait">
        {!intel && !loading && !error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-32 text-center space-y-4"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Zap size={40} />
            </div>
            <h2 className="text-2xl font-display font-bold">Solana Live Intel Terminal</h2>
            <p className="text-slate-500 max-w-md">Enter a Solana token mint address to begin deep real-time forensic investigation and live market monitoring.</p>
          </motion.div>
        )}

        {loading && !intel && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 space-y-4"
          >
            <Loader2 size={40} className="text-primary animate-spin" />
            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Synchronizing with Solana Mainnet...</p>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 space-y-4 text-red-400"
          >
            <AlertTriangle size={40} />
            <p className="font-bold">{error}</p>
            <button onClick={() => setError(null)} className="text-xs underline">Clear Error</button>
          </motion.div>
        )}

        {intel && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Top: Token Header */}
            <TokenHeader intel={intel} />

            {deepMode && (
              <div className="grid grid-cols-12 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="col-span-12 lg:col-span-8">
                  {forensicLoading ? (
                    <div className="h-[500px] bg-slate-panel border border-slate-border rounded-2xl flex flex-col items-center justify-center space-y-4">
                      <Loader2 size={32} className="text-primary animate-spin" />
                      <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Running Forensic Graph Reconstruction...</p>
                    </div>
                  ) : forensicData ? (
                    <ForensicTransactionGraph nodes={forensicData.nodes} edges={forensicData.edges} />
                  ) : (
                    <div className="h-[500px] bg-slate-panel border border-slate-border rounded-2xl flex items-center justify-center">
                      <p className="text-slate-500">Forensic data unavailable for this asset.</p>
                    </div>
                  )}
                </div>
                <div className="col-span-12 lg:col-span-4 space-y-6">
                  {forensicLoading ? (
                    <div className="space-y-6">
                      <div className="h-48 bg-slate-panel animate-pulse rounded-2xl" />
                      <div className="h-48 bg-slate-panel animate-pulse rounded-2xl" />
                    </div>
                  ) : forensicData && (
                    <>
                      <LPUnlockMonitor status={forensicData.lpStatus} />
                      <ClusterRelationshipView clusters={forensicData.clusters} />
                    </>
                  )}
                </div>
                
                {forensicData && (
                  <div className="col-span-12">
                    <FundingChainAnalysis chains={forensicData.fundingChains} />
                  </div>
                )}
              </div>
            )}

            {/* Data Sources + All Pairs Summary */}
            {dataSources.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DataSourcesPanel sources={dataSources} />
                {allPairs.length > 1 && (
                  <div className="bg-slate-panel/50 border border-slate-border rounded-xl p-4">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                      Trading Pairs ({allPairs.length})
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {allPairs.slice(0, 8).map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{p.dexId}</span>
                            <span className="text-slate-500">{p.quoteToken?.symbol}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-400">
                            <span className="font-mono">${parseFloat(p.priceUsd ?? '0').toFixed(6)}</span>
                            <span className={cn("font-mono text-[9px]", (p.priceChange?.h24 ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                              {(p.priceChange?.h24 ?? 0) >= 0 ? '+' : ''}{(p.priceChange?.h24 ?? 0).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-12 gap-6">
              {/* Left: Live Chart (8 cols) */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <LiveChartPanel intel={intel} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <HolderDistribution holders={intel.holders} />
                  <DevActivityTimeline activity={intel.devActivity} />
                </div>
              </div>

              {/* Right: Risk Signals & Feed (4 cols) */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <RiskSignalsPanel signals={intel.riskSignals} />
                <TransactionFeed transactions={intel.transactions} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

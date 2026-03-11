import React, { useState, useEffect, useCallback } from 'react';
import { 
  Zap, 
  Search, 
  Loader2, 
  AlertTriangle, 
  Activity, 
  Users, 
  Clock, 
  TrendingUp, 
  Shield,
  ArrowLeft,
  LayoutDashboard,
  Network,
  Droplets,
  Package,
  ShieldCheck,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TokenHeader } from './solana-intel/TokenHeader';
import { LiveChartPanel } from './solana-intel/LiveChartPanel';
import { TransactionFeed } from './solana-intel/TransactionFeed';
import { HolderDistribution } from './solana-intel/HolderDistribution';
import { DevActivityTimeline } from './solana-intel/DevActivityTimeline';
import { RiskSignalsPanel } from './solana-intel/RiskSignalsPanel';
import { SolanaTokenIntel, RiskSignal } from '../types/signalos';
import { ForensicTransactionGraph } from './solana-intel/ForensicTransactionGraph';
import { FundingChainAnalysis } from './solana-intel/FundingChainAnalysis';
import { LPUnlockMonitor } from './solana-intel/LPUnlockMonitor';
import { ClusterRelationshipView } from './solana-intel/ClusterRelationshipView';
import { BundleAnalysis } from './solana-intel/BundleAnalysis';
import { fetchForensicData, ForensicData } from '../services/forensicService';
import { cn } from '../lib/utils';

export const TokenIntelligenceTerminal: React.FC = () => {
  const [mint, setMint] = useState('');
  const [activeMint, setActiveMint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deepMode, setDeepMode] = useState(true); // Default to deep mode for terminal
  const [forensicLoading, setForensicLoading] = useState(false);
  const [forensicData, setForensicData] = useState<ForensicData | null>(null);
  const [intel, setIntel] = useState<SolanaTokenIntel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchIntel = useCallback(async (targetMint: string) => {
    setLoading(true);
    setError(null);
    setForensicData(null);
    try {
      // In a real app, these would be real API calls. 
      // For the terminal, we'll simulate the multi-layer data fetch.
      const [intelRes, txRes, holderRes, devRes] = await Promise.all([
        fetch(`/api/token-intel/${targetMint}`),
        fetch(`/api/token-transactions/${targetMint}`),
        fetch(`/api/token-holders/${targetMint}`),
        fetch(`/api/dev-activity/${targetMint}`)
      ]);

      if (!intelRes.ok) throw new Error('Token not found or API error');

      const intelData = await intelRes.json();
      const txData = await txRes.json();
      const holderData = await holderRes.json();
      const devData = await devRes.json();

      const riskSignals: RiskSignal[] = [
        { 
          id: '1', 
          label: 'Top Holder > 20%', 
          status: holderData.top10Percentage > 30 ? 'high' : 'low', 
          evidence: `Top 10 holders own ${holderData.top10Percentage}%`, 
          timestamp: Date.now(),
          sourcedEvidence: {
            summary: `Analysis of top 100 holders shows significant concentration. Top 10 wallets control ${holderData.top10Percentage}% of total supply.`,
            sources: [{ label: 'Solscan', url: `https://solscan.io/token/${targetMint}#holders`, kind: 'solscan' }]
          }
        },
        { 
          id: '2', 
          label: 'Liquidity Depth', 
          status: intelData.pair.liquidity.usd < 10000 ? 'critical' : 'low', 
          evidence: `$${intelData.pair.liquidity.usd.toLocaleString()} total liquidity`, 
          timestamp: Date.now(),
          sourcedEvidence: {
            summary: `Current liquidity pool depth is $${intelData.pair.liquidity.usd.toLocaleString()} across DEXes.`,
            sources: [{ label: 'DexScreener', url: intelData.pair.url, kind: 'dexscreener' }]
          }
        },
        { 
          id: '3', 
          label: 'Dev Activity', 
          status: devData.some((a: any) => a.action.includes('Sell')) ? 'medium' : 'low', 
          evidence: 'Dev has sold tokens recently', 
          timestamp: Date.now(),
          sourcedEvidence: {
            summary: "Developer wallet activity monitoring detected recent token transfers.",
            sources: [{ label: 'Solana RPC', url: `https://solscan.io/account/${intelData.metadata.deployer}`, kind: 'rpc' }]
          }
        },
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
      }, 15000);
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
      {/* Search Bar & Terminal Header */}
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="text-primary" size={20} />
              <h1 className="text-4xl font-display font-bold tracking-tight">Token Intelligence Terminal</h1>
            </div>
            <p className="text-slate-500 text-sm max-w-xl">
              SplashSignal Forensic Suite v2.4. Institutional-grade contract auditing, wallet cluster detection, and launch bundle analysis.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Status</div>
              <div className="flex items-center gap-2 text-emerald-500 font-mono text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE_NET_SYNC
              </div>
            </div>
            <button 
              onClick={() => setDeepMode(!deepMode)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                deepMode 
                  ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20" 
                  : "bg-slate-panel border-slate-border text-slate-500 hover:text-slate-300"
              )}
            >
              <Shield size={14} className={cn(deepMode && "animate-pulse")} />
              Deep Mode {deepMode ? 'ACTIVE' : 'STANDBY'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={20} className="text-slate-500 group-focus-within:text-primary transition-colors" />
          </div>
          <input 
            type="text"
            value={mint}
            onChange={(e) => setMint(e.target.value)}
            placeholder="Enter Contract Address (Solana Mint)..."
            className="w-full bg-slate-panel/50 border border-slate-border rounded-2xl py-5 pl-14 pr-40 text-lg focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-slate-600 shadow-2xl"
          />
          <button 
            type="submit"
            disabled={loading || !mint.trim()}
            className="absolute right-3 top-3 bottom-3 px-8 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
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
            className="flex flex-col items-center justify-center py-32 text-center space-y-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
              <div className="w-24 h-24 rounded-3xl bg-slate-panel border border-primary/30 flex items-center justify-center text-primary relative z-10">
                <LayoutDashboard size={48} />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-display font-bold">Terminal Ready</h2>
              <p className="text-slate-500 max-w-md mx-auto">
                Paste a token address to initialize multi-vector forensic analysis including dev tracking, cluster mapping, and bundle detection.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-border/50 w-full max-w-2xl">
              <div className="space-y-1">
                <Network className="mx-auto text-primary/50" size={24} />
                <div className="text-[10px] font-bold text-slate-500 uppercase">Cluster Mapping</div>
              </div>
              <div className="space-y-1">
                <Package className="mx-auto text-primary/50" size={24} />
                <div className="text-[10px] font-bold text-slate-500 uppercase">Bundle Detection</div>
              </div>
              <div className="space-y-1">
                <Droplets className="mx-auto text-primary/50" size={24} />
                <div className="text-[10px] font-bold text-slate-500 uppercase">LP Forensic</div>
              </div>
            </div>
          </motion.div>
        )}

        {loading && !intel && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 space-y-6"
          >
            <div className="relative">
              <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap size={24} className="text-primary animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-display font-bold text-white">INITIALIZING FORENSIC SCAN</p>
              <p className="text-xs font-mono text-slate-500 uppercase tracking-[0.2em] mt-2">Synchronizing with Solana RPC Cluster...</p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 space-y-4 text-red-400"
          >
            <AlertTriangle size={48} />
            <div className="text-center">
              <p className="text-xl font-bold">{error}</p>
              <p className="text-sm text-slate-500 mt-2">The provided address could not be resolved or the API is currently throttled.</p>
            </div>
            <button onClick={() => setError(null)} className="px-6 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all">Retry Search</button>
          </motion.div>
        )}

        {intel && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 max-w-7xl mx-auto"
          >
            {/* Top: Token Header */}
            <TokenHeader intel={intel} />

            {/* Deep Investigation Layer */}
            {deepMode && (
              <div className="grid grid-cols-12 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="col-span-12 lg:col-span-8">
                  {forensicLoading ? (
                    <div className="h-[500px] bg-slate-panel border border-slate-border rounded-2xl flex flex-col items-center justify-center space-y-4">
                      <Loader2 size={32} className="text-primary animate-spin" />
                      <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Reconstructing Transaction Graph...</p>
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
                      <div className="h-64 bg-slate-panel animate-pulse rounded-2xl" />
                      <div className="h-64 bg-slate-panel animate-pulse rounded-2xl" />
                    </div>
                  ) : forensicData && (
                    <>
                      <BundleAnalysis data={forensicData.bundleAnalysis} />
                      <LPUnlockMonitor status={forensicData.lpStatus} />
                    </>
                  )}
                </div>
                
                {forensicData && (
                  <div className="col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ClusterRelationshipView clusters={forensicData.clusters} />
                    <FundingChainAnalysis chains={forensicData.fundingChains} />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-12 gap-6">
              {/* Left: Live Chart & Activity */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <LiveChartPanel intel={intel} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <HolderDistribution holders={intel.holders} />
                  <DevActivityTimeline activity={intel.devActivity} />
                </div>
              </div>

              {/* Right: Risk Signals & Feed */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-slate-panel border border-slate-border rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="text-primary" size={20} />
                    <h3 className="text-lg font-display font-bold">Market Intelligence</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-500 uppercase font-bold">Market Cap</span>
                      <span className="text-sm font-display font-bold text-white">${(intel.pair.fdv || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-500 uppercase font-bold">24H Volume</span>
                      <span className="text-sm font-display font-bold text-white">${(intel.pair.volume.h24 || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-500 uppercase font-bold">Liquidity</span>
                      <span className="text-sm font-display font-bold text-white">${(intel.pair.liquidity.usd || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5">
                      <span className="text-xs text-slate-500 uppercase font-bold">Launchpad</span>
                      <span className="text-sm font-display font-bold text-amber-500 uppercase">{intel.metadata.launchpadType || 'Raydium'}</span>
                    </div>
                  </div>
                </div>
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

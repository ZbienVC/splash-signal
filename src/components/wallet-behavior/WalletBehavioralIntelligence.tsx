import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Loader2, 
  ArrowLeft, 
  Fingerprint, 
  ShieldAlert, 
  Activity,
  Zap,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeWalletBehavior, WalletBehaviorData } from '../../services/walletBehaviorService';
import { WalletBehaviorCard } from './WalletBehaviorCard';
import { WalletClusterGraph } from './WalletClusterGraph';
import { cn } from '../../lib/utils';

interface WalletBehavioralIntelligenceProps {
  target?: string;
  onBack?: () => void;
}

export const WalletBehavioralIntelligence: React.FC<WalletBehavioralIntelligenceProps> = ({ target: initialTarget, onBack }) => {
  const [searchQuery, setSearchQuery] = useState(initialTarget || '');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WalletBehaviorData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performAnalysis = async (address: string) => {
    if (!address.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeWalletBehavior(address);
      if (result) {
        setData(result);
      } else {
        setError("Failed to retrieve behavioral data for this address.");
      }
    } catch (err) {
      setError("An error occurred during forensic analysis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTarget) {
      performAnalysis(initialTarget);
    }
  }, [initialTarget]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performAnalysis(searchQuery);
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header & Search */}
      <div className="flex flex-col gap-6 bg-slate-panel border border-slate-border p-6 rounded-2xl shadow-xl shadow-black/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-500">
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight">Wallet Behavioral Intelligence</h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Intent Classification & Relationship Mapping</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold text-primary uppercase">Forensic Engine Active</span>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Enter wallet address for behavioral profiling..."
            className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-12 pr-32 text-sm focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all placeholder:text-slate-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            type="submit"
            disabled={loading || !searchQuery}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-1.5 bg-primary text-slate-900 text-xs font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : 'ANALYZE'}
          </button>
        </form>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-32 space-y-6"
          >
            <div className="relative">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <Fingerprint className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/50 w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-display font-bold">Scanning Behavioral Signatures</h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Correlating transaction frequency, entry timing, and relationship clusters across the global ledger...
              </p>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div 
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <ShieldAlert size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Analysis Failed</h3>
              <p className="text-slate-500 text-sm">{error}</p>
            </div>
          </motion.div>
        ) : data ? (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-6"
          >
            <WalletBehaviorCard data={data} />
            <WalletClusterGraph data={data} />
          </motion.div>
        ) : (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-8"
          >
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-slate-panel border border-slate-border flex items-center justify-center text-slate-600">
                <Activity size={48} />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Zap size={16} />
              </div>
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-2xl font-display font-bold">Behavioral Intelligence Engine</h2>
              <p className="text-slate-500 text-sm">
                Enter a wallet address to unlock institutional-grade insights into trader classification, success rates, and hidden relationship networks.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
              <div className="p-4 rounded-xl bg-slate-panel border border-slate-border text-left">
                <Target size={16} className="text-primary mb-2" />
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1">Sniper Detection</div>
                <p className="text-[10px] text-slate-500">Identify early-entry bots and high-velocity snipers.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-panel border border-slate-border text-left">
                <Fingerprint size={16} className="text-emerald-500 mb-2" />
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1">Intent Profiling</div>
                <p className="text-[10px] text-slate-500">Classify wallets by strategy and success rate.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-panel border border-slate-border text-left">
                <Activity size={16} className="text-amber-500 mb-2" />
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1">Cluster Mapping</div>
                <p className="text-[10px] text-slate-500">Visualize hidden funding and co-trading networks.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

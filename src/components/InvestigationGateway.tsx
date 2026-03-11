import React from 'react';
import { 
  Search, 
  ShieldCheck, 
  Wallet, 
  Network, 
  FileSearch, 
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  Droplets
} from 'lucide-react';
import { cn } from '../lib/utils';

const modules = [
  { 
    id: 'token-analysis', 
    title: 'Token Intelligence', 
    desc: 'Deep integrity audit and ownership concentration analysis.', 
    icon: ShieldCheck,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  { 
    id: 'wallet-behavior', 
    title: 'Behavioral Intelligence', 
    desc: 'Forensic pattern analysis and relationship mapping.', 
    icon: Wallet,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  { 
    id: 'liquidity-intel', 
    title: 'Liquidity Intelligence', 
    desc: 'Forensic analysis of pool stability and LP behavior.', 
    icon: Droplets,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  { 
    id: 'cluster-analysis', 
    title: 'Cluster Analysis', 
    desc: 'Coordination probability and network synchronization.', 
    icon: Network,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  },
  { 
    id: 'reasoning-audit', 
    title: 'Reasoning Audit', 
    desc: 'Transparent breakdown of model inference logic.', 
    icon: FileSearch,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  },
];

export const InvestigationGateway: React.FC<{ onModuleSelect: (id: string, target?: string) => void }> = ({ onModuleSelect }) => {
  const [input, setInput] = React.useState('');

  const handleAnalyze = () => {
    if (!input.trim()) return;
    // Simple heuristic: if it's a long address, it's likely a wallet or token
    // For now, let's allow the user to choose or default to token analysis
    // but if it's explicitly a wallet investigation requested, we can route to behavior
    if (input.length > 30) {
      onModuleSelect('wallet-behavior', input);
    } else {
      onModuleSelect('token-analysis', input);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-100px)] animate-in fade-in zoom-in-95 duration-700">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-4">
          <Sparkles size={12} /> AI-Powered Investigation Engine
        </div>
        <h1 className="text-5xl font-display font-bold tracking-tight mb-4">Investigation Gateway</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Analyze assets, entities, or events with SplashSignal's suite of specialized intelligence modules.
        </p>
      </div>

      <div className="w-full max-w-2xl relative mb-16">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          placeholder="Enter Token Address, Wallet, or Case ID..." 
          className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-14 pr-32 text-lg focus:outline-none focus:border-primary/50 focus:bg-black/40 transition-all placeholder:text-slate-600 shadow-2xl"
        />
        <button 
          onClick={handleAnalyze}
          disabled={!input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white px-5 py-2 rounded-lg font-bold hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          ANALYZE <ArrowRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {modules.map((mod) => (
          <button 
            key={mod.id}
            onClick={() => onModuleSelect(mod.id)}
            className="bg-slate-panel border border-slate-border rounded-2xl p-6 text-left group hover:border-primary/50 hover:bg-white/[0.02] transition-all relative overflow-hidden"
          >
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", mod.bg, mod.color)}>
              <mod.icon size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{mod.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{mod.desc}</p>
            <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-slate-600 group-hover:text-primary transition-colors">
              LAUNCH MODULE <ArrowRight size={12} />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-16 grid grid-cols-3 gap-12 w-full max-w-4xl border-t border-slate-border pt-12">
        <div className="flex items-center gap-4">
          <Zap className="text-amber-500" size={32} />
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Processing</div>
            <div className="text-lg font-bold">Real-time</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Globe className="text-primary" size={32} />
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Coverage</div>
            <div className="text-lg font-bold">Global Multi-chain</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ShieldCheck className="text-emerald-500" size={32} />
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Accuracy</div>
            <div className="text-lg font-bold">99.9% Verified</div>
          </div>
        </div>
      </div>
    </div>
  );
};

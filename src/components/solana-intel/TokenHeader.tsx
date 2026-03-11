import React from 'react';
import { 
  Zap, 
  Globe, 
  TrendingUp, 
  Activity, 
  Clock, 
  ExternalLink,
  Shield,
  Target,
  BarChart3
} from 'lucide-react';
import { SolanaTokenIntel } from '../../types/signalos';
import { cn } from '../../lib/utils';

export const TokenHeader: React.FC<{ intel: SolanaTokenIntel }> = ({ intel }) => {
  const { metadata, pair } = intel;
  const { baseToken, liquidity, fdv, volume, pairCreatedAt, url } = pair;

  const ageInHours = Math.floor((Date.now() - pairCreatedAt) / (1000 * 60 * 60));

  return (
    <div className="bg-slate-panel border border-slate-border rounded-2xl p-6 relative overflow-hidden group">
      {/* Background Decorative Gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-primary/10 transition-colors"></div>
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/10">
            <Zap size={32} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-display font-bold tracking-tight">{baseToken.name}</h1>
              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20 uppercase tracking-widest">
                ${baseToken.symbol}
              </span>
              {metadata.launchpadType === 'pumpfun' && (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-full border border-amber-500/20 uppercase tracking-widest">
                  PUMP.FUN
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-slate-500 text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <Target size={12} /> {(metadata.address || '').slice(0, 8)}...{(metadata.address || '').slice(-8)}
              </span>
              <span className="h-3 w-px bg-slate-border"></span>
              <span className="flex items-center gap-1.5">
                <Clock size={12} /> {ageInHours}H OLD
              </span>
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                <ExternalLink size={12} /> DEXSCREENER
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full lg:w-auto">
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Liquidity</div>
            <div className="text-xl font-display font-bold text-white">${liquidity.usd.toLocaleString()}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">FDV</div>
            <div className="text-xl font-display font-bold text-white">${fdv.toLocaleString()}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Volume (24H)</div>
            <div className="text-xl font-display font-bold text-white">${volume.h24.toLocaleString()}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Price</div>
            <div className="text-xl font-display font-bold text-emerald-400 font-mono">${pair.priceUsd}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

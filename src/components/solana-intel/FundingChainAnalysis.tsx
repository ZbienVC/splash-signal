import React from 'react';
import { FundingChain } from '../../services/forensicService';
import { Network, ArrowRight, Clock, DollarSign } from 'lucide-react';

interface FundingChainAnalysisProps {
  chains: FundingChain[];
}

export const FundingChainAnalysis: React.FC<FundingChainAnalysisProps> = ({ chains }) => {
  return (
    <div className="bg-slate-panel border border-slate-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Network size={20} />
        </div>
        <div>
          <h3 className="text-lg font-display font-bold">Wallet Funding Chains</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Tracing Initial Capital Origins</p>
        </div>
      </div>

      <div className="space-y-4">
        {chains.map((chain, i) => (
          <div key={i} className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono font-bold text-primary">{(chain.targetWallet || '').slice(0, 8)}...{(chain.targetWallet || '').slice(-8)}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Target Wallet</span>
            </div>
            
            <div className="space-y-2">
              {chain.sourceWallets.map((source, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    {j < chain.sourceWallets.length - 1 && <div className="w-px h-6 bg-slate-800" />}
                  </div>
                  <div className="flex-1 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400">{(source.address || '').slice(0, 6)}...</span>
                      <ArrowRight size={10} className="text-slate-600" />
                      <span className="font-bold text-emerald-500">{source.amount} SOL</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock size={10} />
                      <span>{source.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

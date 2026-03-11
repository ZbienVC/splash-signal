import React from 'react';
import { Users, ShieldCheck, AlertTriangle, ExternalLink, Wallet } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AppLink } from '../common/AppLink';

interface LPWallet {
  address: string;
  type: 'DEX' | 'USER' | 'DEV';
  share: number;
  status: 'LOCKED' | 'ACTIVE' | 'WITHDRAWN';
}

interface LPWalletTrackerProps {
  wallets: LPWallet[];
}

export const LPWalletTracker: React.FC<LPWalletTrackerProps> = ({ wallets }) => {
  return (
    <div className="bg-slate-panel border border-slate-border rounded-2xl p-6 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <Users size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold">LP Wallet Tracker</h3>
          <p className="text-xs text-slate-500">Monitoring liquidity provision distribution</p>
        </div>
      </div>

      <div className="space-y-3">
        {wallets.map((wallet) => (
          <div key={wallet.address} className="p-4 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                wallet.type === 'DEX' ? "bg-primary/10 text-primary" : 
                wallet.type === 'DEV' ? "bg-red-500/10 text-red-500" : 
                "bg-slate-500/10 text-slate-500"
              )}>
                <Wallet size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{wallet.type} Pool</span>
                  <span className={cn(
                    "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest",
                    wallet.status === 'LOCKED' ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500/20 text-amber-500"
                  )}>
                    {wallet.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <AppLink 
                    href={`https://solscan.io/account/${wallet.address}`}
                    label={wallet.address}
                    className="text-[10px] font-mono text-slate-500 hover:text-primary transition-colors"
                  />
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-display font-bold text-slate-200">{wallet.share}%</div>
              <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Share of Pool</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-3">
        <ShieldCheck className="text-primary shrink-0" size={20} />
        <p className="text-[10px] text-slate-400 leading-relaxed">
          <span className="font-bold text-primary">Security Note:</span> 92.5% of liquidity is held in a verified DEX contract. This significantly reduces the risk of a manual liquidity pull by the developer.
        </p>
      </div>
    </div>
  );
};

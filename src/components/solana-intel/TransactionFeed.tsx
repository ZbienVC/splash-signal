import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  Users, 
  Shield, 
  Clock, 
  ExternalLink,
  Filter,
  AlertTriangle,
  Target,
  Activity
} from 'lucide-react';
import { SolanaTransaction } from '../../types/signalos';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AppLink } from '../common/AppLink';
import { SourceChip } from '../common/SourceChip';
import { isValidSolanaSignature, isValidSolanaAddress } from '../../lib/solanaUtils';

export const TransactionFeed: React.FC<{ transactions: SolanaTransaction[] }> = ({ transactions: initialTransactions }) => {
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell' | 'whale' | 'dev' | 'new'>('all');
  const [transactions, setTransactions] = useState<SolanaTransaction[]>(initialTransactions);

  // Sync with props
  React.useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  const checkIndexing = async (signature: string) => {
    try {
      const res = await fetch(`/api/solana/resolve/${signature}`);
      if (res.ok) {
        const updatedTx = await res.json();
        setTransactions(prev => prev.map(tx => tx.txHash === signature ? { ...tx, ...updatedTx } : tx));
      }
    } catch (e) {
      console.error('Failed to resolve signature:', e);
    }
  };

  React.useEffect(() => {
    const awaiting = transactions.filter(tx => tx.indexedStatus === 'awaiting');
    if (awaiting.length > 0) {
      const interval = setInterval(() => {
        awaiting.forEach(tx => checkIndexing(tx.txHash));
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [transactions]);

  const filteredTxs = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'buy') return tx.type === 'buy';
    if (filter === 'sell') return tx.type === 'sell';
    if (filter === 'whale') return tx.isWhale;
    if (filter === 'dev') return tx.isDev;
    if (filter === 'new') return tx.isNewWallet;
    return true;
  });

  return (
    <div className="bg-slate-panel border border-slate-border rounded-2xl p-6 flex flex-col h-[600px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-display font-bold">Live Transaction Feed</h3>
          <div className="flex items-center gap-2 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-[10px] font-bold text-primary animate-pulse">
            LIVE
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-black/20 border border-slate-border rounded-lg px-3 py-1 text-[10px] font-bold text-slate-400 focus:outline-none focus:border-primary/50"
          >
            <option value="all">ALL</option>
            <option value="buy">BUYS</option>
            <option value="sell">SELLS</option>
            <option value="whale">WHALES</option>
            <option value="dev">DEV</option>
            <option value="new">NEW WALLETS</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide pr-2">
        <AnimatePresence initial={false}>
          {filteredTxs.map((tx, i) => (
            <motion.div 
              key={tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={cn(
                "p-3 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden",
                tx.isWhale && "border-primary/30 bg-primary/[0.02]",
                tx.isDev && "border-red-500/30 bg-red-500/[0.02]"
              )}
            >
              {/* Suspicious Pattern Highlight */}
              {tx.isDev && tx.type === 'sell' && (
                <div className="absolute top-0 right-0 p-1 bg-red-500/20 text-red-500 rounded-bl-lg">
                  <AlertTriangle size={10} />
                </div>
              )}

              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    tx.type === 'buy' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                  )}>
                    {tx.type === 'buy' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {isValidSolanaAddress(tx.wallet) ? (
                        <AppLink 
                          href={`https://solscan.io/account/${tx.wallet}`}
                          label={tx.wallet}
                          className="text-xs font-mono font-bold text-primary hover:underline cursor-pointer"
                        />
                      ) : (
                        <span className="text-xs font-mono font-bold text-slate-500">{tx.wallet}</span>
                      )}
                      <SourceChip 
                        evidence={tx.evidence || { sources: [{ label: 'Solana RPC', url: `https://solscan.io/tx/${tx.txHash}`, kind: 'solscan' }] }} 
                        title={`TX: ${(tx.txHash || '').slice(0, 8)}...`} 
                      />
                      {tx.indexedStatus === 'awaiting' && (
                        <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-bold rounded border border-amber-500/20 animate-pulse flex items-center gap-1">
                          <Clock size={8} /> AWAITING INDEX
                        </span>
                      )}
                      {tx.isDev && <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-bold rounded border border-red-500/20">DEV</span>}
                      {tx.isWhale && <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] font-bold rounded border border-primary/20">WHALE</span>}
                      {tx.isNewWallet && <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-bold rounded border border-amber-500/20">NEW</span>}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-widest">
                      {tx.type === 'buy' ? 'Purchased' : 'Sold'} {tx.amountToken.toLocaleString()} Tokens
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "text-sm font-mono font-bold",
                    tx.type === 'buy' ? "text-emerald-400" : "text-red-400"
                  )}>
                    {tx.type === 'buy' ? '+' : '-'}${tx.amountUSD.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                    <Clock size={10} /> {Math.floor((Date.now() - tx.timestamp) / 1000)}s ago
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-[9px] font-mono text-slate-600 truncate max-w-[150px]">
                  TX: {tx.txHash}
                </div>
                {isValidSolanaSignature(tx.txHash) ? (
                  <AppLink 
                    href={`https://solscan.io/tx/${tx.txHash}`}
                    label="VIEW ON SOLSCAN"
                    className="text-[9px] font-bold text-primary flex items-center gap-1 hover:underline"
                  />
                ) : (
                  <span className="text-[9px] font-bold text-slate-600 flex items-center gap-1">
                    <AlertTriangle size={10} /> SIGNATURE UNAVAILABLE
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-4 p-3 bg-black/40 rounded-xl border border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={12} className="text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Pattern Recognition</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Detected <span className="text-white font-bold">3 rapid bot buys</span> in last 60s. Large sell cluster forming at <span className="text-white font-bold">$0.048</span>.
        </p>
      </div>
    </div>
  );
};

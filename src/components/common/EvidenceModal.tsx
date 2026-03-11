import React from 'react';
import { X, ExternalLink, Database, Clock, Shield, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Evidence, SourceRef } from '../../types';
import { cn } from '../../lib/utils';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: Evidence;
  title: string;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ isOpen, onClose, evidence, title }) => {
  if (!isOpen) return null;

  const getKindIcon = (kind: SourceRef['kind']) => {
    switch (kind) {
      case 'solscan': return <Database size={14} />;
      case 'dexscreener': return <TrendingUp size={14} />;
      case 'gdelt': return <Globe size={14} />;
      case 'twitter': return <Twitter size={14} />;
      case 'rpc': return <Cpu size={14} />;
      default: return <Info size={14} />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-panel border border-slate-border rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-bottom border-slate-border flex justify-between items-center bg-black/20">
            <div>
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <Shield className="text-primary" size={20} />
                Evidence Audit: {title}
              </h2>
              <p className="text-xs text-slate-500 mt-1">Tracing data points to authoritative sources</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {evidence.summary && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Analysis Summary</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{evidence.summary}</p>
              </div>
            )}

            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Database size={12} />
                Primary Sources ({evidence.sources.length})
              </h3>
              <div className="space-y-3">
                {evidence.sources.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-500">
                    <AlertCircle size={18} />
                    <p className="text-xs font-bold uppercase tracking-wider">No verifiable sources available for this metric.</p>
                  </div>
                ) : (
                  evidence.sources.map((source, i) => (
                    <a 
                      key={i}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                          <ExternalLink size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-200">{source.label}</div>
                          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">{source.kind}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {source.timestamp && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                            <Clock size={10} />
                            {new Date(source.timestamp).toLocaleString()}
                          </div>
                        )}
                        <div className="text-[10px] text-primary font-bold mt-1 group-hover:underline">VERIFY SOURCE</div>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>

            {evidence.raw && (
              <div>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Info size={12} />
                  Raw Input Payload
                </h3>
                <pre className="p-4 rounded-xl bg-black/40 border border-white/5 text-[10px] font-mono text-slate-400 overflow-x-auto">
                  {JSON.stringify(evidence.raw, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-border bg-black/20 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all"
            >
              CLOSE AUDIT
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Add missing icons for the helper function
import { TrendingUp, Globe, Twitter, Cpu } from 'lucide-react';

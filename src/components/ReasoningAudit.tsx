import React, { useEffect, useState } from 'react';
import { 
  FileSearch, 
  Cpu, 
  Database, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Code,
  Layers,
  Activity,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { initAnalysis, getAnalysisSummary, getAnalysisAudit } from '../services/marketService';

export const ReasoningAudit: React.FC<{ target?: string; onBack: () => void }> = ({ target, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [auditData, setAuditData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const startAnalysis = async () => {
      if (!target) return;
      setLoading(true);
      try {
        const { analysisId: id } = await initAnalysis(target);
        
        // Poll for completion
        let isComplete = false;
        let attempts = 0;
        while (!isComplete && attempts < 30) {
          const status = await getAnalysisSummary(id);
          if (status.status === 'COMPLETED') {
            setSummary(status);
            isComplete = true;
          } else {
            await new Promise(r => setTimeout(r, 2000));
            attempts++;
          }
        }

        if (isComplete) {
          const audit = await getAnalysisAudit(id);
          setAuditData(audit);
        }
      } catch (e) {
        console.error('Analysis failed', e);
      } finally {
        setLoading(false);
      }
    };

    startAnalysis();
  }, [target]);

  const displayTarget = target || 'Case #8291';

  if (loading) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <div className="text-center">
          <h2 className="text-xl font-display font-bold">Auditing Inference Decision Path</h2>
          <p className="text-slate-500 text-sm">Extracting model reasoning and input vectors...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold tracking-tight truncate max-w-md">{displayTarget}</h1>
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded border border-primary/20 uppercase tracking-widest">Audit Mode Active</span>
          </div>
          <p className="text-slate-500 text-sm">Transparent breakdown of model inference logic and decision path</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Decision Logic */}
        <div className="col-span-2 bg-slate-panel border border-slate-border rounded-2xl p-8">
          <h3 className="text-lg font-display font-bold mb-6 flex items-center gap-2">
            <Cpu size={20} className="text-primary" /> Primary Decision Logic
          </h3>
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-sm leading-relaxed text-slate-300">
              {auditData?.logic || (
                <>
                  <span className="text-primary">IF</span> (temporal_sync {'>'} 0.92) <span className="text-primary">AND</span> (funding_source == shared_cex_sub) <span className="text-primary">THEN</span><br />
                  &nbsp;&nbsp;classify(CLUSTER_COORDINATION, HIGH_CONFIDENCE);<br />
                  <span className="text-primary">ELSE IF</span> (gas_pattern_match == TRUE) <span className="text-primary">THEN</span><br />
                  &nbsp;&nbsp;classify(BEHAVIORAL_CORRELATION, MEDIUM_CONFIDENCE);
                </>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Model Inputs</h4>
                <div className="space-y-2">
                  {(auditData?.inputs || ['On-chain Transaction Logs', 'CEX Deposit Metadata', 'Social Sentiment API', 'Historical Cluster DB']).map((input: string) => (
                    <div key={input} className="flex items-center gap-2 text-xs text-slate-400">
                      <Database size={12} className="text-slate-600" /> {input}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inference Engine</h4>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="text-xs font-bold text-primary mb-1">{auditData?.engine || 'SIGNAL_LLM_V4_TURBO'}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{auditData?.engineSpecs || 'Quantized 4-bit • 70B Params'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Metadata */}
        <div className="bg-slate-panel border border-slate-border rounded-2xl p-6 flex flex-col">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Audit Metadata</h3>
          <div className="space-y-4 flex-1">
            {(auditData?.steps || [
              { label: 'Input Vectorization', status: 'success', time: '12ms' },
              { label: 'Heuristic Filtering', status: 'success', time: '45ms' },
              { label: 'Cross-Chain Correlation', status: 'success', time: '120ms' },
              { label: 'Inference Engine v4.2', status: 'success', time: '88ms' },
              { label: 'Confidence Calibration', status: 'warning', time: '15ms' },
            ]).map((step: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                <div className="flex items-center gap-3">
                  {step.status === 'success' ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <AlertCircle size={16} className="text-amber-500" />
                  )}
                  <span className="text-xs font-bold">{step.label}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{step.time}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-slate-border">
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-2">
              <span>TOTAL_LATENCY</span>
              <span className="text-white">{auditData?.totalLatency || '325ms'}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>AUDIT_HASH</span>
              <span className="text-white">0x{auditData?.hash || '882...F92'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal View */}
      <div className="bg-black border border-slate-border rounded-2xl overflow-hidden">
        <div className="bg-slate-panel px-4 py-2 border-b border-slate-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inference Log Stream</span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
          </div>
        </div>
        <div className="p-4 font-mono text-[11px] text-emerald-500/80 space-y-1 h-48 overflow-y-auto scrollbar-hide">
          {auditData?.logs?.map((log: string, i: number) => (
            <div key={i} className={cn(log.includes('WARNING') && "text-amber-500", log.includes('FINAL') && "text-primary")}>
              {log}
            </div>
          )) || (
            <>
              <div>[2026-02-27 07:22:01] INITIALIZING_INFERENCE_PIPELINE...</div>
              <div>[2026-02-27 07:22:01] LOADING_VECTOR_STORE: CROSS_CHAIN_TX_V2</div>
              <div>[2026-02-27 07:22:02] ANALYZING_TEMPORAL_CLUSTERS: 12_NODES_FOUND</div>
              <div className="text-amber-500">[2026-02-27 07:22:02] WARNING: LOW_CONFIDENCE_IN_SOCIAL_METADATA</div>
              <div>[2026-02-27 07:22:03] CALCULATING_COORDINATION_PROBABILITY: 0.9982</div>
              <div className="text-primary">[2026-02-27 07:22:03] FINAL_CLASSIFICATION: ACTIVE_COORDINATION_DETECTED</div>
            </>
          )}
          <div className="animate-pulse">_</div>
        </div>
      </div>
    </div>
  );
};

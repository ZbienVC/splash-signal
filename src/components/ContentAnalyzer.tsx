import React, { useEffect, useState } from 'react';
import { 
  MessageSquare, 
  ShieldCheck, 
  Activity, 
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowUpRight,
  Share2,
  Loader2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from '../lib/utils';
import { getAnalysisContent, getAnalysisSummary } from '../services/marketService';

export const ContentAnalyzer: React.FC<{ id?: string; onBack: () => void }> = ({ id, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [contentData, setContentData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [summaryData, content] = await Promise.all([
          getAnalysisSummary(id),
          getAnalysisContent(id)
        ]);
        setSummary(summaryData);
        setContentData(content);
      } catch (e) {
        console.error('Failed to load content analysis', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <div className="text-center">
          <h2 className="text-xl font-display font-bold">Analyzing Content Narrative</h2>
          <p className="text-slate-500 text-sm">Deconstructing linguistic patterns and persuasion markers...</p>
        </div>
      </div>
    );
  }

  const linguisticData = contentData?.linguisticProfile || [
    { category: 'Emotional Persuasion', value: 82, color: '#ef4444' },
    { category: 'Factual Density', value: 24, color: '#137fec' },
    { category: 'Logical Consistency', value: 45, color: '#10b981' },
    { category: 'Amplification Bias', value: 91, color: '#8b5cf6' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold tracking-tight truncate max-w-md">INV-{id}</h1>
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded border border-primary/20 uppercase tracking-widest">Analysis Complete</span>
          </div>
          <p className="text-slate-500 text-sm">Linguistic Fingerprinting & Persuasion Intensity Analysis</p>
        </div>
        <div className="ml-auto flex gap-3">
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400">
            <Share2 size={20} />
          </button>
          <button className="px-4 py-2 bg-slate-panel border border-slate-border rounded-lg text-xs font-bold hover:bg-white/5 transition-all">VIEW SOURCE</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Credibility Score */}
        <div className="bg-slate-panel border border-slate-border rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-4 left-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Credibility Score</div>
          <div className={cn(
            "text-7xl font-display font-bold mb-2",
            (contentData?.credibilityScore || 0) < 40 ? "text-red-500" : (contentData?.credibilityScore || 0) < 70 ? "text-amber-500" : "text-emerald-500"
          )}>{contentData?.credibilityScore || 0}</div>
          <div className={cn(
            "flex items-center gap-2 text-xs font-bold uppercase tracking-widest",
            (contentData?.credibilityScore || 0) < 40 ? "text-red-500" : (contentData?.credibilityScore || 0) < 70 ? "text-amber-500" : "text-emerald-500"
          )}>
            {(contentData?.credibilityScore || 0) < 40 ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
            {contentData?.credibilityLabel || 'Unknown Credibility'}
          </div>
          <p className="mt-6 text-xs text-slate-400 leading-relaxed">
            {contentData?.verdictDescription || 'No description available for this analysis.'}
          </p>
        </div>

        {/* Linguistic Consistency */}
        <div className="col-span-2 bg-slate-panel border border-slate-border rounded-2xl p-6">
          <h3 className="text-lg font-display font-bold mb-6">Linguistic Consistency Profile</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={linguisticData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4b" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="category" type="category" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} width={120} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1c2632', border: '1px solid #2d3a4b', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {linguisticData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#primary'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Heuristic Markers */}
        <div className="bg-slate-panel border border-slate-border rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Heuristic Markers</h3>
          <div className="space-y-4">
            {(contentData?.heuristicMarkers || [
              { label: 'Fear Appeals', count: 12, intensity: 'High' },
              { label: 'Urgency Cues', count: 8, intensity: 'High' },
              { label: 'Ad Hominem', count: 4, intensity: 'Medium' },
              { label: 'False Dilemma', count: 3, intensity: 'Low' },
            ]).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                <div>
                  <div className="text-xs font-bold">{item.label}</div>
                  <div className="text-[10px] text-slate-500">{item.count} instances detected</div>
                </div>
                <div className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  item.intensity === 'High' ? "text-red-500" : item.intensity === 'Medium' ? "text-amber-500" : "text-emerald-500"
                )}>{item.intensity}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Persuasion Intensity */}
        <div className="col-span-2 bg-slate-panel border border-slate-border rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-display font-bold">Persuasion Intensity Over Time</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><div className="w-2 h-2 rounded-full bg-red-500"></div> Emotional</div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><div className="w-2 h-2 rounded-full bg-primary"></div> Factual</div>
            </div>
          </div>
          <div className="h-[200px] flex items-center justify-center text-slate-600 font-mono text-xs">
            {/* Placeholder for time-series chart */}
            <Activity size={48} className="opacity-20 animate-pulse" />
            <span className="ml-4">TEMPORAL_ANALYSIS_STREAM_ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

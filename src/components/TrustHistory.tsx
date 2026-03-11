import React from 'react';
import { 
  ShieldCheck, 
  History, 
  TrendingUp, 
  ArrowLeft,
  CheckCircle2,
  Clock,
  Calendar,
  BarChart3,
  Award,
  ExternalLink
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '../lib/utils';

const credibilityData = [
  { date: '2023-12', score: 72 },
  { date: '2024-01', score: 75 },
  { date: '2024-02', score: 82 },
  { date: '2024-03', score: 88 },
  { date: '2024-04', score: 85 },
  { date: '2024-05', score: 92 },
];

const events = [
  { id: 'EVT-442', title: 'Accurate Prediction: ETH Merge Volatility', date: '2024-03-12', impact: '+4.2', type: 'Prediction' },
  { id: 'EVT-441', title: 'Verified Identity: Institutional KYC', date: '2024-02-28', impact: '+12.0', type: 'Verification' },
  { id: 'EVT-440', title: 'Minor Discrepancy: Liquidity Report', date: '2024-01-15', impact: '-2.1', type: 'Reporting' },
  { id: 'EVT-439', title: 'High Win Rate: Q4 2023 Signals', date: '2023-12-30', impact: '+8.5', type: 'Performance' },
];

export const TrustHistory: React.FC<{ onBack: () => void }> = ({ onBack }) => {
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
            <h1 className="text-3xl font-display font-bold tracking-tight">Entity: ANALYST_882</h1>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded border border-emerald-500/20 uppercase tracking-widest">Verified Institutional</span>
          </div>
          <p className="text-slate-500 text-sm">Long-term Reliability Assessment & Credibility History</p>
        </div>
        <div className="ml-auto flex gap-3">
          <button className="px-4 py-2 bg-slate-panel border border-slate-border rounded-lg text-xs font-bold hover:bg-white/5 transition-all flex items-center gap-2">
            <ExternalLink size={14} /> VIEW PROFILE
          </button>
          <button className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            ENDORSE ENTITY
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Trust Score */}
        <div className="bg-slate-panel border border-slate-border rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-4 left-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trust Score</div>
          <div className="text-7xl font-display font-bold text-emerald-500 mb-2">92</div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-widest">
            <ShieldCheck size={14} /> Highly Reliable
          </div>
          <p className="mt-6 text-xs text-slate-400 leading-relaxed">
            Entity demonstrates consistent accuracy and high factual density across 42 verified investigations.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="col-span-2 grid grid-cols-3 gap-6">
          <div className="bg-slate-panel border border-slate-border rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reliability Index</span>
              <Award size={16} className="text-primary" />
            </div>
            <div className="text-4xl font-display font-bold">0.96</div>
            <div className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Top 1% of Analysts</div>
            <div className="mt-4 h-1 bg-black/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '96%' }}></div>
            </div>
          </div>

          <div className="bg-slate-panel border border-slate-border rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Win Rate</span>
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <div className="text-4xl font-display font-bold">84%</div>
            <div className="text-xs text-emerald-500 font-bold mt-1 uppercase tracking-widest">+4.2% vs Avg</div>
            <div className="mt-4 h-1 bg-black/20 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '84%' }}></div>
            </div>
          </div>

          <div className="bg-slate-panel border border-slate-border rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Market Tenure</span>
              <Clock size={16} className="text-amber-500" />
            </div>
            <div className="text-4xl font-display font-bold">3.2y</div>
            <div className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Active Since 2021</div>
            <div className="mt-4 h-1 bg-black/20 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Credibility Timeline */}
        <div className="col-span-2 bg-slate-panel border border-slate-border rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-display font-bold">Credibility Timeline</h3>
            <div className="flex gap-2">
              {['6M', '1Y', 'ALL'].map(t => (
                <button key={t} className={cn(
                  "px-3 py-1 text-[10px] font-bold rounded border transition-all",
                  t === 'ALL' ? "bg-primary border-primary text-white" : "border-slate-border text-slate-500 hover:text-slate-300"
                )}>{t}</button>
              ))}
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={credibilityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4b" vertical={false} />
                <XAxis dataKey="date" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1c2632', border: '1px solid #2d3a4b', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="score" stroke="#137fec" strokeWidth={3} dot={{ fill: '#137fec', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Historical Event Registry */}
        <div className="bg-slate-panel border border-slate-border rounded-2xl p-6 flex flex-col">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Historical Event Registry</h3>
          <div className="space-y-4 flex-1">
            {events.map((event) => (
              <div key={event.id} className="p-3 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-mono text-slate-500">{event.id}</span>
                  <span className={cn(
                    "text-[10px] font-bold",
                    event.impact.startsWith('+') ? "text-emerald-500" : "text-red-500"
                  )}>{event.impact} TRUST</span>
                </div>
                <div className="text-xs font-bold group-hover:text-primary transition-colors mb-1">{event.title}</div>
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <div className="flex items-center gap-1 uppercase tracking-widest">
                    <Calendar size={10} /> {event.date}
                  </div>
                  <span className="uppercase tracking-widest">{event.type}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full py-2 text-xs font-bold text-slate-400 hover:text-white border border-slate-border rounded-lg hover:bg-white/5 transition-all">
            VIEW ALL EVENTS
          </button>
        </div>
      </div>
    </div>
  );
};

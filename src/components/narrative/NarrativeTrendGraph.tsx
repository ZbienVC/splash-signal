import React, { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Activity, MousePointer2 } from 'lucide-react';
import { motion } from 'motion/react';

interface NarrativeTrendGraphProps {
  growthRate: number;
  history?: { timestamp: number; mentions: number }[];
}

export const NarrativeTrendGraph: React.FC<NarrativeTrendGraphProps> = ({ growthRate, history }) => {
  const data = useMemo(() => {
    if (history && history.length > 0) {
      return history.map(h => ({
        time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mentions: h.mentions,
        timestamp: h.timestamp
      }));
    }
    
    const points = [];
    const now = Date.now();
    let base = 100;
    for (let i = 24; i >= 0; i--) {
      const time = now - (i * 60 * 60 * 1000);
      const randomWalk = (Math.random() - 0.45) * (base * 0.1); // Slightly biased upwards
      base += randomWalk;
      points.push({
        time: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mentions: Math.max(0, base),
        timestamp: time
      });
    }
    return points;
  }, [growthRate, history]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-panel border border-slate-border p-3 rounded-xl shadow-2xl text-xs space-y-2">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500 uppercase font-bold tracking-widest text-[10px]">Time</span>
            <span className="font-mono">{payload[0].payload.time}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500 uppercase font-bold tracking-widest text-[10px]">Mentions</span>
            <span className="font-mono text-primary">{payload[0].value.toFixed(0)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-panel border border-slate-border rounded-xl p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold">Growth Sparkline</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">24H Mention Velocity</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-500 uppercase">Real-Time Feed</span>
        </div>
      </div>

      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorMentions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4b" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#4b5563" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              interval={4}
            />
            <YAxis 
              stroke="#4b5563" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              orientation="right"
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="mentions" 
              stroke="#10b981" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorMentions)" 
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-emerald-500" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Growth Momentum</span>
        </div>
        <div className="text-xs font-mono font-bold text-emerald-400">
          +{growthRate.toFixed(1)}% (24H)
        </div>
      </div>
    </div>
  );
};

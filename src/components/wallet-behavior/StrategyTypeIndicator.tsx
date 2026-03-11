import React from 'react';
import { Target, TrendingUp, Cpu, User, Code } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StrategyTypeIndicatorProps {
  type: string;
}

export const StrategyTypeIndicator: React.FC<StrategyTypeIndicatorProps> = ({ type }) => {
  const getIcon = () => {
    const t = type.toLowerCase();
    if (t.includes('sniper')) return <Target size={14} />;
    if (t.includes('whale')) return <TrendingUp size={14} />;
    if (t.includes('bot')) return <Cpu size={14} />;
    if (t.includes('retail')) return <User size={14} />;
    if (t.includes('dev')) return <Code size={14} />;
    return <Target size={14} />;
  };

  const getColor = () => {
    const t = type.toLowerCase();
    if (t.includes('sniper')) return "bg-red-500/10 text-red-500 border-red-500/20";
    if (t.includes('whale')) return "bg-primary/10 text-primary border-primary/20";
    if (t.includes('bot')) return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    if (t.includes('retail')) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (t.includes('dev')) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    return "bg-slate-500/10 text-slate-500 border-slate-500/20";
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest",
      getColor()
    )}>
      {getIcon()}
      {type}
    </div>
  );
};

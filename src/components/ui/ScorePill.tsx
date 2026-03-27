import React from 'react';
import { cn } from '../../lib/utils';

export interface ScorePillProps {
  label: string;
  score: number; // 0-100
  type: 'alpha' | 'risk' | 'confidence' | 'wallet';
  showTrend?: 'up' | 'down' | 'flat';
  size?: 'sm' | 'md' | 'lg';
}

const getColors = (type: ScorePillProps['type'], score: number) => {
  switch (type) {
    case 'alpha':
      if (score > 70) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'HIGH', glow: 'animate-glow-alpha' };
      if (score > 40) return { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   label: 'MED',  glow: '' };
      return             { text: 'text-[#8B949E]',   bg: 'bg-[#1C2128]',       border: 'border-[#30363D]',       label: 'LOW',  glow: '' };
    case 'risk':
      if (score > 70) return { text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     label: 'HIGH', glow: 'animate-glow-risk' };
      if (score > 40) return { text: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  label: 'MED',  glow: '' };
      return             { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'LOW',  glow: '' };
    case 'wallet':
      if (score > 75) return { text: 'text-yellow-300',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  label: 'ELITE', glow: '' };
      if (score > 50) return { text: 'text-blue-300',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    label: 'GOOD',  glow: '' };
      return             { text: 'text-[#8B949E]',   bg: 'bg-[#1C2128]',       border: 'border-[#30363D]',       label: 'FAIR',  glow: '' };
    case 'confidence':
    default:
      if (score > 70) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'HIGH', glow: '' };
      if (score > 40) return { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   label: 'MED',  glow: '' };
      return             { text: 'text-[#8B949E]',   bg: 'bg-[#1C2128]',       border: 'border-[#30363D]',       label: 'LOW',  glow: '' };
  }
};

const TREND_ICONS = {
  up:   { icon: '↑', color: 'text-emerald-400' },
  down: { icon: '↓', color: 'text-red-400'     },
  flat: { icon: '→', color: 'text-[#484F58]'   },
};

export const ScorePill: React.FC<ScorePillProps> = ({
  label,
  score,
  type,
  showTrend,
  size = 'md',
}) => {
  const colors = getColors(type, score);
  const trend  = showTrend ? TREND_ICONS[showTrend] : null;

  if (size === 'lg') {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center rounded-xl border p-4 min-w-[110px] shadow-lg',
        colors.bg, colors.border, colors.glow
      )}>
        <div className="text-[9px] font-bold text-[#484F58] uppercase tracking-widest mb-1">{label}</div>
        <div className={cn('text-4xl font-mono font-bold', colors.text)}>
          {score}
        </div>
        <div className={cn('text-[10px] font-bold mt-1 flex items-center gap-0.5', trend ? trend.color : colors.text)}>
          {trend && <span>{trend.icon}</span>}
          {colors.label}
        </div>
      </div>
    );
  }

  if (size === 'sm') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase font-mono',
        colors.bg, colors.border, colors.text, colors.glow
      )}>
        {trend && <span className={trend.color}>{trend.icon}</span>}
        {score}
      </span>
    );
  }

  // md (default)
  return (
    <div className={cn(
      'flex flex-col items-center rounded-xl border px-3 py-2 text-center',
      colors.bg, colors.border, colors.glow
    )}>
      <div className="text-[9px] font-bold text-[#484F58] uppercase tracking-widest mb-0.5">{label}</div>
      <div className={cn('text-2xl font-mono font-bold', colors.text)}>
        {score}
      </div>
      <div className={cn('text-[9px] font-bold mt-0.5 flex items-center gap-0.5', trend ? trend.color : colors.text)}>
        {trend && <span>{trend.icon}</span>}
        {colors.label}
      </div>
    </div>
  );
};

export default ScorePill;

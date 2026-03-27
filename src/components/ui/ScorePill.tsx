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
      if (score > 70) return { text: 'text-emerald-400', bg: 'bg-emerald-900/30', border: 'border-emerald-600/30', label: 'HIGH' };
      if (score > 40) return { text: 'text-amber-400',   bg: 'bg-amber-900/30',   border: 'border-amber-600/30',   label: 'MED'  };
      return             { text: 'text-slate-400',   bg: 'bg-slate-800',       border: 'border-slate-700',       label: 'LOW'  };
    case 'risk':
      if (score > 70) return { text: 'text-red-400',     bg: 'bg-red-900/30',     border: 'border-red-600/30',     label: 'HIGH' };
      if (score > 40) return { text: 'text-orange-400',  bg: 'bg-orange-900/30',  border: 'border-orange-600/30',  label: 'MED'  };
      return             { text: 'text-emerald-400', bg: 'bg-emerald-900/30', border: 'border-emerald-600/30', label: 'LOW'  };
    case 'wallet':
      if (score > 75) return { text: 'text-yellow-300',  bg: 'bg-yellow-900/30',  border: 'border-yellow-600/30',  label: 'ELITE' };
      if (score > 50) return { text: 'text-blue-300',    bg: 'bg-blue-900/30',    border: 'border-blue-600/30',    label: 'GOOD'  };
      return             { text: 'text-slate-400',   bg: 'bg-slate-800',       border: 'border-slate-700',       label: 'FAIR'  };
    case 'confidence':
    default:
      if (score > 70) return { text: 'text-emerald-400', bg: 'bg-emerald-900/30', border: 'border-emerald-600/30', label: 'HIGH' };
      if (score > 40) return { text: 'text-amber-400',   bg: 'bg-amber-900/30',   border: 'border-amber-600/30',   label: 'MED'  };
      return             { text: 'text-slate-400',   bg: 'bg-slate-800',       border: 'border-slate-700',       label: 'LOW'  };
  }
};

const TREND_ICONS = {
  up:   { icon: '↑', color: 'text-emerald-400' },
  down: { icon: '↓', color: 'text-red-400'     },
  flat: { icon: '→', color: 'text-slate-500'   },
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
  const isPulse = type === 'risk' && score > 70;

  if (size === 'lg') {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center rounded-2xl border p-4 min-w-[110px]',
        colors.bg, colors.border
      )}>
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</div>
        <div className={cn('text-4xl font-display font-bold', colors.text, isPulse && 'animate-pulse')}>
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
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase',
        colors.bg, colors.border, colors.text
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
      colors.bg, colors.border
    )}>
      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{label}</div>
      <div className={cn('text-2xl font-display font-bold', colors.text, isPulse && 'animate-pulse')}>
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

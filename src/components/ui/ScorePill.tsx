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
      if (score > 70) return { text: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200',  label: 'HIGH' };
      if (score > 40) return { text: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200',  label: 'MED'  };
      return             { text: 'text-slate-500',  bg: 'bg-slate-100', border: 'border-slate-200', label: 'LOW'  };
    case 'risk':
      if (score > 70) return { text: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',    label: 'HIGH' };
      if (score > 40) return { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', label: 'MED'  };
      return             { text: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200',  label: 'LOW'  };
    case 'wallet':
      if (score > 75) return { text: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200',  label: 'ELITE' };
      if (score > 50) return { text: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',   label: 'GOOD'  };
      return             { text: 'text-slate-500',  bg: 'bg-slate-100', border: 'border-slate-200', label: 'FAIR'  };
    case 'confidence':
    default:
      if (score > 70) return { text: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200',  label: 'HIGH' };
      if (score > 40) return { text: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200',  label: 'MED'  };
      return             { text: 'text-slate-500',  bg: 'bg-slate-100', border: 'border-slate-200', label: 'LOW'  };
  }
};

const TREND_ICONS = {
  up:   { icon: '↑', color: 'text-green-600' },
  down: { icon: '↓', color: 'text-red-600'   },
  flat: { icon: '→', color: 'text-slate-400'  },
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
        'flex flex-col items-center justify-center rounded-xl border p-4 min-w-[110px] shadow-sm',
        colors.bg, colors.border
      )}>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
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
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</div>
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

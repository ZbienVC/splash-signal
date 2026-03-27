import React from 'react';
import { cn } from '../../lib/utils';

export type DistributionState =
  | 'QUIET'
  | 'HEALTHY_ACCUMULATION'
  | 'WATCH_FOR_ROTATION'
  | 'EARLY_DISTRIBUTION'
  | 'ACTIVE_DISTRIBUTION'
  | 'HIGH_DUMP_RISK'
  | 'BROKEN_STRUCTURE';

const STATE_CONFIG: Record<DistributionState, {
  label: string; color: string; bg: string; border: string; emoji: string;
}> = {
  QUIET:               { label: 'Quiet',       color: 'text-gray-400',   bg: 'bg-gray-800',       border: 'border-gray-700',       emoji: '💤' },
  HEALTHY_ACCUMULATION:{ label: 'Accumulating', color: 'text-green-400',  bg: 'bg-green-900/30',   border: 'border-green-600/30',   emoji: '🟢' },
  WATCH_FOR_ROTATION:  { label: 'Watch',        color: 'text-yellow-400', bg: 'bg-yellow-900/30',  border: 'border-yellow-600/30',  emoji: '👀' },
  EARLY_DISTRIBUTION:  { label: 'Early Dist.',  color: 'text-orange-400', bg: 'bg-orange-900/30',  border: 'border-orange-600/30',  emoji: '⚠️' },
  ACTIVE_DISTRIBUTION: { label: 'Distributing', color: 'text-red-400',   bg: 'bg-red-900/30',     border: 'border-red-600/30',     emoji: '🔴' },
  HIGH_DUMP_RISK:      { label: 'Dump Risk',    color: 'text-red-300',   bg: 'bg-red-900/50',     border: 'border-red-500/40',     emoji: '🚨' },
  BROKEN_STRUCTURE:    { label: 'Broken',       color: 'text-red-200',   bg: 'bg-red-950',        border: 'border-red-800',        emoji: '💀' },
};

export interface DistributionStateBadgeProps {
  state: DistributionState;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DistributionStateBadge: React.FC<DistributionStateBadgeProps> = ({
  state,
  size = 'md',
  className,
}) => {
  const cfg = STATE_CONFIG[state];

  if (size === 'lg') {
    return (
      <div className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-xl border',
        cfg.bg, cfg.border, className
      )}>
        <span className="text-xl">{cfg.emoji}</span>
        <div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Distribution State</div>
          <div className={cn('text-sm font-bold', cfg.color)}>{cfg.label}</div>
        </div>
      </div>
    );
  }

  if (size === 'sm') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase',
        cfg.bg, cfg.border, cfg.color, className
      )}>
        {cfg.emoji} {cfg.label}
      </span>
    );
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold',
      cfg.bg, cfg.border, cfg.color, className
    )}>
      {cfg.emoji} {cfg.label}
    </span>
  );
};

export default DistributionStateBadge;

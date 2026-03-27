import React from 'react';
import { cn } from '../../lib/utils';

export interface TrendArrowProps {
  direction: 'up' | 'down' | 'flat' | 'accelerating' | 'decelerating';
  value?: string; // e.g. "+312%" or "-45%"
  size?: 'sm' | 'md';
  className?: string;
}

const DIRECTION_CONFIG = {
  up:           { icon: '↑',  color: 'text-emerald-400', label: '' },
  down:         { icon: '↓',  color: 'text-red-400',     label: '' },
  flat:         { icon: '→',  color: 'text-slate-500',   label: '' },
  accelerating: { icon: '↑↑', color: 'text-emerald-300', label: '' },
  decelerating: { icon: '↓',  color: 'text-orange-400',  label: '' },
};

export const TrendArrow: React.FC<TrendArrowProps> = ({
  direction,
  value,
  size = 'md',
  className,
}) => {
  const cfg = DIRECTION_CONFIG[direction];
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-xs';

  return (
    <span className={cn('inline-flex items-center gap-0.5 font-bold', textSize, cfg.color, className)}>
      <span>{cfg.icon}</span>
      {value && <span>{value}</span>}
    </span>
  );
};

export default TrendArrow;

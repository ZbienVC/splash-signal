import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface LiveIndicatorProps {
  isLive: boolean;
  label?: string;
  lastUpdated?: Date;
  className?: string;
}

export const LiveIndicator: React.FC<LiveIndicatorProps> = ({
  isLive,
  label,
  lastUpdated,
  className,
}) => {
  const [timeAgo, setTimeAgo] = useState<string | null>(null);

  useEffect(() => {
    if (!lastUpdated) { setTimeAgo(null); return; }

    const update = () => {
      const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      if (seconds < 60) setTimeAgo(`${seconds}s ago`);
      else setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
    };

    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  return (
    <span className={cn('flex items-center gap-1', className)}>
      <span
        className={cn(
          'text-[11px] font-medium',
          isLive ? 'text-green-400' : 'text-[#475569]',
        )}
      >
        {isLive ? '●' : '○'} {label ?? (isLive ? 'Live' : 'Demo')}
      </span>
      {timeAgo && (
        <span className="text-[10px] text-[#475569]">· updated {timeAgo}</span>
      )}
    </span>
  );
};

export default LiveIndicator;

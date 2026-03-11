import React from 'react';
import { cn } from '../../lib/utils';
import { ExternalLink, Clock, RefreshCw } from 'lucide-react';

export const FreshnessIndicator: React.FC<{ status: 'LIVE' | 'UPDATING' | 'STALE' }> = ({ status }) => {
  const colors = {
    LIVE: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    UPDATING: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    STALE: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
  };
  
  return (
    <div className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-1 border", colors[status])}>
      <div className={cn("w-1 h-1 rounded-full", 
        status === 'LIVE' ? "animate-pulse bg-emerald-500" : 
        status === 'UPDATING' ? "animate-spin bg-blue-500" : 
        "bg-amber-500"
      )} />
      {status}
    </div>
  );
};

export const ViewSource: React.FC<{ links: { label: string; url: string }[] }> = ({ links }) => (
  <div className="flex gap-2 mt-2">
    {links.map((link, i) => (
      <a 
        key={i} 
        href={link.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-[8px] font-mono text-slate-500 hover:text-primary transition-colors flex items-center gap-1"
      >
        VIEW SOURCE ({link.label}) <ExternalLink size={8} />
      </a>
    ))}
  </div>
);

export const StatusPulse: React.FC<{ status: 'bullish' | 'bearish' | 'warning' | 'neutral' }> = ({ status }) => {
  const colors = {
    bullish: 'bg-emerald-500',
    bearish: 'bg-red-500',
    warning: 'bg-amber-500',
    neutral: 'bg-blue-500'
  };
  
  return (
    <div className={cn("w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.3)]", colors[status])} />
  );
};

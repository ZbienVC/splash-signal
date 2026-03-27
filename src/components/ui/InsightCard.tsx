import React from 'react';
import { cn } from '../../lib/utils';

export type ActionType = 'entry' | 'exit' | 'watch' | 'avoid';

export interface InsightCardProps {
  whatHappening: string;
  whyMatters: string;
  suggestedAction: string;
  actionType: ActionType;
  confidence: number; // 0-100
  className?: string;
}

const ACTION_CONFIG: Record<ActionType, { icon: string; label: string; bg: string; border: string; color: string }> = {
  entry: { icon: '✅', label: 'Consider Entry', bg: 'bg-emerald-900/20', border: 'border-emerald-500/30', color: 'text-emerald-400' },
  exit:  { icon: '🚨', label: 'Consider Exit',  bg: 'bg-red-900/20',     border: 'border-red-500/30',     color: 'text-red-400'     },
  watch: { icon: '👀', label: 'Watch Closely',  bg: 'bg-amber-900/20',   border: 'border-amber-500/30',   color: 'text-amber-400'   },
  avoid: { icon: '❌', label: 'Avoid',           bg: 'bg-red-900/20',     border: 'border-red-500/30',     color: 'text-red-300'     },
};

export const InsightCard: React.FC<InsightCardProps> = ({
  whatHappening,
  whyMatters,
  suggestedAction,
  actionType,
  confidence,
  className,
}) => {
  const action = ACTION_CONFIG[actionType];
  const confColor = confidence >= 75 ? 'text-emerald-400' : confidence >= 50 ? 'text-amber-400' : 'text-slate-400';

  return (
    <div className={cn(
      'rounded-2xl border bg-slate-900/70 overflow-hidden',
      action.border, className
    )}>
      <div className={cn('px-4 py-2 border-b flex items-center gap-2', action.bg, action.border)}>
        <span>{action.icon}</span>
        <span className={cn('text-[10px] font-bold uppercase tracking-widest', action.color)}>
          AI Insight
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* What's happening */}
        <div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 flex items-center gap-1">
            📊 What's happening
          </div>
          <p className="text-xs text-slate-300 font-medium">{whatHappening}</p>
        </div>

        {/* Why it matters */}
        <div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 flex items-center gap-1">
            💡 Why it matters
          </div>
          <p className="text-xs text-slate-400">{whyMatters}</p>
        </div>

        {/* Suggested action */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
          <div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">
              ✅ Suggested action
            </div>
            <p className="text-xs text-slate-300">{suggestedAction}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <div className={cn(
              'px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase',
              action.bg, action.border, action.color
            )}>
              {action.label}
            </div>
            <div className="text-center">
              <div className={cn('text-sm font-bold font-mono', confColor)}>{confidence}%</div>
              <div className="text-[8px] text-slate-600 uppercase tracking-widest">conf.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightCard;

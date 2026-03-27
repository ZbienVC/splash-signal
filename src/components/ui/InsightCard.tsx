import React from 'react';
import { cn } from '../../lib/utils';
import { TrendingUp, AlertCircle, Eye, XCircle, BarChart2, Lightbulb, CheckCircle } from 'lucide-react';

export type ActionType = 'entry' | 'exit' | 'watch' | 'avoid';

export interface InsightCardProps {
  whatHappening: string;
  whyMatters: string;
  suggestedAction: string;
  actionType: ActionType;
  confidence: number; // 0-100
  className?: string;
}

const ACTION_CONFIG: Record<ActionType, {
  icon: React.ReactNode;
  label: string;
  bg: string;
  headerBg: string;
  borderLeft: string;
  border: string;
  color: string;
  barColor: string;
}> = {
  entry: {
    icon: <TrendingUp size={14} />,
    label: 'Consider Entry',
    bg: 'bg-emerald-500/10',
    headerBg: 'bg-emerald-500/10',
    borderLeft: 'border-l-[3px] border-l-emerald-500',
    border: 'border-emerald-500/25',
    color: 'text-emerald-400',
    barColor: 'bg-emerald-500',
  },
  exit: {
    icon: <AlertCircle size={14} />,
    label: 'Consider Exit',
    bg: 'bg-red-500/10',
    headerBg: 'bg-red-500/10',
    borderLeft: 'border-l-[3px] border-l-red-500',
    border: 'border-red-500/25',
    color: 'text-red-400',
    barColor: 'bg-red-500',
  },
  watch: {
    icon: <Eye size={14} />,
    label: 'Watch Closely',
    bg: 'bg-amber-500/10',
    headerBg: 'bg-amber-500/10',
    borderLeft: 'border-l-[3px] border-l-amber-500',
    border: 'border-amber-500/25',
    color: 'text-amber-400',
    barColor: 'bg-amber-400',
  },
  avoid: {
    icon: <XCircle size={14} />,
    label: 'Avoid',
    bg: 'bg-red-500/10',
    headerBg: 'bg-red-600/10',
    borderLeft: 'border-l-[3px] border-l-red-600',
    border: 'border-red-600/25',
    color: 'text-red-300',
    barColor: 'bg-red-600',
  },
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
  const confColor = confidence >= 75 ? 'text-emerald-400' : confidence >= 50 ? 'text-amber-400' : 'text-[#8B949E]';

  return (
    <div className={cn(
      'rounded-xl border bg-[#0D1117]/90 backdrop-blur-sm overflow-hidden',
      action.border,
      action.borderLeft,
      className
    )}>
      {/* Header */}
      <div className={cn('px-4 py-2.5 border-b border-[#21262D] flex items-center gap-2', action.headerBg)}>
        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center', action.bg, action.color)}>
          {action.icon}
        </div>
        <span className={cn('text-[10px] font-semibold uppercase tracking-[0.12em]', action.color)}>
          AI Insight
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* What's happening */}
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#484F58] uppercase tracking-[0.12em] mb-1">
            <BarChart2 size={10} />
            What's happening
          </div>
          <p className="text-xs text-[#E6EDF3] font-medium leading-relaxed">{whatHappening}</p>
        </div>

        {/* Why it matters */}
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#484F58] uppercase tracking-[0.12em] mb-1">
            <Lightbulb size={10} />
            Why it matters
          </div>
          <p className="text-xs text-[#8B949E] leading-relaxed">{whyMatters}</p>
        </div>

        {/* Suggested action + confidence */}
        <div className="flex items-center justify-between pt-2 border-t border-[#21262D]">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#484F58] uppercase tracking-[0.12em] mb-1">
              <CheckCircle size={10} />
              Suggested action
            </div>
            <p className="text-xs text-[#E6EDF3]">{suggestedAction}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <div className={cn(
              'px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wide',
              action.bg, action.border, action.color
            )}>
              {action.label}
            </div>
            <div className="text-center">
              <div className={cn('text-sm font-bold font-mono', confColor)}>{confidence}%</div>
              <div className="text-[8px] text-[#484F58] uppercase tracking-widest">conf.</div>
            </div>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="h-1 bg-[#1C2128] rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', action.barColor)}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default InsightCard;

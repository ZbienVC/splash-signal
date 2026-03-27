import React from 'react';
import { cn } from '../../lib/utils';

export type WalletClassification =
  | 'SMART_MONEY'
  | 'WHALE'
  | 'SNIPER'
  | 'DEV'
  | 'BOT'
  | 'BUNDLE_PARTICIPANT'
  | 'RETAIL';

const WALLET_COLORS: Record<WalletClassification, {
  label: string; color: string; bg: string; border: string; emoji: string;
}> = {
  SMART_MONEY:       { label: 'Smart $',  color: 'text-yellow-300', bg: 'bg-yellow-900/40', border: 'border-yellow-600/40', emoji: '🧠' },
  WHALE:             { label: 'Whale',    color: 'text-blue-300',   bg: 'bg-blue-900/40',   border: 'border-blue-600/40',   emoji: '🐋' },
  SNIPER:            { label: 'Sniper',   color: 'text-orange-300', bg: 'bg-orange-900/40', border: 'border-orange-600/40', emoji: '🎯' },
  DEV:               { label: 'Dev',      color: 'text-purple-300', bg: 'bg-purple-900/40', border: 'border-purple-600/40', emoji: '⚙️' },
  BOT:               { label: 'Bot',      color: 'text-gray-400',   bg: 'bg-gray-800',      border: 'border-gray-600/40',   emoji: '🤖' },
  BUNDLE_PARTICIPANT:{ label: 'Bundle',   color: 'text-red-300',    bg: 'bg-red-900/40',    border: 'border-red-600/40',    emoji: '📦' },
  RETAIL:            { label: 'Retail',   color: 'text-gray-400',   bg: 'bg-gray-800',      border: 'border-gray-600/40',   emoji: '👤' },
};

export interface WalletBadgeProps {
  classification: WalletClassification;
  showEmoji?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const WalletBadge: React.FC<WalletBadgeProps> = ({
  classification,
  showEmoji = true,
  size = 'md',
  className,
}) => {
  const cfg = WALLET_COLORS[classification];

  const sizeClass = size === 'sm'
    ? 'px-1.5 py-0.5 text-[9px]'
    : 'px-2 py-0.5 text-[10px]';

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded border font-bold uppercase tracking-wide',
      cfg.bg, cfg.border, cfg.color, sizeClass, className
    )}>
      {showEmoji && <span>{cfg.emoji}</span>}
      {cfg.label}
    </span>
  );
};

export default WalletBadge;

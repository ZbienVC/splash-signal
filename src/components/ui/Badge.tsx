import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  variant?: 'alpha' | 'risk' | 'neutral' | 'success' | 'warning' | 'entry' | 'exit' | 'watch';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  glow = false,
  className,
  children
}) => {
  const baseStyles = 'inline-flex items-center gap-1 rounded-full font-medium px-2.5 py-0.5 text-xs';

  const variantStyles = {
    alpha:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    entry:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    risk:    'bg-red-500/10 text-red-400 border border-red-500/30',
    exit:    'bg-red-500/10 text-red-400 border border-red-500/30',
    watch:   'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    neutral: 'bg-[#1C2128] text-[#8B949E] border border-[#30363D]',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  const glowStyle = glow
    ? variant === 'risk' || variant === 'exit'
      ? 'animate-glow-risk'
      : 'animate-glow-alpha'
    : '';

  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        glowStyle,
        className
      )}
    >
      {children}
    </span>
  );
};

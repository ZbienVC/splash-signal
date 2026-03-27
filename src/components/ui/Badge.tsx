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
  className,
  children
}) => {
  const baseStyles = 'inline-flex items-center gap-1 rounded-full font-medium px-2.5 py-0.5 text-xs';

  const variantStyles = {
    alpha:   'bg-green-50 text-green-700 border border-green-200',
    entry:   'bg-green-50 text-green-700 border border-green-200',
    risk:    'bg-red-50 text-red-700 border border-red-200',
    exit:    'bg-red-50 text-red-700 border border-red-200',
    watch:   'bg-amber-50 text-amber-700 border border-amber-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    success: 'bg-green-50 text-green-700 border border-green-200',
    neutral: 'bg-slate-100 text-slate-500 border border-slate-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
};

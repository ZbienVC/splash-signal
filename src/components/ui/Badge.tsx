import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  variant?: 'alpha' | 'risk' | 'neutral' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  className,
  children
}) => {
  const baseStyles = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  const variantStyles = {
    alpha: 'badge-alpha',
    risk: 'badge-risk',
    neutral: 'badge-neutral',
    success: 'bg-success-900/30 text-success-400 border border-success-600/30',
    warning: 'bg-warning-900/30 text-warning-400 border border-warning-600/30'
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-2xs',
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
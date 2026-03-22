import React from 'react';
import { cn } from '../../lib/utils';
import { Search, X } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'search';
  state?: 'default' | 'error' | 'success';
  onClear?: () => void;
  showClearButton?: boolean;
}

export const Input: React.FC<InputProps> = ({
  variant = 'default',
  state = 'default',
  className,
  onClear,
  showClearButton = false,
  value,
  ...props
}) => {
  const baseStyles = [
    'w-full h-10 px-3 rounded-lg',
    'bg-slate-800 border text-slate-200 placeholder-slate-500',
    'transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-primary/50',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ];

  const stateStyles = {
    default: 'border-slate-600 focus:border-primary/50',
    error: 'border-risk-500 focus:border-risk-500/50',
    success: 'border-alpha-500 focus:border-alpha-500/50'
  };

  const variantStyles = {
    default: '',
    search: 'pl-10'
  };

  if (variant === 'search') {
    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          className={cn(
            baseStyles,
            stateStyles[state],
            variantStyles[variant],
            showClearButton && value && 'pr-10',
            className
          )}
          value={value}
          {...props}
        />
        {showClearButton && value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <input
      className={cn(
        baseStyles,
        stateStyles[state],
        variantStyles[variant],
        className
      )}
      value={value}
      {...props}
    />
  );
};
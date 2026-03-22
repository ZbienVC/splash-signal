import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  iconOnly?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconOnly = false,
  className,
  disabled,
  children,
  ...props
}) => {
  const baseStyles = [
    'inline-flex items-center justify-center gap-2',
    'rounded-lg font-medium transition-all',
    'focus-ring',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ];

  const variantStyles = {
    primary: [
      'bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20',
      'hover:bg-primary/90 transition-all',
      'active:scale-95'
    ],
    secondary: [
      'bg-white/5 text-white border border-white/10 rounded-xl font-bold',
      'hover:bg-white/10 transition-all',
      'active:scale-95'
    ],
    ghost: [
      'text-slate-300 rounded-lg',
      'hover:bg-white/5 hover:text-slate-200 transition-colors',
      'active:bg-slate-700 active:scale-95'
    ],
    destructive: [
      'bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/20',
      'hover:bg-red-700 transition-all',
      'active:scale-95'
    ],
    success: [
      'bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20',
      'hover:bg-emerald-700 transition-all',
      'active:scale-95'
    ]
  };

  const sizeStyles = {
    sm: iconOnly ? 'h-8 w-8 p-0' : 'h-8 px-3 text-xs',
    md: iconOnly ? 'h-10 w-10 p-0' : 'h-10 px-4 text-sm',
    lg: iconOnly ? 'h-12 w-12 p-0' : 'h-12 px-6 text-base'
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        loading && 'relative pointer-events-none',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <span className={cn(loading && 'opacity-0')}>
        {children}
      </span>
    </motion.button>
  );
};
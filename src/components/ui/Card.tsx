import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface CardProps {
  variant?: 'default' | 'interactive' | 'elevated' | 'signal-entry' | 'signal-risk';
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  className,
  children,
  onClick,
  ...props
}) => {
  const baseStyles = 'bg-white border border-slate-200 rounded-xl shadow-sm transition-all';

  const variantStyles = {
    default: 'hover:border-slate-300 hover:shadow-md',
    interactive: 'cursor-pointer hover:border-blue-200 hover:shadow-md group',
    elevated: 'shadow-md',
    'signal-entry': 'border-green-200 bg-green-50/30 hover:border-green-300',
    'signal-risk': 'border-red-200 bg-red-50/30 hover:border-red-300',
  };

  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const Component = onClick ? motion.div : 'div';

  return (
    <Component
      className={cn(
        baseStyles,
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
      onClick={onClick}
      {...(onClick && {
        whileHover: { y: -1 },
        whileTap: { scale: 0.98 },
        transition: { duration: 0.15 }
      })}
      {...props}
    >
      {children}
    </Component>
  );
};

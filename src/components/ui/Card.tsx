import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface CardProps {
  variant?: 'default' | 'interactive' | 'elevated';
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
  // Use exact production patterns from MarketOverview/Settings  
  const baseStyles = 'bg-slate-900 border border-slate-700 rounded-2xl';
  
  const variantStyles = {
    default: '',
    interactive: 'cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group',
    elevated: 'shadow-lg'
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
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 },
        transition: { duration: 0.15 }
      })}
      {...props}
    >
      {children}
    </Component>
  );
};
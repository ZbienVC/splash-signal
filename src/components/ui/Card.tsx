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
  const baseStyles = 'bg-[#0D1117] border border-[#21262D] rounded-xl transition-all';

  const variantStyles = {
    default: 'hover:border-[#30363D] hover:shadow-lg hover:shadow-black/40',
    interactive: 'cursor-pointer hover:border-[#30363D] hover:shadow-lg hover:shadow-black/40 hover:shadow-[0_0_20px_rgba(0,210,255,0.06)] group',
    elevated: 'shadow-lg shadow-black/40',
    'signal-entry': 'border-emerald-500/30 hover:border-emerald-500/50 animate-glow-alpha',
    'signal-risk': 'border-red-500/30 hover:border-red-500/50 animate-glow-risk',
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

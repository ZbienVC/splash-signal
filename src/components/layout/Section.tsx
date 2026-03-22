import React from 'react';
import { cn } from '../../lib/utils';

interface SectionProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'card' | 'bordered';
  spacing?: 'tight' | 'default' | 'loose';
}

export const Section: React.FC<SectionProps> = ({
  title,
  description,
  actions,
  icon,
  children,
  className,
  variant = 'default',
  spacing = 'default'
}) => {
  const spacingStyles = {
    tight: 'section-spacing-tight',
    default: 'section-spacing',
    loose: 'section-spacing-loose'
  };

  const variantStyles = {
    default: spacingStyles[spacing],
    card: cn('bg-slate-900 border border-slate-700 rounded-2xl p-6', spacingStyles[spacing]),
    bordered: cn('border border-slate-700 rounded-lg p-6', spacingStyles[spacing])
  };

  return (
    <section className={cn(variantStyles[variant], className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-1">
            {title && (
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                {icon && <div className="text-primary">{icon}</div>}
                {title}
              </h3>
            )}
            {description && (
              <p className="text-slate-500 text-sm">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  );
};
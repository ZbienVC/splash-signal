import React from 'react';
import { cn } from '../../lib/utils';

interface PageShellProps {
  title?: string;
  subtitle?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  containerSize?: 'default' | 'wide' | 'narrow';
}

export const PageShell: React.FC<PageShellProps> = ({
  title,
  subtitle,
  description,
  actions,
  children,
  className,
  containerSize = 'default'
}) => {
  const containerClasses = {
    default: 'container-app',
    wide: 'container-wide', 
    narrow: 'container-narrow'
  };

  return (
    <div className={cn('min-h-full', className)}>
      {(title || actions) && (
        <div className={cn('pb-8', containerClasses[containerSize])}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {title && (
                <h1 className="text-decision">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-insight mt-2">
                  {subtitle}
                </p>
              )}
              {description && (
                <p className="text-supporting mt-2 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className={containerClasses[containerSize]}>
        {children}
      </div>
    </div>
  );
};
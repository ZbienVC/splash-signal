import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { ExternalLink, Info } from 'lucide-react';

interface AppLinkProps {
  href?: string;
  to?: string;
  label: ReactNode;
  sourceType?: 'news' | 'dexscreener' | 'solscan' | 'pumpfun' | 'gdelt' | 'wiki' | 'trends' | 'other';
  disabledReason?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const AppLink: React.FC<AppLinkProps> = ({
  href,
  to,
  label,
  sourceType,
  disabledReason,
  className,
  onClick
}) => {
  const isExternal = !!href;
  const isInternal = !!to;
  const isDisabled = !href && !to;

  const baseStyles = "inline-flex items-center gap-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-0.5";
  const activeStyles = "text-primary hover:text-primary/80 hover:underline cursor-pointer";
  const disabledStyles = "text-slate-500 cursor-not-allowed opacity-70 group relative";

  const renderIcon = () => {
    if (isExternal) return <ExternalLink size={10} className="shrink-0" />;
    return null;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
    // If it's an internal link handled by a routing system, we might need to use a navigate function.
    // Assuming for now it might be handled by a global state change if 'to' is provided.
  };

  if (isDisabled) {
    return (
      <span 
        className={cn(baseStyles, disabledStyles, className)}
        title={disabledReason || "Source not available"}
      >
        {label}
        <Info size={10} className="shrink-0 opacity-50" />
      </span>
    );
  }

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(baseStyles, activeStyles, className)}
        onClick={handleClick}
        aria-label={typeof label === 'string' ? `${label} (opens in new tab)` : undefined}
      >
        {label}
        {renderIcon()}
      </a>
    );
  }

  // For internal links, if we are using a custom routing system (like the one in App.tsx)
  // we might need to trigger a state change.
  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(baseStyles, activeStyles, className, "bg-transparent border-none p-0 text-left")}
      role="link"
    >
      {label}
    </button>
  );
};

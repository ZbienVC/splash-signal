import React from 'react';
import { Search } from 'lucide-react';
import { ViewId } from '../types';
import { cn } from '../lib/utils';

interface HeaderProps {
  activeView: ViewId;
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeView, onSearch }) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const getBreadcrumbs = (): [string, string] => {
    const mapping: Record<string, [string, string]> = {
      'home':                    ['Overview', 'Home'],
      'market-overview':         ['Macro Terminal', 'Global State'],
      'attention-feed':          ['Macro Terminal', 'Attention Feed'],
      'narrative-monitor':       ['Macro Terminal', 'Narrative Intensity'],
      'investigation-gateway':   ['Institutional', 'Investigation'],
      'archive':                 ['Institutional', 'Analyst Archive'],
      'token-analysis':          ['Institutional', 'Reports'],
      'solana-intel':            ['Institutional', 'Solana Intel'],
      'hunter-feed':             ['Institutional', 'Hunter Scanner'],
      'smart-money':             ['Institutional', 'Smart Money'],
      'wallet-behavior':         ['Institutional', 'Wallet Behavior'],
      'liquidity-intel':         ['Institutional', 'Liquidity Intel'],
      'alpha-hunter':            ['Alpha Suite', 'Alpha Hunter'],
      'dump-detector':           ['Alpha Suite', 'Dump Detector'],
      'signal-feed':             ['Alpha Suite', 'Signal Feed'],
      'wallet-ranking':          ['Alpha Suite', 'Wallet Rankings'],
      'settings':                ['System', 'Settings'],
    };
    return mapping[activeView] ?? ['Overview', activeView];
  };

  const [section, page] = getBreadcrumbs();

  return (
    <header className="h-[52px] bg-white/90 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-slate-400 min-w-0">
        <span>{section}</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600">{page}</span>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search token or address..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={cn(
            'w-64 h-8 pl-9 pr-16 rounded-lg text-sm',
            'bg-slate-100 border border-slate-200',
            'text-slate-900 placeholder:text-slate-400',
            'focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors'
          )}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">⌘K</span>
      </form>

      {/* Right */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-live" />
          <span className="text-xs text-slate-500">Live</span>
        </div>
      </div>
    </header>
  );
};

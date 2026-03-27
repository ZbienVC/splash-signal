import React from 'react';
import { Search, Bell, ChevronRight, User } from 'lucide-react';
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
      'investigation-gateway':   ['Institutional Tools', 'Investigation'],
      'archive':                 ['Institutional Tools', 'Analyst Archive'],
      'token-analysis':          ['Institutional Tools', 'Reports'],
      'solana-intel':            ['Institutional Tools', 'Solana Intel'],
      'hunter-feed':             ['Institutional Tools', 'Hunter Scanner'],
      'smart-money':             ['Institutional Tools', 'Smart Money'],
      'wallet-behavior':         ['Institutional Tools', 'Wallet Behavior'],
      'liquidity-intel':         ['Institutional Tools', 'Liquidity Intel'],
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
    <header className="relative h-14 bg-[#080B11]/80 backdrop-blur-md border-b border-[#21262D] flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-mono min-w-0 flex-1">
        <span className="text-[#484F58]">{section}</span>
        <ChevronRight size={11} className="text-[#30363D] shrink-0" />
        <span className="text-[#8B949E] font-medium truncate">{page}</span>
      </div>

      {/* Search + Actions */}
      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="relative">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#484F58]" />
          <input
            type="text"
            placeholder="Search assets, entities…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={cn(
              'w-64 h-9 pl-9 pr-4 rounded-full text-xs',
              'bg-[#161B22] border border-[#30363D]',
              'text-[#E6EDF3] placeholder:text-[#484F58]',
              'focus:outline-none focus:border-[#00D2FF]/50 transition-colors'
            )}
          />
        </form>

        <div className="flex items-center gap-3 border-l border-[#21262D] pl-4">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">LIVE</span>
          </div>

          {/* Bell */}
          <button className="relative p-1.5 rounded-lg text-[#484F58] hover:text-[#E6EDF3] hover:bg-[#161B22] transition-colors">
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-[#080B11]" />
          </button>

          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-[#161B22] border border-[#30363D] flex items-center justify-center cursor-pointer hover:border-[#00D2FF]/50 transition-colors">
            <User size={13} className="text-[#8B949E]" />
          </div>
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00D2FF]/20 to-transparent" />
    </header>
  );
};

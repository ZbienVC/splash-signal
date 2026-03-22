import React from 'react';
import { Search, Bell, Shield, ChevronRight } from 'lucide-react';
import { ViewId } from '../types';
import { FreshnessIndicator } from './common/SignalUI';
import { Input } from './ui';
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

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const getBreadcrumbs = () => {
    const mapping: Record<string, string> = {
      'home': 'Overview / Home',
      'market-overview': 'Macro Terminal / Global State',
      'attention-feed': 'Macro Terminal / Attention Feed',
      'narrative-monitor': 'Macro Terminal / Narrative Intensity',
      'investigation-gateway': 'Institutional Tools / Investigation',
      'archive': 'Institutional Tools / Analyst Archive',
      'token-analysis': 'Institutional Tools / Reports',
      'solana-intel': 'Institutional Tools / Solana Intel',
      'hunter-feed': 'Institutional Tools / Hunter Scanner',
      'smart-money': 'Institutional Tools / Smart Money',
      'wallet-behavior': 'Institutional Tools / Wallet Behavior',
      'liquidity-intel': 'Institutional Tools / Liquidity Intel',
      'settings': 'System / Settings'
    };
    return mapping[activeView] || activeView;
  };

  return (
    <header className="h-14 border-b border-slate-700 bg-slate-975/95 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <img 
              src="https://i.imgur.com/DJKVOsz.png" 
              alt="Logo" 
              className="w-6 h-6 rounded-md object-cover border border-primary/30"
              referrerPolicy="no-referrer"
            />
            <span className="text-primary font-bold">SplashSignal</span>
          </div>
          <ChevronRight size={12} className="text-slate-600" />
          <span className="text-slate-300 uppercase tracking-wider font-medium truncate">
            {getBreadcrumbs()}
          </span>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-6">
        <form onSubmit={handleSearch} className="relative">
          <Input
            variant="search"
            placeholder="Search assets, entities, or events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={handleClearSearch}
            showClearButton={!!searchQuery}
            className="w-72 h-9 text-xs bg-slate-900/50 border-slate-600"
          />
        </form>

        <div className="flex items-center gap-4 border-l border-slate-700 pl-6">
          <FreshnessIndicator status="LIVE" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400">LATENCY: 12ms</span>
          </div>
          <button className={cn(
            "text-slate-400 hover:text-slate-200 transition-colors relative p-1 rounded-md",
            "hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
          )}>
            <Bell size={18} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-risk-500 rounded-full border border-slate-975"></span>
          </button>
          <button className={cn(
            "text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-md",
            "hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
          )}>
            <Shield size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

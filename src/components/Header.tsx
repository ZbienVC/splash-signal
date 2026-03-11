import React from 'react';
import { Search, Bell, Shield, Terminal, ChevronRight } from 'lucide-react';
import { ViewId } from '../types';
import { FreshnessIndicator } from './common/SignalUI';

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

  const getBreadcrumbs = () => {
    const mapping: Record<string, string> = {
      'home': 'Overview / Home',
      'market-overview': 'Macro Terminal / Global State',
      'attention-feed': 'Macro Terminal / Attention Feed',
      'narrative-monitor': 'Macro Terminal / Narrative Intensity',
      'investigation-gateway': 'Institutional Tools / Investigation',
      'archive': 'Institutional Tools / Analyst Archive',
      'token-analysis': 'Institutional Tools / Reports',
      'settings': 'System / Settings'
    };
    return mapping[activeView] || activeView;
  };

  return (
    <header className="h-14 border-b border-slate-border bg-background-dark/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <img 
              src="https://i.imgur.com/DJKVOsz.png" 
              alt="Logo" 
              className="w-6 h-6 rounded-md object-cover border border-primary/30"
              referrerPolicy="no-referrer"
            />
            <span className="text-sky-400 font-bold">SplashSignal</span>
          </div>
          <ChevronRight size={12} />
          <span className="text-sky-200 uppercase tracking-wider">{getBreadcrumbs()}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input 
            type="text" 
            placeholder="Search assets, entities, or events..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-black/20 border border-white/5 rounded-lg py-1.5 pl-9 pr-4 text-[11px] w-72 focus:outline-none focus:border-primary/50 focus:bg-black/40 transition-all placeholder:text-slate-600"
          />
        </form>

        <div className="flex items-center gap-4 border-l border-slate-border pl-6">
          <FreshnessIndicator status="LIVE" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400">LATENCY: 12ms</span>
          </div>
          <button className="text-slate-400 hover:text-white transition-colors relative">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-background-dark"></span>
          </button>
          <button className="text-slate-400 hover:text-white transition-colors">
            <Shield size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

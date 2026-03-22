import React from 'react';
import { 
  Home,
  Globe, 
  Bell, 
  Search, 
  History, 
  FileText, 
  LayoutDashboard, 
  MessageSquare,
  ShieldAlert,
  Settings,
  ChevronRight,
  Zap,
  Wallet,
  Droplets,
  Trophy,
  Radar
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ViewId } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const { user, logout } = useAuth();
  const categories = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'home', label: 'Home', icon: Home },
      ]
    },
    {
      title: 'MACRO TERMINAL',
      items: [
        { id: 'market-overview', label: 'Global State', icon: Globe },
        { id: 'attention-feed', label: 'Attention Feed', icon: Bell },
        { id: 'narrative-monitor', label: 'Narrative Intensity', icon: MessageSquare },
      ]
    },
    {
      title: 'INSTITUTIONAL TOOLS',
      items: [
        { id: 'investigation-gateway', label: 'Investigation', icon: Search },
        { id: 'archive', label: 'Analyst Archive', icon: History },
        { id: 'token-analysis', label: 'Reports', icon: FileText },
        { id: 'solana-intel', label: 'Solana Intel', icon: Zap },
        { id: 'hunter-feed', label: 'Hunter Scanner', icon: Radar },
        { id: 'smart-money', label: 'Smart Money', icon: Trophy },
        { id: 'wallet-behavior', label: 'Wallet Behavior', icon: Wallet },
        { id: 'liquidity-intel', label: 'Liquidity Intel', icon: Droplets },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  return (
    <div className="w-64 h-screen bg-slate-925 border-r border-slate-700 flex flex-col shrink-0">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <img 
            src="https://i.imgur.com/DJKVOsz.png" 
            alt="SplashSignal Logo" 
            className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-primary/20 border border-primary/30"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <span className="font-display font-bold text-xl tracking-tight leading-none text-slate-100">SplashSignal</span>
            <div className="mt-1 text-[10px] text-primary font-mono tracking-widest uppercase">Intelligence I.O.</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {categories.map((cat, idx) => (
          <div key={idx} className="mb-6">
            <div className="px-6 mb-2 text-[10px] font-bold text-slate-500 tracking-widest uppercase">
              {cat.title}
            </div>
            {cat.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id as ViewId)}
                className={cn(
                  "w-full px-6 py-2.5 flex items-center gap-3 transition-colors text-sm font-medium",
                  "focus-ring-inset",
                  activeView === item.id 
                    ? "bg-primary/10 text-primary border-r-2 border-primary" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                )}
              >
                <item.icon size={18} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-600 overflow-hidden border border-primary/30 flex items-center justify-center">
            <ShieldAlert size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold truncate uppercase text-slate-200">PUBLIC_ACCESS</div>
            <div className="text-[10px] text-primary font-mono">SECURE_TERMINAL</div>
          </div>
        </div>
      </div>
    </div>
  );
};

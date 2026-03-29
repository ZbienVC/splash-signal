import React from 'react';
import {
  Home,
  Globe,
  Bell,
  BellRing,
  Search,
  History,
  FileText,
  MessageSquare,
  Settings,
  Zap,
  Wallet,
  Droplets,
  Trophy,
  Radar,
  Flame,
  AlertTriangle,
  Radio,
  Waves,
  LogOut
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
      title: 'Overview',
      items: [
        { id: 'home', label: 'Home', icon: Home },
      ]
    },
    {
      title: 'Macro Terminal',
      items: [
        { id: 'market-overview',   label: 'Global State',        icon: Globe },
        { id: 'attention-feed',    label: 'Attention Feed',      icon: Bell },
        { id: 'narrative-monitor', label: 'Narrative Intensity', icon: MessageSquare },
      ]
    },
    {
      title: 'Alpha Suite',
      items: [
        { id: 'alpha-hunter',   label: 'Alpha Hunter',    icon: Flame },
        { id: 'dump-detector',  label: 'Dump Detector',   icon: AlertTriangle },
        { id: 'signal-feed',    label: 'Signal Feed',     icon: Radio },
        { id: 'wallet-ranking', label: 'Wallet Rankings', icon: Trophy },
      ]
    },
    {
      title: 'Institutional',
      items: [
        { id: 'investigation-gateway', label: 'Investigation',   icon: Search },
        { id: 'archive',               label: 'Analyst Archive', icon: History },
        { id: 'token-analysis',        label: 'Reports',         icon: FileText },
        { id: 'solana-intel',          label: 'Solana Intel',    icon: Zap },
        { id: 'hunter-feed',           label: 'Hunter Scanner',  icon: Radar },
        { id: 'smart-money',           label: 'Smart Money',     icon: Trophy },
        { id: 'wallet-behavior',       label: 'Wallet Behavior', icon: Wallet },
        { id: 'liquidity-intel',       label: 'Liquidity Intel', icon: Droplets },
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'alerts',   label: 'Alerts',   icon: BellRing },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <aside className="w-56 h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Waves className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm">Splash</span>
            <span className="font-bold text-blue-600 text-sm">Signal</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-hide">
        {categories.map((cat) => (
          <div key={cat.title} className="mb-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 mb-1">
              {cat.title}
            </p>
            {cat.items.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id as ViewId)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all focus:outline-none',
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <item.icon
                    className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-600' : 'text-slate-400')}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-blue-700 text-xs font-bold">{initials}</span>
            </div>
            <span className="text-xs text-slate-600 truncate max-w-[80px]">{displayName}</span>
          </div>
          <button
            onClick={() => logout()}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 px-0.5">v2.1</p>
      </div>
    </aside>
  );
};

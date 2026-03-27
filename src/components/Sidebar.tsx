import React from 'react';
import {
  Home,
  Globe,
  Bell,
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

interface SidebarProps {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
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
        { id: 'market-overview',   label: 'Global State',       icon: Globe },
        { id: 'attention-feed',    label: 'Attention Feed',     icon: Bell },
        { id: 'narrative-monitor', label: 'Narrative Intensity',icon: MessageSquare },
      ]
    },
    {
      title: 'Alpha Suite',
      items: [
        { id: 'alpha-hunter',   label: 'Alpha Hunter',   icon: Flame },
        { id: 'dump-detector',  label: 'Dump Detector',  icon: AlertTriangle },
        { id: 'signal-feed',    label: 'Signal Feed',    icon: Radio },
        { id: 'wallet-ranking', label: 'Wallet Rankings',icon: Trophy },
      ]
    },
    {
      title: 'Institutional',
      items: [
        { id: 'investigation-gateway', label: 'Investigation',  icon: Search },
        { id: 'archive',               label: 'Analyst Archive',icon: History },
        { id: 'token-analysis',        label: 'Reports',        icon: FileText },
        { id: 'solana-intel',          label: 'Solana Intel',   icon: Zap },
        { id: 'hunter-feed',           label: 'Hunter Scanner', icon: Radar },
        { id: 'smart-money',           label: 'Smart Money',    icon: Trophy },
        { id: 'wallet-behavior',       label: 'Wallet Behavior',icon: Wallet },
        { id: 'liquidity-intel',       label: 'Liquidity Intel',icon: Droplets },
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  return (
    <div className="w-[220px] h-screen bg-white border-r border-slate-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-2.5">
          <Waves size={18} className="text-blue-600 shrink-0" />
          <span>
            <span className="font-semibold text-sm text-slate-900">Splash</span>
            <span className="text-sm text-slate-400">Signal</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        {categories.map((cat, idx) => (
          <div key={idx} className="mb-4">
            <div className="px-3 mb-1 text-[10px] font-medium text-slate-400 uppercase tracking-widest">
              {cat.title}
            </div>
            {cat.items.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id as ViewId)}
                  className={cn(
                    'w-full px-3 py-1.5 flex items-center gap-2.5 text-sm rounded-md transition-colors focus:outline-none',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <item.icon
                    size={14}
                    className={isActive ? 'text-blue-600' : 'text-slate-400'}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600 font-medium">
            Z
          </div>
          <span className="text-xs text-slate-600">v2.1</span>
        </div>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <LogOut size={13} />
        </button>
      </div>
    </div>
  );
};

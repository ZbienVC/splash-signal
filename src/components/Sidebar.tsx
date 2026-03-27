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
    <div className="w-[220px] h-screen bg-[#0A0E17] border-r border-[#1E2A3A] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-2.5">
          <Waves size={18} className="text-blue-500 shrink-0" />
          <span>
            <span className="font-semibold text-sm text-[#F1F5F9]">Splash</span>
            <span className="text-sm text-[#475569]">Signal</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        {categories.map((cat, idx) => (
          <div key={idx} className="mb-4">
            <div className="px-3 mb-1 text-[11px] font-medium text-[#475569] uppercase tracking-[0.08em]">
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
                      ? 'text-[#F1F5F9] bg-[#1A2234]'
                      : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1A2234]'
                  )}
                >
                  <item.icon
                    size={14}
                    className={isActive ? 'text-[#F1F5F9]' : 'text-[#94A3B8]'}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#1E2A3A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#1A2234] flex items-center justify-center text-xs text-[#94A3B8] font-medium">
            Z
          </div>
          <span className="text-xs text-[#475569]">v2.1</span>
        </div>
        <button className="text-[#475569] hover:text-[#94A3B8] transition-colors">
          <LogOut size={13} />
        </button>
      </div>
    </div>
  );
};

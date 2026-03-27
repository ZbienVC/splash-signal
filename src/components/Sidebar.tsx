import React from 'react';
import { 
  Home,
  Globe, 
  Bell, 
  Search, 
  History, 
  FileText, 
  MessageSquare,
  ShieldAlert,
  Settings,
  Zap,
  Wallet,
  Droplets,
  Trophy,
  Radar,
  Flame,
  AlertTriangle,
  Radio,
  Waves
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ViewId } from '../types';
import { motion } from 'motion/react';

interface SidebarProps {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
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
      title: 'ALPHA SUITE',
      items: [
        { id: 'alpha-hunter',  label: 'Alpha Hunter',     icon: Flame },
        { id: 'dump-detector', label: 'Dump Detector',    icon: AlertTriangle },
        { id: 'signal-feed',   label: 'Signal Feed',      icon: Radio },
        { id: 'wallet-ranking',label: 'Wallet Rankings',  icon: Trophy },
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
    <div className="w-60 h-screen bg-[#080B11] border-r border-[#21262D] flex flex-col shrink-0">
      {/* Logo area */}
      <div className="px-5 py-5 border-b border-[#21262D]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00D2FF]/10 border border-[#00D2FF]/30 flex items-center justify-center">
            <Waves size={18} className="text-[#00D2FF]" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight leading-none text-[#E6EDF3]">SPLASH SIGNAL</span>
            <div className="mt-1 text-[10px] text-[#00D2FF] font-mono tracking-widest uppercase">Intelligence I.O.</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {categories.map((cat, idx) => (
          <div key={idx} className="mb-5">
            <div className="px-5 mb-2 text-[10px] font-semibold text-[#484F58] tracking-[0.12em] uppercase">
              {cat.title}
            </div>
            {cat.items.map((item) => {
              const isActive = activeView === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => onViewChange(item.id as ViewId)}
                  whileHover={{ x: isActive ? 0 : 2 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "w-full px-5 py-2.5 flex items-center gap-3 text-sm transition-colors focus:outline-none",
                    isActive
                      ? "border-l-2 border-[#00D2FF] bg-[#161B22] text-[#E6EDF3] font-medium"
                      : "border-l-2 border-transparent text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#0D1117]"
                  )}
                >
                  <item.icon
                    size={16}
                    className={isActive ? 'text-[#00D2FF]' : 'text-[#484F58] group-hover:text-[#8B949E]'}
                  />
                  <span className="font-medium">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>

      {/* User area */}
      <div className="p-4 border-t border-[#21262D]">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0D1117] border border-[#21262D]">
          <div className="w-8 h-8 rounded-full bg-[#161B22] border border-[#00D2FF]/30 flex items-center justify-center shrink-0">
            <ShieldAlert size={15} className="text-[#00D2FF]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate text-[#E6EDF3]">PUBLIC_ACCESS</div>
            <div className="text-[10px] text-[#484F58] font-mono">SECURE_TERMINAL</div>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#00D2FF]/10 text-[#00D2FF] border border-[#00D2FF]/30 shrink-0">
            PRO
          </span>
        </div>
      </div>
    </div>
  );
};

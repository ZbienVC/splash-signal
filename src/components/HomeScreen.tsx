import React from 'react';
import {
  Waves,
  Zap,
  Shield,
  Search,
  MessageSquare,
  ArrowRight,
  Droplets,
  Anchor,
  Compass
} from 'lucide-react';
import { ViewId } from '../types';
import { cn } from '../lib/utils';
import { DexTrendingFeed } from './DexTrendingFeed';

interface HomeScreenProps {
  onNavigate: (view: ViewId) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const tools = [
    {
      id: 'market-overview',
      title: 'Global State',
      desc: 'Real-time structural coordination and macro liquidity flows.',
      icon: Waves,
      insight: 'Current: High Synchronization'
    },
    {
      id: 'attention-feed',
      title: 'Attention Feed',
      desc: 'Critical alerts and signal intelligence from deep-sea data.',
      icon: Zap,
      insight: 'Active: 12 Critical Signals'
    },
    {
      id: 'investigation-gateway',
      title: 'Investigation',
      desc: 'Deep-dive into assets, entities, and cluster coordination.',
      icon: Search,
      insight: 'Engine: AI-Powered v4.2'
    },
    {
      id: 'narrative-monitor',
      title: 'Narrative Intensity',
      desc: 'Monitoring cross-platform amplification and organic resonance.',
      icon: MessageSquare,
      insight: 'Trending: "AI Agent Summer"'
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-panel border border-slate-border p-12 flex flex-col items-center text-center">
        <div className="absolute inset-0 fluid-bg opacity-50"></div>
        <div className="relative z-10">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-primary/20 rounded-3xl flex items-center justify-center mb-6 border border-primary/30 overflow-hidden shadow-2xl shadow-primary/20">
              <img 
                src="https://i.imgur.com/DJKVOsz.png" 
                alt="SplashSignal Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest">
              <Droplets size={14} /> Intelligence in Motion
            </div>
          </div>
          <h1 className="text-6xl font-display font-bold tracking-tight mb-6 text-white">
            Dive into the <span className="text-primary">SplashSignal</span>
          </h1>
          <p className="text-xl text-sky-200/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            The next generation of market intelligence. Fluid data analysis, deep-sea signal detection, and institutional-grade risk assessment.
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => onNavigate('market-overview')}
              className="px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group"
            >
              LAUNCH TERMINAL <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => onNavigate('investigation-gateway')}
              className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center gap-2"
            >
              START INVESTIGATION
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Menu / Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onNavigate(tool.id as ViewId)}
            className="bg-slate-panel/50 border border-slate-border rounded-2xl p-6 text-left group hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col h-full"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <tool.icon size={24} />
            </div>
            <h3 className="text-xl font-display font-bold mb-2 text-white">{tool.title}</h3>
            <p className="text-sm text-sky-200/50 mb-6 flex-1">{tool.desc}</p>
            <div className="pt-4 border-t border-slate-border/50 flex items-center justify-between">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{tool.insight}</span>
              <ArrowRight size={14} className="text-slate-500 group-hover:text-primary transition-colors" />
            </div>
          </button>
        ))}
      </div>

      {/* Trending Feed */}
      <DexTrendingFeed onNavigate={onNavigate} />

      {/* System Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-slate-panel/30 border border-slate-border rounded-2xl p-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Anchor size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data Stability</div>
            <div className="text-xl font-display font-bold">99.98%</div>
          </div>
        </div>
        <div className="bg-slate-panel/30 border border-slate-border rounded-2xl p-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Compass size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Signal Coverage</div>
            <div className="text-xl font-display font-bold">Global</div>
          </div>
        </div>
        <div className="bg-slate-panel/30 border border-slate-border rounded-2xl p-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risk Shield</div>
            <div className="text-xl font-display font-bold">Active</div>
          </div>
        </div>
      </div>
    </div>
  );
};

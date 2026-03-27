import React, { useState, useEffect } from 'react';
import {
  Waves,
  Zap,
  Shield,
  Search,
  MessageSquare,
  ArrowRight,
  Droplets,
  Anchor,
  Compass,
  Trophy,
  Wallet,
  Radar,
  Monitor,
  Flame,
  AlertTriangle,
  Radio,
  RefreshCw
} from 'lucide-react';
import { ViewId } from '../types';
import { cn } from '../lib/utils';
import { DexTrendingFeed } from './DexTrendingFeed';
import { Button, Card, Badge } from './ui';
import { PageShell, Section } from './layout';
import { motion } from 'motion/react';

type AlertSeverity = 'entry' | 'exit' | 'watch' | 'warning';
type SuggestedAction = 'ENTRY' | 'EXIT' | 'WATCH' | 'HOLD';

interface NowPanelItem {
  emoji: string;
  headline: string;
  token: string;
  timeAgo: string;
  action: SuggestedAction;
  severity: AlertSeverity;
  address?: string;
}

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  entry:   'border-emerald-500/30 bg-emerald-900/20 hover:border-emerald-500/50',
  exit:    'border-red-500/30 bg-red-900/20 hover:border-red-500/50',
  watch:   'border-amber-500/30 bg-amber-900/20 hover:border-amber-500/50',
  warning: 'border-orange-500/30 bg-orange-900/20 hover:border-orange-500/50',
};

const ACTION_COLOR: Record<SuggestedAction, string> = {
  ENTRY: 'text-emerald-400',
  EXIT:  'text-red-400',
  WATCH: 'text-amber-400',
  HOLD:  'text-blue-400',
};

const MOCK_NOW_ITEMS: NowPanelItem[] = [
  { emoji: '🔥', headline: 'Smart wallets entering + vol +847%', token: '$PEPE2', timeAgo: '2m ago', action: 'ENTRY', severity: 'entry', address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' },
  { emoji: '🚨', headline: 'Dev sold $12K — dump risk rising fast', token: '$RUGME', timeAgo: '5m ago', action: 'EXIT', severity: 'exit', address: '3mNqXvK8wP2sLjF5dTaBcRy7hUoEpGnZqM1iAsDfKL4' },
  { emoji: '👀', headline: 'Whale reduced 23% — watch for follow-through', token: '$MOON', timeAgo: '12m ago', action: 'WATCH', severity: 'watch', address: '9nKmPoq4XwZtLrB2vYsCdEfHuiJ3OpNqGaWxTkMsVb8' },
];

const NowPanel: React.FC<{ onNavigate: (view: ViewId) => void; onSelectToken?: (view: string, addr: string) => void }> = ({ onNavigate, onSelectToken }) => {
  const [items, setItems] = useState<NowPanelItem[]>(MOCK_NOW_ITEMS);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setLastRefresh(new Date());
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const entryCount = items.filter(i => i.action === 'ENTRY').length;
  const exitCount  = items.filter(i => i.action === 'EXIT').length;

  return (
    <div className="bg-[#0D1117] border border-[#21262D] rounded-xl overflow-hidden">
      {/* Panel header */}
      <div className="px-5 py-3 border-b border-[#21262D] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-semibold text-[#E6EDF3]">What's happening now</span>
          </div>
          <div className="flex items-center gap-1.5">
            {entryCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-900/30 border border-emerald-600/30 text-emerald-400 text-[9px] font-bold uppercase">
                {entryCount} entry {entryCount === 1 ? 'signal' : 'signals'}
              </span>
            )}
            {exitCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-900/30 border border-red-600/30 text-red-400 text-[9px] font-bold uppercase">
                {exitCount} exit {exitCount === 1 ? 'risk' : 'risks'}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-600 font-mono">auto-refresh 60s</span>
          <button onClick={() => onNavigate('signal-feed' as ViewId)} className="text-[9px] font-bold text-primary hover:underline">
            View all →
          </button>
        </div>
      </div>

      {/* Cards — horizontal scroll on mobile, 3-col on desktop */}
      <div className="p-4">
        <div className="flex gap-3 overflow-x-auto md:grid md:grid-cols-3 pb-1 md:pb-0 snap-x md:snap-none">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => item.address && onSelectToken?.('solana-intel', item.address)}
              className={cn(
                'flex-shrink-0 snap-start w-72 md:w-auto rounded-xl border p-4 text-left transition-all group',
                SEVERITY_STYLES[item.severity]
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xl">{item.emoji}</span>
                <span className={cn('text-[9px] font-bold uppercase tracking-widest', ACTION_COLOR[item.action])}>
                  {item.action}
                </span>
              </div>
              <div className="text-xs font-bold text-white mb-1 leading-snug">{item.headline}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-primary">{item.token}</span>
                <span className="text-[9px] text-slate-500 font-mono">{item.timeAgo}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface HomeScreenProps {
  onNavigate: (view: ViewId) => void;
  onSelectToken?: (view: string, address: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, onSelectToken }) => {
  const primaryTools = [
    {
      id: 'market-overview',
      title: 'Global State',
      desc: 'Real-time structural coordination and macro liquidity flows.',
      icon: Waves,
      insight: 'Current: High Synchronization',
      badge: 'Live'
    },
    {
      id: 'attention-feed',
      title: 'Attention Feed',
      desc: 'Critical alerts and signal intelligence from deep-sea data.',
      icon: Zap,
      insight: 'Active: 12 Critical Signals',
      badge: 'Hot'
    },
    {
      id: 'investigation-gateway',
      title: 'Investigation',
      desc: 'Deep-dive into assets, entities, and cluster coordination.',
      icon: Search,
      insight: 'Engine: AI-Powered v4.2',
      badge: 'Core'
    },
    {
      id: 'narrative-monitor',
      title: 'Narrative Intensity',
      desc: 'Monitoring cross-platform amplification and organic resonance.',
      icon: MessageSquare,
      insight: 'Trending: "AI Agent Summer"',
      badge: 'Trending'
    }
  ];

  const institutionalTools = [
    {
      id: 'solana-intel',
      title: 'Solana Intel',
      desc: 'Advanced Solana ecosystem analysis and on-chain intelligence.',
      icon: Zap,
      insight: 'Network Activity: High'
    },
    {
      id: 'hunter-feed',
      title: 'Hunter Scanner',
      desc: 'Early signal detection and opportunity identification.',
      icon: Radar,
      insight: 'Scanning: 24/7'
    },
    {
      id: 'smart-money',
      title: 'Smart Money',
      desc: 'Track and analyze sophisticated trader behavior patterns.',
      icon: Trophy,
      insight: 'Following: 1,247 Wallets'
    },
    {
      id: 'wallet-behavior',
      title: 'Wallet Intelligence',
      desc: 'Deep behavioral analysis and wallet classification system.',
      icon: Wallet,
      insight: 'Behavioral Models: Active'
    }
  ];

  return (
    <PageShell className="animate-in fade-in duration-700">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="section-spacing-loose"
      >
        {/* Hero Section */}
        <Section className="relative overflow-hidden rounded-3xl bg-slate-925 border border-slate-700 p-12 flex flex-col items-center text-center">
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
              <Badge variant="alpha" className="text-xs font-bold uppercase tracking-widest">
                <Droplets size={12} className="mr-1" />
                Intelligence in Motion
              </Badge>
            </div>
            <h1 className="text-6xl font-display font-bold tracking-tight mb-6 text-slate-100">
              Dive into the <span className="text-primary">SplashSignal</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              The next generation of market intelligence. Fluid data analysis, deep-sea signal detection, and institutional-grade risk assessment.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => onNavigate('market-overview')}
                className="px-8 py-4 text-base shadow-xl shadow-primary/20 group"
              >
                LAUNCH TERMINAL 
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => onNavigate('investigation-gateway')}
                className="px-8 py-4 text-base"
              >
                START INVESTIGATION
              </Button>
            </div>
          </div>
        </Section>

        {/* Now Panel */}
        <Section>
          <NowPanel onNavigate={onNavigate} onSelectToken={onSelectToken} />
        </Section>

        {/* Quick Access — Alpha Suite */}
        <Section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'alpha-hunter',  icon: Flame,         label: '🔥 Alpha Hunter',    desc: 'Early momentum detection — highest alpha tokens now', color: 'from-emerald-500/10 to-transparent border-emerald-500/20 hover:border-emerald-500/40' },
              { id: 'dump-detector', icon: AlertTriangle,  label: '🚨 Dump Detector',   desc: 'Risk & exit signal monitoring — active dump threats',  color: 'from-red-500/10 to-transparent border-red-500/20 hover:border-red-500/40' },
              { id: 'wallet-ranking',icon: Trophy,         label: '🏆 Wallet Rankings', desc: 'Top smart wallets by win rate and avg multiple',       color: 'from-amber-500/10 to-transparent border-amber-500/20 hover:border-amber-500/40' },
            ].map(card => (
              <button
                key={card.id}
                onClick={() => onNavigate(card.id as ViewId)}
                className={cn(
                  'bg-gradient-to-br rounded-2xl p-5 text-left border transition-all group',
                  card.color
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-display font-bold text-white">{card.label}</span>
                  <ArrowRight size={14} className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all ml-auto" />
                </div>
                <p className="text-xs text-slate-400">{card.desc}</p>
              </button>
            ))}
          </div>
        </Section>

        {/* Primary Tools */}
        <Section 
          title="Core Intelligence" 
          description="Essential market intelligence and analysis tools"
          variant="card"
          icon={<Waves size={14} />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {primaryTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onNavigate(tool.id as ViewId)}
                className="bg-[#0D1117] border border-[#21262D] rounded-xl p-5 text-left group hover:border-[#00D2FF]/40 hover:bg-[#161B22] transition-all flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#00D2FF]/10 text-[#00D2FF] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <tool.icon size={20} />
                  </div>
                  {tool.badge && (
                    <div className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 rounded-full text-[8px] font-bold uppercase tracking-widest">
                      {tool.badge}
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-semibold mb-1 text-[#E6EDF3]">{tool.title}</h3>
                <p className="text-xs text-[#8B949E] mb-4 flex-1 leading-relaxed">{tool.desc}</p>
                <div className="pt-3 border-t border-[#21262D] flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#00D2FF] uppercase tracking-widest">{tool.insight}</span>
                  <ArrowRight size={13} className="text-[#484F58] group-hover:text-[#00D2FF] transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </Section>

        {/* Institutional Tools */}
        <Section 
          title="Institutional Arsenal" 
          description="Advanced tools for professional traders and analysts"
          variant="card"
          icon={<Shield size={14} />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {institutionalTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onNavigate(tool.id as ViewId)}
                className="bg-[#0D1117] border border-[#21262D] rounded-xl p-5 text-left group hover:border-[#30363D] hover:bg-[#161B22] transition-all flex flex-col h-full"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1C2128] text-[#8B949E] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <tool.icon size={20} />
                </div>
                <h3 className="text-sm font-semibold mb-1 text-[#E6EDF3]">{tool.title}</h3>
                <p className="text-xs text-[#8B949E] mb-4 flex-1 leading-relaxed">{tool.desc}</p>
                <div className="pt-3 border-t border-[#21262D] flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#8B949E] uppercase tracking-widest">{tool.insight}</span>
                  <ArrowRight size={13} className="text-[#484F58] group-hover:text-[#8B949E] transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </Section>

        {/* Trending Feed */}
        <Section>
          <DexTrendingFeed onNavigate={onNavigate} />
        </Section>

        {/* System Stats */}
        <Section 
          title="System Status" 
          description="Real-time platform health and coverage metrics"
          variant="card"
          icon={<Monitor size={14} />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/30 border border-slate-700 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Anchor size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data Stability</div>
                <div className="text-xl font-display font-bold text-white">99.98%</div>
              </div>
            </div>
            <div className="bg-slate-900/30 border border-slate-700 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Compass size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Signal Coverage</div>
                <div className="text-xl font-display font-bold text-white">Global</div>
              </div>
            </div>
            <div className="bg-slate-900/30 border border-slate-700 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Shield size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risk Shield</div>
                <div className="text-xl font-display font-bold text-white">Active</div>
              </div>
            </div>
          </div>
        </Section>
      </motion.div>
    </PageShell>
  );
};

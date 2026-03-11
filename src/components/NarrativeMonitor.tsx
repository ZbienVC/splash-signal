import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Zap, 
  Activity,
  BarChart3,
  ArrowUpRight,
  Filter,
  Share2,
  Info,
  ShieldAlert,
  Target,
  MousePointer2,
  Search,
  Loader2,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Tooltip } from './common/Tooltip';
import { FreshnessIndicator, ViewSource, StatusPulse } from './common/SignalUI';
import { fetchNarrativeAnalysis, NarrativeData } from '../services/geminiNarrativeService';
import { NarrativeMomentumCard } from './narrative/NarrativeMomentumCard';
import { NarrativeTrendGraph } from './narrative/NarrativeTrendGraph';
import { NarrativeHeatIndicator } from './narrative/NarrativeHeatIndicator';
import { getNarrativeHistory } from '../services/marketService';

const generateVolumeData = () => {
  const base = [
    { time: '00:00', volume: 1200, unique: 400 },
    { time: '04:00', volume: 1800, unique: 550 },
    { time: '08:00', volume: 3200, unique: 800 },
    { time: '12:00', volume: 4500, unique: 1200 },
    { time: '16:00', volume: 3800, unique: 1100 },
    { time: '20:00', volume: 5200, unique: 1500 },
    { time: '23:59', volume: 4800, unique: 1400 },
  ];
  return base.map(d => ({ 
    ...d, 
    volume: Math.max(0, d.volume + (Math.random() * 400 - 200)),
    unique: Math.max(0, d.unique + (Math.random() * 100 - 50))
  }));
};

const initialStats = [
  { 
    label: 'Narrative Strength', 
    value: 0, 
    delta: '0%', 
    status: 'neutral',
    description: 'Composite score of social, token, volume, and search metrics.',
    insight: 'Initializing analysis...'
  },
  { 
    label: 'Social Velocity', 
    value: 0, 
    delta: '0%', 
    status: 'neutral',
    description: 'Speed and acceleration of social media mentions.',
    insight: 'Initializing analysis...'
  },
  { 
    label: 'Token Launches', 
    value: 0, 
    delta: '0%', 
    status: 'neutral',
    description: 'New tokens launched within this narrative cluster.',
    insight: 'Initializing analysis...'
  },
  { 
    label: 'Trading Volume', 
    value: 0, 
    delta: '0%', 
    status: 'neutral',
    description: 'Aggregated trading volume across related pairs.',
    insight: 'Initializing analysis...'
  },
];

const TraderInsight: React.FC<{ title: string; content: string; type?: 'info' | 'warning' | 'success' }> = ({ title, content, type = 'info' }) => (
  <div className={cn(
    "mt-3 p-2 rounded border text-[10px] leading-tight",
    type === 'info' && "bg-blue-500/5 border-blue-500/20 text-blue-400",
    type === 'warning' && "bg-amber-500/5 border-amber-500/20 text-amber-400",
    type === 'success' && "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
  )}>
    <div className="font-bold uppercase mb-1 flex items-center gap-1">
      <Zap size={10} /> {title}
    </div>
    {content}
  </div>
);

const SUGGESTED_NARRATIVES = [
  { id: 'AI Agent Summer', description: 'Autonomous agents managing portfolios and executing trades.' },
  { id: 'DePIN Expansion', description: 'Decentralized physical infrastructure networks growing in real-world utility.' },
  { id: 'Meme Supercycle', description: 'High-velocity capital rotation into community-driven tokens.' },
  { id: 'BTC Layer 2s', description: 'Scaling solutions for Bitcoin seeing massive TVL growth.' },
  { id: 'Modular Interop', description: 'Cross-chain communication protocols and modular stack adoption.' },
];

export const NarrativeMonitor: React.FC = () => {
  const [currentNarrative, setCurrentNarrative] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [volumeData, setVolumeData] = useState(generateVolumeData());
  
  const [stats, setStats] = useState(() => initialStats);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [strengthScore, setStrengthScore] = useState(0);
  const [networkData, setNetworkData] = useState(() => [
    { label: 'Bot Clusters', value: 0, color: 'bg-primary', description: 'Coordinated groups of automated accounts.' },
    { label: 'Influencer Nodes', value: 0, color: 'bg-purple-500', description: 'Key accounts amplifying the narrative.' },
    { label: 'Organic Users', value: 0, color: 'bg-emerald-500', description: 'Real individuals participating naturally.' },
  ]);
  const [riskAssessment, setRiskAssessment] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [marketSignal, setMarketSignal] = useState('');
  const [signalDescription, setSignalDescription] = useState('');
  const [volumeToUniqueRatio, setVolumeToUniqueRatio] = useState<number>(0);
  const [relatedNarratives, setRelatedNarratives] = useState<string[]>([]);
  const [keyDrivers, setKeyDrivers] = useState<string[]>([]);
  const [recentDevelopments, setRecentDevelopments] = useState<string[]>([]);
  const [velocityEngine, setVelocityEngine] = useState<NarrativeData['velocityEngine'] | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [narrativeHistory, setNarrativeHistory] = useState<any[]>([]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setCurrentNarrative(query);
    
    // Add to history
    setSearchHistory(prev => [query, ...prev.filter(q => q !== query)].slice(0, 5));
    
    try {
      const [data, history] = await Promise.all([
        fetchNarrativeAnalysis(query),
        getNarrativeHistory(query)
      ]);
      
      if (data) {
        setStats(data.stats);
        setRadarData(data.radarMetrics);
        setStrengthScore(data.strengthScore);
        setNetworkData(data.network);
        setRiskAssessment(data.riskAssessment);
        setTargetAudience(data.targetAudience);
        setMarketSignal(data.marketSignal);
        setSignalDescription(data.signalDescription);
        setVolumeToUniqueRatio(data.volumeToUniqueRatio);
        setRelatedNarratives(data.relatedNarratives);
        setKeyDrivers(data.keyDrivers);
        setRecentDevelopments(data.recentDevelopments);
        setVelocityEngine(data.velocityEngine);
        setVolumeData(generateVolumeData());
      }
      if (history) {
        setNarrativeHistory(history);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
    setSearchQuery('');
  };

  useEffect(() => {
    if (!currentNarrative) return;
    const interval = setInterval(() => {
      setVolumeData(generateVolumeData());
      setStats(prev => prev.map(s => {
        const jitter = (Math.random() * 4 - 2);
        let newValue = s.value + jitter;
        
        // Only cap percentage-based metrics
        if (s.label !== 'Message Velocity') {
          newValue = Math.max(0, Math.min(100, newValue));
        } else {
          newValue = Math.max(0, newValue);
        }
        
        return { ...s, value: newValue };
      }));

      setNetworkData(prev => {
        // Jitter network data while keeping them roughly summing to 100
        const jitter = (Math.random() * 2 - 1);
        const newData = [...prev];
        newData[0] = { ...newData[0], value: Math.max(0, Math.min(100, newData[0].value + jitter)) };
        newData[2] = { ...newData[2], value: Math.max(0, Math.min(100, newData[2].value - jitter)) };
        
        // Normalize to 100%
        const total = newData.reduce((acc, curr) => acc + curr.value, 0);
        return newData.map(item => ({ ...item, value: (item.value / total) * 100 }));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [currentNarrative]);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Search & Suggestions Bar */}
      <div className="flex flex-col gap-4 bg-slate-panel border border-slate-border p-5 rounded-2xl shadow-xl shadow-black/20">
        <div className="flex gap-4">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search narrative (e.g. 'RWA', 'GameFi', 'ZK-Proofs')..."
              className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pl-11 pr-10 text-[11px] focus:outline-none focus:border-primary/50 focus:bg-black/60 transition-all placeholder:text-slate-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Zap size={12} className="rotate-45" />
              </button>
            )}
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-primary text-[9px] font-bold uppercase tracking-widest">
                <Loader2 size={12} className="animate-spin" />
              </div>
            )}
          </form>
          <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-xl border border-white/5 hover:border-slate-500 transition-colors cursor-pointer">
            <Filter size={16} className="text-slate-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Filter</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Trending Signals:</span>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {SUGGESTED_NARRATIVES.map((n) => (
              <button 
                key={n.id}
                onClick={() => performSearch(n.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap",
                  currentNarrative === n.id 
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                    : "bg-black/20 border-slate-border text-slate-400 hover:border-slate-500 hover:text-slate-300"
                )}
              >
                {n.id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && !currentNarrative ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-pulse">
          <div className="relative">
            <Loader2 className="w-20 h-20 text-primary animate-spin" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary w-8 h-8" />
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-display font-bold tracking-tight">Aggregating Narrative Intelligence</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
              Scanning global social nodes, analyzing amplification patterns, and calculating organic resonance for your query...
            </p>
          </div>
        </div>
      ) : !currentNarrative ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 relative z-10">
              <TrendingUp size={48} />
            </div>
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full -z-0 animate-pulse" />
          </div>
          <div className="max-w-lg space-y-3">
            <h2 className="text-3xl font-display font-bold tracking-tight">Narrative Intelligence Monitor</h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Unlock deep-sea insights into crypto market trends. Search any narrative to analyze cross-platform amplification, bot density, and organic resonance in real-time.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 w-full max-w-3xl mt-8">
            <div className="p-6 rounded-2xl bg-slate-panel border border-slate-border text-left hover:border-primary/40 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                <ShieldAlert size={20} />
              </div>
              <h3 className="text-sm font-bold mb-2 uppercase tracking-widest">Bot Detection</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Identify coordinated amplification clusters and artificial hype patterns before they peak.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-panel border border-slate-border text-left hover:border-emerald-500/40 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <h3 className="text-sm font-bold mb-2 uppercase tracking-widest">Organic Growth</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Measure genuine community interest and unique account participation across social layers.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-panel border border-slate-border text-left hover:border-amber-500/40 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                <Activity size={20} />
              </div>
              <h3 className="text-sm font-bold mb-2 uppercase tracking-widest">Velocity Tracking</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Monitor the speed of narrative propagation to catch emerging trends in their early stages.</p>
            </div>
          </div>
          
          {searchHistory.length > 0 && (
            <div className="w-full max-w-3xl mt-12 animate-in fade-in duration-1000">
              <div className="flex items-center gap-2 mb-4 text-slate-500">
                <Activity size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Recent Searches</span>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {searchHistory.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => performSearch(q)}
                    className="px-4 py-2 rounded-xl bg-slate-panel border border-slate-border text-xs text-slate-400 hover:border-primary hover:text-primary transition-all flex items-center gap-2"
                  >
                    <Search size={12} />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={cn("transition-opacity duration-500", loading ? "opacity-50 pointer-events-none" : "opacity-100")}>
          <div className="flex justify-between items-end mb-8 animate-in fade-in duration-500">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-display font-bold tracking-tight">Narrative ID: "{currentNarrative}"</h1>
                <div className="flex items-center gap-2 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded border border-primary/20 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Live Analysis
                </div>
              </div>
              <p className="text-slate-500">Monitoring cross-platform amplification and organic resonance</p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400"><Share2 size={20} /></button>
              <button className="px-4 py-2 bg-slate-panel border border-slate-border rounded-lg text-xs font-bold hover:bg-white/5 transition-all">EXPORT DATA</button>
            </div>
          </div>

          {/* KPI Ribbon */}
          <div className="grid grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
            {stats.map((stat, i) => (
              <div key={i} className="bg-slate-panel border border-slate-border p-4 rounded-xl flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                    <Tooltip content={stat.description}>
                      <Info size={10} className="text-slate-600 cursor-help hover:text-slate-400 transition-colors" />
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPulse status={stat.status as any} />
                    <div className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded",
                      stat.delta.startsWith('+') ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
                    )}>{stat.delta}</div>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-display font-bold">
                    {stat.label === 'Narrative Strength' ? stat.value.toFixed(0) : 
                     stat.label === 'Token Launches' ? stat.value.toFixed(0) : 
                     `${stat.value.toFixed(0)}%`}
                  </span>
                </div>
                <div className="mt-3 h-1 bg-black/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.label === 'Narrative Strength' ? (stat.value / 400) * 100 : stat.value}%` }}
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      stat.status === 'high' ? "bg-emerald-500" : 
                      stat.status === 'low' ? "bg-red-500" : "bg-blue-500"
                    )} 
                  />
                </div>
                <TraderInsight 
                  title="Actionable Insight" 
                  content={stat.insight || ''} 
                  type={stat.status === 'high' ? 'success' : stat.status === 'low' ? 'warning' : 'info'} 
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
            {/* Narrative Intensity Radar */}
            <div className="col-span-2 bg-slate-panel border border-slate-border rounded-xl p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-display font-bold">Narrative Intensity Radar</h3>
                    <Tooltip content="Visualizing the balance between social velocity, token launches, trading volume, and search interest.">
                      <Info size={14} className="text-slate-600 cursor-help" />
                    </Tooltip>
                  </div>
                  <p className="text-xs text-slate-500">Actionable Metric Distribution</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-display font-bold text-primary">{strengthScore.toFixed(0)}</div>
                    <div className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Strength Score</div>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#2d3a4b" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Narrative"
                      dataKey="value"
                      stroke="#137fec"
                      fill="#137fec"
                      fillOpacity={0.6}
                    />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1c2632', border: '1px solid #2d3a4b', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff', fontSize: '10px' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-3 bg-black/20 rounded-lg border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-[10px] font-bold text-primary uppercase">Market Signal:</div>
                  <div className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter",
                    strengthScore > 300 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                    strengthScore > 200 ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                    "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                  )}>
                    {marketSignal || (strengthScore > 300 ? "Dominant Narrative" : 
                     strengthScore > 200 ? "Emerging Trend" : "Niche Discussion")}
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {signalDescription || (
                    <>
                      This narrative has a strength score of <span className="text-white font-bold">{strengthScore.toFixed(0)}</span>. 
                      {strengthScore > 300 ? 
                        " It is currently dominating market attention with high social velocity and significant trading volume." :
                        strengthScore > 200 ?
                        " It is showing strong signs of emergence with growing search interest and token launch activity." :
                        " It remains a niche topic with limited broader market impact at this stage."
                      }
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Amplification Network */}
            <div className="bg-slate-panel border border-slate-border rounded-xl p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-lg font-display font-bold">Amplification Network</h3>
                <Tooltip content="Who is actually spreading this news? Are they real users, paid influencers, or coordinated bot clusters?">
                  <Info size={14} className="text-slate-600 cursor-help" />
                </Tooltip>
              </div>
              <div className="space-y-6 flex-1">
                {networkData.map((item, i) => (
                  <div key={i} className="group relative">
                    <div className="flex justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{item.label}</span>
                        <Tooltip content={item.description}>
                          <Info size={10} className="text-slate-600 cursor-help" />
                        </Tooltip>
                      </div>
                      <span className="font-mono font-bold">{item.value.toFixed(2)}%</span>
                    </div>
                    <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        className={cn("h-full rounded-full", item.color)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 text-primary font-bold text-xs mb-2 uppercase tracking-widest">
                  <ShieldAlert size={14} /> AI Risk Assessment
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {riskAssessment}
                </p>
                <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase">
                  <Target size={12} /> Target: {targetAudience || (currentNarrative.toLowerCase().includes('meme') ? 'Retail FOMO' : 'Institutional Awareness')}
                </div>
              </div>
            </div>
          </div>

          {/* Narrative Velocity Engine Section */}
          <div className="grid grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
            {velocityEngine && (
              <>
                <NarrativeMomentumCard 
                  velocityScore={velocityEngine.velocityScore}
                  growthRate={velocityEngine.growthRate}
                  saturation={velocityEngine.saturation}
                  freshness={velocityEngine.freshness}
                />
                <NarrativeTrendGraph growthRate={velocityEngine.growthRate} history={narrativeHistory} />
                <NarrativeHeatIndicator 
                  retailAttention={velocityEngine.retailAttention}
                  recentArticles={velocityEngine.recentArticles}
                />
              </>
            )}
          </div>

          {/* Context & Related Signals */}
          <div className="grid grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
            <div className="bg-slate-panel border border-slate-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={18} className="text-amber-500" />
                <h3 className="text-lg font-display font-bold">Key Drivers</h3>
              </div>
              <ul className="space-y-3">
                {keyDrivers.map((driver, i) => (
                  <li key={i} className="flex gap-3 text-xs text-slate-400 leading-relaxed">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/40 shrink-0" />
                    {driver}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-panel border border-slate-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={18} className="text-blue-500" />
                <h3 className="text-lg font-display font-bold">Recent Developments</h3>
              </div>
              <ul className="space-y-3">
                {recentDevelopments.map((dev, i) => (
                  <li key={i} className="flex gap-3 text-xs text-slate-400 leading-relaxed">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500/40 shrink-0" />
                    {dev}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-panel border border-slate-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Share2 size={18} className="text-primary" />
                <h3 className="text-lg font-display font-bold">Related Narratives</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {relatedNarratives.map((narrative, i) => (
                  <button
                    key={i}
                    onClick={() => performSearch(narrative)}
                    className="px-3 py-1.5 rounded-lg bg-black/20 border border-slate-border text-[10px] font-bold text-slate-400 hover:border-primary hover:text-primary transition-all uppercase tracking-wider"
                  >
                    {narrative}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  AlertTriangle, 
  ArrowUpRight,
  Globe,
  Waves,
  BarChart3,
  Info,
  Shield,
  Search,
  Cpu,
  RefreshCw,
  Clock,
  ExternalLink,
  Users,
  Layers,
  Flame,
  Target,
  ChevronRight,
  Maximize2,
  Filter,
  Eye,
  Activity as ActivityIcon,
  ShieldAlert,
  Droplets,
  UserMinus
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  Legend,
  ComposedChart,
  Scatter,
  ScatterChart,
  ZAxis,
  Brush
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { AppLink } from './common/AppLink';
import { SourceChip } from './common/SourceChip';
import { Tooltip } from './common/Tooltip';
import { FreshnessIndicator, ViewSource, StatusPulse } from './common/SignalUI';
import { GlobalIntelligence, MarketAlert, NarrativePerformance } from '../types/signalos';
import { getMarketOverview, getAltStrength, getAlerts } from '../services/marketService';

// --- Sub-components ---

const SectionHeader: React.FC<{ 
  title: string; 
  icon?: React.ReactNode; 
  lastUpdated?: number;
  onRefresh?: () => void;
  refreshing?: boolean;
  tooltip?: string;
}> = ({ title, icon, lastUpdated, onRefresh, refreshing, tooltip }) => (
  <div className="flex justify-between items-center mb-6">
    <div className="flex items-center gap-2">
      {icon && <div className="text-primary">{icon}</div>}
      <Tooltip content={tooltip || title}>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest cursor-help">{title}</h3>
      </Tooltip>
    </div>
    <div className="flex items-center gap-3">
      {refreshing ? <FreshnessIndicator status="UPDATING" /> : <FreshnessIndicator status="LIVE" />}
      {lastUpdated && (
        <div className="text-[9px] text-slate-600 font-mono flex items-center gap-1">
          <Clock size={10} />
          UPDATED: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      {onRefresh && (
        <button 
          onClick={onRefresh}
          disabled={refreshing}
          className="p-1.5 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={cn(refreshing && "animate-spin text-primary")} />
        </button>
      )}
    </div>
  </div>
);

const SourceBadge: React.FC<{ source: string; timestamp?: string; confidence?: number }> = ({ source, timestamp, confidence }) => (
  <div className="flex items-center gap-2 mt-2">
    <div className="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded text-[8px] font-mono text-slate-500 flex items-center gap-1">
      <Globe size={8} />
      SOURCE: {source.toUpperCase()}
    </div>
    {confidence !== undefined && (
      <div className="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded text-[8px] font-mono text-slate-500 flex items-center gap-1">
        <Shield size={8} />
        CONF: {(confidence * 100).toFixed(0)}%
      </div>
    )}
  </div>
);

const MarketModePanel: React.FC<{ data: GlobalIntelligence['marketMode'] }> = ({ data }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-panel border border-slate-border p-6 rounded-2xl relative overflow-hidden group h-full">
      <div className="absolute top-0 right-0 p-4">
        <div className={cn(
          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-2",
          data.mode === 'Risk-On' || data.mode === 'Alt Season' 
            ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30" 
            : data.mode === 'BTC Dominance' ? "bg-blue-500/20 text-blue-500 border border-blue-500/30"
            : data.mode === 'Risk-Off' ? "bg-red-500/20 text-red-500 border border-red-500/30"
            : "bg-slate-500/20 text-slate-500 border border-slate-500/30"
        )}>
          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", 
            data.mode === 'Risk-On' || data.mode === 'Alt Season' ? "bg-emerald-500" : 
            data.mode === 'Risk-Off' ? "bg-red-500" : "bg-slate-500"
          )} />
          {data.mode}
        </div>
      </div>
      
      <SectionHeader 
        title="Market Mode Engine" 
        icon={<ActivityIcon size={14} />} 
        tooltip="Current market regime based on liquidity flows, BTC dominance, and risk appetite."
      />
      
      <div className="flex items-end gap-4 mb-6">
        <Tooltip content="Confidence score of the current market mode detection.">
          <div className="text-5xl font-display font-bold text-slate-900 cursor-help">{data.confidence}%</div>
        </Tooltip>
        <div className="text-xs text-slate-500 mb-2 uppercase font-bold tracking-tighter">Signal Confidence</div>
      </div>

      <SourceBadge source="Multi-Source Aggregate" confidence={data.confidence / 100} />
      <ViewSource links={[{ label: 'CoinGecko', url: 'https://coingecko.com' }, { label: 'DexScreener', url: 'https://dexscreener.com' }]} />
      
      <div className="space-y-2 mt-4">
        {data.signals.map((sig, i) => (
          <Tooltip key={i} content={sig.interpretation}>
            <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5 hover:border-primary/30 transition-all group/sig">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{sig.label}</span>
                  {sig.sourceLink && (
                    <a href={sig.sourceLink} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-primary transition-colors">
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <div className="text-[9px] text-slate-600 italic mt-0.5 truncate max-w-[120px]">{sig.interpretation}</div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm font-bold font-mono text-slate-900">{sig.value}</span>
                  <StatusPulse status={sig.status === 'positive' ? 'bullish' : sig.status === 'negative' ? 'bearish' : 'neutral'} />
                </div>
                <div className={cn(
                  "text-[9px] font-mono font-bold",
                  sig.change24h.toString().startsWith('+') || parseFloat(sig.change24h.toString()) > 0 ? "text-emerald-500" : "text-red-500"
                )}>
                  {sig.change24h} (24H)
                </div>
              </div>
            </div>
          </Tooltip>
        ))}
      </div>

      <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl relative group/insight">
        <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase mb-1.5">
          <Zap size={10} /> Strategy Insight
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          {data.mode === 'Alt Season' ? 'Altcoins are outperforming BTC. Focus on high-beta SOL ecosystem tokens and AI narratives.' :
           data.mode === 'Risk-On' ? 'Bullish structure. BTC leading. Look for laggard alts with strong fundamental narratives.' :
           data.mode === 'BTC Dominance' ? 'Capital flowing into BTC. Alts bleeding. Wait for BTC stabilization before entering alt positions.' :
           data.mode === 'Risk-Off' ? 'Defensive positioning recommended. Increase stablecoin exposure and wait for RSI stabilization.' :
           'Market in transition. Neutral bias. Accumulate in high-conviction narratives on dips.'}
        </p>
      </div>
    </div>
  );
};

const AltStrengthPanel: React.FC<{ data: GlobalIntelligence['altStrength'] }> = ({ data: initialData }) => {
  const [indicators, setIndicators] = useState({ macd: false, rsi: false, volume: true });
  const [visibleLines, setVisibleLines] = useState({ btc: true, sol: true, total2: true });
  const [timeframe, setTimeframe] = useState('24H');
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  const fetchData = async () => {
    try {
      const result = await getAltStrength(timeframe);
      if (result && result.btc && result.btc.length > 0) {
        // Merge series for Recharts
        const merged = result.btc.map((p: any, i: number) => ({
          timestamp: p.time,
          btc: p.value,
          sol: result.sol[i]?.value,
          total2: result.total2[i]?.value,
          volume: result.volume[i]?.value,
          rsi: result.rsi[i],
          macd: result.macd.macd[i],
          signal: result.macd.signal[i],
          histogram: result.macd.histogram[i]
        }));
        
        console.log(`[AltStrength] Received data: BTC=${result.btc.length}, SOL=${result.sol.length}, TOTAL2=${result.total2.length}`);
        setChartData(merged);
        setError(null);
        setLastUpdated(Date.now());
      } else {
        setError("Empty dataset received");
      }
    } catch (e) {
      console.error('Failed to fetch alt strength data:', e);
      setError("Failed to fetch data from CoinGecko");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 60000); // 60 seconds polling
    return () => clearInterval(interval);
  }, [timeframe]);

  const getLatestChange = (key: string) => {
    if (chartData.length < 2) return 0;
    const first = chartData[0][key];
    const last = chartData[chartData.length - 1][key];
    if (!first) return 0;
    return ((last - first) / first) * 100;
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex justify-end gap-4 text-[10px] font-mono mb-4">
        {payload.map((entry: any, index: number) => {
          if (['MACD', 'RSI', 'Volume'].includes(entry.value)) return null;
          
          let key = '';
          if (entry.value === 'BTC') key = 'btc';
          if (entry.value === 'SOL INDEX') key = 'sol';
          if (entry.value === 'TOTAL2') key = 'total2';
          
          const change = key ? getLatestChange(key) : 0;
          const isPositive = change >= 0;
          
          return (
            <li key={`item-${index}`} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-500 uppercase">{entry.value}</span>
              <span className={cn("font-bold", isPositive ? "text-emerald-500" : "text-red-500")}>
                {isPositive ? '+' : ''}{change.toFixed(2)}%
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="bg-slate-panel border border-slate-border p-6 rounded-2xl flex flex-col group h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <SectionHeader 
            title="Alt Strength Engine" 
            icon={<BarChart3 size={14} />} 
            tooltip="Relative performance of altcoins vs Bitcoin. High values indicate Alt Season."
          />
          <div className="flex items-center gap-2 mt-[-16px]">
            <Tooltip content="Alt Strength Index: 0-100 scale. >75 is Alt Season.">
              <span className="text-3xl font-display font-bold cursor-help">{initialData.index}</span>
            </Tooltip>
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded",
              initialData.trend === 'rising' ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
            )}>
              {initialData.trend === 'rising' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {initialData.trend.toUpperCase()}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SourceBadge source="CoinGecko + DexScreener" confidence={0.95} />
            <div className="text-[9px] text-slate-600 font-mono flex items-center gap-1 mt-2">
              <Clock size={10} />
              LAST UPDATED: {secondsAgo}s AGO
            </div>
          </div>
          <ViewSource links={[{ label: 'CoinGecko', url: 'https://coingecko.com' }, { label: 'DexScreener', url: 'https://dexscreener.com' }]} />
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-2">
            {['1H', '4H', '24H', '7D'].map(t => (
              <button 
                key={t} 
                onClick={() => setTimeframe(t)}
                className={cn(
                  "px-2 py-1 text-[9px] font-bold rounded border transition-all",
                  timeframe === t ? "bg-primary border-primary text-slate-900" : "border-slate-border text-slate-500 hover:text-slate-600"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(['btc', 'sol', 'total2'] as const).map(line => (
              <button 
                key={line}
                onClick={() => setVisibleLines(prev => ({ ...prev, [line]: !prev[line] }))}
                className={cn(
                  "px-2 py-1 text-[9px] font-bold rounded border transition-all uppercase",
                  visibleLines[line] ? "bg-white/10 border-white/20 text-slate-900" : "border-slate-border text-slate-600"
                )}
              >
                {line === 'sol' ? 'SOL' : line.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(['macd', 'rsi', 'volume'] as const).map(ind => (
              <button 
                key={ind}
                onClick={() => setIndicators(prev => ({ ...prev, [ind]: !prev[ind] }))}
                className={cn(
                  "px-2 py-1 text-[9px] font-bold rounded border transition-all uppercase",
                  indicators[ind] ? "bg-white/10 border-white/20 text-slate-900" : "border-slate-border text-slate-600"
                )}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] relative">
        {loading && chartData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="animate-spin text-primary" size={20} />
              <span className="text-[10px] font-mono text-slate-500">FETCHING MARKET DATA...</span>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/5 rounded-xl border border-red-500/20">
            <div className="flex flex-col items-center gap-2 text-red-500">
              <AlertTriangle size={20} />
              <span className="text-[10px] font-mono uppercase">{error}</span>
              <button onClick={() => fetchData()} className="mt-2 px-3 py-1 bg-red-500/20 rounded text-[9px] font-bold hover:bg-red-500/30 transition-all">RETRY</button>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="colorBtc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#137fec" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#137fec" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4b" vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                hide 
                domain={['auto', 'auto']}
                type="number"
              />
              <YAxis 
                yAxisId="left"
                hide 
                domain={['auto', 'auto']}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                hide 
                domain={['auto', 'auto']}
              />
              <RechartsTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg shadow-xl min-w-[150px]">
                        <div className="text-[10px] text-slate-500 font-mono mb-2 border-bottom border-white/5 pb-1">
                          {new Date(label).toLocaleString()}
                        </div>
                        <div className="space-y-1.5">
                          {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex justify-between items-center gap-4">
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-[10px] text-slate-600 uppercase">{entry.name}</span>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-slate-900">
                                {entry.value.toFixed(2)}
                                {entry.name === 'Volume' ? '' : '%'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Legend content={renderLegend} verticalAlign="top" align="right" />
              
              {indicators.volume && (
                <Bar yAxisId="right" dataKey="volume" fill="#ffffff" fillOpacity={0.05} barSize={10} name="Volume" />
              )}
              
              {/* Base Series - Always Render if visible */}
              {visibleLines.btc && <Line yAxisId="left" type="monotone" dataKey="btc" stroke="#137fec" strokeWidth={2} dot={false} name="BTC" animationDuration={1000} isAnimationActive={true} />}
              {visibleLines.total2 && <Line yAxisId="left" type="monotone" dataKey="total2" stroke="#10b981" strokeWidth={2} dot={false} name="TOTAL2" animationDuration={1000} isAnimationActive={true} />}
              {visibleLines.sol && <Line yAxisId="left" type="monotone" dataKey="sol" stroke="#a855f7" strokeWidth={2} dot={false} name="SOL INDEX" animationDuration={1000} isAnimationActive={true} />}
              
              {/* Indicator Overlays */}
              {indicators.macd && (
                <Line yAxisId="right" type="monotone" dataKey="macd" stroke="#f59e0b" strokeWidth={1} dot={false} name="MACD" />
              )}
              {indicators.rsi && (
                <Line yAxisId="right" type="monotone" dataKey="rsi" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" dot={false} name="RSI" />
              )}
              <Brush dataKey="timestamp" height={20} stroke="#3b82f6" fill="#1c2632" tickFormatter={() => ''} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="p-3 bg-black/20 rounded-xl border border-white/5 flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center text-blue-500">
            <Globe size={12} />
          </div>
          <div>
            <div className="text-[8px] text-slate-500 uppercase font-bold">CoinGecko</div>
            <div className="text-[10px] font-mono text-slate-600">Global Indices</div>
          </div>
        </div>
        <div className="p-3 bg-black/20 rounded-xl border border-white/5 flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Activity size={12} />
          </div>
          <div>
            <div className="text-[8px] text-slate-500 uppercase font-bold">DexScreener</div>
            <div className="text-[10px] font-mono text-slate-600">SOL Ecosystem</div>
          </div>
        </div>
        <div className="p-3 bg-black/20 rounded-xl border border-white/5 flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center text-purple-500">
            <Layers size={12} />
          </div>
          <div>
            <div className="text-[8px] text-slate-500 uppercase font-bold">DefiLlama</div>
            <div className="text-[10px] font-mono text-slate-600">TVL Analytics</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NarrativeTradingRadar: React.FC<{ narratives: NarrativePerformance[] }> = ({ narratives }) => {
  const [selectedNarrative, setSelectedNarrative] = useState<NarrativePerformance | null>(null);

  const radarData = useMemo(() => {
    return narratives.map(n => ({
      ...n,
      x: n.socialMentions,
      y: n.volumeGrowth,
      z: n.marketCap,
    }));
  }, [narratives]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '#10b981'; // emerald-500
      case 'negative': return '#ef4444'; // red-500
      case 'neutral': return '#3b82f6'; // blue-500
      default: return '#f59e0b'; // amber-500
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'Rising': return <TrendingUp size={10} className="text-emerald-500" />;
      case 'Peaking': return <Activity size={10} className="text-amber-500" />;
      case 'Cooling': return <TrendingDown size={10} className="text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="bg-slate-panel border border-slate-border p-6 rounded-2xl group h-full flex flex-col relative overflow-hidden">
      <SectionHeader 
        title="Narrative Trading Radar" 
        icon={<Flame size={14} />} 
        tooltip="Visualizing narratives by social mentions (X) and volume growth (Y). Bubble size is market cap."
      />
      <SourceBadge source="Twitter Velocity + Google Trends + DexScreener" confidence={0.88} />
      <ViewSource links={[{ label: 'DexScreener', url: 'https://dexscreener.com' }]} />
      
      <div className="flex-1 min-h-[300px] w-full mb-6 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4b" vertical={false} strokeOpacity={0.5} />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Social Mentions" 
              stroke="#4b5563" 
              fontSize={9}
              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}K` : val}
              label={{ value: 'SOCIAL MENTIONS', position: 'bottom', offset: 0, fontSize: 8, fill: '#4b5563', fontWeight: 'bold' }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Volume Growth" 
              stroke="#4b5563" 
              fontSize={9}
              tickFormatter={(val) => `${val}%`}
              label={{ value: 'VOLUME GROWTH %', angle: -90, position: 'left', fontSize: 8, fill: '#4b5563', fontWeight: 'bold' }}
            />
            <ZAxis type="number" dataKey="z" range={[100, 2000]} name="Market Cap" />
            <RechartsTooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as NarrativePerformance;
                  return (
                    <div className="bg-white/95 backdrop-blur-md border border-slate-border p-4 rounded-xl shadow-2xl min-w-[240px]">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{data.name}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {getTrendIcon(data.trend)}
                            <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-500">{data.trend}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[14px] font-display font-bold text-primary">{data.priceMomentum}</div>
                          <div className="text-[7px] text-slate-500 uppercase font-bold">Radar Score</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                          <div className="text-[7px] text-slate-500 uppercase font-bold mb-0.5">Social Velocity</div>
                          <div className="text-xs font-bold text-blue-400">+{data.socialVelocity.toFixed(1)}%</div>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                          <div className="text-[7px] text-slate-500 uppercase font-bold mb-0.5">Wallet Growth</div>
                          <div className="text-xs font-bold text-emerald-400">+{data.walletGrowth.toFixed(1)}%</div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Top Narrative Assets</div>
                        {data.tokens && data.tokens.slice(0, 2).map((token, idx) => (
                          <div key={idx} className="flex justify-between items-center p-1.5 bg-black/20 rounded-md border border-white/5">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[7px] font-bold text-primary">
                                {token.symbol[0]}
                              </div>
                              <span className="text-[9px] font-bold text-slate-900">{token.symbol}</span>
                            </div>
                            <span className={cn("text-[9px] font-mono font-bold", token.change24h > 0 ? "text-emerald-500" : "text-red-500")}>
                              {token.change24h > 0 ? '+' : ''}{token.change24h.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-3 text-[8px] text-center text-slate-500 italic">Click bubble for deep token drilldown</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter 
              name="Narratives" 
              data={radarData} 
              onClick={(data) => setSelectedNarrative(data)}
              className="cursor-pointer"
            >
              {radarData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getSentimentColor(entry.sentiment)} 
                  fillOpacity={0.4}
                  stroke={getSentimentColor(entry.sentiment)}
                  strokeWidth={2}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {narratives.slice(0, 4).map((nar, i) => (
          <button 
            key={i} 
            onClick={() => setSelectedNarrative(nar)}
            className="p-3 bg-black/20 rounded-xl border border-white/5 hover:border-primary/30 transition-all text-left group/item relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs font-bold group-hover/item:text-primary transition-colors">{nar.name}</div>
              {getTrendIcon(nar.trend)}
            </div>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[10px] font-display font-bold text-slate-900">{nar.priceMomentum}</div>
                <div className="text-[7px] text-slate-500 uppercase font-bold">Momentum</div>
              </div>
              <div className="text-right">
                <div className={cn("text-[10px] font-mono font-bold", nar.volumeGrowth > 0 ? "text-emerald-500" : "text-red-500")}>
                  {nar.volumeGrowth > 0 ? '+' : ''}{nar.volumeGrowth}%
                </div>
                <div className="text-[7px] text-slate-500 uppercase font-bold">Vol 24h</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Token Drilldown Modal */}
      <AnimatePresence>
        {selectedNarrative && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedNarrative(null)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronRight size={16} className="rotate-180" />
                </button>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{selectedNarrative.name} Intelligence</h4>
                  <div className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Narrative Drilldown</div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                <span className="text-[10px] font-bold text-primary">{selectedNarrative.priceMomentum}</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase">Score</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-[8px] text-slate-500 uppercase font-bold mb-1">Social Velocity</div>
                  <div className="text-sm font-display font-bold text-blue-400">+{selectedNarrative.socialVelocity.toFixed(1)}%</div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-[8px] text-slate-500 uppercase font-bold mb-1">Wallet Growth</div>
                  <div className="text-sm font-display font-bold text-emerald-400">+{selectedNarrative.walletGrowth.toFixed(1)}%</div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-[8px] text-slate-500 uppercase font-bold mb-1">Token Launches</div>
                  <div className="text-sm font-display font-bold text-amber-400">{selectedNarrative.tokenLaunchCount}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">High-Confidence Assets</div>
                {selectedNarrative.tokens && selectedNarrative.tokens.map((token, idx) => (
                  <div key={idx} className="p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group/token">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                          {token.symbol[0]}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 group-hover/token:text-primary transition-colors">{token.name}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-500">{token.symbol}</span>
                            <span className="text-[8px] px-1.5 py-0.5 bg-white/5 rounded text-slate-500 uppercase font-bold">{token.source}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-slate-900">${token.priceUsd.toFixed(4)}</div>
                        <div className={cn("text-[10px] font-mono font-bold", token.change24h > 0 ? "text-emerald-500" : "text-red-500")}>
                          {token.change24h > 0 ? '+' : ''}{token.change24h.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[9px]">
                          <span className="text-slate-500 uppercase font-bold">Market Cap</span>
                          <span className="text-slate-900 font-mono">${(token.marketCap / 1000000).toFixed(1)}M</span>
                        </div>
                        <div className="flex justify-between text-[9px]">
                          <span className="text-slate-500 uppercase font-bold">Liquidity</span>
                          <span className="text-slate-900 font-mono">${(token.liquidity / 1000).toFixed(1)}K</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[9px]">
                          <span className="text-slate-500 uppercase font-bold">Dev Wallet</span>
                          <span className="text-emerald-500 font-mono font-bold">CLEAN</span>
                        </div>
                        <div className="flex justify-between text-[9px]">
                          <span className="text-slate-500 uppercase font-bold">Launchpad</span>
                          <span className="text-slate-900 font-mono uppercase">{token.source}</span>
                        </div>
                      </div>
                    </div>

                    <a 
                      href={token.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-4 w-full py-2 bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/30 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
                    >
                      VIEW ON {token.source.toUpperCase()} <ExternalLink size={10} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NarrativeRotationTracker: React.FC<{ data: GlobalIntelligence['narrativeRotation'] }> = ({ data }) => {
  return (
    <div className="bg-slate-panel border border-slate-border p-6 rounded-2xl group h-full">
      <SectionHeader 
        title="Narrative Rotation Tracker" 
        icon={<RefreshCw size={14} />} 
        tooltip="Tracking capital migration between different market narratives."
      />
      <ViewSource links={[{ label: 'DexScreener', url: 'https://dexscreener.com' }]} />
      
      <div className="space-y-4">
        {data.map((rot, i) => (
          <div key={i} className="relative p-4 bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
            <div className="flex justify-between items-center mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-500 border border-white/5">
                  {rot.from}
                </div>
                <div className="flex flex-col items-center">
                  <motion.div 
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-primary"
                  >
                    <ChevronRight size={16} />
                  </motion.div>
                  <div className="text-[8px] font-bold text-primary/50 uppercase">Rotation</div>
                </div>
                <div className="px-3 py-1 bg-primary/20 rounded-lg text-xs font-bold text-primary border border-primary/30">
                  {rot.to}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-display font-bold text-slate-900">{rot.strength}%</div>
                <div className="text-[8px] text-slate-500 uppercase font-bold">Flow Strength</div>
              </div>
            </div>
            
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-3">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${rot.strength}%` }}
                className="h-full bg-primary"
              />
            </div>
            
            <p className="text-[10px] text-slate-500 leading-relaxed italic">
              &ldquo;{rot.reason}&rdquo;
            </p>
            
            {/* Background Flow Animation */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
              <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
        <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase mb-1">
          <Info size={10} /> How it works
        </div>
        <p className="text-[9px] text-slate-500 leading-tight">
          SplashSignal monitors volume shifts, token performance, and new launch density to detect capital migration between market sectors.
        </p>
      </div>
    </div>
  );
};

const MemeHealthPanel: React.FC<{ data: GlobalIntelligence['memeHealth'] }> = ({ data }) => {
  return (
    <div className="bg-slate-panel border border-slate-border p-6 rounded-2xl group h-full">
      <SectionHeader 
        title="Meme Market Health Engine" 
        icon={<Target size={14} />} 
        tooltip="Real-time health of the meme coin market, specifically on Pump.fun."
      />
      <SourceBadge source="Pump.fun API" confidence={0.92} />
      <ViewSource links={[{ label: 'Pump.fun', url: 'https://pump.fun' }]} />
      
      <div className="grid grid-cols-2 gap-4 mb-6 mt-4">
        <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Launches / Hour</div>
          <div className="text-2xl font-display font-bold text-slate-900">{data.launchesPerHour} <span className="text-xs text-slate-500">/ hr</span></div>
          <div className="text-[9px] text-slate-600 font-mono mt-1">{data.launches24h} TOTAL (24H)</div>
        </div>
        <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Bonding Success</div>
          <div className="text-2xl font-display font-bold text-primary">{data.bondingSuccessRate}%</div>
          <div className="text-[9px] text-slate-600 font-mono mt-1">{data.bondedCount24h} GRADUATED</div>
        </div>
      </div>

      <div className="h-[150px] w-full mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.launchRateData}>
            <defs>
              <linearGradient id="colorLaunches" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#137fec" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#137fec" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4b" vertical={false} />
            <XAxis dataKey="timestamp" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: '#1c2632', border: '1px solid #2d3a4b', borderRadius: '8px', fontSize: '10px' }}
              labelFormatter={(t) => new Date(t).toLocaleTimeString()}
            />
            <Area type="monotone" dataKey="count" stroke="#137fec" fillOpacity={1} fill="url(#colorLaunches)" strokeWidth={2} />
            <Brush dataKey="timestamp" height={20} stroke="#137fec" fill="#1c2632" tickFormatter={() => ''} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="text-center text-[9px] text-slate-600 font-mono mt-2 uppercase tracking-widest">Pump.fun Launch Rate (24H)</div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5">
          <span className="text-xs text-slate-500">Avg Survival Time</span>
          <span className="text-sm font-bold font-mono text-slate-900">{data.avgSurvivalTime}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5">
          <span className="text-xs text-slate-500">Median Market Cap</span>
          <span className="text-sm font-bold font-mono text-slate-900">${(data.medianMarketCap / 1000).toFixed(1)}K</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5">
          <span className="text-xs text-slate-500">Median Liquidity</span>
          <span className="text-sm font-bold font-mono text-slate-900">${(data.medianLiquidity / 1000).toFixed(1)}K</span>
        </div>
      </div>
    </div>
  );
};

const WhaleIntelligencePanel: React.FC<{ data: GlobalIntelligence['whaleActivity'] }> = ({ data }) => {
  const [view, setView] = useState<'flow' | 'transactions'>('flow');

  return (
    <div className="bg-slate-panel border border-slate-border p-6 rounded-2xl group h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <SectionHeader 
          title="Whale Activity Intelligence" 
          icon={<Users size={14} />} 
          tooltip="Monitoring large wallet movements and accumulation patterns."
        />
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
            <button 
              onClick={() => setView('flow')}
              className={cn("px-2 py-1 text-[9px] font-bold rounded transition-all", view === 'flow' ? "bg-primary text-slate-900" : "text-slate-500 hover:text-slate-600")}
            >
              FLOW
            </button>
            <button 
              onClick={() => setView('transactions')}
              className={cn("px-2 py-1 text-[9px] font-bold rounded transition-all", view === 'transactions' ? "bg-primary text-slate-900" : "text-slate-500 hover:text-slate-600")}
            >
              TXS
            </button>
          </div>
          <SourceBadge source="Solana RPC + Pump.fun" confidence={0.98} />
          <ViewSource links={[{ label: 'Solscan', url: 'https://solscan.io' }]} />
        </div>
      </div>
      
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
          <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Buy Volume</div>
          <div className="text-xl font-display font-bold text-emerald-500">${(data.totalBuyVolume / 1000000).toFixed(1)}M</div>
        </div>
        <div className="flex-1 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
          <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Sell Volume</div>
          <div className="text-xl font-display font-bold text-red-500">${(data.totalSellVolume / 1000000).toFixed(1)}M</div>
        </div>
      </div>

      <div className="flex-1 min-h-[200px]">
        {view === 'flow' ? (
          <>
            <div className="h-[150px] w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.whaleFlowData}>
                  <defs>
                    <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSell" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4b" vertical={false} />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1c2632', border: '1px solid #2d3a4b', borderRadius: '8px', fontSize: '10px' }}
                    labelFormatter={(t) => new Date(t).toLocaleTimeString()}
                  />
                  <Area type="monotone" dataKey="buyVolume" stroke="#10b981" fillOpacity={1} fill="url(#colorBuy)" strokeWidth={2} stackId="1" />
                  <Area type="monotone" dataKey="sellVolume" stroke="#ef4444" fillOpacity={1} fill="url(#colorSell)" strokeWidth={2} stackId="2" />
                  <Brush dataKey="timestamp" height={20} stroke="#3b82f6" fill="#1c2632" tickFormatter={() => ''} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="text-center text-[9px] text-slate-600 font-mono mt-2 uppercase tracking-widest">Whale Flow (Buy vs Sell)</div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Top Accumulated</div>
              {data.topAccumulatedTokens.map((token, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                      {token.symbol[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold">{token.symbol}</div>
                      <div className="text-[8px] text-slate-500 font-mono">{token.mint.slice(0, 4)}...{token.mint.slice(-4)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-emerald-500">+${(token.whaleVolume / 1000).toFixed(1)}K</div>
                    <div className="text-[8px] text-slate-500 uppercase font-bold">Whale Vol</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {data.recentTransactions.map((tx, i) => (
              <div key={i} className="p-3 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase",
                      tx.type === 'buy' ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"
                    )}>
                      {tx.type}
                    </div>
                    <span className="text-xs font-bold text-slate-900">{tx.symbol}</span>
                  </div>
                  <a href={tx.solscanLink} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-primary transition-colors">
                    <ExternalLink size={10} />
                  </a>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[10px] font-mono text-slate-500">${tx.amount.toLocaleString()}</div>
                    <div className="text-[8px] text-slate-600 font-mono mt-0.5">{tx.address.slice(0, 6)}...{tx.address.slice(-6)}</div>
                  </div>
                  <div className="text-[8px] text-slate-600 font-mono">
                    {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MarketAlertsPanel: React.FC<{ alerts: MarketAlert[] }> = ({ alerts }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'liquidity_removal': return <Droplets size={14} className="text-red-500" />;
      case 'whale_buy': return <TrendingUp size={14} className="text-emerald-500" />;
      case 'dev_sell': return <UserMinus size={14} className="text-orange-500" />;
      case 'volume_spike': return <Zap size={14} className="text-amber-500" />;
      case 'narrative_surge': return <Flame size={14} className="text-blue-500" />;
      default: return <AlertTriangle size={14} className="text-slate-500" />;
    }
  };

  return (
    <div className="bg-slate-panel border border-slate-border rounded-2xl overflow-hidden group flex flex-col h-full">
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Real-Time Market Alert Engine</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-red-500 animate-pulse">LIVE ON-CHAIN FEED</span>
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="divide-y divide-white/5">
          {alerts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-slate-600 text-xs italic">Scanning Solana RPC for triggers...</div>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="p-4 hover:bg-white/5 transition-all group/alert relative">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-1.5 rounded-lg border",
                      getPriorityColor(alert.priority)
                    )}>
                      {getAlertIcon(alert.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{alert.token?.name || 'Unknown Token'}</span>
                        <span className="text-[10px] font-mono text-slate-500">{alert.token?.symbol || '???'}</span>
                      </div>
                      <div className="text-[10px] font-bold text-primary uppercase tracking-tight">{alert.trigger}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border",
                      getPriorityColor(alert.priority)
                    )}>
                      {alert.priority}
                    </div>
                    <div className="text-[8px] text-slate-500 font-mono mt-1">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                  {alert.description}
                </p>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] font-bold text-slate-500 uppercase">Confidence</span>
                      <span className="text-[8px] font-bold text-slate-900">{Math.round(alert.confidence * 100)}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${alert.confidence * 100}%` }}
                        className={cn(
                          "h-full rounded-full",
                          alert.confidence > 0.9 ? "bg-emerald-500" : alert.confidence > 0.7 ? "bg-primary" : "bg-amber-500"
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={alert.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/30 rounded-lg text-slate-500 hover:text-slate-900 transition-all flex items-center gap-1.5 text-[9px] font-bold"
                    >
                      {alert.source} <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

export const MarketOverview: React.FC = () => {
  const [intel, setIntel] = useState<GlobalIntelligence | null>(null);
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (force: boolean = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getMarketOverview(force);
      setIntel(data.payload);
      if (data.payload.alerts) setAlerts(data.payload.alerts);
    } catch (e) {
      console.error('Failed to fetch market overview:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAlertsOnly = async () => {
    try {
      const data = await getAlerts();
      setAlerts(data);
    } catch (e) {
      console.error('Failed to fetch alerts:', e);
    }
  };

  useEffect(() => {
    fetchData();
    const intelInterval = setInterval(() => fetchData(false), 30000);
    const alertsInterval = setInterval(fetchAlertsOnly, 10000);
    return () => {
      clearInterval(intelInterval);
      clearInterval(alertsInterval);
    };
  }, []);

  if (loading && !intel) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-primary" size={32} />
          <p className="text-sm font-mono text-slate-500">INITIALIZING INTELLIGENCE PIPELINE...</p>
        </div>
      </div>
    );
  }

  if (!intel) return null;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
              <Globe className="text-primary" size={20} />
            </div>
            <h1 className="text-3xl font-display font-bold text-slate-900">Global Intelligence Terminal</h1>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
            <div className="flex items-center gap-1.5">
              <Clock size={10} />
              LAST SYNC: {new Date(intel.timestamp).toLocaleTimeString()}
            </div>
            <div className="flex items-center gap-1.5">
              <Activity size={10} />
              PIPELINE STATUS: <span className="text-emerald-500 font-bold">ACTIVE</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-panel border border-slate-border rounded-xl text-xs font-bold hover:bg-white/5 transition-all disabled:opacity-50 shadow-lg"
          >
            <RefreshCw size={14} className={cn(refreshing && "animate-spin")} />
            {refreshing ? 'REFRESHING...' : 'FORCE REFRESH'}
          </button>
        </div>
      </div>

      {/* Top Row: Market Mode & Alt Strength */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <MarketModePanel data={intel.marketMode} />
        </div>
        <div className="col-span-8">
          <AltStrengthPanel data={intel.altStrength} />
        </div>
      </div>

      {/* Middle Row: Narratives, Meme Health, Whale Activity */}
      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1">
          <NarrativeTradingRadar narratives={intel.narratives} />
        </div>
        <div className="col-span-1">
          <NarrativeRotationTracker data={intel.narrativeRotation} />
        </div>
        <div className="col-span-1">
          <MemeHealthPanel data={intel.memeHealth} />
        </div>
        <div className="col-span-1">
          <WhaleIntelligencePanel data={intel.whaleActivity} />
        </div>
      </div>

      {/* Bottom Row: Alerts */}
      <MarketAlertsPanel alerts={alerts} />

      {/* Footer / Data Sources */}
      <div className="pt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-600 font-mono">
        <div className="flex gap-6">
          <div className="flex items-center gap-1.5">
            <SourceChip evidence={{ sources: [{ label: 'DexScreener', url: 'https://dexscreener.com' }] }} title="Price Data" />
            <span>REAL-TIME DEX VOLUME</span>
          </div>
          <div className="flex items-center gap-1.5">
            <SourceChip evidence={{ sources: [{ label: 'CoinGecko', url: 'https://coingecko.com' }] }} title="Market Cap" />
            <span>GLOBAL MARKET INDICES</span>
          </div>
          <div className="flex items-center gap-1.5">
            <SourceChip evidence={{ sources: [{ label: 'Solscan', url: 'https://solscan.io' }] }} title="On-Chain" />
            <span>SOLANA RPC TRANSACTION PARSING</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Shield size={10} />
          VERIFIED BY SPLASHSIGNAL NODE
        </div>
      </div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  ZAxis,
  Cell,
  Legend
} from 'recharts';
import { SolanaTokenIntel, SolanaTransaction } from '../../types/signalos';
import { cn } from '../../lib/utils';
import { Info, TrendingUp, TrendingDown, Activity, Zap, AlertCircle } from 'lucide-react';
import { isValidSolanaSignature, isValidSolanaAddress } from '../../lib/solanaUtils';

function fmt(n: number, digits = 2): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(digits)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(digits)}K`;
  return `$${n.toFixed(digits)}`;
}

function fmtPrice(p: number): string {
  if (p < 0.0001) return `$${p.toFixed(8)}`;
  if (p < 0.01)   return `$${p.toFixed(6)}`;
  if (p < 1)      return `$${p.toFixed(4)}`;
  return `$${p.toFixed(2)}`;
}

const MetricTile: React.FC<{ label: string; value: string; sub?: string; positive?: boolean | null }> = ({ label, value, sub, positive }) => (
  <div className="bg-black/20 border border-white/5 rounded-xl px-4 py-3 flex flex-col gap-0.5">
    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    <span className={cn(
      "text-sm font-mono font-bold",
      positive === true ? 'text-emerald-400' : positive === false ? 'text-red-400' : 'text-white'
    )}>{value}</span>
    {sub && <span className="text-[9px] text-slate-600">{sub}</span>}
  </div>
);

export const LiveChartPanel: React.FC<{ intel: SolanaTokenIntel }> = ({ intel }) => {
  const { transactions, pair } = intel;
  const [filter, setFilter] = useState<'all' | 'dev' | 'whale' | 'buy' | 'sell'>('all');
  const [showClusters, setShowClusters] = useState(false);

  const priceUsd  = parseFloat(pair?.priceUsd ?? '0');
  const change24h: number = pair?.priceChange?.h24 ?? 0;
  const change1h: number  = pair?.priceChange?.h1  ?? 0;
  const change6h: number  = pair?.priceChange?.h6  ?? 0;
  const vol24h   = pair?.volume?.h24    ?? 0;
  const liquidityUsd = pair?.liquidity?.usd ?? 0;
  const fdv      = pair?.fdv            ?? 0;
  const buys24h  = pair?.txns?.h24?.buys  ?? 0;
  const sells24h = pair?.txns?.h24?.sells ?? 0;

  // Real buy pressure from transactions (last 2h window)
  const { buyPressure, tradeVelocity, volatilityLabel } = useMemo(() => {
    const cutoff = Date.now() - 2 * 3600 * 1000;
    const recent = transactions.filter(tx => tx.timestamp > cutoff);
    const buys  = recent.filter(tx => tx.type === 'buy').length;
    const sells = recent.filter(tx => tx.type === 'sell').length;
    const total = buys + sells;
    const buyPct = total > 0 ? Math.round((buys / total) * 100) : (buys24h / Math.max(1, buys24h + sells24h) * 100);

    // trades per minute over last 10 min
    const tenMin = transactions.filter(tx => tx.timestamp > Date.now() - 600_000);
    const velocity = (tenMin.length / 10).toFixed(1);

    // Volatility: std dev of priceAtEvent if available
    const prices = transactions.filter(tx => tx.priceAtEvent).map(tx => tx.priceAtEvent as number);
    let label = 'Normal';
    if (prices.length > 4) {
      const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
      const std  = Math.sqrt(prices.reduce((a, b) => a + (b - mean) ** 2, 0) / prices.length);
      const cv   = mean > 0 ? (std / mean) * 100 : 0;
      label = cv > 20 ? 'High' : cv > 8 ? 'Elevated' : 'Low';
    } else if (Math.abs(change24h) > 50) {
      label = 'High';
    } else if (Math.abs(change24h) > 20) {
      label = 'Elevated';
    }

    return { buyPressure: Math.round(buyPct), tradeVelocity: velocity, volatilityLabel: label };
  }, [transactions, buys24h, sells24h, change24h]);

  const isUp = change24h >= 0;
  const chartColor = isUp ? '#10b981' : '#ef4444';

  const chartData = useMemo(() => {
    const basePrice = priceUsd;
    const now = Date.now();

    const sortedTxs = [...transactions].sort((a, b) => a.timestamp - b.timestamp);

    if (sortedTxs.length > 5 && sortedTxs.some(tx => tx.priceAtEvent)) {
      return sortedTxs.map(tx => ({
        time: new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: tx.priceAtEvent || basePrice,
        liquidity: liquidityUsd,
        volume: tx.amountUSD,
        timestamp: tx.timestamp
      }));
    }

    // Reconstruct a plausible price history from change data
    const points = [];
    for (let i = 40; i >= 0; i--) {
      const time = now - (i * 90 * 1000);
      // Interpolate price based on 24h change
      const fraction = (40 - i) / 40;
      const startPrice = basePrice / (1 + change24h / 100);
      const interpPrice = startPrice + (basePrice - startPrice) * fraction;
      // Add small noise seeded from time to avoid re-render jitter
      const noise = ((time % 997) / 997 - 0.5) * basePrice * 0.008;
      points.push({
        time: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: Math.max(0, interpPrice + noise),
        liquidity: liquidityUsd,
        volume: vol24h / 960,
        timestamp: time
      });
    }
    return points;
  }, [pair, transactions, priceUsd, change24h, liquidityUsd, vol24h]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (filter === 'all')   return true;
      if (filter === 'dev')   return tx.isDev;
      if (filter === 'whale') return tx.isWhale;
      if (filter === 'buy')   return tx.type === 'buy';
      if (filter === 'sell')  return tx.type === 'sell';
      return true;
    });
  }, [transactions, filter]);

  const eventMarkers = useMemo(() => {
    return filteredTransactions.map(tx => {
      const closestPoint = chartData.reduce((prev, curr) =>
        Math.abs(curr.timestamp - tx.timestamp) < Math.abs(prev.timestamp - tx.timestamp) ? curr : prev
      );
      return { x: closestPoint.time, y: closestPoint.price, z: tx.amountUSD, ...tx };
    });
  }, [filteredTransactions, chartData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-panel border border-slate-border p-3 rounded-xl shadow-2xl text-xs space-y-2 pointer-events-auto z-50">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500 uppercase font-bold tracking-widest text-[10px]">Time</span>
            <span className="font-mono">{d.time}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500 uppercase font-bold tracking-widest text-[10px]">Price</span>
            <span className={cn("font-mono font-bold", isUp ? 'text-emerald-400' : 'text-red-400')}>{fmtPrice(d.price)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500 uppercase font-bold tracking-widest text-[10px]">Volume</span>
            <span className="font-mono">{fmt(d.volume)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const MarkerTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-panel border border-slate-border p-3 rounded-xl shadow-2xl text-xs space-y-2 min-w-[220px] pointer-events-auto z-[100]">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn("w-2 h-2 rounded-full", data.isDev ? (data.type === 'buy' ? "bg-emerald-500" : "bg-red-500") : (data.type === 'buy' ? "bg-blue-500" : "bg-amber-500"))} />
            <span className="font-bold uppercase tracking-widest text-[10px]">{data.isDev ? 'Developer' : 'Whale'} {data.type}</span>
            {data.indexedStatus === 'awaiting' && (
              <span className="ml-auto px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-bold rounded border border-amber-500/20 animate-pulse">AWAITING</span>
            )}
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500 uppercase font-bold tracking-widest text-[10px]">Wallet</span>
            {isValidSolanaAddress(data.wallet) ? (
              <a href={`https://solscan.io/account/${data.wallet}`} target="_blank" rel="noopener noreferrer" className="font-mono text-primary hover:underline">
                {(data.wallet || '').slice(0, 8)}...{(data.wallet || '').slice(-4)}
              </a>
            ) : (
              <span className="font-mono text-slate-500">{data.wallet}</span>
            )}
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500 uppercase font-bold tracking-widest text-[10px]">Amount</span>
            <span className="font-mono">{fmt(data.amountUSD)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500 uppercase font-bold tracking-widest text-[10px]">Time</span>
            <span className="font-mono">{new Date(data.timestamp).toLocaleTimeString()}</span>
          </div>
          <div className="pt-2 border-t border-slate-border">
            {isValidSolanaSignature(data.txHash) ? (
              <a href={`https://solscan.io/tx/${data.txHash}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                VIEW ON SOLSCAN <Zap size={10} />
              </a>
            ) : (
              <div className="flex items-center gap-1 text-[9px] text-slate-500 italic">
                <AlertCircle size={10} /> Tx signature unavailable
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-panel border border-slate-border rounded-2xl p-6 flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-display font-bold">Live Market Intelligence</h3>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase">Live Feed</span>
          </div>
          <div className="group relative">
            <Info size={14} className="text-slate-500 cursor-help" />
            <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-slate-panel border border-slate-border rounded-xl shadow-2xl text-[10px] text-slate-400 z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <p className="font-bold text-white mb-1 uppercase tracking-widest">Intelligence Definitions</p>
              <ul className="space-y-1 list-disc pl-3">
                <li><span className="text-primary">Whale:</span> Transaction value &gt; $2,000 USD.</li>
                <li><span className="text-red-400">Developer:</span> Wallets identified as contract deployers or team.</li>
                <li><span className="text-emerald-400">Buy/Sell:</span> Classified via DEX swap direction heuristics.</li>
                <li><span className="text-slate-300">Price line:</span> Reconstructed from on-chain transactions or interpolated from 24h change when live data is sparse.</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-black/20 border border-slate-border rounded-lg p-1">
            {(['all', 'dev', 'whale', 'buy', 'sell'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-3 py-1 text-[9px] font-bold uppercase rounded transition-all",
                  filter === f ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
              >{f}</button>
            ))}
          </div>
          <button onClick={() => setShowClusters(!showClusters)}
            className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase transition-all",
              showClusters ? "bg-primary/20 border-primary text-primary" : "bg-black/20 border-slate-border text-slate-500")}
          >
            <Activity size={12} /> Clusters
          </button>
        </div>
      </div>

      {/* ── Metrics Strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        <MetricTile
          label="Price"
          value={fmtPrice(priceUsd)}
          sub={pair?.priceNative ? `${parseFloat(pair.priceNative).toFixed(6)} SOL` : undefined}
        />
        <MetricTile
          label="24h Change"
          value={`${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`}
          sub={`1h: ${change1h >= 0 ? '+' : ''}${change1h.toFixed(1)}%  6h: ${change6h >= 0 ? '+' : ''}${change6h.toFixed(1)}%`}
          positive={change24h >= 0}
        />
        <MetricTile label="24h Volume"  value={fmt(vol24h)} />
        <MetricTile label="Market Cap"  value={fmt(fdv)} />
        <MetricTile label="Liquidity"   value={fmt(liquidityUsd)} />
      </div>

      {/* ── Chart ──────────────────────────────────────────────────────────── */}
      <div className="h-[380px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={chartColor} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4b" vertical={false} />
            <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis
              yAxisId="price"
              stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false}
              orientation="right"
              domain={['auto', 'auto']}
              tickFormatter={(v) => fmtPrice(v)}
            />
            <YAxis
              yAxisId="volume"
              stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false}
              orientation="left"
              tickFormatter={(v) => fmt(v, 0)}
              width={55}
            />
            <ZAxis dataKey="z" range={[50, 400]} />
            <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'auto' }} />
            <Legend
              verticalAlign="top" align="right" iconType="circle"
              wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingBottom: '12px' }}
            />
            <Bar
              yAxisId="volume"
              name="Volume"
              dataKey="volume"
              fill={chartColor}
              opacity={0.25}
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
            <Area
              yAxisId="price"
              name="Price (USD)"
              type="monotone"
              dataKey="price"
              stroke={chartColor}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPrice)"
              animationDuration={800}
            />
            <Scatter
              yAxisId="price"
              name="On-chain Events"
              data={eventMarkers}
              fill="#8884d8"
            >
              {eventMarkers.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isDev ? (entry.type === 'buy' ? "#10b981" : "#ef4444") : (entry.type === 'buy' ? "#137fec" : "#f59e0b")}
                  className="cursor-pointer pointer-events-auto hover:stroke-white hover:stroke-2 transition-all"
                  strokeWidth={1}
                  stroke="rgba(255,255,255,0.2)"
                />
              ))}
            </Scatter>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-black/20 border border-white/5 flex items-center gap-4">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", buyPressure >= 50 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-400")}>
            {buyPressure >= 50 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Buy Pressure</div>
            <div className={cn("text-lg font-display font-bold", buyPressure >= 50 ? "text-emerald-400" : "text-red-400")}>{buyPressure}%</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-black/20 border border-white/5 flex items-center gap-4">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center",
            volatilityLabel === 'High' ? "bg-red-500/10 text-red-400" :
            volatilityLabel === 'Elevated' ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary")}>
            <Activity size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Volatility</div>
            <div className={cn("text-lg font-display font-bold",
              volatilityLabel === 'High' ? "text-red-400" : volatilityLabel === 'Elevated' ? "text-amber-400" : "text-white"
            )}>{volatilityLabel}</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-black/20 border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Zap size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trade Velocity</div>
            <div className="text-lg font-display font-bold">{tradeVelocity}/min</div>
          </div>
        </div>
      </div>
    </div>
  );
};

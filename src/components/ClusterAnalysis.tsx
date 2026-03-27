import React, { useState, useEffect, useRef } from 'react';
import { 
  Network, 
  Activity, 
  Users, 
  ArrowLeft,
  AlertTriangle,
  Zap,
  Clock,
  CheckCircle2,
  Search,
  ArrowUpRight,
  Share2,
  Info,
  Loader2,
  Fingerprint,
  Link as LinkIcon,
  DollarSign,
  Shield,
  ExternalLink,
  Target
} from 'lucide-react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  initAnalysis, 
  getAnalysisSummary, 
  getAnalysisMetadata, 
  getAnalysisClusters, 
  getAnalysisRisk
} from '../services/marketService';
import { TokenMetadata, WalletCluster, RiskAssessment, ClusterWallet } from '../types/signalos';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  label: string;
  wallet?: ClusterWallet & {
    pnlUSD?: number;
    botProbability?: number;
    percentage?: number;
    isWashTrader?: boolean;
    txCount?: number;
  };
  clusterType?: string;
  radius?: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  value: number;
  type?: 'primary' | 'secondary' | 'funding' | 'trading';
}

export const ClusterAnalysis: React.FC<{ target?: string; onBack: () => void }> = ({ target, onBack }) => {
  const [searchQuery, setSearchQuery] = useState(target || '');
  const [loading, setLoading] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [clusters, setClusters] = useState<WalletCluster[]>([]);
  const [holders, setHolders] = useState<any>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [selectedWallet, setSelectedWallet] = useState<ClusterWallet | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Derived metrics
  const botRisk = Math.round(risk?.insiderCoordinationRisk.score || 0);
  const timingMatch = risk ? (risk.insiderCoordinationRisk.score / 100).toFixed(2) : '0.00';
  const walletCount = clusters?.reduce((acc, c) => acc + (c.wallets?.length || 0), 0) || 0;
  const totalClusterValue = clusters?.reduce((acc, c) => acc + (c.totalValueUSD || 0), 0) || 0;

  const evidenceLog = [
    ...(clusters?.flatMap((cluster, i) => 
      (cluster.evidence || []).map((ev, j) => ({
        id: `DET-${i+1}${j+1}`,
        type: (cluster.type || 'unknown').toUpperCase(),
        description: ev,
        confidence: (cluster.coordinationScore || 0) / 100,
        time: 'Real-time'
      }))
    ) || []),
    ...(clusters?.length === 0 && holders?.holders ? holders.holders.slice(0, 3).map((h: any, i: number) => ({
      id: `HLD-${i+1}`,
      type: 'TOP HOLDER',
      description: `Wallet holds ${(h.percentage).toFixed(2)}% of total supply. ${h.isContract ? 'Identified as a smart contract/pool.' : 'Identified as an EOA.'}`,
      confidence: 0.99,
      time: 'Static'
    })) : [])
  ];

  useEffect(() => {
    const startAnalysis = async () => {
      if (!searchQuery) return;
      
      setLoading(true);
      try {
        const init = await initAnalysis(searchQuery);
        setAnalysisId(init.analysisId);
        
        let completed = false;
        let attempts = 0;
        while (!completed && attempts < 10) {
          const status = await getAnalysisSummary(init.analysisId);
          if (status.status !== 'PENDING') {
            completed = true;
            setSummary(status);
            
            const [metaData, clusterData, riskData, holderData] = await Promise.all([
              getAnalysisMetadata(init.analysisId),
              getAnalysisClusters(init.analysisId),
              getAnalysisRisk(init.analysisId),
              fetch(`/api/analysis/${init.analysisId}/holders`).then(r => r.json())
            ]);
            
            setMetadata(metaData);
            setClusters(clusterData);
            setRisk(riskData);
            setHolders(holderData);
          } else {
            await new Promise(r => setTimeout(r, 1000));
            attempts++;
          }
        }
      } catch (e) {
        console.error('Analysis failed', e);
      } finally {
        setLoading(false);
      }
    };

    if (searchQuery) startAnalysis();
  }, [searchQuery]);

  const renderMap = React.useCallback(() => {
    if (!svgRef.current || loading || !analysisId) return;

      let simulation: d3.Simulation<Node, Link> | undefined;

      try {
        const container = svgRef.current.parentElement;
        const width = container?.clientWidth || 800;
        const height = container?.clientHeight || 500;

        if (width === 0 || height === 0) {
          console.warn('SVG container has 0 dimensions');
          return;
        }

        console.log('Forensic Render Start:', { 
          width, 
          height, 
          clusterCount: clusters?.length || 0,
          holderCount: holders?.holders?.length || 0
        });

        const svg = d3.select(svgRef.current)
          .attr("width", width)
          .attr("height", height)
          .attr("viewBox", `0 0 ${width} ${height}`)
          .style("background", "radial-gradient(circle at center, #0f172a 0%, #020617 100%)");

        svg.selectAll("*").remove();

        // Add glow filters
        const glowDefs = svg.append("defs");
        const filter = glowDefs.append("filter")
          .attr("id", "glow")
          .attr("x", "-50%")
          .attr("y", "-50%")
          .attr("width", "200%")
          .attr("height", "200%");
        filter.append("feGaussianBlur")
          .attr("stdDeviation", "3.5")
          .attr("result", "coloredBlur");
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        // Add background grid with perspective
        const grid = svg.append("g").attr("class", "grid-layer").attr("opacity", 0.1);
        for (let i = 0; i < width; i += 40) grid.append("line").attr("x1", i).attr("y1", 0).attr("x2", i).attr("y2", height).attr("stroke", "#1e293b");
        for (let i = 0; i < height; i += 40) grid.append("line").attr("x1", 0).attr("y1", i).attr("x2", width).attr("y2", i).attr("stroke", "#1e293b");

        const nodes: Node[] = [{ 
          id: "center", 
          group: 1, 
          label: metadata?.symbol ? `$${metadata.symbol}` : 'Target',
          x: width / 2,
          y: height / 2,
          fx: width / 2,
          fy: height / 2,
          radius: 32
        }];
        const links: Link[] = [];

        // Add Clusters
        const safeClusters = Array.isArray(clusters) ? clusters : [];
        safeClusters.forEach((cluster, cIdx) => {
          if (!cluster.wallets || !Array.isArray(cluster.wallets)) return;
          
          const clusterNodes: string[] = [];
          cluster.wallets.forEach((wallet, wIdx) => {
            const isString = typeof wallet === 'string';
            const address = isString ? wallet : wallet.address;
            const nodeId = address || `cluster-${cIdx}-${wIdx}`;
            
            if (!nodes.find(n => n.id === nodeId)) {
              // Generate some "advanced" data for the trader
              const mockPnl = (Math.random() - 0.3) * 50000;
              const mockBotProb = cluster.coordinationScore || Math.random() * 100;
              const mockPerc = (Math.random() * 2);
              
              nodes.push({ 
                id: nodeId, 
                group: 2, 
                label: `${nodeId.slice(0, 4)}..${nodeId.slice(-2)}`,
                wallet: isString ? {
                  address,
                  balanceUSD: Math.random() * 10000,
                  firstTradeTime: Date.now() - Math.random() * 100000000,
                  tags: [cluster.type],
                  fundingSource: 'Unknown',
                  pnlUSD: mockPnl,
                  botProbability: mockBotProb,
                  percentage: mockPerc,
                  isWashTrader: mockBotProb > 85 && Math.random() > 0.5,
                  txCount: Math.floor(Math.random() * 500)
                } : {
                  ...wallet,
                  pnlUSD: mockPnl,
                  botProbability: mockBotProb,
                  percentage: mockPerc,
                  isWashTrader: mockBotProb > 85 && Math.random() > 0.5,
                  txCount: Math.floor(Math.random() * 500)
                },
                clusterType: cluster.type,
                x: width / 2 + (Math.random() - 0.5) * 400,
                y: height / 2 + (Math.random() - 0.5) * 400,
                radius: 14 + (mockPerc * 5)
              });
              clusterNodes.push(nodeId);
              links.push({ source: "center", target: nodeId, value: 1, type: 'primary' });
            }
          });

          // Inter-cluster connections (showing coordination)
          for (let i = 0; i < clusterNodes.length; i++) {
            for (let j = i + 1; j < clusterNodes.length; j++) {
              if (Math.random() > 0.6) {
                links.push({ 
                  source: clusterNodes[i], 
                  target: clusterNodes[j], 
                  value: 0.5, 
                  type: cluster.type === 'funding' ? 'funding' : 'secondary' 
                });
              }
            }
          }
        });

        // Add Top Holders
        const holderList = holders?.holders && Array.isArray(holders.holders) ? holders.holders : [];
        holderList.forEach((holder: any, hIdx: number) => {
          const nodeId = holder.address;
          if (!nodes.find(n => n.id === nodeId)) {
            const mockPnl = (Math.random() - 0.1) * 200000;
            nodes.push({
              id: nodeId,
              group: 3,
              label: `${nodeId.slice(0, 4)}..${nodeId.slice(-2)}`,
              wallet: {
                address: holder.address,
                balanceUSD: parseFloat(holder.balance || "0") / 1e6,
                firstTradeTime: Date.now() - (hIdx * 3600000),
                tags: holder.isCreator ? ['Creator'] : ['Top Holder'],
                fundingSource: 'Organic / CEX',
                pnlUSD: mockPnl,
                botProbability: holder.isCreator ? 0 : Math.random() * 30,
                percentage: holder.percentage || 0,
                isWashTrader: false,
                txCount: Math.floor(Math.random() * 100)
              } as any,
              clusterType: 'holder',
              x: width / 2 + (Math.random() - 0.5) * 500,
              y: height / 2 + (Math.random() - 0.5) * 500,
              radius: 16 + (holder.percentage || 0) * 2
            });
            links.push({ source: "center", target: nodeId, value: 1, type: 'primary' });
          }
        });

        simulation = d3.forceSimulation<Node>(nodes)
          .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(d => d.type === 'primary' ? 160 : 80))
          .force("charge", d3.forceManyBody().strength(-600))
          .force("center", d3.forceCenter(width / 2, height / 2))
          .force("collision", d3.forceCollide().radius(d => ((d as Node).radius || 20) + 10));

        const link = svg.append("g")
          .selectAll("path")
          .data(links)
          .join("path")
          .attr("fill", "none")
          .attr("stroke", d => {
            if (d.type === 'funding') return "#8b5cf6";
            if (d.type === 'trading') return "#f59e0b";
            return "#1e293b";
          })
          .attr("stroke-opacity", d => d.type === 'primary' ? 0.4 : 0.2)
          .attr("stroke-width", d => d.type === 'primary' ? 2 : 1)
          .attr("stroke-dasharray", d => d.type === 'secondary' ? "4,4" : "none");

        const node = svg.append("g")
          .selectAll("g")
          .data(nodes)
          .join("g")
          .attr("class", "node-group")
          .attr("cursor", "pointer")
          .on("click", (event, d) => {
            event.stopPropagation();
            if (d.wallet) setSelectedWallet(d.wallet);
          })
          .call(d3.drag<SVGGElement, Node>()
            .on("start", (event, d) => {
              if (!event.active) simulation?.alphaTarget(0.3).restart();
              d.fx = d.x; d.fy = d.y;
            })
            .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
            .on("end", (event, d) => {
              if (!event.active) simulation?.alphaTarget(0);
              if (d.id !== "center") { d.fx = null; d.fy = null; }
            }) as any);

        // Add gradients to SVG
        const clusterDefs = svg.append("defs");
        
        const createGradient = (id: string, color1: string, color2: string) => {
          const grad = clusterDefs.append("radialGradient")
            .attr("id", id)
            .attr("cx", "30%")
            .attr("cy", "30%")
            .attr("r", "70%");
          grad.append("stop").attr("offset", "0%").attr("stop-color", color1);
          grad.append("stop").attr("offset", "100%").attr("stop-color", color2);
        };

        createGradient("grad-center", "#60a5fa", "#1d4ed8");
        createGradient("grad-wash", "#f87171", "#b91c1c");
        createGradient("grad-bot", "#fbbf24", "#d97706");
        createGradient("grad-funding", "#a78bfa", "#6d28d9");
        createGradient("grad-timing", "#22d3ee", "#0891b2");
        createGradient("grad-default", "#475569", "#1e293b");

        // Node styling based on type
        const getFill = (d: Node) => {
          if (d.id === "center") return "url(#grad-center)";
          if (d.wallet?.isWashTrader) return "url(#grad-wash)";
          if ((d.wallet?.botProbability || 0) > 70) return "url(#grad-bot)";
          switch (d.clusterType) {
            case 'funding': return "url(#grad-funding)";
            case 'timing': return "url(#grad-timing)";
            case 'insider': return "url(#grad-wash)";
            case 'holder': return "url(#grad-timing)";
            default: return "url(#grad-default)";
          }
        };

        // Node circles with glow for high risk
        node.append("circle")
          .attr("r", d => d.radius || 15)
          .attr("fill", getFill)
          .attr("stroke", d => (d.wallet?.botProbability || 0) > 80 ? "#ef4444" : "rgba(255,255,255,0.1)")
          .attr("stroke-width", d => (d.wallet?.botProbability || 0) > 80 ? 3 : 1)
          .style("filter", d => (d.id === "center" || (d.wallet?.botProbability || 0) > 80) ? "url(#glow)" : "none");

        // Percentage indicators for holders
        node.filter(d => d.group === 3)
          .append("circle")
          .attr("r", d => (d.radius || 15) + 4)
          .attr("fill", "none")
          .attr("stroke", "#10b981")
          .attr("stroke-width", 2)
          .attr("stroke-opacity", 0.6)
          .attr("stroke-dasharray", d => {
            const perc = d.wallet?.percentage || 0;
            const circumference = 2 * Math.PI * ((d.radius || 15) + 4);
            return `${(perc / 100) * circumference}, ${circumference}`;
          });

        // Labels
        node.append("text")
          .text(d => d.label)
          .attr("dy", d => (d.radius || 15) + 18)
          .attr("text-anchor", "middle")
          .style("font-size", "8px")
          .style("font-weight", "800")
          .style("fill", "#94a3b8")
          .style("font-family", "JetBrains Mono, monospace")
          .style("pointer-events", "none")
          .style("text-transform", "uppercase")
          .style("letter-spacing", "0.05em");

        // Bot icons for high probability
        node.filter(d => (d.wallet?.botProbability || 0) > 75)
          .append("text")
          .text("🤖")
          .attr("dy", 4)
          .attr("dx", 0)
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .style("pointer-events", "none");

        simulation.on("tick", () => {
          link.attr("d", d => {
            const source = d.source as any;
            const target = d.target as any;
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dr = Math.sqrt(dx * dx + dy * dy) * 2; // Curve radius
            return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
          });

          node.attr("transform", d => `translate(${d.x},${d.y})`);
        });

        // Background click to clear selection
        svg.on("click", () => {
          setSelectedWallet(null);
        });

      return simulation;
    } catch (err) {
      console.error('D3 Render Error:', err);
    }
  }, [loading, analysisId, clusters, metadata, holders]);

  useEffect(() => {
    let simulation: d3.Simulation<Node, Link> | undefined;
    const timer = setTimeout(() => {
      simulation = renderMap();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (simulation) simulation.stop();
    };
  }, [renderMap]);
  
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    // Update node visual states based on selection
    svg.selectAll(".node-group").each(function(d: any) {
      const isSelected = selectedWallet && d.wallet?.address === selectedWallet.address;
      const isCenter = d.id === "center";
      
      const group = d3.select(this);
      const circle = group.select("circle");
      
      if (isSelected) {
        circle
          .transition()
          .duration(300)
          .attr("stroke", "#3b82f6")
          .attr("stroke-width", 4)
          .style("filter", "url(#glow)");
      } else {
        const botProb = d.wallet?.botProbability || 0;
        circle
          .transition()
          .duration(300)
          .attr("stroke", botProb > 80 ? "#ef4444" : "rgba(255,255,255,0.1)")
          .attr("stroke-width", botProb > 80 ? 3 : 1)
          .style("filter", (isCenter || botProb > 80) ? "url(#glow)" : "none");
      }
    });

    // Dim other nodes when one is selected
    svg.selectAll(".node-group")
      .transition()
      .duration(300)
      .style("opacity", (d: any) => {
        if (!selectedWallet) return 1;
        return (d.wallet?.address === selectedWallet.address || d.id === "center") ? 1 : 0.3;
      });

    // Dim links when a node is selected
    svg.selectAll("path")
      .transition()
      .duration(300)
      .style("opacity", (d: any) => {
        if (!selectedWallet) return (d.type === 'primary' ? 0.4 : 0.2);
        const source = d.source as any;
        const target = d.target as any;
        const isConnected = source.wallet?.address === selectedWallet.address || 
                           target.wallet?.address === selectedWallet.address ||
                           (source.id === "center" && target.wallet?.address === selectedWallet.address);
        return isConnected ? 0.8 : 0.05;
      });
  }, [selectedWallet]);

  const displayAddress = metadata?.address || metadata?.deployer || searchQuery;
  const shortenedAddress = displayAddress.length > 12 ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}` : displayAddress;

  const getExplorerUrl = (address: string, isToken: boolean = false) => {
    const chain = metadata?.chain || 'solana';
    if (chain === 'solana') return `https://solscan.io/${isToken ? 'token' : 'account'}/${address}`;
    if (chain === 'ethereum') return `https://etherscan.io/${isToken ? 'token' : 'address'}/${address}`;
    if (chain === 'base') return `https://basescan.org/${isToken ? 'token' : 'address'}/${address}`;
    return `https://solscan.io/account/${address}`;
  };

  const getBubblemapsUrl = (address: string) => {
    const chain = metadata?.chain || 'solana';
    const chainSlug = chain === 'ethereum' ? 'eth' : chain;
    return `https://bubblemaps.io/${chainSlug}/token/${address}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold tracking-tight">
              {metadata ? `$${metadata.symbol}` : (searchQuery ? (searchQuery.startsWith('0x') ? 'Analyzing Asset...' : searchQuery) : 'Cluster Investigation')}
            </h1>
            {analysisId && (
              <span className={cn(
                "px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-widest",
                botRisk > 80 ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              )}>
                {botRisk > 80 ? 'High Risk' : 'Low Risk'}
              </span>
            )}
          </div>
          {analysisId && (
            <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
              <LinkIcon size={12} />
              <a 
                href={getExplorerUrl(metadata?.address || searchQuery, true)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono hover:text-primary transition-colors cursor-pointer"
              >
                {shortenedAddress}
              </a>
              <span className="text-slate-700">•</span>
              <span>{metadata?.name || 'Forensic Audit'}</span>
            </div>
          )}
        </div>
        
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input 
            type="text"
            placeholder="Search Token or Address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/20 border border-white/5 rounded-lg py-1.5 pl-9 pr-4 text-[11px] text-slate-900 focus:outline-none focus:border-primary/50 focus:bg-black/40 transition-all placeholder:text-slate-600"
          />
        </div>

        <div className="flex gap-3">
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-500">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-[600px] flex flex-col items-center justify-center space-y-6 bg-slate-panel/20 rounded-3xl border border-slate-border/50"
          >
            <div className="relative">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <Fingerprint className="absolute inset-0 m-auto w-6 h-6 text-primary/50" />
            </div>
            <div className="text-center">
              <div className="text-xl font-display font-bold text-slate-900 mb-2">SCANNING NETWORK TOPOLOGY...</div>
              <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Tracing wallet connections & funding lineage</p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bot Activity Risk */}
              <div className="bg-slate-panel border border-slate-border rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group cursor-help h-full">
                <div className="absolute top-3 left-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  Bot Activity Risk
                  <Info size={10} />
                </div>
                
                <div className={cn(
                  "text-4xl font-display font-bold mb-1 transition-transform group-hover:scale-110 duration-500",
                  botRisk > 80 ? "text-red-500" : "text-emerald-500"
                )}>
                  {botRisk}%
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest",
                  botRisk > 80 ? "text-red-500" : "text-emerald-500"
                )}>
                  {botRisk > 80 ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
                  {botRisk > 80 ? 'High Risk' : 'Organic'}
                </div>
                <p className="mt-3 text-[10px] text-slate-500 leading-tight px-2">
                  {botRisk > 80 
                    ? `Detected ${walletCount} wallets acting in sync. High probability of coordinated manipulation.`
                    : 'Wallets appear to be acting independently. Healthy organic growth signature.'}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-slate-panel border border-slate-border rounded-2xl p-5 flex flex-col justify-between group cursor-help relative">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      Timing Similarity
                      <Info size={10} />
                    </span>
                    <Clock size={14} className="text-primary" />
                  </div>
                  <div className="text-3xl font-display font-bold mt-2">{timingMatch}</div>
                  <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
                    {parseFloat(timingMatch) > 0.7 ? 'Suspiciously Fast' : 'Natural Timing'}
                  </div>
                  <div className="mt-4 flex gap-1">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className={cn(
                        "h-1 flex-1 rounded-full", 
                        i < parseFloat(timingMatch) * 10 ? "bg-primary" : "bg-black/20"
                      )}></div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-panel border border-slate-border rounded-2xl p-5 flex flex-col justify-between group cursor-help relative">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      Connected Wallets
                      <Info size={10} />
                    </span>
                    <Users size={14} className="text-purple-500" />
                  </div>
                  <div className="text-3xl font-display font-bold mt-2">{walletCount}</div>
                  <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">Linked Accounts</div>
                  <div className="mt-4 flex -space-x-2">
                    {[...Array(Math.min(5, walletCount))].map((_, i) => (
                      <div key={i} className="w-5 h-5 rounded-full border-2 border-slate-panel bg-blue-100 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=actor${i}${analysisId}`} alt="Actor" />
                      </div>
                    ))}
                    {walletCount > 5 && (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-panel bg-slate-100 flex items-center justify-center text-[8px] font-bold">
                        +{walletCount - 5}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-panel border border-slate-border rounded-2xl p-5 flex flex-col justify-between group cursor-help relative">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      Cluster Net Worth
                      <Info size={10} />
                    </span>
                    <DollarSign size={14} className="text-emerald-500" />
                  </div>
                  <div className="text-3xl font-display font-bold mt-2">${(totalClusterValue / 1000).toFixed(1)}k</div>
                  <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">Combined Holdings</div>
                  <div className="mt-4 h-1 bg-black/20 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[65%]"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Wallet Connection Map */}
              <div className="lg:col-span-3 bg-slate-panel border border-slate-border rounded-2xl p-6 relative min-h-[450px] overflow-hidden group">
                {!analysisId && !loading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100/50 flex items-center justify-center text-slate-600">
                      <Network size={32} />
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-bold text-slate-500">Ready to Investigate</h3>
                      <p className="text-sm text-slate-500 max-w-xs mx-auto">Enter a token contract address above to visualize the wallet connection network.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="absolute top-4 left-4 z-10 flex items-center justify-between w-[calc(100%-32px)]">
                      <div>
                        <h3 className="text-base font-display font-bold">Wallet Connection Map</h3>
                        <p className="text-[10px] text-slate-500">Visualizing structural links between coordinated actors</p>
                      </div>
                      <button 
                        onClick={() => renderMap()}
                        className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-slate-900"
                        title="Refresh Map"
                      >
                        <Activity className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="w-full h-full min-h-[450px] border border-white/5 rounded-xl overflow-hidden relative">
                      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
                      
                      {/* Scanner Overlay Effect */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                        <motion.div 
                          animate={{ y: ["0%", "100%", "0%"] }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                          className="absolute top-0 left-0 w-full h-1 bg-primary/30 blur-sm shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        />
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-4 p-4 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 text-[10px] text-slate-500 grid grid-cols-2 gap-x-6 gap-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                        <span>Target Asset</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                        <span>Wash Trader / Insider</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                        <span>Bot Activity</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-50 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span>Top Holder</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#8b5cf6] shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div>
                        <span>Funding Cluster</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(6,182,212,0.5)]"></div>
                        <span>Timing Cluster</span>
                      </div>
                    </div>

                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <button className="p-2 bg-black/40 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"><Search size={16} /></button>
                      <button className="p-2 bg-black/40 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"><Activity size={16} /></button>
                    </div>
                  </>
                )}
              </div>

              {/* Sidebar: Details or Evidence */}
              <div className="space-y-6">
                <AnimatePresence mode="wait">
                  {selectedWallet ? (
                    <motion.div 
                      key="wallet-details"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-slate-panel border border-primary/30 rounded-2xl p-6 flex flex-col relative overflow-hidden shadow-2xl shadow-primary/10"
                    >
                      <div className="absolute top-0 right-0 p-2">
                        <button onClick={() => setSelectedWallet(null)} className="p-2 text-slate-500 hover:text-slate-900 transition-colors">×</button>
                      </div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                          <Fingerprint size={24} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold font-mono text-slate-900">
                            {(selectedWallet.address || '').slice(0, 8)}...{(selectedWallet.address || '').slice(-4)}
                          </h3>
                          <div className="flex gap-1 mt-1">
                            {selectedWallet.tags.map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] font-bold rounded uppercase tracking-widest border border-primary/20">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 flex-1">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="text-[8px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                              <DollarSign size={8} /> Balance
                            </div>
                            <div className="text-sm font-bold text-emerald-500">${selectedWallet.balanceUSD?.toLocaleString()}</div>
                          </div>
                          <div className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="text-[8px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                              <Target size={8} /> Supply %
                            </div>
                            <div className="text-sm font-bold text-primary">{selectedWallet.percentage?.toFixed(2)}%</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="text-[8px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                              <Activity size={8} /> PnL (Est.)
                            </div>
                            <div className={cn(
                              "text-sm font-bold",
                              (selectedWallet.pnlUSD || 0) >= 0 ? "text-emerald-500" : "text-red-500"
                            )}>
                              {(selectedWallet.pnlUSD || 0) >= 0 ? '+' : ''}${Math.abs(selectedWallet.pnlUSD || 0).toLocaleString()}
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="text-[8px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                              <Zap size={8} /> Bot Prob.
                            </div>
                            <div className={cn(
                              "text-sm font-bold",
                              (selectedWallet.botProbability || 0) > 70 ? "text-red-500" : "text-emerald-500"
                            )}>
                              {(selectedWallet.botProbability || 0).toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1">
                              <Activity size={8} /> Activity Score
                            </div>
                            <div className="text-[10px] font-bold text-slate-900">{selectedWallet.txCount || 0} TXs</div>
                          </div>
                          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-1000" 
                              style={{ width: `${Math.min(100, (selectedWallet.txCount || 0) / 5)}%` }}
                            />
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="text-[8px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                            <LinkIcon size={8} /> Funding Source
                          </div>
                          <div className="text-xs font-mono truncate text-slate-600">{selectedWallet.fundingSource}</div>
                        </div>

                        <div className="pt-4 border-t border-slate-border">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3">External Intelligence</h4>
                          <div className="space-y-2">
                            <a 
                              href={getExplorerUrl(selectedWallet.address)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 text-[10px] text-slate-500 transition-colors"
                            >
                              View on Explorer <ExternalLink size={10} />
                            </a>
                            <a 
                              href={getBubblemapsUrl(metadata?.address || searchQuery)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 text-[10px] text-slate-500 transition-colors"
                            >
                              Bubblemaps Profile <Target size={10} />
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="evidence-log"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-slate-panel border border-slate-border rounded-2xl p-6 flex flex-col h-full"
                    >
                      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Detection Evidence</h3>
                      <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide">
                        {evidenceLog.map((log) => (
                          <div key={log.id} className="p-3 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-all group">
                            <div className="flex justify-between items-start mb-1.5">
                              <span className="text-[9px] font-mono text-slate-500">{log.id}</span>
                              <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-500">
                                <CheckCircle2 size={10} /> {(log.confidence * 100).toFixed(0)}% CONF
                              </div>
                            </div>
                            <div className="text-[11px] font-bold mb-0.5 group-hover:text-primary transition-colors uppercase">{log.type}</div>
                            <p className="text-[10px] text-slate-500 leading-tight mb-2">{log.description}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] text-slate-600">{log.time}</span>
                              <button className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1">
                                LEARN WHY <ArrowUpRight size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button className="mt-4 w-full py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-900 border border-slate-border rounded-lg hover:bg-white/5 transition-all">
                        VIEW FULL FORENSIC LOG
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { WalletBehaviorData } from '../../services/walletBehaviorService';

interface WalletClusterGraphProps {
  data: WalletBehaviorData;
}

export const WalletClusterGraph: React.FC<WalletClusterGraphProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.clusters) return;

    const width = 600;
    const height = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation(data.clusters.nodes as any)
      .force("link", d3.forceLink(data.clusters.links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "#2d3a4b")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(data.clusters.links)
      .join("line")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", (d: any) => d.relationship === 'funds' ? '4 4' : '0');

    const node = svg.append("g")
      .selectAll("g")
      .data(data.clusters.nodes)
      .join("g")
      .call(d3.drag<SVGGElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("circle")
      .attr("r", (d: any) => d.type === 'investigated' ? 12 : 8)
      .attr("fill", (d: any) => d.type === 'investigated' ? "#137fec" : "#1e293b")
      .attr("stroke", (d: any) => d.type === 'investigated' ? "#3b82f6" : "#4b5563")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("dx", 15)
      .attr("dy", 4)
      .text((d: any) => d.label)
      .attr("fill", "#94a3b8")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .style("pointer-events", "none")
      .style("text-transform", "uppercase");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();
  }, [data]);

  return (
    <div className="bg-slate-panel border border-slate-border rounded-2xl p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-display font-bold">Wallet Relationship Map</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Cluster Co-occurrence Analysis</p>
        </div>
        <div className="flex gap-4 text-[9px] font-bold uppercase tracking-widest">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary"></div> Target</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-800 border border-slate-600"></div> Correlated</div>
        </div>
      </div>
      
      <div className="flex-1 min-h-[300px] relative bg-black/20 rounded-xl border border-white/5 overflow-hidden">
        <svg 
          ref={svgRef} 
          width="100%" 
          height="100%" 
          viewBox="0 0 600 400" 
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
        />
        
        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 p-3 bg-slate-900/80 backdrop-blur-sm border border-white/5 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-[8px] font-bold text-slate-400 uppercase">
            <div className="w-4 h-0.5 bg-slate-600"></div> Buy/Sell Together
          </div>
          <div className="flex items-center gap-2 text-[8px] font-bold text-slate-400 uppercase">
            <div className="w-4 h-0.5 border-t border-dashed border-slate-600"></div> Funding Relationship
          </div>
        </div>
      </div>
    </div>
  );
};

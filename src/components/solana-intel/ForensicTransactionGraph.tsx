import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ForensicNode, ForensicEdge } from '../../services/forensicService';

interface ForensicTransactionGraphProps {
  nodes: ForensicNode[];
  edges: ForensicEdge[];
}

export const ForensicTransactionGraph: React.FC<ForensicTransactionGraphProps> = ({ nodes, edges }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !nodes.length) return;

    const width = 800;
    const height = 500;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const nodeIds = new Set(nodes.map(n => n.id));
    const validEdges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(validEdges).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "#2d3a4b")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(validEdges)
      .join("line")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", (d: any) => d.type === 'funding' ? '4 4' : '0')
      .attr("marker-end", "url(#arrowhead)");

    // Arrowhead marker
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#4b5563")
      .style("stroke", "none");

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<SVGGElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("circle")
      .attr("r", (d: any) => d.type === 'contract' ? 14 : d.type === 'lp' ? 12 : 8)
      .attr("fill", (d: any) => 
        d.type === 'contract' ? "#8b5cf6" : 
        d.type === 'lp' ? "#10b981" : 
        "#3b82f6"
      )
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("dx", 15)
      .attr("dy", 4)
      .text((d: any) => d.label)
      .attr("fill", "#94a3b8")
      .style("font-size", "9px")
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
  }, [nodes, edges]);

  return (
    <div className="bg-slate-panel border border-slate-border rounded-2xl p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-display font-bold">Forensic Transaction Graph</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Network Interaction & Flow Analysis</p>
        </div>
        <div className="flex gap-4 text-[9px] font-bold uppercase tracking-widest">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Wallet</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Contract</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> LP</div>
        </div>
      </div>
      
      <div className="flex-1 min-h-[400px] relative bg-black/20 rounded-xl border border-white/5 overflow-hidden">
        <svg 
          ref={svgRef} 
          width="100%" 
          height="100%" 
          viewBox="0 0 800 500" 
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

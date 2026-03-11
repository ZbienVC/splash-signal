import React, { useState } from 'react';
import { 
  Database, 
  TrendingUp, 
  Globe, 
  Twitter, 
  Cpu, 
  Info, 
  ExternalLink,
  Shield,
  AlertCircle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Evidence, SourceRef } from '../../types';
import { cn } from '../../lib/utils';
import { EvidenceModal } from './EvidenceModal';

interface SourceChipProps {
  evidence: Evidence;
  title: string;
  className?: string;
}

export const SourceChip: React.FC<SourceChipProps> = ({ evidence, title, className }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasSources = evidence.sources.length > 0;
  const primarySource = hasSources ? evidence.sources[0] : null;

  const getKindIcon = (kind: SourceRef['kind']) => {
    switch (kind) {
      case 'solscan': return <Database size={10} />;
      case 'dexscreener': return <TrendingUp size={10} />;
      case 'gdelt': return <Globe size={10} />;
      case 'twitter': return <Twitter size={10} />;
      case 'rpc': return <Cpu size={10} />;
      default: return <Info size={10} />;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (evidence.sources.length > 1 || !hasSources) {
      setIsModalOpen(true);
    } else if (primarySource) {
      window.open(primarySource.url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!hasSources) {
    return (
      <>
        <button 
          onClick={handleClick}
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-bold uppercase tracking-widest hover:bg-amber-500/20 transition-all",
            className
          )}
        >
          <AlertCircle size={10} />
          DEMO / NO SOURCE
        </button>
        <EvidenceModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          evidence={evidence} 
          title={title} 
        />
      </>
    );
  }

  return (
    <>
      <button 
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[8px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all group",
          className
        )}
      >
        {getKindIcon(primarySource!.kind)}
        <span className="max-w-[80px] truncate">{primarySource!.label}</span>
        {evidence.sources.length > 1 && (
          <span className="text-slate-500 ml-0.5">+{evidence.sources.length - 1}</span>
        )}
        <ExternalLink size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
      <EvidenceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        evidence={evidence} 
        title={title} 
      />
    </>
  );
};

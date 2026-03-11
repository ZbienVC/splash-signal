import React, { useEffect, useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ArrowUpRight,
  FileText,
  Shield,
  Users,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getUserArchive } from '../services/marketService';

export const AnalystArchive: React.FC<{ onItemSelected: (id: string) => void }> = ({ onItemSelected }) => {
  const [archiveItems, setArchiveItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadArchive = async () => {
      setLoading(true);
      try {
        const data = await getUserArchive();
        setArchiveItems(data);
      } catch (e) {
        console.error('Failed to load archive', e);
      } finally {
        setLoading(false);
      }
    };
    loadArchive();
  }, []);

  const filteredItems = archiveItems.filter(item => 
    (item.identifier?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    item.id.toString().includes(searchQuery)
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Analyst Archive</h1>
          <p className="text-slate-500 mt-1">History of all investigations, reports, and system audits</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input 
              type="text" 
              placeholder="Search archive..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/20 border border-white/5 rounded-lg py-1.5 pl-9 pr-4 text-[11px] w-64 focus:outline-none focus:border-primary/50 focus:bg-black/40 transition-all placeholder:text-slate-600"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-1.5 bg-black/20 border border-white/5 rounded-lg text-[11px] font-bold hover:bg-white/5 transition-all">
            <Filter size={14} /> FILTER
          </button>
        </div>
      </div>

      <div className="bg-slate-panel border border-slate-border rounded-2xl overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-[400px] flex flex-col items-center justify-center text-slate-500 space-y-4">
            <History size={48} className="opacity-20" />
            <p>No investigations found in your archive.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 border-b border-slate-border">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Investigation ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target / Input</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chain</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-border/50">
              {filteredItems.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => onItemSelected(item.id.toString())}
                  className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">INV-{item.id}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold group-hover:text-primary transition-colors truncate max-w-[200px]">{item.identifier}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400 capitalize">
                      <Shield size={12} />
                      {item.chain}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                    {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest",
                      item.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                    )}>{item.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-600 hover:text-white transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filteredItems.length > 0 && (
        <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
          <span>Showing {filteredItems.length} investigations</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-border rounded hover:bg-white/5 disabled:opacity-50" disabled>PREV</button>
            <button className="px-3 py-1 border border-slate-border rounded bg-primary border-primary text-white">1</button>
            <button className="px-3 py-1 border border-slate-border rounded hover:bg-white/5 disabled:opacity-50" disabled>NEXT</button>
          </div>
        </div>
      )}
    </div>
  );
};

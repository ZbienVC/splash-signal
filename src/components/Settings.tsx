import React, { useState } from 'react';
import { 
  Globe, 
  Layout, 
  Clock, 
  DollarSign, 
  Zap, 
  Save,
  Shield,
  Bell,
  Monitor
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    defaultLandingPage: user?.settings?.defaultLandingPage || 'home',
    timezone: user?.settings?.timezone || 'UTC',
    units: user?.settings?.units || 'USD',
    dataMode: user?.settings?.dataMode || 'light'
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    updateUser({
      settings: {
        defaultLandingPage: formData.defaultLandingPage as any,
        timezone: formData.timezone,
        units: formData.units as any,
        dataMode: formData.dataMode as any
      }
    });
    setIsSaving(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Analyst Settings</h1>
          <p className="text-slate-500 mt-1">Configure your terminal preferences and profile</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {isSaving ? <Zap size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Preferences Section */}
        <section className="bg-slate-panel border border-slate-border rounded-2xl p-6 space-y-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Monitor size={14} /> Terminal Preferences
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Default Landing Page</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Layout size={14} /></div>
                <select 
                  value={formData.defaultLandingPage}
                  onChange={(e) => setFormData({...formData, defaultLandingPage: e.target.value as any})}
                  className="w-full bg-black/20 border border-slate-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-all appearance-none"
                >
                  <option value="home">Home Dashboard</option>
                  <option value="market-overview">Market Overview</option>
                  <option value="investigation-gateway">Investigation Gateway</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Timezone</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Clock size={14} /></div>
                <select 
                  value={formData.timezone}
                  onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                  className="w-full bg-black/20 border border-slate-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-all appearance-none"
                >
                  <option value="UTC">UTC (Universal Time)</option>
                  <option value="America/New_York">EST (New York)</option>
                  <option value="Europe/London">GMT (London)</option>
                  <option value="Asia/Tokyo">JST (Tokyo)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Valuation Units</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><DollarSign size={14} /></div>
                  <select 
                    value={formData.units}
                    onChange={(e) => setFormData({...formData, units: e.target.value as any})}
                    className="w-full bg-black/20 border border-slate-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-all appearance-none"
                  >
                    <option value="USD">USD</option>
                    <option value="NATIVE">Native Token</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Data Mode</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Zap size={14} /></div>
                  <select 
                    value={formData.dataMode}
                    onChange={(e) => setFormData({...formData, dataMode: e.target.value as any})}
                    className="w-full bg-black/20 border border-slate-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-all appearance-none"
                  >
                    <option value="light">Light (Fast)</option>
                    <option value="heavy">Heavy (Full Depth)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Security & System */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-panel/50 border border-slate-border rounded-2xl p-6 flex flex-col items-center text-center">
          <Shield className="text-primary mb-3" size={24} />
          <h4 className="text-sm font-bold mb-1">Security Audit</h4>
          <p className="text-[10px] text-slate-500">Last audit: 2h ago</p>
        </div>
        <div className="bg-slate-panel/50 border border-slate-border rounded-2xl p-6 flex flex-col items-center text-center">
          <Bell className="text-amber-500 mb-3" size={24} />
          <h4 className="text-sm font-bold mb-1">Notifications</h4>
          <p className="text-[10px] text-slate-500">12 Active Alerts</p>
        </div>
        <div className="bg-slate-panel/50 border border-slate-border rounded-2xl p-6 flex flex-col items-center text-center">
          <Monitor className="text-emerald-500 mb-3" size={24} />
          <h4 className="text-sm font-bold mb-1">System Health</h4>
          <p className="text-[10px] text-slate-500">v2.4.1 Stable</p>
        </div>
      </div>
    </div>
  );
};

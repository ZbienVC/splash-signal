import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserPlus, LogIn, Camera, Shield, Droplets, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await signup(username, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -mr-96 -mt-96 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[100px] -ml-72 -mb-72"></div>
        <div className="absolute inset-0 fluid-bg opacity-30"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-slate-panel border border-slate-border rounded-2xl p-8 relative z-10 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 border border-primary/30 overflow-hidden shadow-2xl shadow-primary/20">
            <img 
              src="https://i.imgur.com/DJKVOsz.png" 
              alt="SplashSignal Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">SplashSignal I.O.</h1>
          <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-mono">Intelligence Access</p>
        </div>

        <div className="flex gap-4 mb-8 p-1 bg-black/20 rounded-lg">
          <button 
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${!isLogin ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            CREATE ACCOUNT
          </button>
          <button 
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${isLogin ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            LOGIN
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs font-bold flex items-center gap-2">
            <Shield size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                {isLogin ? 'Access Identifier' : 'Analyst Designation'}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <UserPlus size={16} />
                </div>
                <input 
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isLogin ? "Enter username..." : "Choose analyst name..."}
                  className="w-full bg-black/20 border border-slate-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Security Keyphrase
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Shield size={16} />
                </div>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/20 border border-slate-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : (isLogin ? <LogIn size={18} /> : <UserPlus size={18} />)}
            <span className="tracking-widest uppercase text-xs">
              {loading ? 'AUTHENTICATING...' : (isLogin ? 'ESTABLISH LINK' : 'INITIALIZE PROTOCOL')}
            </span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-border/50 flex items-center justify-center gap-4 opacity-50 grayscale">
          <div className="h-4 w-px bg-slate-border"></div>
          <span className="text-[10px] font-mono text-slate-500">ENCRYPTED_SESSION_V2.4</span>
          <div className="h-4 w-px bg-slate-border"></div>
        </div>
      </motion.div>
    </div>
  );
};

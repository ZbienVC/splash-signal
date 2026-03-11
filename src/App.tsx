import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MarketOverview } from './components/MarketOverview';
import { AttentionFeed } from './components/AttentionFeed';
import { InvestigationGateway } from './components/InvestigationGateway';
import { TokenIntelligenceTerminal } from './components/TokenIntelligenceTerminal';
import { TokenAnalysis } from './components/TokenAnalysis';
import { WalletIntelligence } from './components/DetailedInvestigation';
import { ClusterAnalysis } from './components/ClusterAnalysis';
import { ReasoningAudit } from './components/ReasoningAudit';
import { NarrativeMonitor } from './components/NarrativeMonitor';
import { AnalystArchive } from './components/AnalystArchive';
import { ContentAnalyzer } from './components/ContentAnalyzer';
import { TrustHistory } from './components/TrustHistory';
import { HomeScreen } from './components/HomeScreen';
import { AuthScreen } from './components/AuthScreen';
import { Settings } from './components/Settings';
import { TokenIntelPage } from './components/solana-intel/TokenIntelPage';
import { HunterFeed } from './components/HunterFeed';
import SmartMoneyTracker from './components/wallet-behavior/SmartMoneyTracker';
import { WalletBehavioralIntelligence } from './components/wallet-behavior/WalletBehavioralIntelligence';
import { LiquidityIntelligence } from './components/solana-intel/LiquidityIntelligence';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ViewId } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { NarrativeSync } from './components/NarrativeSync';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<ViewId>(user?.settings?.defaultLandingPage || 'home');
  const [analysisTarget, setAnalysisTarget] = useState<string>('');

  React.useEffect(() => {
    const landingPage = user?.settings?.defaultLandingPage;
    if (landingPage) {
      setActiveView(landingPage);
    }
  }, [user?.settings?.defaultLandingPage]);

  const handleModuleSelect = (id: string, target?: string) => {
    if (target) setAnalysisTarget(target);
    setActiveView(id as ViewId);
  };

  const renderView = () => {
    switch (activeView) {
      case 'settings':
        return <Settings />;
      case 'solana-intel':
        return <TokenIntelPage />;
      case 'hunter-feed':
        return <HunterFeed />;
      case 'smart-money':
        return <SmartMoneyTracker />;
      case 'wallet-behavior':
        return <WalletBehavioralIntelligence target={analysisTarget} onBack={() => setActiveView('investigation-gateway')} />;
      case 'liquidity-intel':
        return <LiquidityIntelligence mint={analysisTarget} />;
      case 'home':
        return <HomeScreen onNavigate={(view) => setActiveView(view)} />;
      case 'market-overview':
        return <MarketOverview />;
      case 'attention-feed':
        return <AttentionFeed />;
      case 'investigation-gateway':
        return <TokenIntelligenceTerminal />;
      case 'token-analysis':
        return <TokenAnalysis target={analysisTarget} onBack={() => setActiveView('investigation-gateway')} />;
      case 'wallet-intelligence':
        return <WalletIntelligence target={analysisTarget} onBack={() => setActiveView('investigation-gateway')} />;
      case 'cluster-analysis':
        return <ClusterAnalysis target={analysisTarget} onBack={() => setActiveView('investigation-gateway')} />;
      case 'reasoning-audit':
        return <ReasoningAudit target={analysisTarget} onBack={() => setActiveView('investigation-gateway')} />;
      case 'narrative-monitor':
        return <NarrativeMonitor />;
      case 'archive':
        return <AnalystArchive onItemSelected={(id) => {
          setAnalysisTarget(id);
          // Determine view based on analysis type if possible, or just default to a view
          // For now, we'll try to be smart based on the ID prefix or just set a default
          setActiveView('token-analysis'); 
        }} />;
      case 'content-analyzer':
        return <ContentAnalyzer id={analysisTarget} onBack={() => setActiveView('archive')} />;
      case 'trust-history':
        return <TrustHistory onBack={() => setActiveView('archive')} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-slate-500">
            <div className="text-4xl font-display font-bold mb-4 opacity-20 uppercase tracking-widest">{activeView.replace('-', ' ')}</div>
            <p className="text-sm">Module implementation in progress...</p>
            <button 
              onClick={() => setActiveView('market-overview')}
              className="mt-8 px-6 py-2 bg-primary text-white rounded-lg font-bold text-xs"
            >
              RETURN TO DASHBOARD
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background-dark overflow-hidden selection:bg-primary/30 selection:text-white">
      <NarrativeSync />
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -mr-96 -mt-96 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[100px] -ml-72 -mb-72"></div>
          <div className="absolute inset-0 fluid-bg opacity-30"></div>
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-primary/5 to-transparent opacity-50"></div>
          <div className="absolute inset-0 chart-grid opacity-10"></div>
        </div>

        <Header 
          activeView={activeView} 
          onSearch={(query) => {
            setAnalysisTarget(query);
            setActiveView('token-analysis');
          }} 
        />
        
        <div className="flex-1 overflow-y-auto relative scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Status Bar */}
        <footer className="h-8 border-t border-slate-border bg-slate-panel flex items-center justify-between px-6 text-[10px] font-mono text-slate-500 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span>SYSTEM_READY</span>
            </div>
            <div className="h-3 w-px bg-slate-border"></div>
            <span>NODE_ID: 0x882A...F92</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{new Date().toISOString()}</span>
            <div className="h-3 w-px bg-slate-border"></div>
            <span className="text-primary">v2.4.1-STABLE</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

const LinkAuditUtility = () => {
  React.useEffect(() => {
    // Only run in development
    if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('run.app')) return;

    const auditLinks = () => {
      const elements = document.querySelectorAll('.cursor-pointer, .hover\\:text-primary, .hover\\:underline');
      const deadLinks: any[] = [];

      elements.forEach((el) => {
        const isAnchor = el.tagName === 'A';
        const hasOnClick = (el as any).onclick || el.hasAttribute('onclick') || (el as any).__reactProps$?.onClick;
        const hasRoleLink = el.getAttribute('role') === 'link';
        
        if (!isAnchor && !hasOnClick && !hasRoleLink) {
          deadLinks.push({
            text: el.textContent?.trim().slice(0, 30),
            tag: el.tagName,
            classes: el.className,
          });
        }
      });

      if (deadLinks.length > 0) {
        console.warn('🔗 Link Audit: Detected potential "dead" links (styled as links but no <a> or role="link"):', deadLinks);
      }
    };

    const timeout = setTimeout(auditLinks, 3000);
    return () => clearTimeout(timeout);
  }, []);

  return null;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LinkAuditUtility />
      <AppContent />
    </AuthProvider>
  );
};

export default App;

export interface User {
  username: string;
  login: string;
  email: string;
  displayName: string;
  profilePicture: string;
  role: string;
  status: string;
  settings: {
    defaultLandingPage: 'home' | 'market-overview' | 'investigation-gateway';
    timezone: string;
    units: 'USD' | 'NATIVE';
    dataMode: 'light' | 'heavy';
  };
}

export type SourceRef = {
  label: string;
  url: string;
  kind: 'dexscreener' | 'solscan' | 'pumpfun' | 'gdelt' | 'wiki' | 'trends' | 'twitter' | 'rpc' | 'internal' | 'other';
  timestamp?: string;
};

export type Evidence = {
  summary?: string;
  sources: SourceRef[];
  raw?: Record<string, any>;
};

export type SourcedMetric<T> = {
  value: T;
  display: string;
  evidence: Evidence;
};

export type ViewId = 
  | 'home'
  | 'market-overview' 
  | 'attention-feed' 
  | 'investigation-gateway' 
  | 'token-analysis' 
  | 'wallet-intelligence' 
  | 'wallet-behavior'
  | 'liquidity-intel'
  | 'cluster-analysis' 
  | 'reasoning-audit' 
  | 'content-analyzer' 
  | 'trust-history' 
  | 'archive' 
  | 'narrative-monitor'
  | 'solana-intel'
  | 'hunter-feed'
  | 'smart-money'
  | 'alpha-hunter'
  | 'dump-detector'
  | 'signal-feed'
  | 'wallet-ranking'
  | 'settings'
  | 'alpha-hunter'      // New Alpha Hunter view
  | 'dump-detector'     // New Dump/Risk view
  | 'wallet-ranking'    // New Wallet Ranking view
  | 'signal-feed';      // New Signal Feed view

export interface NavItem {
  id: ViewId;
  label: string;
  icon: string;
  category: 'macro' | 'tools' | 'system';
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'market-overview', label: 'Global State', icon: 'Public', category: 'macro' },
  { id: 'attention-feed', label: 'Attention Feed', icon: 'NotificationsActive', category: 'macro' },
  { id: 'narrative-monitor', label: 'Narrative Intensity', icon: 'Forum', category: 'macro' },
  { id: 'investigation-gateway', label: 'Investigation', icon: 'ManageSearch', category: 'tools' },
  { id: 'archive', label: 'Analyst Archive', icon: 'History', category: 'tools' },
  { id: 'token-analysis', label: 'Reports', icon: 'Description', category: 'tools' },
  { id: 'solana-intel', label: 'Solana Intel', icon: 'Zap', category: 'tools' },
  { id: 'hunter-feed', label: 'Hunter Scanner', icon: 'Radar', category: 'tools' },
  { id: 'smart-money', label: 'Smart Money', icon: 'Trophy', category: 'tools' },
  { id: 'alpha-hunter', label: 'Alpha Hunter', icon: 'Bolt', category: 'tools' },
  { id: 'dump-detector', label: 'Dump Detector', icon: 'Warning', category: 'tools' },
  { id: 'wallet-ranking', label: 'Wallet Rankings', icon: 'EmojiEvents', category: 'tools' },
  { id: 'signal-feed', label: 'Signal Feed', icon: 'Campaign', category: 'tools' },
];

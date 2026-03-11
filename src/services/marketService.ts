export interface TokenData {
  name: string;
  symbol: string;
  priceUsd: string;
  priceChange: {
    h24: number;
  };
  volume: {
    h24: number;
  };
  liquidity: {
    usd: number;
  };
  fdv?: number;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
}

export const fetchTokenData = async (address: string): Promise<TokenData | null> => {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    
    if (data.pairs && data.pairs.length > 0) {
      // Sort by liquidity to get the most relevant pair
      const sortedPairs = data.pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
      return sortedPairs[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching token data:', error);
    return null;
  }
};

export const getDeterministicScore = (address: string, seed: string, min: number = 40, max: number = 99): number => {
  let hash = 0;
  const combined = address + seed;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const absHash = Math.abs(hash);
  return min + (absHash % (max - min + 1));
};

// --- SignalOS Backend API ---

export const initAnalysis = async (input: string) => {
  const response = await fetch('/api/analyze/init', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ input })
  });
  return response.json();
};

export const getAnalysisSummary = async (id: string) => {
  const response = await fetch(`/api/analysis/${id}/summary`);
  return response.json();
};

export const getAnalysisMetadata = async (id: string) => {
  const response = await fetch(`/api/analysis/${id}/metadata`);
  return response.json();
};

export const getAnalysisHolders = async (id: string) => {
  const response = await fetch(`/api/analysis/${id}/holders`);
  return response.json();
};

export const getAnalysisClusters = async (id: string) => {
  const response = await fetch(`/api/analysis/${id}/clusters`);
  return response.json();
};

export const getAnalysisLiquidity = async (id: string) => {
  const response = await fetch(`/api/analysis/${id}/liquidity`);
  return response.json();
};

export const getAnalysisRisk = async (id: string) => {
  const response = await fetch(`/api/analysis/${id}/risk`);
  return response.json();
};

export const getAnalysisTemporal = async (id: string) => {
  const response = await fetch(`/api/analysis/${id}/temporal`);
  return response.json();
};

export const getAnalysisClusterIntelligence = async (id: string) => {
  const response = await fetch(`/api/analysis/${id}/cluster-intelligence`);
  return response.json();
};

export const getAnalysisWallet = async (id: string) => {
  const response = await fetch(`/api/analysis/${id}/wallet`);
  return response.json();
};

export const getAnalysisAudit = async (id: string) => {
  const response = await fetch(`/api/analysis/${id}/audit`);
  return response.json();
};

export const getAnalysisContent = async (id: string) => {
  const response = await fetch(`/api/analysis/${id}/content`);
  return response.json();
};

export const getUserArchive = async () => {
  const response = await fetch('/api/me/archive');
  if (!response.ok) return [];
  return response.json();
};

export const getNarrativeHistory = async (id: string) => {
  const response = await fetch(`/api/narrative-history/${id}`);
  if (!response.ok) return [];
  return response.json();
};

export const getMarketOverview = async (refresh: boolean = false) => {
  const response = await fetch(`/api/market-overview${refresh ? '?refresh=true' : ''}`);
  if (!response.ok) throw new Error('Failed to fetch market overview');
  return response.json();
};

export const getGlobalState = async () => {
  const response = await fetch('/api/global-state');
  return response.json();
};

export const getAltStrength = async (timeframe: string = '24H') => {
  const response = await fetch(`/api/alt-strength?timeframe=${timeframe}`);
  return response.json();
};

export const getNarratives = async () => {
  const response = await fetch('/api/narratives');
  return response.json();
};

export const getMemeHealth = async () => {
  const response = await fetch('/api/meme-health');
  return response.json();
};

export const getWhales = async () => {
  const response = await fetch('/api/whales');
  return response.json();
};

export const getAlerts = async () => {
  const response = await fetch('/api/alerts');
  if (!response.ok) return [];
  return response.json();
};

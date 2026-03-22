// API Layer Integration and Frontend Utilities
import { NextRequest } from 'next/server';

// ============= API CLIENT =============

export class SplashSignalAPI {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = '/api', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.error || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }

    return response.json();
  }

  // Trending tokens
  async getTrendingTokens(params: {
    limit?: number;
    minAlpha?: number;
    maxRug?: number;
    timeframe?: '1h' | '6h' | '24h';
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value));
    });
    
    return this.request<TrendingTokensResponse>(`/tokens/trending?${searchParams}`);
  }

  // Token analysis
  async getTokenAnalysis(address: string) {
    return this.request<TokenAnalysisResponse>(`/token/${address}`);
  }

  // Alerts
  async getAlerts(params: {
    page?: number;
    limit?: number;
    type?: string[];
    severity?: string[];
    category?: string[];
    token?: string;
    timeframe?: string;
    status?: 'active' | 'resolved' | 'expired';
  } = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          searchParams.set(key, value.join(','));
        } else {
          searchParams.set(key, String(value));
        }
      }
    });

    return this.request<AlertsResponse>(`/alerts?${searchParams}`);
  }

  // Create alert (internal use)
  async createAlert(alertData: {
    type: string;
    severity: string;
    category: string;
    tokenAddress: string;
    title: string;
    message: string;
    data?: any;
    confidence?: number;
  }) {
    return this.request<{ success: boolean; data: any }>('/alerts', {
      method: 'POST',
      body: JSON.stringify(alertData)
    });
  }

  // Update alert status
  async updateAlert(alertId: string, status: string, userId?: string) {
    return this.request<{ success: boolean; data: any }>('/alerts', {
      method: 'PATCH',
      body: JSON.stringify({ alertId, status, userId })
    });
  }

  // Wallet analysis
  async getWalletAnalysis(address: string) {
    return this.request<WalletAnalysisResponse>(`/wallet/${address}`);
  }
}

// ============= RESPONSE TYPES =============

export interface TrendingTokensResponse {
  success: boolean;
  cached: boolean;
  data: {
    tokens: TrendingToken[];
    count: number;
    timestamp: string;
    filters: {
      limit: number;
      minAlpha: number;
      maxRug: number;
      timeframe: string;
    };
    metadata: {
      totalProcessed: number;
      avgAlphaScore: number;
      avgRugScore: number;
    };
  };
}

export interface TrendingToken {
  address: string;
  symbol: string;
  name: string;
  alphaScore: number;
  rugScore: number;
  price: number | null;
  volume24h: number | null;
  liquidity: number | null;
  marketCap: number | null;
  holders: number;
  age: number;
  trending: {
    volumeGrowth24h: number;
    holderGrowth24h: number;
    priceChange24h: number;
  };
  signals: string[];
  confidence: number;
  lastUpdated: string;
}

export interface TokenAnalysisResponse {
  success: boolean;
  cached: boolean;
  data: {
    token: TokenInfo;
    analysis: {
      alphaScore: any;
      rugScore: any;
      recommendation: {
        action: string;
        reasoning: string;
        confidence: number;
        riskLevel: string;
      };
    };
    holders: HolderAnalysis;
    liquidity: LiquidityAnalysis;
    activity: ActivityAnalysis;
    signals: {
      recent: RecentAlert[];
      activeCount: number;
    };
    metadata: {
      lastUpdated: string;
      dataFreshness: string;
      analysisTime: number;
    };
  };
}

export interface AlertsResponse {
  success: boolean;
  cached: boolean;
  data: {
    alerts: FormattedAlert[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      hasMore: boolean;
    };
    filters: {
      type?: string[];
      severity?: string[];
      category?: string[];
      token?: string;
      timeframe?: string;
    };
    metadata: {
      timestamp: string;
      activeAlerts: number;
      alertsByType: Record<string, number>;
      alertsBySeverity: Record<string, number>;
    };
  };
}

export interface WalletAnalysisResponse {
  success: boolean;
  cached: boolean;
  data: {
    wallet: WalletInfo;
    portfolio: PortfolioAnalysis;
    trading: TradingAnalysis;
    reputation: ReputationAnalysis;
    activity: ActivityTimeline;
    metadata: {
      lastUpdated: string;
      dataCompleteness: number;
      analysisConfidence: number;
      limitations: string[];
    };
  };
}

// ============= ERROR HANDLING =============

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// ============= FRONTEND UTILITIES =============

export class FrontendUtils {
  // Format numbers for display
  static formatNumber(num: number, decimals: number = 2): string {
    if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  }

  // Format currency
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: amount < 1 ? 4 : 2,
      maximumFractionDigits: amount < 1 ? 6 : 2
    }).format(amount);
  }

  // Format percentage
  static formatPercentage(value: number, decimals: number = 1): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
  }

  // Format time ago
  static formatTimeAgo(timestamp: string): string {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;

    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  // Get alert severity color
  static getAlertColor(severity: string): string {
    const colors = {
      'EMERGENCY': '#8B0000',
      'CRITICAL': '#DC143C',
      'HIGH': '#FF4500',
      'MEDIUM': '#FFA500',
      'LOW': '#32CD32'
    };
    return colors[severity as keyof typeof colors] || '#888888';
  }

  // Get alert severity emoji
  static getAlertEmoji(severity: string): string {
    const emojis = {
      'EMERGENCY': '🚨🚨🚨',
      'CRITICAL': '🔥',
      'HIGH': '⚠️',
      'MEDIUM': '💡',
      'LOW': 'ℹ️'
    };
    return emojis[severity as keyof typeof emojis] || '📊';
  }

  // Get recommendation color
  static getRecommendationColor(action: string): string {
    const colors = {
      'STRONG_BUY': '#00ff88',
      'BUY': '#00d4ff',
      'CAUTIOUS': '#ffaa00',
      'MONITOR': '#888888',
      'PASS': '#ff8800',
      'AVOID': '#ff4444'
    };
    return colors[action as keyof typeof colors] || '#888888';
  }

  // Validate Ethereum address
  static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Truncate address for display
  static truncateAddress(address: string, chars: number = 6): string {
    if (!this.isValidAddress(address)) return address;
    return `${address.slice(0, 2 + chars)}...${address.slice(-chars)}`;
  }

  // Get risk level color
  static getRiskColor(riskLevel: string): string {
    const colors = {
      'LOW': '#00ff88',
      'MEDIUM': '#ffaa00',
      'HIGH': '#ff8800',
      'CRITICAL': '#ff4444',
      'EMERGENCY': '#8B0000'
    };
    return colors[riskLevel as keyof typeof colors] || '#888888';
  }

  // Sort tokens by multiple criteria
  static sortTokens(tokens: TrendingToken[], sortBy: string = 'alphaScore'): TrendingToken[] {
    return [...tokens].sort((a, b) => {
      switch (sortBy) {
        case 'alphaScore':
          return b.alphaScore - a.alphaScore;
        case 'rugScore':
          return a.rugScore - b.rugScore; // Lower rug score is better
        case 'volume':
          return (b.volume24h || 0) - (a.volume24h || 0);
        case 'marketCap':
          return (b.marketCap || 0) - (a.marketCap || 0);
        case 'age':
          return a.age - b.age; // Newer tokens first
        case 'confidence':
          return b.confidence - a.confidence;
        default:
          return 0;
      }
    });
  }

  // Filter tokens
  static filterTokens(tokens: TrendingToken[], filters: {
    minAlpha?: number;
    maxRug?: number;
    minVolume?: number;
    minMarketCap?: number;
    maxAge?: number; // hours
    signals?: string[];
  }): TrendingToken[] {
    return tokens.filter(token => {
      if (filters.minAlpha && token.alphaScore < filters.minAlpha) return false;
      if (filters.maxRug && token.rugScore > filters.maxRug) return false;
      if (filters.minVolume && (token.volume24h || 0) < filters.minVolume) return false;
      if (filters.minMarketCap && (token.marketCap || 0) < filters.minMarketCap) return false;
      if (filters.maxAge && token.age > filters.maxAge) return false;
      if (filters.signals && !filters.signals.some(signal => token.signals.includes(signal))) return false;
      return true;
    });
  }
}

// ============= REACT HOOKS (if using React) =============

export const useAPI = () => {
  const api = new SplashSignalAPI();
  
  return {
    api,
    formatNumber: FrontendUtils.formatNumber,
    formatCurrency: FrontendUtils.formatCurrency,
    formatPercentage: FrontendUtils.formatPercentage,
    formatTimeAgo: FrontendUtils.formatTimeAgo,
    getAlertColor: FrontendUtils.getAlertColor,
    getAlertEmoji: FrontendUtils.getAlertEmoji,
    getRecommendationColor: FrontendUtils.getRecommendationColor,
    truncateAddress: FrontendUtils.truncateAddress,
    getRiskColor: FrontendUtils.getRiskColor,
    sortTokens: FrontendUtils.sortTokens,
    filterTokens: FrontendUtils.filterTokens
  };
};

// ============= WEBSOCKET CLIENT =============

export class AlertWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Function[]> = new Map();

  constructor(url: string) {
    this.url = url;
  }

  connect(filters?: {
    severity?: string[];
    type?: string[];
    tokens?: string[];
  }) {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('🔗 WebSocket connected to alerts stream');
        this.reconnectAttempts = 0;
        
        // Send filters if provided
        if (filters) {
          this.send({ type: 'SET_FILTERS', filters });
        }
        
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('message', data);
          
          if (data.type === 'NEW_ALERT') {
            this.emit('alert', data.alert);
          } else if (data.type === 'RECENT_ALERTS') {
            this.emit('recent', data.alerts);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('❌ WebSocket disconnected');
        this.emit('disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      this.emit('error', error);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect();
      }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.emit('maxReconnectReached');
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  subscribeToken(tokenAddress: string) {
    this.send({ type: 'SUBSCRIBE_TOKEN', tokenAddress });
  }

  unsubscribeToken(tokenAddress: string) {
    this.send({ type: 'UNSUBSCRIBE_TOKEN', tokenAddress });
  }

  updateFilters(filters: any) {
    this.send({ type: 'SET_FILTERS', filters });
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      if (callback) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      } else {
        callbacks.length = 0;
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

// ============= EXAMPLE USAGE =============

export const EXAMPLE_USAGE = {
  // Basic API usage
  basicAPI: `
// Initialize API client
const api = new SplashSignalAPI();

// Get trending tokens
const trending = await api.getTrendingTokens({
  limit: 20,
  minAlpha: 60,
  maxRug: 40
});

// Analyze specific token  
const analysis = await api.getTokenAnalysis('0x1234...abcd');

// Get recent alerts
const alerts = await api.getAlerts({
  type: ['ENTRY_SIGNAL', 'EXIT_SIGNAL'],
  severity: ['HIGH', 'CRITICAL'],
  limit: 50
});
  `,

  // WebSocket usage
  websocket: `
// Connect to alert stream
const alertClient = new AlertWebSocketClient('ws://localhost:3000/alerts/stream');

alertClient.on('alert', (alert) => {
  console.log('🚨 New alert:', alert);
  showNotification(alert);
});

alertClient.connect({
  severity: ['HIGH', 'CRITICAL'],
  type: ['ENTRY_SIGNAL', 'EXIT_SIGNAL']
});

// Subscribe to specific token
alertClient.subscribeToken('0x1234...abcd');
  `,

  // Frontend utilities
  frontend: `
// Format numbers for display
const { formatCurrency, formatPercentage, getAlertColor } = useAPI();

const TokenCard = ({ token }) => (
  <div>
    <h3>{token.symbol}</h3>
    <p>Price: {formatCurrency(token.price)}</p>
    <p>Alpha: {token.alphaScore}/100</p>
    <p>24h Change: {formatPercentage(token.trending.priceChange24h)}</p>
  </div>
);

const AlertItem = ({ alert }) => (
  <div style={{ borderLeft: \`4px solid \${getAlertColor(alert.severity)}\` }}>
    <h4>{alert.alert.title}</h4>
    <p>{alert.alert.message}</p>
  </div>
);
  `,

  // Error handling
  errorHandling: `
try {
  const result = await api.getTokenAnalysis('invalid-address');
} catch (error) {
  if (error instanceof APIError) {
    if (error.status === 404) {
      console.log('Token not found');
    } else if (error.status === 400) {
      console.log('Invalid request:', error.message);
    } else {
      console.error('API error:', error.message);
    }
  } else {
    console.error('Network error:', error);
  }
}
  `
};

// Type definitions for better TypeScript support
export type {
  TrendingToken,
  TrendingTokensResponse,
  TokenAnalysisResponse,
  AlertsResponse,
  WalletAnalysisResponse
};

// Additional type definitions that would be used
interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  chainId: number;
  price: number | null;
  marketCap: number | null;
  volume24h: number | null;
  liquidity: number | null;
  verified: boolean;
  ownershipRenounced: boolean;
  isProxy: boolean;
  buyTax: number | null;
  sellTax: number | null;
  createdAt: string;
  age: string;
}

interface HolderAnalysis {
  total: number;
  breakdown: {
    whales: number;
    snipers: number;
    normal: number;
    fresh: number;
  };
  distribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  topHolders: Array<{
    address: string;
    percentage: number;
    type: string;
    isSniper: boolean;
    firstBuy: string | null;
  }>;
}

interface LiquidityAnalysis {
  pools: Array<{
    address: string;
    dex: string;
    pairedWith: string;
    totalLiquidity: number;
    token0Reserve: number;
    token1Reserve: number;
    isLocked: boolean;
    lockUntil: string | null;
    lockProvider: string | null;
  }>;
  totalLiquidity: number;
  liquidityRatio: number;
  isLocked: boolean;
  riskLevel: string;
}

interface ActivityAnalysis {
  transactions24h: number;
  volume24h: number;
  uniqueTraders24h: number;
  buyVsSell: {
    buys: number;
    sells: number;
    ratio: number;
  };
  priceChange: {
    '5m': number;
    '1h': number;
    '24h': number;
  };
  devActivity: {
    recentSells: Array<{
      amount: number;
      value: number;
      timestamp: string;
    }>;
    totalDevSells24h: number;
    devHolding: number;
    riskLevel: string;
  };
}

interface RecentAlert {
  type: string;
  severity: string;
  message: string;
  timestamp: string;
}

interface FormattedAlert {
  id: string;
  type: string;
  severity: string;
  category: string;
  token: {
    address: string;
    symbol: string;
    name: string;
    price: number | null;
    marketCap: number | null;
  };
  alert: {
    title: string;
    message: string;
    confidence: number;
    timestamp: string;
    expiresAt: string | null;
  };
  data: any;
  metadata: {
    triggeredBy: string;
    age: string;
    priority: number;
  };
}

interface WalletInfo {
  address: string;
  type: string;
  isDevWallet: boolean;
  isSniper: boolean;
  riskScore: number | null;
  labels: string[];
  createdAt: string;
  lastActivity: string;
  age: string;
}

interface PortfolioAnalysis {
  totalValue: number;
  totalTokens: number;
  activePosistions: number;
  portfolioHealth: string;
  diversification: number;
  holdings: any[];
}

interface TradingAnalysis {
  summary: any;
  performance: any;
  patterns: any;
  recent: any[];
}

interface ReputationAnalysis {
  smartMoneyScore: number;
  isKnownProfitable: boolean;
  followersCount: number;
  successRate: number;
  riskAssessment: string;
  trustLevel: string;
  flags: string[];
  achievements: string[];
}

interface ActivityTimeline {
  timeline: any[];
  heatmap: Record<string, number>;
  chains: any[];
}
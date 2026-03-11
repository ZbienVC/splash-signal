
export type Chain = 'ethereum' | 'base' | 'solana';

export interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  chain: Chain;
  creationBlock?: number;
  creationSlot?: number;
  deployer: string;
  launchpadType?: 'pumpfun' | 'bonk' | 'standard';
  bondingCurveProgress?: number;
  isGraduated?: boolean;
}

export interface Holder {
  address: string;
  balance: string;
  percentage: number;
  isContract: boolean;
  isCreator: boolean;
}

export interface HolderAnalysis {
  top10Percentage: number;
  giniCoefficient: number;
  singleWalletDominance: boolean;
  creatorShare: number;
  holders: Holder[];
}

export interface LiquidityPool {
  platform: string;
  address: string;
  liquidityUSD: number;
  isLocked: boolean;
  ownershipPercentage: number;
  proximityToDev: number; // 0-100
}

export interface LiquidityAnalysis {
  primaryPools: LiquidityPool[];
  totalLiquidityUSD: number;
  lpOwnershipRisk: number;
  removalRisk: number;
  depthScore: number;
  isLocked: boolean;
  lockDuration?: string;
}

export interface ClusterWallet {
  address: string;
  balanceUSD: number;
  firstTradeTime: number;
  fundingSource?: string;
  tags: string[];
  pnlUSD?: number;
  botProbability?: number;
  percentage?: number;
  isWashTrader?: boolean;
  txCount?: number;
}

export interface WalletCluster {
  id: string;
  type: 'funding' | 'timing' | 'behavioral' | 'insider';
  wallets: ClusterWallet[];
  coordinationScore: number;
  evidence: string[];
  totalValueUSD: number;
}

import { Evidence } from '../types';

export interface Signal {
  id: string;
  name: string;
  value: any;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence?: Evidence;
}

export interface RiskScore {
  score: number; // 0-100
  label: string;
  evidence: string[];
  confidence: number; // 0-1
  sourcedEvidence?: Evidence;
}

export interface RiskAssessment {
  ownershipRisk: RiskScore;
  concentrationRisk: RiskScore;
  liquidityRisk: RiskScore;
  insiderCoordinationRisk: RiskScore;
  contractRisk: RiskScore;
  compositeRugLikelihood: RiskScore;
}

export interface TemporalPoint {
  phase: 'launch' | 'early_accumulation' | 'distribution';
  timestamp: number;
  momentum: number;
  dispersion: number;
  velocity: number;
}

export interface TemporalAnalysis {
  currentPhase: string;
  temporalScores: {
    launchMomentum: number;
    participationDispersion: number;
    clusterPersistence: number;
    liquidityVelocity: number;
  };
  temporalEvidence: string[];
}

export interface ClusterEvidence {
  wallet: string;
  signature: string;
  amount: number;
  timestamp: number;
  usdValue: number;
}

export interface ClusterIntelligence {
  id: string;
  clusterType: 'Whale Accumulation' | 'Distribution' | 'Bot Activity';
  signalStrength: 'Low' | 'Medium' | 'High';
  interpretation: string;
  wallets: string[];
  transactions: string[];
  totalVolume: number;
  startTime: number;
  endTime: number;
  evidence: ClusterEvidence[];
  confidence: number;
}

export interface NarrativeRotation {
  from: string;
  to: string;
  strength: number; // 0-100
  reason: string;
}

export interface NarrativePerformance {
  name: string;
  volumeChange24h: number;
  tokenCount: number;
  avgPriceChange24h: number;
  topTokens: string[];
  socialMentions: number;
  priceMomentum: number; // 0-100 (NarrativeScore)
  description?: string;
  relatedNews?: { title: string; link: string }[];
  // New actionable metrics
  socialVelocity: number;
  volumeGrowth: number;
  tokenLaunchCount: number;
  walletGrowth: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  marketCap: number;
  trend: 'Rising' | 'Peaking' | 'Cooling';
  tokens: NarrativeToken[];
}

export interface MemeMarketHealth {
  launchesPerHour: number;
  launches24h: number;
  bondedCount24h: number;
  avgSurvivalTime: string;
  medianMarketCap: number;
  medianLiquidity: number;
  bondingSuccessRate: number;
  launchRateData: { timestamp: number; count: number }[];
  timestamp: number;
}

export interface WhaleTransaction {
  address: string;
  amount: number;
  timestamp: number;
  type: 'buy' | 'sell';
  symbol: string;
  mint: string;
  txHash: string;
  solscanLink: string;
}

export interface WhaleActivitySummary {
  totalBuyVolume: number;
  totalSellVolume: number;
  topAccumulatedTokens: {
    symbol: string;
    mint: string;
    whaleVolume: number;
  }[];
  whaleFlowData: { timestamp: number; buyVolume: number; sellVolume: number }[];
  recentTransactions: WhaleTransaction[];
}

export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export interface MarketAlert {
  id: string;
  type: 'whale_buy' | 'liquidity_removal' | 'large_launch' | 'unusual_activity' | 'volume_spike' | 'dev_sell' | 'narrative_surge';
  token: {
    name: string;
    symbol: string;
    mint: string;
  };
  trigger: string;
  confidence: number; // 0-1
  priority: AlertPriority;
  description: string;
  timestamp: number;
  source: string;
  link: string;
  txHash?: string;
}

export interface GlobalIntelligence {
  marketMode: {
    mode: 'Risk-On' | 'Risk-Off' | 'Neutral' | 'Alt Season' | 'BTC Dominance';
    confidence: number; // 0-100
    signals: { 
      label: string; 
      value: string | number; 
      change24h: string | number;
      interpretation: string;
      status: 'positive' | 'negative' | 'neutral'; 
      sourceLink?: string 
    }[];
  };
  altStrength: {
    index: number; // 0-100
    trend: 'rising' | 'falling';
    comparisonData: { 
      timestamp: number; 
      btc: number; 
      total2: number; 
      sol: number;
      macd?: number;
      rsi?: number;
      volume?: number;
    }[];
  };
  narratives: NarrativePerformance[];
  narrativeRotation: NarrativeRotation[];
  memeHealth: MemeMarketHealth;
  whaleActivity: WhaleActivitySummary;
  alerts: MarketAlert[];
  timestamp: number;
}

export interface NarrativeSignal {
  id: string;
  name: string;
  momentumScore: 'Low' | 'Medium' | 'High';
  momentumValue: number; // 0-100
  description: string;
  keywords: string[];
  sources: { name: string; link: string }[];
  detectedAt: number;
}

export interface NewsIntelligence {
  id: string;
  title: string;
  summary: string;
  narrativeId?: string;
  source: string;
  link: string;
  timestamp: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevance: number; // 0-1
}

export interface NarrativeToken {
  id: string;
  narrativeId: string;
  name: string;
  symbol: string;
  mint: string;
  priceUsd: number;
  change24h: number;
  marketCap: number;
  liquidity: number;
  volume24h: number;
  launchTime: number;
  matchReason: string;
  source: 'dexscreener' | 'pumpfun' | 'solana';
  link: string;
}

export interface NarrativeIntelligence {
  signals: NarrativeSignal[];
  news: NewsIntelligence[];
  tokens: NarrativeToken[];
  timestamp: number;
}

export interface AnalysisResult {
  id: string;
  chain: Chain;
  identifier: string;
  metadata: TokenMetadata;
  holders: HolderAnalysis;
  liquidity: LiquidityAnalysis;
  clusters: WalletCluster[];
  clusterIntelligence?: ClusterIntelligence[];
  signals: Signal[];
  risk: RiskAssessment;
  temporal: TemporalAnalysis;
  wallet?: any;
  audit?: any;
  content?: any;
  verdict: {
    summary: string;
    explanation: string;
    confidence: number;
  };
  timestamp: number;
}

export interface SolanaTokenIntel {
  metadata: TokenMetadata;
  pair: any;
  transactions: SolanaTransaction[];
  holders: HolderAnalysis;
  devActivity: DevActivity[];
  riskSignals: RiskSignal[];
}

export interface SolanaTransaction {
  id: string;
  wallet: string;
  type: 'buy' | 'sell';
  amountToken: number;
  amountUSD: number;
  timestamp: number;
  isWhale: boolean;
  isDev: boolean;
  isNewWallet: boolean;
  txHash: string;
  evidence?: Evidence;
  priceAtEvent?: number;
  indexedStatus?: 'indexed' | 'awaiting' | 'failed';
  confidence?: number;
}

export interface DevActivity {
  wallet: string;
  action: string;
  amount: string;
  timestamp: number;
  txHash: string;
}

export interface RiskSignal {
  id: string;
  label: string;
  status: 'critical' | 'high' | 'medium' | 'low';
  evidence: string;
  timestamp: number;
  sourcedEvidence?: Evidence;
}

export type HunterLifecycleStage = 
  | 'DISCOVERED' 
  | 'PUMPFUN_LAUNCH' 
  | 'POOL_CREATED' 
  | 'DEXSCREENER_INDEXED' 
  | 'BOOSTED' 
  | 'TRENDING' 
  | 'DORMANT';

export interface HunterToken {
  mint: string;
  name: string;
  symbol: string;
  image?: string;
  description?: string;
  creator?: string;
  createdAt: number;
  updatedAt: number;
  socials?: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  market?: {
    priceUsd: number;
    liquidity: number;
    volume24h: number;
    fdv: number;
    pairAddress?: string;
  };
  risk?: {
    score: number;
    tags: string[];
    mintAuthority: boolean;
    freezeAuthority: boolean;
    topHolderPercent: number;
    isRenounced: boolean;
  };
  classification?: {
    category: string;
    confidence: number;
    reasoning?: string;
  };
  lifecycle: {
    stage: HunterLifecycleStage;
    lastTransition: number;
  };
  signals: {
    type: string;
    timestamp: number;
    payload?: any;
  }[];
  alphaRating?: {
    score: number;
    label: 'S' | 'A' | 'B' | 'C' | 'D';
    reasoning: string[];
  };
  devReputation?: {
    score: number;
    label: string;
    totalTokens: number;
    rugs: number;
    maxMc: number;
  };
  smartWalletSignals?: {
    count: number;
    tier: string;
    wallets: string[];
  };
  pumpProbability?: number;
  bondingCurveProgress?: number;
  athMc?: number;
}

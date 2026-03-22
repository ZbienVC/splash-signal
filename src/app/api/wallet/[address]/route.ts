// /api/wallet/[address] - Wallet analysis and activity
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL!);

interface WalletAnalysis {
  wallet: {
    address: string;
    type: string;
    isDevWallet: boolean;
    isSniper: boolean;
    riskScore: number | null;
    labels: string[];
    createdAt: string;
    lastActivity: string;
    age: string;
  };

  portfolio: {
    totalValue: number;
    totalTokens: number;
    activePosistions: number;
    portfolioHealth: string;
    diversification: number; // 0-100 score
    holdings: Array<{
      token: {
        address: string;
        symbol: string;
        name: string;
        price: number | null;
      };
      position: {
        balance: number;
        percentage: number; // % of token supply
        value: number; // USD value
        costBasis: number | null;
        pnl: number | null;
        pnlPercentage: number | null;
      };
      activity: {
        firstBuy: string | null;
        lastTx: string | null;
        transactions: number;
        totalBought: number;
        totalSold: number;
        avgBuyPrice: number | null;
        avgSellPrice: number | null;
      };
      risk: {
        concentration: number; // % of wallet value
        liquidityRisk: string;
        rugRisk: number;
        exitDifficulty: string;
      };
    }>;
  };

  trading: {
    summary: {
      totalTransactions: number;
      winRate: number;
      totalVolume: number;
      avgPositionSize: number;
      avgHoldTime: number; // hours
      mostTradedToken: string;
    };
    performance: {
      realizedPnL: number;
      unrealizedPnL: number;
      totalPnL: number;
      bestTrade: {
        token: string;
        pnl: number;
        percentage: number;
        date: string;
      } | null;
      worstTrade: {
        token: string;
        pnl: number;
        percentage: number;
        date: string;
      } | null;
    };
    patterns: {
      tradingFrequency: string; // VERY_ACTIVE, ACTIVE, MODERATE, SLOW
      avgSessionDuration: number;
      preferredTimeOfDay: string;
      riskTolerance: string; // HIGH, MEDIUM, LOW
      strategyType: string; // SCALPER, SWING, HOLD, UNKNOWN
    };
    recent: Array<{
      token: {
        address: string;
        symbol: string;
        name: string;
      };
      type: string; // BUY, SELL, TRANSFER
      amount: number;
      value: number;
      price: number;
      timestamp: string;
      age: string;
    }>;
  };

  reputation: {
    smartMoneyScore: number; // 0-100
    isKnownProfitable: boolean;
    followersCount: number; // Estimated based on copy traders
    successRate: number;
    riskAssessment: string;
    trustLevel: string;
    flags: string[];
    achievements: string[];
  };

  activity: {
    timeline: Array<{
      date: string;
      transactions: number;
      volume: number;
      tokensTraded: number;
      pnl: number;
    }>;
    heatmap: Record<string, number>; // Hour of day activity
    chains: Array<{
      chainId: number;
      chainName: string;
      transactionCount: number;
      volume: number;
    }>;
  };

  metadata: {
    lastUpdated: string;
    dataCompleteness: number; // 0-100%
    analysisConfidence: number; // 0-100%
    limitations: string[];
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const walletAddress = params.address.toLowerCase();
    
    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid wallet address format'
      }, { status: 400 });
    }

    // Check cache first (10 minute expiry)
    const cacheKey = `wallet_analysis:${walletAddress}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return NextResponse.json({
        success: true,
        cached: true,
        data: JSON.parse(cached)
      });
    }

    console.log(`📊 Analyzing wallet: ${walletAddress}`);

    // Get wallet data
    const wallet = await prisma.wallet.findUnique({
      where: { address: walletAddress },
      include: {
        holdings: {
          include: {
            token: {
              select: {
                address: true,
                symbol: true,
                name: true,
                price: true,
                marketCap: true,
                liquidity: true
              }
            }
          },
          orderBy: { value: 'desc' }
        },
        transactions: {
          include: {
            token: {
              select: {
                address: true,
                symbol: true,
                name: true
              }
            }
          },
          orderBy: { timestamp: 'desc' },
          take: 1000 // Limit for performance
        }
      }
    });

    if (!wallet) {
      return NextResponse.json({
        success: false,
        error: 'Wallet not found'
      }, { status: 404 });
    }

    // Analyze wallet data
    const analysis = await analyzeWallet(wallet);

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(analysis));

    console.log(`✅ Wallet analysis complete for ${walletAddress}`);

    return NextResponse.json({
      success: true,
      cached: false,
      data: analysis
    });

  } catch (error) {
    console.error(`Error in /api/wallet/${params.address}:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function analyzeWallet(wallet: any): Promise<WalletAnalysis> {
  const holdings = wallet.holdings || [];
  const transactions = wallet.transactions || [];

  // Basic wallet info
  const lastTransaction = transactions[0];
  const walletAge = wallet.createdAt ? 
    (Date.now() - new Date(wallet.createdAt).getTime()) / (1000 * 60 * 60) : 0;

  // Portfolio analysis
  const portfolio = analyzePortfolio(holdings);
  
  // Trading analysis
  const trading = analyzeTradingActivity(transactions);
  
  // Reputation analysis
  const reputation = analyzeReputation(wallet, trading);
  
  // Activity timeline
  const activity = analyzeActivity(transactions);

  return {
    wallet: {
      address: wallet.address,
      type: wallet.type || 'UNKNOWN',
      isDevWallet: wallet.isDevWallet || false,
      isSniper: wallet.isSniper || false,
      riskScore: wallet.riskScore,
      labels: generateWalletLabels(wallet, trading),
      createdAt: wallet.createdAt?.toISOString() || 'Unknown',
      lastActivity: lastTransaction?.timestamp?.toISOString() || 'No activity',
      age: formatAge(walletAge)
    },

    portfolio,
    trading,
    reputation,
    activity,

    metadata: {
      lastUpdated: new Date().toISOString(),
      dataCompleteness: calculateDataCompleteness(wallet),
      analysisConfidence: calculateAnalysisConfidence(transactions.length, walletAge),
      limitations: [
        'Historical data may be incomplete',
        'Cross-chain activity not fully tracked',
        'Some DEX trades may be missing'
      ]
    }
  };
}

function analyzePortfolio(holdings: any[]) {
  const totalValue = holdings.reduce((sum, h) => sum + (h.value || 0), 0);
  const activePositions = holdings.filter(h => (h.balance || 0) > 0).length;

  // Calculate diversification (Herfindahl-Hirschman Index)
  const diversification = holdings.length > 1 ? 
    Math.max(0, 100 - holdings.reduce((sum, h) => {
      const share = (h.value || 0) / totalValue;
      return sum + (share * share * 10000);
    }, 0) / 100) : 0;

  let portfolioHealth = 'UNKNOWN';
  if (totalValue > 100000) portfolioHealth = 'EXCELLENT';
  else if (totalValue > 10000) portfolioHealth = 'GOOD';
  else if (totalValue > 1000) portfolioHealth = 'MODERATE';
  else portfolioHealth = 'POOR';

  return {
    totalValue,
    totalTokens: holdings.length,
    activePosistions: activePositions,
    portfolioHealth,
    diversification: Math.round(diversification),
    holdings: holdings.slice(0, 20).map(holding => ({ // Top 20 holdings
      token: {
        address: holding.token.address,
        symbol: holding.token.symbol,
        name: holding.token.name,
        price: holding.token.price
      },
      position: {
        balance: holding.balance || 0,
        percentage: holding.percentage || 0,
        value: holding.value || 0,
        costBasis: null, // Would need more complex calculation
        pnl: null,
        pnlPercentage: null
      },
      activity: {
        firstBuy: holding.firstBuyAt?.toISOString() || null,
        lastTx: holding.lastTxAt?.toISOString() || null,
        transactions: 0, // Would need to calculate
        totalBought: 0,
        totalSold: 0,
        avgBuyPrice: null,
        avgSellPrice: null
      },
      risk: {
        concentration: totalValue > 0 ? ((holding.value || 0) / totalValue) * 100 : 0,
        liquidityRisk: (holding.token.liquidity || 0) > 50000 ? 'LOW' : 'HIGH',
        rugRisk: 0, // Would need rug score
        exitDifficulty: (holding.token.liquidity || 0) > 50000 ? 'EASY' : 'DIFFICULT'
      }
    }))
  };
}

function analyzeTradingActivity(transactions: any[]) {
  if (transactions.length === 0) {
    return {
      summary: {
        totalTransactions: 0,
        winRate: 0,
        totalVolume: 0,
        avgPositionSize: 0,
        avgHoldTime: 0,
        mostTradedToken: 'None'
      },
      performance: {
        realizedPnL: 0,
        unrealizedPnL: 0,
        totalPnL: 0,
        bestTrade: null,
        worstTrade: null
      },
      patterns: {
        tradingFrequency: 'INACTIVE',
        avgSessionDuration: 0,
        preferredTimeOfDay: 'Unknown',
        riskTolerance: 'UNKNOWN',
        strategyType: 'UNKNOWN'
      },
      recent: []
    };
  }

  const buyTxs = transactions.filter(tx => tx.type === 'BUY');
  const sellTxs = transactions.filter(tx => tx.type === 'SELL');
  const totalVolume = transactions.reduce((sum, tx) => sum + (tx.value || 0), 0);

  // Token frequency
  const tokenCounts: Record<string, number> = {};
  transactions.forEach(tx => {
    if (tx.token?.symbol) {
      tokenCounts[tx.token.symbol] = (tokenCounts[tx.token.symbol] || 0) + 1;
    }
  });
  const mostTradedToken = Object.keys(tokenCounts).reduce((a, b) => 
    tokenCounts[a] > tokenCounts[b] ? a : b, 'None'
  );

  // Trading patterns
  let frequency = 'SLOW';
  const txsPerDay = transactions.length / Math.max(1, 
    (Date.now() - new Date(transactions[transactions.length - 1]?.timestamp || Date.now()).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (txsPerDay > 50) frequency = 'VERY_ACTIVE';
  else if (txsPerDay > 10) frequency = 'ACTIVE';
  else if (txsPerDay > 2) frequency = 'MODERATE';

  // Time analysis
  const hourCounts: number[] = new Array(24).fill(0);
  transactions.forEach(tx => {
    const hour = new Date(tx.timestamp).getHours();
    hourCounts[hour]++;
  });
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  let preferredTime = 'Unknown';
  if (peakHour >= 0 && peakHour < 6) preferredTime = 'Late Night';
  else if (peakHour >= 6 && peakHour < 12) preferredTime = 'Morning';
  else if (peakHour >= 12 && peakHour < 18) preferredTime = 'Afternoon';
  else preferredTime = 'Evening';

  return {
    summary: {
      totalTransactions: transactions.length,
      winRate: 0, // Would need more complex P&L calculation
      totalVolume,
      avgPositionSize: totalVolume / transactions.length,
      avgHoldTime: 0, // Would need matched buy/sell pairs
      mostTradedToken
    },
    performance: {
      realizedPnL: 0,
      unrealizedPnL: 0,
      totalPnL: 0,
      bestTrade: null,
      worstTrade: null
    },
    patterns: {
      tradingFrequency: frequency,
      avgSessionDuration: 0, // Would need session analysis
      preferredTimeOfDay: preferredTime,
      riskTolerance: totalVolume > 100000 ? 'HIGH' : totalVolume > 10000 ? 'MEDIUM' : 'LOW',
      strategyType: frequency === 'VERY_ACTIVE' ? 'SCALPER' : 
                   frequency === 'ACTIVE' ? 'SWING' :
                   frequency === 'SLOW' ? 'HOLD' : 'UNKNOWN'
    },
    recent: transactions.slice(0, 20).map(tx => ({
      token: {
        address: tx.token?.address || 'Unknown',
        symbol: tx.token?.symbol || 'Unknown',
        name: tx.token?.name || 'Unknown'
      },
      type: tx.type,
      amount: tx.amount || 0,
      value: tx.value || 0,
      price: tx.price || 0,
      timestamp: tx.timestamp.toISOString(),
      age: formatTimeSince(tx.timestamp)
    }))
  };
}

function analyzeReputation(wallet: any, trading: any) {
  let smartMoneyScore = 0;
  const flags: string[] = [];
  const achievements: string[] = [];

  // Base scoring
  if (trading.summary.totalVolume > 1000000) {
    smartMoneyScore += 30;
    achievements.push('High Volume Trader');
  }
  
  if (wallet.isSniper && trading.summary.winRate > 60) {
    smartMoneyScore += 25;
    achievements.push('Successful Sniper');
  }

  if (wallet.type === 'WHALE') {
    smartMoneyScore += 20;
    achievements.push('Whale Wallet');
  }

  // Risk flags
  if (wallet.isDevWallet) {
    flags.push('Developer Wallet');
  }
  
  if (wallet.riskScore && wallet.riskScore > 70) {
    flags.push('High Risk Score');
  }

  let trustLevel = 'UNKNOWN';
  if (smartMoneyScore >= 70) trustLevel = 'HIGH';
  else if (smartMoneyScore >= 40) trustLevel = 'MEDIUM';
  else if (smartMoneyScore >= 20) trustLevel = 'LOW';
  else trustLevel = 'VERY_LOW';

  return {
    smartMoneyScore,
    isKnownProfitable: smartMoneyScore >= 60,
    followersCount: 0, // Would need copy trading data
    successRate: 0, // Would need P&L analysis
    riskAssessment: flags.length > 0 ? 'ELEVATED' : 'NORMAL',
    trustLevel,
    flags,
    achievements
  };
}

function analyzeActivity(transactions: any[]) {
  // Group by day
  const dailyActivity: Record<string, any> = {};
  const hourlyActivity: Record<string, number> = {};

  transactions.forEach(tx => {
    const date = tx.timestamp.toISOString().split('T')[0];
    const hour = new Date(tx.timestamp).getHours().toString();

    if (!dailyActivity[date]) {
      dailyActivity[date] = {
        date,
        transactions: 0,
        volume: 0,
        tokensTraded: new Set(),
        pnl: 0
      };
    }

    dailyActivity[date].transactions++;
    dailyActivity[date].volume += tx.value || 0;
    dailyActivity[date].tokensTraded.add(tx.token?.symbol || 'Unknown');

    hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
  });

  // Convert sets to counts
  Object.values(dailyActivity).forEach((day: any) => {
    day.tokensTraded = day.tokensTraded.size;
  });

  return {
    timeline: Object.values(dailyActivity).sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 30), // Last 30 days
    heatmap: hourlyActivity,
    chains: [
      {
        chainId: 1,
        chainName: 'Ethereum',
        transactionCount: transactions.length,
        volume: transactions.reduce((sum, tx) => sum + (tx.value || 0), 0)
      }
    ] // Simplified - would track multiple chains
  };
}

function generateWalletLabels(wallet: any, trading: any): string[] {
  const labels: string[] = [];

  if (wallet.isDevWallet) labels.push('Developer');
  if (wallet.isSniper) labels.push('Sniper');
  if (wallet.type === 'WHALE') labels.push('Whale');
  if (trading.summary.totalVolume > 1000000) labels.push('High Volume');
  if (trading.patterns.tradingFrequency === 'VERY_ACTIVE') labels.push('Very Active');
  if (wallet.riskScore && wallet.riskScore < 30) labels.push('Low Risk');
  if (wallet.riskScore && wallet.riskScore > 70) labels.push('High Risk');

  return labels;
}

function calculateDataCompleteness(wallet: any): number {
  let score = 0;
  if (wallet.address) score += 20;
  if (wallet.type && wallet.type !== 'UNKNOWN') score += 20;
  if (wallet.holdings && wallet.holdings.length > 0) score += 20;
  if (wallet.transactions && wallet.transactions.length > 0) score += 20;
  if (wallet.riskScore !== null) score += 20;
  return score;
}

function calculateAnalysisConfidence(txCount: number, ageHours: number): number {
  let confidence = 0;
  
  // Transaction count confidence
  if (txCount > 100) confidence += 40;
  else if (txCount > 20) confidence += 25;
  else if (txCount > 5) confidence += 15;
  
  // Age confidence
  if (ageHours > 24 * 30) confidence += 30; // 30 days+
  else if (ageHours > 24 * 7) confidence += 20; // 7 days+
  else if (ageHours > 24) confidence += 10; // 1 day+
  
  // Activity recency
  confidence += 30; // Base confidence for having any data
  
  return Math.min(100, confidence);
}

function formatAge(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} minutes`;
  if (hours < 24) return `${Math.round(hours)} hours`;
  return `${Math.round(hours / 24)} days`;
}

function formatTimeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
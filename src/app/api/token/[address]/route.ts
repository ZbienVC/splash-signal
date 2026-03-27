// /api/token/[address] - Full token analysis
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { AlphaScorer } from '@/lib/engines/analysis/alphaScorer';
import { RugScorer } from '@/lib/engines/analysis/rugScorer';
import { DumpScorer } from '@/lib/engines/analysis/dumpScorer';
import { SmartWalletEngine } from '@/lib/engines/wallets/smartWalletEngine';
import { SignalEngine } from '@/lib/engines/signals/signalEngine';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL!);

interface TokenAnalysis {
  token: {
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
  };
  
  analysis: {
    alphaScore: any;
    rugScore: any;
    dumpScore: any;    // NEW: Dump/sell-off risk analysis
    signal: any;       // NEW: Current active signal (BUY/HOLD/SELL)
    recommendation: {
      action: string;
      reasoning: string;
      confidence: number;
      riskLevel: string;
    };
  };

  holders: {
    total: number;
    breakdown: {
      whales: number;      // >5% holders
      snipers: number;     // Sniper wallets
      normal: number;      // Regular holders
      fresh: number;       // <24h old wallets
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
  };

  liquidity: {
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
    liquidityRatio: number; // Liquidity to market cap
    isLocked: boolean;
    riskLevel: string;
  };

  activity: {
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
  };

  signals: {
    recent: Array<{
      type: string;
      severity: string;
      message: string;
      timestamp: string;
    }>;
    activeCount: number;
  };

  smartWalletActivity: Array<{   // NEW: Recent smart wallet moves on this token
    walletAddress: string;
    action: string;
    amount: number;
    timestamp: string;
  }>;

  metadata: {
    lastUpdated: string;
    dataFreshness: string;
    analysisTime: number;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const startTime = Date.now();
  
  try {
    const tokenAddress = params.address.toLowerCase();
    
    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid token address format'
      }, { status: 400 });
    }

    // Check cache first (5 minute expiry for full analysis)
    const cacheKey = `token_analysis:${tokenAddress}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return NextResponse.json({
        success: true,
        cached: true,
        data: JSON.parse(cached)
      });
    }

    console.log(`📊 Analyzing token: ${tokenAddress}`);

    // Get comprehensive token data
    const token = await prisma.token.findUnique({
      where: { address: tokenAddress },
      include: {
        wallets: {
          include: {
            wallet: {
              select: {
                address: true,
                type: true,
                isSniper: true,
                isDevWallet: true,
                createdAt: true
              }
            }
          },
          orderBy: { percentage: 'desc' }
        },
        transactions: {
          where: {
            timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          },
          include: {
            wallet: {
              select: {
                address: true,
                isDevWallet: true
              }
            }
          },
          orderBy: { timestamp: 'desc' }
        },
        liquidityPools: {
          orderBy: { totalLiquidity: 'desc' }
        },
        priceHistory: {
          where: {
            timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          },
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token not found'
      }, { status: 404 });
    }

    // Run analysis in parallel
    console.log(`🔍 Running Alpha, Rug, and Dump analysis for ${token.symbol}...`);
    const [alphaResult, rugResult, dumpResult, recentAlerts, smartWalletExits] = await Promise.all([
      new AlphaScorer(prisma, redis).calculateAlphaScore(tokenAddress),
      new RugScorer(prisma, redis).calculateRugScore(tokenAddress),
      new DumpScorer(prisma, redis).calculateDumpScore(tokenAddress),
      getRecentAlerts(tokenAddress),
      new SmartWalletEngine(prisma, redis).detectExits(tokenAddress).catch(() => []),
    ]);

    // Get recent signals in new format
    const signalEngine = new SignalEngine();
    const recentSignals = await signalEngine.getRecentSignals(5).catch(() => []);
    const tokenSignals = recentSignals.filter((s: any) => s.tokenAddress === tokenAddress);

    // Build comprehensive analysis
    const analysis: TokenAnalysis = {
      token: {
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        chainId: token.chainId,
        price: token.price,
        marketCap: token.marketCap,
        volume24h: token.volume24h,
        liquidity: token.liquidity,
        verified: token.verified,
        ownershipRenounced: token.ownershipRenounced,
        isProxy: token.isProxy,
        buyTax: token.buyTax,
        sellTax: token.sellTax,
        createdAt: token.createdAt.toISOString(),
        age: formatAge(token.createdAt)
      },

      analysis: {
        alphaScore: alphaResult,
        rugScore: rugResult,
        dumpScore: dumpResult,
        signal: tokenSignals[0] || null,
        recommendation: generateRecommendation(alphaResult, rugResult, dumpResult)
      },

      holders: analyzeHolders(token.wallets),
      liquidity: analyzeLiquidity(token.liquidityPools, token.marketCap),
      activity: analyzeActivity(token.transactions, token.priceHistory),
      signals: {
        recent: recentAlerts,
        activeCount: recentAlerts.filter(alert => 
          new Date(alert.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
        ).length
      },

      smartWalletActivity: smartWalletExits.map((e: any) => ({
        walletAddress: e.wallet.address,
        action: e.activity.action,
        amount: e.activity.amount,
        timestamp: e.activity.timestamp instanceof Date
          ? e.activity.timestamp.toISOString()
          : new Date(e.activity.timestamp).toISOString(),
      })),

      metadata: {
        lastUpdated: new Date().toISOString(),
        dataFreshness: token.lastScanAt ? 
          formatTimeSince(token.lastScanAt) : 'Unknown',
        analysisTime: Date.now() - startTime
      }
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(analysis));

    console.log(`✅ Analysis complete for ${token.symbol} in ${Date.now() - startTime}ms`);

    return NextResponse.json({
      success: true,
      cached: false,
      data: analysis
    });

  } catch (error) {
    console.error(`Error in /api/token/${params.address}:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      analysisTime: Date.now() - startTime
    }, { status: 500 });
  }
}

function generateRecommendation(alphaResult: any, rugResult: any, dumpResult?: any) {
  const alpha = alphaResult.finalScore;
  const rug = rugResult.finalScore;
  const dump = dumpResult?.finalScore ?? rug; // fallback to rug if no dump score
  const alphaConf = alphaResult.confidence;

  let action = 'MONITOR';
  let reasoning = 'Mixed signals detected';
  let confidence = 0.5;
  let riskLevel = 'MEDIUM';

  // High alpha + Low dump risk = Strong opportunity
  if (alpha >= 75 && dump <= 25 && rug <= 30 && alphaConf >= 0.7) {
    action = 'STRONG_BUY';
    reasoning = `Excellent opportunity: High alpha (${alpha}) with low risk (dump:${dump}, rug:${rug}) and strong confidence`;
    confidence = Math.min(0.95, alphaConf + 0.2);
    riskLevel = 'LOW';
  }
  // Good alpha + Acceptable risk = Buy
  else if (alpha >= 65 && dump <= 50 && rug <= 40 && alphaConf >= 0.6) {
    action = 'BUY';
    reasoning = `Good opportunity: Solid alpha (${alpha}) with manageable risk (dump:${dump})`;
    confidence = alphaConf;
    riskLevel = dump <= 30 ? 'LOW' : 'MEDIUM';
  }
  // High alpha but elevated dump risk = Cautious
  else if (alpha >= 65 && dump > 50) {
    action = 'CAUTIOUS';
    reasoning = `High potential (${alpha}) but significant dump risk (${dump}). Monitor closely.`;
    confidence = Math.max(0.3, alphaConf - 0.3);
    riskLevel = dump >= 70 ? 'HIGH' : 'MEDIUM';
  }
  // High dump or rug risk = Avoid
  else if (dump >= 75 || rug >= 80) {
    action = 'AVOID';
    reasoning = `Very high risk detected (dump:${dump}, rug:${rug}). Recommend avoiding.`;
    confidence = 0.9;
    riskLevel = 'CRITICAL';
  }
  // Low alpha = Pass
  else if (alpha < 40) {
    action = 'PASS';
    reasoning = `Low alpha potential (${alpha}). Better opportunities likely available.`;
    confidence = 0.7;
    riskLevel = dump >= 60 ? 'HIGH' : 'MEDIUM';
  }

  return {
    action,
    reasoning,
    confidence: Math.round(confidence * 100) / 100,
    riskLevel
  };
}

function analyzeHolders(wallets: any[]) {
  const total = wallets.length;
  let whales = 0;
  let snipers = 0;
  let normal = 0;
  let fresh = 0;

  const distribution = [
    { range: '>10%', count: 0, percentage: 0 },
    { range: '5-10%', count: 0, percentage: 0 },
    { range: '1-5%', count: 0, percentage: 0 },
    { range: '0.1-1%', count: 0, percentage: 0 },
    { range: '<0.1%', count: 0, percentage: 0 }
  ];

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  wallets.forEach(holding => {
    const percentage = holding.percentage;
    const wallet = holding.wallet;

    // Categorize wallets
    if (percentage > 5) whales++;
    else if (wallet?.isSniper) snipers++;
    else normal++;

    if (wallet?.createdAt && new Date(wallet.createdAt) > yesterday) {
      fresh++;
    }

    // Distribution
    if (percentage > 10) distribution[0].count++;
    else if (percentage > 5) distribution[1].count++;
    else if (percentage > 1) distribution[2].count++;
    else if (percentage > 0.1) distribution[3].count++;
    else distribution[4].count++;
  });

  // Calculate percentages for distribution
  distribution.forEach(range => {
    range.percentage = Math.round((range.count / total) * 100 * 10) / 10;
  });

  return {
    total,
    breakdown: { whales, snipers, normal, fresh },
    distribution,
    topHolders: wallets.slice(0, 10).map(holding => ({
      address: holding.wallet?.address || 'Unknown',
      percentage: Math.round(holding.percentage * 100) / 100,
      type: holding.wallet?.type || 'UNKNOWN',
      isSniper: holding.wallet?.isSniper || false,
      firstBuy: holding.firstBuyAt?.toISOString() || null
    }))
  };
}

function analyzeLiquidity(pools: any[], marketCap: number | null) {
  const totalLiquidity = pools.reduce((sum, pool) => sum + (pool.totalLiquidity || 0), 0);
  const liquidityRatio = marketCap && marketCap > 0 ? (totalLiquidity / marketCap) * 100 : 0;
  const isLocked = pools.some(pool => pool.isLocked);
  
  let riskLevel = 'HIGH';
  if (isLocked && liquidityRatio > 15) riskLevel = 'LOW';
  else if (isLocked || liquidityRatio > 10) riskLevel = 'MEDIUM';

  return {
    pools: pools.map(pool => ({
      address: pool.address,
      dex: pool.dex,
      pairedWith: pool.pairedWith,
      totalLiquidity: pool.totalLiquidity,
      token0Reserve: pool.token0Reserve,
      token1Reserve: pool.token1Reserve,
      isLocked: pool.isLocked,
      lockUntil: pool.lockUntil?.toISOString() || null,
      lockProvider: pool.lockProvider
    })),
    totalLiquidity,
    liquidityRatio: Math.round(liquidityRatio * 10) / 10,
    isLocked,
    riskLevel
  };
}

function analyzeActivity(transactions: any[], priceHistory: any[]) {
  const buyTxs = transactions.filter(tx => tx.type === 'BUY');
  const sellTxs = transactions.filter(tx => tx.type === 'SELL');
  const devSells = transactions.filter(tx => tx.type === 'SELL' && tx.wallet?.isDevWallet);

  const uniqueTraders = new Set(transactions.map(tx => tx.walletId)).size;
  const volume24h = transactions.reduce((sum, tx) => sum + (tx.value || 0), 0);

  // Calculate price changes
  const priceChange = { '5m': 0, '1h': 0, '24h': 0 };
  if (priceHistory.length >= 2) {
    const latest = priceHistory[0];
    const hour1 = priceHistory.find(p => 
      new Date(p.timestamp) <= new Date(Date.now() - 60 * 60 * 1000)
    );
    const oldest = priceHistory[priceHistory.length - 1];

    if (latest && hour1) {
      priceChange['1h'] = ((latest.price - hour1.price) / hour1.price) * 100;
    }
    if (latest && oldest) {
      priceChange['24h'] = ((latest.price - oldest.price) / oldest.price) * 100;
    }
  }

  return {
    transactions24h: transactions.length,
    volume24h,
    uniqueTraders24h: uniqueTraders,
    buyVsSell: {
      buys: buyTxs.length,
      sells: sellTxs.length,
      ratio: sellTxs.length > 0 ? buyTxs.length / sellTxs.length : buyTxs.length
    },
    priceChange: {
      '5m': 0, // Would need more frequent price data
      '1h': Math.round(priceChange['1h'] * 100) / 100,
      '24h': Math.round(priceChange['24h'] * 100) / 100
    },
    devActivity: {
      recentSells: devSells.slice(0, 5).map(tx => ({
        amount: tx.amount,
        value: tx.value,
        timestamp: tx.timestamp.toISOString()
      })),
      totalDevSells24h: devSells.reduce((sum, tx) => sum + (tx.value || 0), 0),
      devHolding: 0, // Would need to calculate from holdings
      riskLevel: devSells.length > 0 ? 'HIGH' : 'LOW'
    }
  };
}

async function getRecentAlerts(tokenAddress: string) {
  try {
    const alerts = await prisma.alert.findMany({
      where: {
        token: { address: tokenAddress },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        status: 'ACTIVE'
      },
      select: {
        type: true,
        severity: true,
        message: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return alerts.map(alert => ({
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.createdAt.toISOString()
    }));
  } catch {
    return [];
  }
}

function formatAge(createdAt: Date): string {
  const hours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  if (hours < 1) return `${Math.round(hours * 60)} minutes`;
  if (hours < 24) return `${Math.round(hours)} hours`;
  return `${Math.round(hours / 24)} days`;
}

function formatTimeSince(date: Date): string {
  const minutes = (Date.now() - date.getTime()) / (1000 * 60);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${Math.round(minutes)} minutes ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)} hours ago`;
  return `${Math.round(hours / 24)} days ago`;
}
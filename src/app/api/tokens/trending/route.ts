// /api/tokens/trending - Trending tokens by Alpha Score
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { AlphaScorer } from '@/lib/engines/analysis/alphaScorer';
import { RugScorer } from '@/lib/engines/analysis/rugScorer';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL!);

interface TrendingToken {
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
  age: number; // hours
  trending: {
    volumeGrowth24h: number;
    holderGrowth24h: number;
    priceChange24h: number;
  };
  signals: string[];
  confidence: number;
  lastUpdated: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const minAlpha = parseInt(searchParams.get('minAlpha') || '40');
    const maxRug = parseInt(searchParams.get('maxRug') || '70');
    const timeframe = searchParams.get('timeframe') || '24h';
    
    // Check cache first
    const cacheKey = `trending:${limit}:${minAlpha}:${maxRug}:${timeframe}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return NextResponse.json({
        success: true,
        cached: true,
        data: JSON.parse(cached)
      });
    }

    // Get active tokens with recent activity
    const cutoffHours = timeframe === '1h' ? 1 : timeframe === '6h' ? 6 : 24;
    const cutoff = new Date(Date.now() - cutoffHours * 60 * 60 * 1000);

    const tokens = await prisma.token.findMany({
      where: {
        AND: [
          { lastScanAt: { gte: cutoff } },
          { volume24h: { gte: 5000 } }, // Minimum $5k volume
          { 
            OR: [
              { verified: true },
              { createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) } } // New tokens get a pass
            ]
          }
        ]
      },
      include: {
        wallets: {
          select: {
            percentage: true,
            wallet: {
              select: {
                type: true,
                isSniper: true
              }
            }
          }
        },
        priceHistory: {
          where: {
            timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          },
          orderBy: { timestamp: 'desc' },
          take: 2
        }
      },
      orderBy: { volume24h: 'desc' },
      take: limit * 3 // Get more to filter after scoring
    });

    console.log(`📊 Processing ${tokens.length} tokens for trending analysis...`);

    // Score tokens in parallel (batches of 10)
    const batchSize = 10;
    const scoredTokens: TrendingToken[] = [];
    
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (token) => {
        try {
          const [alphaResult, rugResult] = await Promise.all([
            new AlphaScorer(prisma, redis).calculateAlphaScore(token.address),
            new RugScorer(prisma, redis).calculateRugScore(token.address)
          ]);

          // Filter by alpha/rug thresholds
          if (alphaResult.finalScore < minAlpha || rugResult.finalScore > maxRug) {
            return null;
          }

          // Calculate trending metrics
          const trending = calculateTrendingMetrics(token);
          const age = (Date.now() - new Date(token.createdAt).getTime()) / (1000 * 60 * 60);

          return {
            address: token.address,
            symbol: token.symbol,
            name: token.name,
            alphaScore: alphaResult.finalScore,
            rugScore: rugResult.finalScore,
            price: token.price,
            volume24h: token.volume24h,
            liquidity: token.liquidity,
            marketCap: token.marketCap,
            holders: token.wallets.length,
            age: Math.round(age * 10) / 10,
            trending,
            signals: alphaResult.earlySignals,
            confidence: alphaResult.confidence,
            lastUpdated: new Date().toISOString()
          } as TrendingToken;

        } catch (error) {
          console.error(`Error scoring token ${token.address}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter(result => result !== null) as TrendingToken[];
      scoredTokens.push(...validResults);

      // Small delay to avoid overwhelming the system
      if (i + batchSize < tokens.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Sort by combined score (alpha * confidence - rug risk factor)
    const sortedTokens = scoredTokens
      .map(token => ({
        ...token,
        combinedScore: (token.alphaScore * token.confidence) - (token.rugScore * 0.3)
      }))
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, limit);

    const result = {
      tokens: sortedTokens,
      count: sortedTokens.length,
      timestamp: new Date().toISOString(),
      filters: {
        limit,
        minAlpha,
        maxRug,
        timeframe
      },
      metadata: {
        totalProcessed: tokens.length,
        avgAlphaScore: sortedTokens.reduce((sum, t) => sum + t.alphaScore, 0) / sortedTokens.length,
        avgRugScore: sortedTokens.reduce((sum, t) => sum + t.rugScore, 0) / sortedTokens.length
      }
    };

    // Cache for 2 minutes (trending data changes quickly)
    await redis.setex(cacheKey, 120, JSON.stringify(result));

    return NextResponse.json({
      success: true,
      cached: false,
      data: result
    });

  } catch (error) {
    console.error('Error in /api/tokens/trending:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function calculateTrendingMetrics(token: any) {
  const priceHistory = token.priceHistory || [];
  
  let volumeGrowth24h = 0;
  let priceChange24h = 0;
  let holderGrowth24h = 0;

  // Calculate price change from price history
  if (priceHistory.length >= 2) {
    const latest = priceHistory[0];
    const previous = priceHistory[priceHistory.length - 1];
    if (previous.price && latest.price) {
      priceChange24h = ((latest.price - previous.price) / previous.price) * 100;
    }
  }

  // Volume growth (simplified - would need historical volume data)
  if (token.volume24h && token.volume24h > 0) {
    volumeGrowth24h = 50; // Placeholder - would calculate from historical data
  }

  // Holder growth (simplified - would need historical holder count)
  holderGrowth24h = Math.max(0, token.wallets.length - 100); // Rough estimate

  return {
    volumeGrowth24h: Math.round(volumeGrowth24h),
    holderGrowth24h,
    priceChange24h: Math.round(priceChange24h * 100) / 100
  };
}
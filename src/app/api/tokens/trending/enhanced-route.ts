// Enhanced Trending Tokens API - With Insights Layer
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { InsightAPI } from '@/lib/engines/insights/apiIntegration';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL!);

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Standard parameters
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const minAlpha = parseInt(searchParams.get('minAlpha') || '40');
    const maxRug = parseInt(searchParams.get('maxRug') || '70');
    const timeframe = searchParams.get('timeframe') || '24h';
    
    // NEW: Insights parameters
    const includeInsights = searchParams.get('insights') !== 'false'; // Default true
    const insightLevel = searchParams.get('insightLevel') || 'standard'; // 'basic', 'standard', 'detailed'
    const decisionOnly = searchParams.get('decisionOnly') === 'true'; // Return only decisions

    // Check cache
    const cacheKey = `trending_enhanced:${limit}:${minAlpha}:${maxRug}:${timeframe}:${insightLevel}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return NextResponse.json({
        success: true,
        cached: true,
        data: JSON.parse(cached)
      });
    }

    console.log(`📊 Fetching trending tokens with insights (${insightLevel} level)...`);

    // Get tokens with enhanced data for insights
    const tokens = await prisma.token.findMany({
      where: {
        volume24h: { gte: 5000 },
        AND: [
          { alphaScore: { gte: minAlpha } },
          { rugScore: { lte: maxRug } }
        ]
      },
      include: {
        // Include data needed for insights
        wallets: {
          take: 10,
          orderBy: { percentage: 'desc' },
          include: {
            wallet: {
              select: {
                isDevWallet: true,
                isSniper: true,
                type: true
              }
            }
          }
        },
        transactions: {
          where: {
            timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            wallet: { isDevWallet: true },
            type: 'SELL'
          },
          select: {
            value: true,
            timestamp: true
          }
        },
        liquidityPools: {
          select: {
            totalLiquidity: true,
            isLocked: true
          }
        }
      },
      orderBy: { alphaScore: 'desc' },
      take: limit
    });

    if (tokens.length === 0) {
      return NextResponse.json({
        success: true,
        cached: false,
        data: {
          tokens: [],
          count: 0,
          message: "No tokens match current filters"
        }
      });
    }

    // Transform raw data for insights
    const tokensWithMetrics = tokens.map(token => {
      const topHolder = token.wallets[0];
      const devSells24h = token.transactions.reduce((sum, tx) => sum + (tx.value || 0), 0);
      const totalLiquidity = token.liquidityPools.reduce((sum, pool) => sum + pool.totalLiquidity, 0);
      
      return {
        // Original token data
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        alphaScore: token.alphaScore || 0,
        rugScore: token.rugScore || 0,
        price: token.price,
        volume24h: token.volume24h,
        liquidity: totalLiquidity,
        marketCap: token.marketCap,
        holders: token.wallets.length,
        age: token.createdAt ? (Date.now() - new Date(token.createdAt).getTime()) / (1000 * 60 * 60) : 0,
        verified: token.verified,
        
        // Enhanced metrics for insights
        trending: {
          volumeGrowth24h: 150, // Would be calculated from historical data
          holderGrowth24h: token.wallets.filter(w => 
            new Date(w.firstBuyAt || 0) > new Date(Date.now() - 24 * 60 * 60 * 1000)
          ).length,
          priceChange24h: 85.5 // Would be calculated from price history
        },
        
        // Risk factors
        topHolderPercent: topHolder?.percentage || 0,
        liquidityRatio: token.marketCap ? (totalLiquidity / token.marketCap) * 100 : 0,
        devSells24h,
        isLocked: token.liquidityPools.some(pool => pool.isLocked),
        
        // Smart money (simplified for example)
        smartWalletBuys: token.wallets.filter(w => w.wallet?.type === 'WHALE').length,
        smartMoneyVolume: token.wallets
          .filter(w => w.wallet?.type === 'WHALE')
          .reduce((sum, w) => sum + (w.value || 0), 0),
        
        lastUpdated: new Date().toISOString()
      };
    });

    let response;

    if (includeInsights) {
      // Generate insights for each token
      const insightAPI = new InsightAPI();
      const enhancedTokens = await insightAPI.enhancedTrendingTokens(tokensWithMetrics);
      
      if (decisionOnly) {
        // Return only decision summaries
        response = {
          tokens: enhancedTokens.map(token => ({
            address: token.address,
            symbol: token.symbol,
            name: token.name,
            price: token.price,
            decision: {
              action: token.insights.recommendation.action,
              reasoning: token.insights.recommendation.reasoning,
              urgency: token.insights.recommendation.urgency,
              emoji: token.insights.recommendation.emoji,
              confidence: token.insights.recommendation.confidence
            },
            summary: token.insights.summary.tldr,
            allocation: token.insights.recommendation.action.includes('BUY') ? '3-5% of portfolio' : 'No position',
            timeframe: token.insights.summary.timeframe
          })),
          count: enhancedTokens.length,
          timestamp: new Date().toISOString(),
          mode: 'decisions_only'
        };
      } else if (insightLevel === 'basic') {
        // Include only key insights
        response = {
          tokens: enhancedTokens.map(token => ({
            ...token,
            insights: {
              decision: token.insights.recommendation.action,
              reasoning: token.insights.recommendation.reasoning,
              urgency: token.insights.recommendation.urgency,
              emoji: token.insights.recommendation.emoji,
              tldr: token.insights.summary.tldr
            }
          })),
          count: enhancedTokens.length,
          timestamp: new Date().toISOString(),
          mode: 'basic_insights'
        };
      } else {
        // Full insights (standard or detailed)
        response = {
          tokens: enhancedTokens,
          count: enhancedTokens.length,
          timestamp: new Date().toISOString(),
          filters: { limit, minAlpha, maxRug, timeframe },
          metadata: {
            totalProcessed: enhancedTokens.length,
            avgAlphaScore: enhancedTokens.reduce((sum, t) => sum + t.alphaScore, 0) / enhancedTokens.length,
            avgRugScore: enhancedTokens.reduce((sum, t) => sum + t.rugScore, 0) / enhancedTokens.length,
            strongBuyCount: enhancedTokens.filter(t => t.insights.recommendation.action === 'STRONG BUY').length,
            avoidCount: enhancedTokens.filter(t => t.insights.recommendation.action === 'AVOID').length,
            analysisTime: Date.now() - startTime
          },
          mode: 'full_insights'
        };
      }
    } else {
      // Original response without insights
      response = {
        tokens: tokensWithMetrics.map(token => ({
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          alphaScore: token.alphaScore,
          rugScore: token.rugScore,
          price: token.price,
          volume24h: token.volume24h,
          liquidity: token.liquidity,
          marketCap: token.marketCap,
          holders: token.holders,
          age: token.age,
          trending: token.trending,
          lastUpdated: token.lastUpdated
        })),
        count: tokensWithMetrics.length,
        timestamp: new Date().toISOString(),
        mode: 'raw_data_only'
      };
    }

    // Cache for 2 minutes
    await redis.setex(cacheKey, 120, JSON.stringify(response));

    console.log(`✅ Enhanced trending analysis complete: ${enhancedTokens?.length || tokensWithMetrics.length} tokens in ${Date.now() - startTime}ms`);

    return NextResponse.json({
      success: true,
      cached: false,
      data: response
    });

  } catch (error) {
    console.error('Error in enhanced trending endpoint:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      analysisTime: Date.now() - startTime
    }, { status: 500 });
  }
}

// Example requests:

// Basic insights:
// GET /api/tokens/trending?insights=true&insightLevel=basic

// Decision summaries only:
// GET /api/tokens/trending?decisionOnly=true

// Raw data only (original behavior):
// GET /api/tokens/trending?insights=false

// Full insights (default):
// GET /api/tokens/trending
// GET /api/tokens/discover
// Returns tokens sorted by Alpha Score with optional risk filtering
// Query params: ?minAlpha=50&maxRisk=60&limit=20
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { AlphaScorer } from '@/lib/engines/analysis/alphaScorer';
import { DumpScorer } from '@/lib/engines/analysis/dumpScorer';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL!);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const minAlpha = parseInt(searchParams.get('minAlpha') || '0', 10);
    const maxRisk = parseInt(searchParams.get('maxRisk') || '100', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const chain = searchParams.get('chain'); // optional chain filter

    // Check cache
    const cacheKey = `discover:${minAlpha}:${maxRisk}:${limit}:${chain || 'all'}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, cached: true, data: JSON.parse(cached) });
    }

    // Fetch recent tokens from DB
    const where: any = {};
    if (chain) where.chainId = parseInt(chain, 10);

    const tokens = await prisma.token.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 100, // Fetch more then filter
      select: {
        address: true,
        symbol: true,
        name: true,
        chainId: true,
        price: true,
        marketCap: true,
        volume24h: true,
        liquidity: true,
        createdAt: true,
      },
    });

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, cached: false, data: { tokens: [], total: 0 } });
    }

    // Score all tokens in parallel (batched to avoid overload)
    const alphaScorer = new AlphaScorer(prisma, redis);
    const dumpScorer = new DumpScorer(prisma, redis);

    const scored = await Promise.allSettled(
      tokens.map(async (token) => {
        try {
          const [alpha, dump] = await Promise.all([
            alphaScorer.getCachedAlphaScore(token.address),
            dumpScorer.getCachedDumpScore(token.address),
          ]);

          const alphaScore = alpha?.finalScore ?? 0;
          const dumpScore = dump?.finalScore ?? 0;

          return {
            token,
            alphaScore,
            dumpScore,
            alphaLevel: alpha?.alphaLevel ?? 'LOW',
            dumpRiskLevel: dump?.riskLevel ?? 'LOW',
            humanReadable: dump?.humanReadable ?? null,
            primaryRisk: dump?.primaryRisk ?? null,
            earlySignals: alpha?.earlySignals ?? [],
          };
        } catch {
          return { token, alphaScore: 0, dumpScore: 0, alphaLevel: 'LOW', dumpRiskLevel: 'LOW', humanReadable: null, primaryRisk: null, earlySignals: [] };
        }
      })
    );

    const results = scored
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter(r => r.alphaScore >= minAlpha && r.dumpScore <= maxRisk)
      .sort((a, b) => b.alphaScore - a.alphaScore)
      .slice(0, limit)
      .map(r => ({
        address: r.token.address,
        symbol: r.token.symbol,
        name: r.token.name,
        chainId: r.token.chainId,
        price: r.token.price,
        marketCap: r.token.marketCap,
        volume24h: r.token.volume24h,
        liquidity: r.token.liquidity,
        createdAt: r.token.createdAt,
        alphaScore: r.alphaScore,
        dumpScore: r.dumpScore,
        alphaLevel: r.alphaLevel,
        dumpRiskLevel: r.dumpRiskLevel,
        humanReadable: r.humanReadable,
        primaryRisk: r.primaryRisk,
        earlySignals: r.earlySignals,
      }));

    const data = {
      tokens: results,
      total: results.length,
      filters: { minAlpha, maxRisk, limit, chain: chain || 'all' },
      timestamp: new Date().toISOString(),
    };

    // Cache for 2 minutes
    await redis.setex(cacheKey, 120, JSON.stringify(data));

    return NextResponse.json({ success: true, cached: false, data });

  } catch (error) {
    console.error('Error in /api/tokens/discover:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

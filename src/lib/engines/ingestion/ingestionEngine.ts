// Complete Data Ingestion Engine Example
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { IngestionQueueManager } from '../../queue/ingestionQueue';
import { DexScreenerService } from '../../services/dexscreener';

export class IngestionEngine {
  private prisma: PrismaClient;
  private redis: Redis;
  private queueManager: IngestionQueueManager;
  private dexScreener: DexScreenerService;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL!);
    this.queueManager = new IngestionQueueManager();
    this.dexScreener = new DexScreenerService(this.prisma);
  }

  // Initialize the ingestion engine
  async initialize() {
    console.log('🚀 Initializing Data Ingestion Engine...');
    
    // Start recurring jobs
    await this.queueManager.scheduleRecurringJobs();
    
    // Perform initial data sync
    await this.performInitialSync();
    
    console.log('✅ Data Ingestion Engine initialized successfully');
  }

  // Perform initial data synchronization
  private async performInitialSync() {
    try {
      console.log('🔄 Performing initial data sync...');
      
      // 1. Discover trending tokens
      const trendingTokens = await this.dexScreener.getTrendingTokens(50);
      console.log(`📊 Found ${trendingTokens.length} trending tokens`);
      
      // 2. Process each trending token
      for (const pair of trendingTokens.slice(0, 10)) { // Limit for initial sync
        await this.processTokenPair(pair);
      }
      
      // 3. Cache initial data
      await this.cacheInitialData(trendingTokens);
      
      console.log('✅ Initial sync completed');
      
    } catch (error) {
      console.error('❌ Initial sync failed:', error);
    }
  }

  // Process individual token pair
  private async processTokenPair(pair: any) {
    try {
      const tokenAddress = pair.baseToken.address;
      
      // 1. Create or update token
      const token = await this.prisma.token.upsert({
        where: { address: tokenAddress },
        update: {
          price: parseFloat(pair.priceUsd) || null,
          volume24h: pair.volume.h24 || null,
          liquidity: pair.liquidity?.usd || null,
          lastScanAt: new Date(),
        },
        create: {
          address: tokenAddress,
          symbol: pair.baseToken.symbol,
          name: pair.baseToken.name,
          chainId: this.getChainId(pair.chainId),
          price: parseFloat(pair.priceUsd) || null,
          volume24h: pair.volume.h24 || null,
          liquidity: pair.liquidity?.usd || null,
          lastScanAt: new Date(),
        }
      });

      // 2. Queue wallet analysis
      await this.queueManager.triggerWalletAnalysis(tokenAddress);
      
      // 3. Queue liquidity tracking
      await this.queueManager.triggerLiquidityCheck(tokenAddress);
      
      console.log(`✅ Processed token: ${pair.baseToken.symbol}`);
      
    } catch (error) {
      console.error(`❌ Error processing token ${pair.baseToken.symbol}:`, error);
    }
  }

  // Real-time ingestion workflow
  async ingestRealtimeData() {
    console.log('🔄 Starting real-time data ingestion...');
    
    // 1. Trigger immediate token discovery
    await this.queueManager.triggerTokenDiscovery('ethereum', true);
    await this.queueManager.triggerTokenDiscovery('bsc', true);
    
    // 2. Get queue statuses
    const queueStatuses = await this.queueManager.getAllQueueStatuses();
    console.log('📊 Queue statuses:', queueStatuses);
    
    // 3. Monitor for new high-activity tokens
    const highActivityTokens = await this.findHighActivityTokens();
    
    for (const tokenAddress of highActivityTokens) {
      // Immediate analysis for high activity
      await this.queueManager.triggerWalletAnalysis(tokenAddress);
    }
    
    return {
      queuesActive: Object.keys(queueStatuses).length,
      highActivityTokens: highActivityTokens.length,
      timestamp: new Date(),
    };
  }

  // Find tokens with high activity (potential alpha)
  private async findHighActivityTokens(): Promise<string[]> {
    const cutoffTime = new Date(Date.now() - 60 * 60 * 1000); // Last hour
    
    const activeTokens = await this.prisma.token.findMany({
      where: {
        lastScanAt: { gte: cutoffTime },
        volume24h: { gte: 10000 }, // Min $10k volume
        liquidity: { gte: 25000 }, // Min $25k liquidity
      },
      select: { address: true },
      orderBy: { volume24h: 'desc' },
      take: 20,
    });
    
    return activeTokens.map(token => token.address);
  }

  // Cache initial data for quick access
  private async cacheInitialData(trendingTokens: any[]) {
    try {
      // Cache trending tokens for 5 minutes
      await this.redis.setex(
        'trending_tokens_cache',
        300,
        JSON.stringify(trendingTokens.slice(0, 20))
      );
      
      // Cache ingestion stats
      const stats = {
        lastUpdate: new Date(),
        totalTokens: await this.prisma.token.count(),
        totalWallets: await this.prisma.wallet.count(),
        totalTransactions: await this.prisma.transaction.count(),
      };
      
      await this.redis.setex(
        'ingestion_stats',
        60, // 1 minute
        JSON.stringify(stats)
      );
      
    } catch (error) {
      console.error('❌ Error caching data:', error);
    }
  }

  // Helper method to get chain ID
  private getChainId(chainName: string): number {
    const chainMap: Record<string, number> = {
      'ethereum': 1,
      'bsc': 56,
      'polygon': 137,
      'solana': 1399,
    };
    return chainMap[chainName] || 1;
  }

  // Get ingestion statistics
  async getIngestionStats() {
    // Try cache first
    const cachedStats = await this.redis.get('ingestion_stats');
    if (cachedStats) {
      return JSON.parse(cachedStats);
    }

    // Calculate fresh stats
    const stats = {
      totalTokens: await this.prisma.token.count(),
      totalWallets: await this.prisma.wallet.count(),
      totalTransactions: await this.prisma.transaction.count(),
      recentTokens: await this.prisma.token.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),
      queueStatus: await this.queueManager.getAllQueueStatuses(),
      lastUpdate: new Date(),
    };

    // Cache for 1 minute
    await this.redis.setex('ingestion_stats', 60, JSON.stringify(stats));
    
    return stats;
  }

  // Shutdown the engine
  async shutdown() {
    console.log('🔄 Shutting down Data Ingestion Engine...');
    await this.queueManager.shutdown();
    await this.redis.quit();
    await this.prisma.$disconnect();
    console.log('✅ Data Ingestion Engine shut down successfully');
  }
}

// Example usage and initialization
export async function initializeIngestion() {
  const engine = new IngestionEngine();
  
  // Initialize the engine
  await engine.initialize();
  
  // Set up graceful shutdown
  process.on('SIGINT', async () => {
    await engine.shutdown();
    process.exit(0);
  });
  
  return engine;
}
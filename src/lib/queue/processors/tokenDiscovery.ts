// Token Discovery Job Processor
import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { DexScreenerService } from '../../services/dexscreener';
import { Redis } from 'ioredis';

interface TokenDiscoveryJobData {
  chain?: string;
  force?: boolean;
}

export class TokenDiscoveryProcessor {
  private prisma: PrismaClient;
  private dexScreener: DexScreenerService;
  private redis: Redis;

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
    this.dexScreener = new DexScreenerService(prisma);
  }

  async process(job: Job<TokenDiscoveryJobData>) {
    const { chain = 'ethereum', force = false } = job.data;
    
    try {
      // Update job status
      await this.updateJobStatus(job.id!, 'RUNNING');
      
      // Check if we should skip (rate limiting)
      if (!force && await this.shouldSkipDiscovery(chain)) {
        await job.updateProgress(100);
        return { skipped: true, reason: 'Rate limited' };
      }
      
      // Discover new tokens
      await job.updateProgress(25);
      const newTokens = await this.dexScreener.discoverNewTokens(chain);
      
      // Get trending tokens for additional data
      await job.updateProgress(50);
      const trendingTokens = await this.dexScreener.getTrendingTokens(100);
      
      // Cache results for quick access
      await job.updateProgress(75);
      await this.cacheDiscoveryResults(chain, newTokens, trendingTokens);
      
      // Update scan timestamp
      await this.redis.set(`last_discovery:${chain}`, Date.now());
      
      await job.updateProgress(100);
      await this.updateJobStatus(job.id!, 'COMPLETED');
      
      return {
        newTokensFound: newTokens.length,
        trendingTokensProcessed: trendingTokens.length,
        chain
      };
      
    } catch (error) {
      await this.updateJobStatus(job.id!, 'FAILED', error.message);
      throw error;
    }
  }

  private async shouldSkipDiscovery(chain: string): Promise<boolean> {
    const lastRun = await this.redis.get(`last_discovery:${chain}`);
    if (!lastRun) return false;
    
    // Skip if last run was less than 5 minutes ago
    const timeDiff = Date.now() - parseInt(lastRun);
    return timeDiff < 5 * 60 * 1000;
  }

  private async cacheDiscoveryResults(
    chain: string, 
    newTokens: string[], 
    trendingTokens: any[]
  ) {
    // Cache new tokens list
    await this.redis.setex(
      `new_tokens:${chain}`, 
      300, // 5 minutes
      JSON.stringify(newTokens)
    );
    
    // Cache trending tokens data
    await this.redis.setex(
      `trending_tokens:${chain}`,
      300,
      JSON.stringify(trendingTokens.slice(0, 20)) // Top 20
    );
  }

  private async updateJobStatus(jobId: string, status: string, error?: string) {
    await this.prisma.scanJob.upsert({
      where: { id: jobId },
      update: {
        status: status as any,
        error,
        completedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date() : null
      },
      create: {
        id: jobId,
        type: 'token_discovery',
        status: status as any,
        error,
        startedAt: status === 'RUNNING' ? new Date() : null,
        completedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date() : null
      }
    });
  }
}
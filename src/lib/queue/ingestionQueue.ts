// Data Ingestion Queue Manager
import { Queue, Worker, QueueOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { TokenDiscoveryProcessor } from './processors/tokenDiscovery';

export class IngestionQueueManager {
  private redis: Redis;
  private prisma: PrismaClient;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
    this.prisma = new PrismaClient();
    this.setupQueues();
    this.setupWorkers();
  }

  private setupQueues() {
    const queueConfig: QueueOptions = {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 20,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    };

    // Create queues for different ingestion tasks
    this.queues.set('token-discovery', new Queue('token-discovery', queueConfig));
    this.queues.set('wallet-analysis', new Queue('wallet-analysis', queueConfig));
    this.queues.set('liquidity-tracking', new Queue('liquidity-tracking', queueConfig));
    this.queues.set('price-updates', new Queue('price-updates', queueConfig));
  }

  private setupWorkers() {
    const tokenProcessor = new TokenDiscoveryProcessor(this.prisma, this.redis);

    // Token Discovery Worker
    const tokenWorker = new Worker(
      'token-discovery',
      async (job) => await tokenProcessor.process(job),
      {
        connection: this.redis,
        concurrency: 2, // Process 2 jobs simultaneously
      }
    );

    tokenWorker.on('completed', (job) => {
      console.log(`✅ Token discovery job ${job.id} completed`);
    });

    tokenWorker.on('failed', (job, err) => {
      console.error(`❌ Token discovery job ${job?.id} failed:`, err);
    });

    this.workers.set('token-discovery', tokenWorker);
  }

  // Schedule recurring jobs
  async scheduleRecurringJobs() {
    const tokenQueue = this.queues.get('token-discovery')!;

    // Discover new tokens every 5 minutes
    await tokenQueue.add(
      'discover-ethereum',
      { chain: 'ethereum' },
      {
        repeat: { pattern: '*/5 * * * *' }, // Every 5 minutes
        jobId: 'token-discovery-ethereum',
      }
    );

    // Discover BSC tokens every 10 minutes
    await tokenQueue.add(
      'discover-bsc',
      { chain: 'bsc' },
      {
        repeat: { pattern: '*/10 * * * *' }, // Every 10 minutes
        jobId: 'token-discovery-bsc',
      }
    );

    // Price updates every minute for active tokens
    const priceQueue = this.queues.get('price-updates')!;
    await priceQueue.add(
      'update-active-prices',
      {},
      {
        repeat: { pattern: '* * * * *' }, // Every minute
        jobId: 'price-updates-active',
      }
    );
  }

  // Manual job triggers
  async triggerTokenDiscovery(chain: string = 'ethereum', force: boolean = false) {
    const queue = this.queues.get('token-discovery')!;
    return await queue.add('manual-discovery', { chain, force });
  }

  async triggerWalletAnalysis(tokenAddress: string) {
    const queue = this.queues.get('wallet-analysis')!;
    return await queue.add('analyze-wallets', { tokenAddress });
  }

  async triggerLiquidityCheck(tokenAddress: string) {
    const queue = this.queues.get('liquidity-tracking')!;
    return await queue.add('check-liquidity', { tokenAddress });
  }

  // Queue status monitoring
  async getQueueStatus(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    const waiting = await queue.getWaiting();
    const active = await queue.getActive();
    const completed = await queue.getCompleted();
    const failed = await queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  async getAllQueueStatuses() {
    const statuses: Record<string, any> = {};
    
    for (const [name, queue] of this.queues) {
      statuses[name] = await this.getQueueStatus(name);
    }
    
    return statuses;
  }

  // Cleanup
  async shutdown() {
    console.log('🔄 Shutting down ingestion queues...');
    
    for (const worker of this.workers.values()) {
      await worker.close();
    }
    
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    
    await this.redis.quit();
    await this.prisma.$disconnect();
    
    console.log('✅ Ingestion queues shut down successfully');
  }
}
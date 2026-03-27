// Smart Wallet Intelligence Engine
// Tracks and scores wallets based on historical trading performance
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

export type WalletClass = 'SMART_MONEY' | 'SNIPER' | 'DEV' | 'WHALE' | 'BOT' | 'RETAIL';

export interface WalletStats {
  winRate: number;        // % of profitable trades (0-100)
  avgMultiple: number;    // Average return multiple (e.g. 3.2x)
  totalTrades: number;
  avgEntryMcap: number;   // Average market cap at entry (lower = smarter entry)
  avgExitMcap: number;    // Average MC at exit
  bestTrade: number;      // Best single trade multiple
  worstTrade: number;
  streak: number;         // Current win streak
}

export interface WalletActivity {
  tokenAddress: string;
  tokenSymbol: string;
  action: 'ENTER' | 'ADD' | 'EXIT' | 'PARTIAL_EXIT';
  amount: number;         // USD value
  timestamp: Date;
  mcapAtAction: number;
  pnlEstimate?: number;   // Estimated PnL if exit
}

export interface SmartWallet {
  address: string;
  score: number;                  // 0-100 (higher = smarter)
  classification: WalletClass;
  stats: WalletStats;
  recentActivity: WalletActivity[];
  rank: number;                   // Global rank among tracked wallets
  lastUpdated: Date;
}

export class SmartWalletEngine {
  private prisma: PrismaClient;
  private redis: Redis;

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
  }

  // Score a wallet based on historical performance
  async scoreWallet(address: string): Promise<SmartWallet> {
    // Try DB first
    const existing = await this.getWalletFromDb(address);
    const activities = await this.getWalletActivities(address, 50);

    // Build stats from activity data
    const stats = this.calculateStats(activities, existing);
    const score = this.calculateScore(stats);
    const classification = this.classifyWallet(score, stats, existing);

    const wallet: SmartWallet = {
      address,
      score,
      classification,
      stats,
      recentActivity: activities.slice(0, 10),
      rank: existing?.rank || 9999,
      lastUpdated: new Date(),
    };

    // Persist / update in DB
    await this.upsertWallet(wallet);

    return wallet;
  }

  // Get top N ranked wallets
  async getTopWallets(limit: number = 20): Promise<SmartWallet[]> {
    try {
      const dbWallets = await (this.prisma as any).smartWallet.findMany({
        where: { isTracked: true },
        orderBy: { score: 'desc' },
        take: limit,
        include: { activities: { orderBy: { timestamp: 'desc' }, take: 5 } },
      });

      return dbWallets.map((w: any) => this.dbWalletToSmartWallet(w));
    } catch (err) {
      console.warn('[SmartWalletEngine] getTopWallets DB error:', err);
      return [];
    }
  }

  // Detect when a tracked wallet enters a new token (since N minutes ago)
  async detectNewEntries(sinceMinutes: number = 30): Promise<WalletActivity[]> {
    const since = new Date(Date.now() - sinceMinutes * 60 * 1000);
    try {
      const activities = await (this.prisma as any).walletActivity.findMany({
        where: {
          action: { in: ['ENTER', 'ADD'] },
          timestamp: { gte: since },
          wallet: { isTracked: true, score: { gte: 60 } },
        },
        orderBy: { timestamp: 'desc' },
        include: { wallet: true },
        take: 50,
      });

      return activities.map((a: any) => this.dbActivityToActivity(a));
    } catch (err) {
      console.warn('[SmartWalletEngine] detectNewEntries DB error:', err);
      return [];
    }
  }

  // Detect when tracked wallets are exiting a token
  async detectExits(tokenAddress: string): Promise<{ wallet: SmartWallet; activity: WalletActivity }[]> {
    const since = new Date(Date.now() - 60 * 60 * 1000); // Last hour
    try {
      const activities = await (this.prisma as any).walletActivity.findMany({
        where: {
          tokenAddress,
          action: { in: ['EXIT', 'PARTIAL_EXIT'] },
          timestamp: { gte: since },
          wallet: { isTracked: true },
        },
        include: { wallet: { include: { activities: { orderBy: { timestamp: 'desc' }, take: 5 } } } },
        orderBy: { timestamp: 'desc' },
      });

      return activities.map((a: any) => ({
        wallet: this.dbWalletToSmartWallet(a.wallet),
        activity: this.dbActivityToActivity(a),
      }));
    } catch (err) {
      console.warn('[SmartWalletEngine] detectExits DB error:', err);
      return [];
    }
  }

  // Auto-discover potentially smart wallets from recent alpha trades
  async discoverSmartWallets(): Promise<string[]> {
    try {
      // Find wallets with high win activity: multiple profitable entries
      const candidates = await this.prisma.wallet.findMany({
        where: {
          type: { not: 'EXCHANGE' },
        },
        include: {
          transactions: {
            where: {
              type: 'BUY',
              timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
            orderBy: { timestamp: 'desc' },
          },
        },
        take: 200,
      });

      // Filter for wallets with multiple early entries (large buy at low MC)
      const promising: string[] = [];
      for (const wallet of candidates) {
        const largeBuys = wallet.transactions.filter((tx: any) => (tx.value || 0) > 1000);
        if (largeBuys.length >= 3) {
          promising.push(wallet.address);
        }
      }

      // Cache discovered wallets
      if (promising.length > 0) {
        await this.redis.setex('discovered_smart_wallets', 3600, JSON.stringify(promising));
      }

      return promising;
    } catch (err) {
      console.warn('[SmartWalletEngine] discoverSmartWallets error:', err);
      return [];
    }
  }

  // Decay wallet scores if they start underperforming
  async updateScores(): Promise<void> {
    try {
      const wallets = await (this.prisma as any).smartWallet.findMany({
        where: { isTracked: true },
        include: { activities: { orderBy: { timestamp: 'desc' }, take: 5 } },
      });

      for (const wallet of wallets) {
        const recentActivities: any[] = wallet.activities || [];
        const recentExits = recentActivities.filter((a: any) => a.action === 'EXIT' || a.action === 'PARTIAL_EXIT');

        if (recentExits.length >= 5) {
          const recentWins = recentExits.filter((a: any) => (a.pnlEstimate || 0) > 0).length;
          const recentWinRate = (recentWins / recentExits.length) * 100;

          // DECAY: if last 5 trades win rate < 40%, reduce score by 15 points
          if (recentWinRate < 40) {
            const newScore = Math.max(0, wallet.score - 15);
            await (this.prisma as any).smartWallet.update({
              where: { id: wallet.id },
              data: { score: newScore, updatedAt: new Date() },
            });
            console.log(`[SmartWalletEngine] Decayed score for ${wallet.address}: ${wallet.score} → ${newScore}`);
          }
        }

        // Re-rank all wallets
        await this.reRankWallets();
      }
    } catch (err) {
      console.warn('[SmartWalletEngine] updateScores error:', err);
    }
  }

  // ======= SCORING LOGIC =======

  private calculateScore(stats: WalletStats): number {
    let score = 0;

    // winRate > 70% = 40 base points
    if (stats.winRate > 70) {
      score += 40;
    } else if (stats.winRate > 55) {
      score += 20;
    } else if (stats.winRate > 40) {
      score += 10;
    }

    // avgMultiple > 5x = +20 points
    if (stats.avgMultiple > 5) {
      score += 20;
    } else if (stats.avgMultiple > 3) {
      score += 12;
    } else if (stats.avgMultiple > 1.5) {
      score += 5;
    }

    // avgEntryMcap < $500k (early entry) = +20 points
    if (stats.avgEntryMcap > 0 && stats.avgEntryMcap < 500000) {
      score += 20;
    } else if (stats.avgEntryMcap < 1000000) {
      score += 10;
    }

    // Consistency bonus: 10+ trades with winRate > 60% = +20 points
    if (stats.totalTrades >= 10 && stats.winRate > 60) {
      score += 20;
    } else if (stats.totalTrades >= 5 && stats.winRate > 55) {
      score += 8;
    }

    // Streak bonus
    if (stats.streak >= 5) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  private calculateStats(activities: WalletActivity[], existing: any): WalletStats {
    if (activities.length === 0) {
      return {
        winRate: existing?.winRate || 0,
        avgMultiple: existing?.avgMultiple || 1,
        totalTrades: existing?.totalTrades || 0,
        avgEntryMcap: existing?.avgEntryMcap || 0,
        avgExitMcap: 0,
        bestTrade: 1,
        worstTrade: 1,
        streak: 0,
      };
    }

    const exits = activities.filter(a => a.action === 'EXIT' || a.action === 'PARTIAL_EXIT');
    const entries = activities.filter(a => a.action === 'ENTER');

    const wins = exits.filter(a => (a.pnlEstimate || 0) > 0).length;
    const winRate = exits.length > 0 ? (wins / exits.length) * 100 : 0;

    const multiples = exits
      .filter(a => a.pnlEstimate != null)
      .map(a => {
        const entry = entries.find(e => e.tokenAddress === a.tokenAddress);
        if (entry && entry.amount > 0) return (entry.amount + (a.pnlEstimate || 0)) / entry.amount;
        return 1;
      })
      .filter(m => m > 0);

    const avgMultiple = multiples.length > 0
      ? multiples.reduce((a, b) => a + b, 0) / multiples.length
      : 1;

    const entryMcaps = entries.map(e => e.mcapAtAction).filter(m => m > 0);
    const avgEntryMcap = entryMcaps.length > 0
      ? entryMcaps.reduce((a, b) => a + b, 0) / entryMcaps.length
      : 0;

    const exitMcaps = exits.map(e => e.mcapAtAction).filter(m => m > 0);
    const avgExitMcap = exitMcaps.length > 0
      ? exitMcaps.reduce((a, b) => a + b, 0) / exitMcaps.length
      : 0;

    const bestTrade = multiples.length > 0 ? Math.max(...multiples) : 1;
    const worstTrade = multiples.length > 0 ? Math.min(...multiples) : 1;

    // Calculate streak (consecutive wins from most recent)
    let streak = 0;
    for (const exit of exits.slice(0, 10)) {
      if ((exit.pnlEstimate || 0) > 0) streak++;
      else break;
    }

    return {
      winRate: Math.round(winRate * 10) / 10,
      avgMultiple: Math.round(avgMultiple * 100) / 100,
      totalTrades: exits.length,
      avgEntryMcap: Math.round(avgEntryMcap),
      avgExitMcap: Math.round(avgExitMcap),
      bestTrade: Math.round(bestTrade * 100) / 100,
      worstTrade: Math.round(worstTrade * 100) / 100,
      streak,
    };
  }

  private classifyWallet(score: number, stats: WalletStats, existing: any): WalletClass {
    if (existing?.classification) return existing.classification as WalletClass;

    if (score >= 75) return 'SMART_MONEY';
    if (stats.avgEntryMcap < 200000 && stats.totalTrades > 5) return 'SNIPER';
    if (stats.avgMultiple > 0 && stats.avgEntryMcap > 5000000) return 'WHALE';
    if (stats.totalTrades > 50 && stats.winRate < 45) return 'BOT';
    return 'RETAIL';
  }

  // ======= HELPERS =======

  private async getWalletFromDb(address: string): Promise<any> {
    try {
      return await (this.prisma as any).smartWallet.findUnique({
        where: { address },
        include: { activities: { orderBy: { timestamp: 'desc' }, take: 10 } },
      });
    } catch {
      return null;
    }
  }

  private async getWalletActivities(address: string, limit: number): Promise<WalletActivity[]> {
    try {
      const acts = await (this.prisma as any).walletActivity.findMany({
        where: { walletAddress: address },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
      return acts.map((a: any) => this.dbActivityToActivity(a));
    } catch {
      return [];
    }
  }

  private async upsertWallet(wallet: SmartWallet): Promise<void> {
    try {
      await (this.prisma as any).smartWallet.upsert({
        where: { address: wallet.address },
        create: {
          address: wallet.address,
          score: wallet.score,
          classification: wallet.classification,
          winRate: wallet.stats.winRate,
          avgMultiple: wallet.stats.avgMultiple,
          totalTrades: wallet.stats.totalTrades,
          avgEntryMcap: wallet.stats.avgEntryMcap,
          rank: wallet.rank,
          isTracked: true,
        },
        update: {
          score: wallet.score,
          classification: wallet.classification,
          winRate: wallet.stats.winRate,
          avgMultiple: wallet.stats.avgMultiple,
          totalTrades: wallet.stats.totalTrades,
          avgEntryMcap: wallet.stats.avgEntryMcap,
          updatedAt: new Date(),
        },
      });
    } catch (err) {
      console.warn('[SmartWalletEngine] upsertWallet error:', err);
    }
  }

  private async reRankWallets(): Promise<void> {
    try {
      const wallets = await (this.prisma as any).smartWallet.findMany({
        where: { isTracked: true },
        orderBy: { score: 'desc' },
        select: { id: true },
      });

      for (let i = 0; i < wallets.length; i++) {
        await (this.prisma as any).smartWallet.update({
          where: { id: wallets[i].id },
          data: { rank: i + 1 },
        });
      }
    } catch (err) {
      console.warn('[SmartWalletEngine] reRankWallets error:', err);
    }
  }

  private dbWalletToSmartWallet(w: any): SmartWallet {
    return {
      address: w.address,
      score: w.score,
      classification: w.classification as WalletClass,
      stats: {
        winRate: w.winRate,
        avgMultiple: w.avgMultiple,
        totalTrades: w.totalTrades,
        avgEntryMcap: w.avgEntryMcap,
        avgExitMcap: 0,
        bestTrade: 0,
        worstTrade: 0,
        streak: 0,
      },
      recentActivity: (w.activities || []).map((a: any) => this.dbActivityToActivity(a)),
      rank: w.rank || 9999,
      lastUpdated: w.updatedAt || new Date(),
    };
  }

  private dbActivityToActivity(a: any): WalletActivity {
    return {
      tokenAddress: a.tokenAddress,
      tokenSymbol: a.tokenSymbol,
      action: a.action as WalletActivity['action'],
      amount: a.amountUsd,
      timestamp: new Date(a.timestamp),
      mcapAtAction: a.mcapAtAction,
      pnlEstimate: a.pnlEstimate ?? undefined,
    };
  }
}

// Rug Score Analysis Engine
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

interface RugScoreComponents {
  contractSafety: ComponentScore;
  holderDistribution: ComponentScore;
  liquiditySafety: ComponentScore;
  devBehavior: ComponentScore;
  tradingPatterns: ComponentScore;
}

interface ComponentScore {
  score: number; // 0-100
  reasoning: string[];
  flags: string[];
  weight: number;
}

interface RugScoreResult {
  tokenAddress: string;
  finalScore: number; // 0-100 (0 = safest, 100 = highest rug risk)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  components: RugScoreComponents;
  summary: string;
  timestamp: Date;
}

export class RugScorer {
  private prisma: PrismaClient;
  private redis: Redis;

  // Component weights (must sum to 1.0)
  private readonly WEIGHTS = {
    contractSafety: 0.20,
    holderDistribution: 0.20,
    liquiditySafety: 0.20,
    devBehavior: 0.20,
    tradingPatterns: 0.20,
  };

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
  }

  // Main scoring function
  async calculateRugScore(tokenAddress: string): Promise<RugScoreResult> {
    try {
      // Get token data with relations
      const tokenData = await this.getTokenWithRelations(tokenAddress);
      if (!tokenData) {
        throw new Error(`Token ${tokenAddress} not found`);
      }

      // Calculate each component score
      const contractSafety = await this.scoreContractSafety(tokenData);
      const holderDistribution = await this.scoreHolderDistribution(tokenData);
      const liquiditySafety = await this.scoreLiquiditySafety(tokenData);
      const devBehavior = await this.scoreDevBehavior(tokenData);
      const tradingPatterns = await this.scoreTradingPatterns(tokenData);

      // Aggregate final score
      const finalScore = this.calculateWeightedScore({
        contractSafety,
        holderDistribution,
        liquiditySafety,
        devBehavior,
        tradingPatterns,
      });

      const result: RugScoreResult = {
        tokenAddress,
        finalScore,
        riskLevel: this.getRiskLevel(finalScore),
        components: {
          contractSafety,
          holderDistribution,
          liquiditySafety,
          devBehavior,
          tradingPatterns,
        },
        summary: this.generateSummary(finalScore, {
          contractSafety,
          holderDistribution,
          liquiditySafety,
          devBehavior,
          tradingPatterns,
        }),
        timestamp: new Date(),
      };

      // Cache result for 5 minutes
      await this.cacheResult(tokenAddress, result);

      return result;

    } catch (error) {
      console.error(`Error calculating rug score for ${tokenAddress}:`, error);
      throw error;
    }
  }

  // 1. CONTRACT SAFETY SCORING (20%)
  private async scoreContractSafety(token: any): Promise<ComponentScore> {
    let score = 0;
    const reasoning: string[] = [];
    const flags: string[] = [];

    // Verified contract (+30 points)
    if (token.verified) {
      score += 30;
      reasoning.push("✅ Contract is verified on block explorer");
    } else {
      score -= 20;
      reasoning.push("⚠️ Contract is NOT verified");
      flags.push("UNVERIFIED_CONTRACT");
    }

    // Renounced ownership (+25 points)
    if (token.ownershipRenounced) {
      score += 25;
      reasoning.push("✅ Ownership has been renounced");
    } else {
      score -= 15;
      reasoning.push("⚠️ Ownership has NOT been renounced");
      flags.push("OWNERSHIP_NOT_RENOUNCED");
    }

    // Proxy contract (-30 points - higher risk)
    if (token.isProxy) {
      score -= 30;
      reasoning.push("🚨 Contract uses proxy pattern (upgradeable)");
      flags.push("PROXY_CONTRACT");
    } else {
      score += 15;
      reasoning.push("✅ Contract is not a proxy (non-upgradeable)");
    }

    // High buy/sell tax (-20 points)
    const avgTax = ((token.buyTax || 0) + (token.sellTax || 0)) / 2;
    if (avgTax > 10) {
      score -= 20;
      reasoning.push(`🚨 High transaction tax: ${avgTax.toFixed(1)}%`);
      flags.push("HIGH_TAX");
    } else if (avgTax > 5) {
      score -= 10;
      reasoning.push(`⚠️ Moderate transaction tax: ${avgTax.toFixed(1)}%`);
    } else {
      score += 10;
      reasoning.push(`✅ Low transaction tax: ${avgTax.toFixed(1)}%`);
    }

    // Normalize score to 0-100 (inverted: lower score = higher risk)
    const normalizedScore = Math.max(0, Math.min(100, 100 - score));

    return {
      score: normalizedScore,
      reasoning,
      flags,
      weight: this.WEIGHTS.contractSafety,
    };
  }

  // 2. HOLDER DISTRIBUTION SCORING (20%)
  private async scoreHolderDistribution(token: any): Promise<ComponentScore> {
    let score = 0;
    const reasoning: string[] = [];
    const flags: string[] = [];

    const holdings = token.wallets || [];
    const totalHolders = holdings.length;

    if (totalHolders === 0) {
      return {
        score: 100, // High risk if no holder data
        reasoning: ["🚨 No holder data available"],
        flags: ["NO_HOLDER_DATA"],
        weight: this.WEIGHTS.holderDistribution,
      };
    }

    // Sort holders by percentage
    const sortedHoldings = holdings.sort((a: any, b: any) => b.percentage - a.percentage);

    // Top 10 holders concentration
    const top10Holdings = sortedHoldings.slice(0, 10);
    const top10Percentage = top10Holdings.reduce((sum: number, h: any) => sum + h.percentage, 0);

    if (top10Percentage > 70) {
      score += 40; // High concentration = high risk
      reasoning.push(`🚨 Top 10 holders own ${top10Percentage.toFixed(1)}% of supply`);
      flags.push("HIGH_CONCENTRATION");
    } else if (top10Percentage > 50) {
      score += 20;
      reasoning.push(`⚠️ Top 10 holders own ${top10Percentage.toFixed(1)}% of supply`);
    } else {
      score -= 20;
      reasoning.push(`✅ Good distribution: Top 10 holders own ${top10Percentage.toFixed(1)}%`);
    }

    // Whale analysis (holders with >5%)
    const whales = sortedHoldings.filter((h: any) => h.percentage > 5);
    if (whales.length > 5) {
      score += 25;
      reasoning.push(`🚨 ${whales.length} whale wallets (>5% each)`);
      flags.push("MULTIPLE_WHALES");
    } else if (whales.length > 2) {
      score += 10;
      reasoning.push(`⚠️ ${whales.length} whale wallets detected`);
    }

    // Single holder dominance (>20%)
    const topHolder = sortedHoldings[0];
    if (topHolder && topHolder.percentage > 20) {
      score += 30;
      reasoning.push(`🚨 Single holder owns ${topHolder.percentage.toFixed(1)}% of supply`);
      flags.push("DOMINANT_HOLDER");
    }

    // Sniper wallet concentration
    const sniperWallets = holdings.filter((h: any) => h.wallet?.isSniper);
    const sniperPercentage = sniperWallets.reduce((sum: number, h: any) => sum + h.percentage, 0);
    
    if (sniperPercentage > 30) {
      score += 35;
      reasoning.push(`🚨 Sniper wallets control ${sniperPercentage.toFixed(1)}% of supply`);
      flags.push("SNIPER_CONCENTRATION");
    }

    // Normalize score
    const normalizedScore = Math.max(0, Math.min(100, score));

    return {
      score: normalizedScore,
      reasoning,
      flags,
      weight: this.WEIGHTS.holderDistribution,
    };
  }

  // 3. LIQUIDITY SAFETY SCORING (20%)
  private async scoreLiquiditySafety(token: any): Promise<ComponentScore> {
    let score = 0;
    const reasoning: string[] = [];
    const flags: string[] = [];

    const liquidityPools = token.liquidityPools || [];
    
    if (liquidityPools.length === 0) {
      return {
        score: 100,
        reasoning: ["🚨 No liquidity pools found"],
        flags: ["NO_LIQUIDITY"],
        weight: this.WEIGHTS.liquiditySafety,
      };
    }

    const mainPool = liquidityPools[0]; // Largest pool
    const totalLiquidity = mainPool.totalLiquidity || 0;
    const marketCap = token.marketCap || 0;

    // LP Lock Status
    if (mainPool.isLocked) {
      score -= 30;
      const lockDuration = mainPool.lockUntil ? 
        Math.ceil((new Date(mainPool.lockUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
      
      if (lockDuration > 365) {
        score -= 20;
        reasoning.push(`✅ LP locked for ${lockDuration} days`);
      } else if (lockDuration > 90) {
        score -= 10;
        reasoning.push(`✅ LP locked for ${lockDuration} days`);
      } else {
        score += 15;
        reasoning.push(`⚠️ LP locked for only ${lockDuration} days`);
        flags.push("SHORT_LOCK");
      }
    } else {
      score += 40;
      reasoning.push("🚨 LP is NOT locked");
      flags.push("NO_LP_LOCK");
    }

    // Liquidity to Market Cap Ratio
    if (marketCap > 0) {
      const liquidityRatio = (totalLiquidity / marketCap) * 100;
      
      if (liquidityRatio < 5) {
        score += 25;
        reasoning.push(`🚨 Low liquidity ratio: ${liquidityRatio.toFixed(1)}%`);
        flags.push("LOW_LIQUIDITY_RATIO");
      } else if (liquidityRatio < 15) {
        score += 10;
        reasoning.push(`⚠️ Moderate liquidity ratio: ${liquidityRatio.toFixed(1)}%`);
      } else {
        score -= 15;
        reasoning.push(`✅ Good liquidity ratio: ${liquidityRatio.toFixed(1)}%`);
      }
    }

    // Multiple pools risk
    if (liquidityPools.length > 3) {
      score += 15;
      reasoning.push(`⚠️ Liquidity spread across ${liquidityPools.length} pools`);
      flags.push("FRAGMENTED_LIQUIDITY");
    }

    // Absolute liquidity amount
    if (totalLiquidity < 10000) {
      score += 30;
      reasoning.push(`🚨 Very low liquidity: $${totalLiquidity.toLocaleString()}`);
      flags.push("VERY_LOW_LIQUIDITY");
    } else if (totalLiquidity < 50000) {
      score += 15;
      reasoning.push(`⚠️ Low liquidity: $${totalLiquidity.toLocaleString()}`);
    } else {
      score -= 10;
      reasoning.push(`✅ Adequate liquidity: $${totalLiquidity.toLocaleString()}`);
    }

    const normalizedScore = Math.max(0, Math.min(100, score));

    return {
      score: normalizedScore,
      reasoning,
      flags,
      weight: this.WEIGHTS.liquiditySafety,
    };
  }

  // 4. DEV BEHAVIOR SCORING (20%)
  private async scoreDevBehavior(token: any): Promise<ComponentScore> {
    let score = 0;
    const reasoning: string[] = [];
    const flags: string[] = [];

    // Find dev wallets
    const devWallets = token.wallets?.filter((h: any) => h.wallet?.isDevWallet) || [];
    
    if (devWallets.length === 0) {
      score += 20;
      reasoning.push("⚠️ No identified dev wallets (could be good or bad)");
      return {
        score: 20, // Moderate risk when no dev info
        reasoning,
        flags: ["NO_DEV_IDENTIFIED"],
        weight: this.WEIGHTS.devBehavior,
      };
    }

    // Analyze dev wallet transactions
    for (const devHolding of devWallets) {
      const devWallet = devHolding.wallet;
      const devTransactions = token.transactions?.filter((tx: any) => 
        tx.walletId === devWallet.id
      ) || [];

      // Dev selling pattern
      const sellTransactions = devTransactions.filter((tx: any) => tx.type === 'SELL');
      const totalSells = sellTransactions.length;
      const recentSells = sellTransactions.filter((tx: any) => 
        new Date(tx.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length;

      if (recentSells > 0) {
        score += 30;
        reasoning.push(`🚨 Dev wallet sold ${recentSells} times in last 24h`);
        flags.push("RECENT_DEV_SELLS");
      }

      if (totalSells > 5) {
        score += 20;
        reasoning.push(`🚨 Dev wallet has ${totalSells} sell transactions`);
        flags.push("FREQUENT_DEV_SELLS");
      }

      // Dev holding percentage
      if (devHolding.percentage > 15) {
        score += 25;
        reasoning.push(`🚨 Dev holds ${devHolding.percentage.toFixed(1)}% of supply`);
        flags.push("HIGH_DEV_HOLDING");
      } else if (devHolding.percentage > 5) {
        score += 10;
        reasoning.push(`⚠️ Dev holds ${devHolding.percentage.toFixed(1)}% of supply`);
      }

      // Multiple dev wallet transfers
      const transferTxs = devTransactions.filter((tx: any) => tx.type === 'TRANSFER');
      if (transferTxs.length > 3) {
        score += 15;
        reasoning.push(`⚠️ Dev made ${transferTxs.length} transfer transactions`);
        flags.push("DEV_WALLET_TRANSFERS");
      }
    }

    // If no concerning dev behavior found
    if (score === 0) {
      reasoning.push("✅ No concerning dev wallet behavior detected");
    }

    const normalizedScore = Math.max(0, Math.min(100, score));

    return {
      score: normalizedScore,
      reasoning,
      flags,
      weight: this.WEIGHTS.devBehavior,
    };
  }

  // 5. TRADING PATTERNS SCORING (20%)
  private async scoreTradingPatterns(token: any): Promise<ComponentScore> {
    let score = 0;
    const reasoning: string[] = [];
    const flags: string[] = [];

    const transactions = token.transactions || [];
    
    if (transactions.length < 10) {
      score += 30;
      reasoning.push("🚨 Very few transactions detected");
      flags.push("LOW_ACTIVITY");
    }

    // Recent transaction analysis (last 24h)
    const recentTxs = transactions.filter((tx: any) => 
      new Date(tx.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    const buyTxs = recentTxs.filter((tx: any) => tx.type === 'BUY');
    const sellTxs = recentTxs.filter((tx: any) => tx.type === 'SELL');

    // Bot-like activity detection
    const uniqueBuyers = new Set(buyTxs.map((tx: any) => tx.walletId)).size;
    const uniqueSellers = new Set(sellTxs.map((tx: any) => tx.walletId)).size;

    if (buyTxs.length > 20 && uniqueBuyers < 5) {
      score += 30;
      reasoning.push("🚨 Possible bot buying detected");
      flags.push("BOT_BUYING");
    }

    // Wash trading detection
    const washTraders = buyTxs.filter((buyTx: any) => 
      sellTxs.some((sellTx: any) => 
        sellTx.walletId === buyTx.walletId && 
        Math.abs(sellTx.amount - buyTx.amount) < buyTx.amount * 0.1 // Similar amounts
      )
    );

    if (washTraders.length > buyTxs.length * 0.3) {
      score += 35;
      reasoning.push("🚨 Potential wash trading detected");
      flags.push("WASH_TRADING");
    }

    // Volume anomalies
    const volume24h = token.volume24h || 0;
    const marketCap = token.marketCap || 0;
    
    if (marketCap > 0) {
      const volumeRatio = volume24h / marketCap;
      
      if (volumeRatio > 2) {
        score += 25;
        reasoning.push(`🚨 Unusually high volume ratio: ${(volumeRatio * 100).toFixed(1)}%`);
        flags.push("VOLUME_ANOMALY");
      } else if (volumeRatio > 1) {
        score += 10;
        reasoning.push(`⚠️ High volume ratio: ${(volumeRatio * 100).toFixed(1)}%`);
      }
    }

    // Transaction timing patterns (clustering)
    const txTimestamps = recentTxs.map((tx: any) => new Date(tx.timestamp).getTime());
    const clusteredTxs = this.findTransactionClusters(txTimestamps);
    
    if (clusteredTxs.length > 3) {
      score += 20;
      reasoning.push(`⚠️ ${clusteredTxs.length} transaction clusters detected`);
      flags.push("CLUSTERED_TRANSACTIONS");
    }

    // Sudden activity spikes
    const hourlyTxCounts = this.getHourlyTransactionCounts(recentTxs);
    const avgTxsPerHour = hourlyTxCounts.reduce((a, b) => a + b, 0) / hourlyTxCounts.length;
    const maxTxsInHour = Math.max(...hourlyTxCounts);
    
    if (maxTxsInHour > avgTxsPerHour * 5) {
      score += 15;
      reasoning.push("⚠️ Sudden transaction activity spike detected");
      flags.push("ACTIVITY_SPIKE");
    }

    if (score === 0) {
      reasoning.push("✅ Normal trading patterns detected");
    }

    const normalizedScore = Math.max(0, Math.min(100, score));

    return {
      score: normalizedScore,
      reasoning,
      flags,
      weight: this.WEIGHTS.tradingPatterns,
    };
  }

  // Helper methods
  private findTransactionClusters(timestamps: number[]): number[][] {
    const clusters: number[][] = [];
    const sorted = [...timestamps].sort((a, b) => a - b);
    let currentCluster: number[] = [];
    
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0 || sorted[i] - sorted[i - 1] < 5 * 60 * 1000) { // 5 minute window
        currentCluster.push(sorted[i]);
      } else {
        if (currentCluster.length > 5) {
          clusters.push(currentCluster);
        }
        currentCluster = [sorted[i]];
      }
    }
    
    if (currentCluster.length > 5) {
      clusters.push(currentCluster);
    }
    
    return clusters;
  }

  private getHourlyTransactionCounts(transactions: any[]): number[] {
    const hourCounts: number[] = new Array(24).fill(0);
    
    transactions.forEach(tx => {
      const hour = new Date(tx.timestamp).getHours();
      hourCounts[hour]++;
    });
    
    return hourCounts;
  }

  private calculateWeightedScore(components: RugScoreComponents): number {
    const weightedSum = 
      components.contractSafety.score * this.WEIGHTS.contractSafety +
      components.holderDistribution.score * this.WEIGHTS.holderDistribution +
      components.liquiditySafety.score * this.WEIGHTS.liquiditySafety +
      components.devBehavior.score * this.WEIGHTS.devBehavior +
      components.tradingPatterns.score * this.WEIGHTS.tradingPatterns;

    return Math.round(weightedSum);
  }

  private getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 30) return 'MEDIUM';
    return 'LOW';
  }

  private generateSummary(score: number, components: RugScoreComponents): string {
    const riskLevel = this.getRiskLevel(score);
    const highestRisk = Object.entries(components)
      .sort(([,a], [,b]) => b.score - a.score)[0];

    const recommendations = {
      CRITICAL: "🚨 AVOID: Extremely high rug risk detected",
      HIGH: "⚠️ HIGH RISK: Proceed with extreme caution",
      MEDIUM: "⚠️ MODERATE RISK: Due diligence required",
      LOW: "✅ LOW RISK: Appears relatively safe"
    };

    return `${recommendations[riskLevel]}. Primary concern: ${highestRisk[0]} (${highestRisk[1].score}/100)`;
  }

  private async getTokenWithRelations(address: string) {
    return await this.prisma.token.findUnique({
      where: { address },
      include: {
        wallets: {
          include: {
            wallet: true
          }
        },
        transactions: {
          where: {
            timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last week
          }
        },
        liquidityPools: true,
      }
    });
  }

  private async cacheResult(tokenAddress: string, result: RugScoreResult) {
    await this.redis.setex(
      `rug_score:${tokenAddress}`,
      300, // 5 minutes
      JSON.stringify(result)
    );
  }

  // Get cached result if available
  async getCachedRugScore(tokenAddress: string): Promise<RugScoreResult | null> {
    const cached = await this.redis.get(`rug_score:${tokenAddress}`);
    return cached ? JSON.parse(cached) : null;
  }
}
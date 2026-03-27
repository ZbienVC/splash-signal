// Dump Score Analysis Engine - Realistic Sell-Off Detection
// Most tokens don't rug — they dump. This engine focuses on realistic sell-off behavior.
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

// Reuse the same ComponentScore interface pattern from alphaScorer/rugScorer
interface ComponentScore {
  score: number; // 0-100
  reasoning: string[];
  flags: string[];
  weight: number;
}

export interface DumpScoreComponents {
  sniperConcentration: ComponentScore;  // Early wallet control %
  bundleBehavior: ComponentScore;       // Coordinated buy/sell groups
  whaleDistribution: ComponentScore;   // Top holders reducing positions
  devBehavior: ComponentScore;          // Dev sells, transfers, fragmentation
  momentumDecay: ComponentScore;        // Volume declining vs peak
  liquidityHealth: ComponentScore;      // LP ratio vs market cap
}

export interface DumpScoreResult {
  tokenAddress: string;
  finalScore: number;          // 0-100 (100 = imminent dump)
  riskLevel: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  primaryRisk: string;         // Single clearest risk in plain English
  humanReadable: string;       // e.g. "High risk of coordinated sell-off by top 5 holders"
  signals: DumpSignal[];
  components: DumpScoreComponents;
  timestamp: Date;
}

export interface DumpSignal {
  type: 'SNIPER_EXIT' | 'BUNDLE_SELLING' | 'WHALE_DISTRIBUTION' | 'DEV_SELL' | 'LIQUIDITY_DRAIN' | 'VOLUME_COLLAPSE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;  // Human-readable: "Dev sold $12k in last 2 hours"
  confidence: number;   // 0-1
  detectedAt: Date;
}

export class DumpScorer {
  private prisma: PrismaClient;
  private redis: Redis;

  // Component weights (must sum to 1.0)
  private readonly WEIGHTS = {
    sniperConcentration: 0.20,
    bundleBehavior: 0.20,
    whaleDistribution: 0.20,
    devBehavior: 0.20,
    momentumDecay: 0.10,
    liquidityHealth: 0.10,
  };

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
  }

  // Main scoring function
  async calculateDumpScore(tokenAddress: string): Promise<DumpScoreResult> {
    try {
      // Check cache first (5 minute TTL)
      const cached = await this.getCachedDumpScore(tokenAddress);
      if (cached) return cached;

      const tokenData = await this.getTokenWithRelations(tokenAddress);
      if (!tokenData) {
        throw new Error(`Token ${tokenAddress} not found`);
      }

      // Calculate each component
      const sniperConcentration = await this.scoreSniperConcentration(tokenData);
      const bundleBehavior = await this.scoreBundleBehavior(tokenData);
      const whaleDistribution = await this.scoreWhaleDistribution(tokenData);
      const devBehavior = await this.scoreDevBehavior(tokenData);
      const momentumDecay = await this.scoreMomentumDecay(tokenData);
      const liquidityHealth = await this.scoreLiquidityHealth(tokenData);

      const components: DumpScoreComponents = {
        sniperConcentration,
        bundleBehavior,
        whaleDistribution,
        devBehavior,
        momentumDecay,
        liquidityHealth,
      };

      const finalScore = this.calculateWeightedScore(components);
      const signals = this.collectSignals(components, tokenData);
      const trend = await this.calculateTrend(tokenAddress, finalScore);
      const primaryRisk = this.identifyPrimaryRisk(components);
      const humanReadable = this.generateHumanReadable(finalScore, components, signals, tokenData);

      const result: DumpScoreResult = {
        tokenAddress,
        finalScore,
        riskLevel: this.getRiskLevel(finalScore),
        trend,
        primaryRisk,
        humanReadable,
        signals,
        components,
        timestamp: new Date(),
      };

      // Persist to DB and cache
      await this.persistResult(result);
      await this.cacheResult(tokenAddress, result);

      return result;

    } catch (error) {
      console.error(`Error calculating dump score for ${tokenAddress}:`, error);
      throw error;
    }
  }

  // 1. SNIPER CONCENTRATION (20%)
  // Top 10 wallets holding >40% = HIGH risk. Check wallet creation time vs token age.
  private async scoreSniperConcentration(token: any): Promise<ComponentScore> {
    let score = 0;
    const reasoning: string[] = [];
    const flags: string[] = [];

    const holdings = token.wallets || [];
    if (holdings.length === 0) {
      return { score: 50, reasoning: ['⚠️ No holder data available'], flags: ['NO_HOLDER_DATA'], weight: this.WEIGHTS.sniperConcentration };
    }

    // Identify sniper wallets: created within 1 hour of token, or tagged isSniper
    const tokenAgeMs = Date.now() - new Date(token.createdAt).getTime();
    const sniperWindow = Math.min(tokenAgeMs * 0.1, 60 * 60 * 1000); // 10% of token age, max 1h

    const sniperHoldings = holdings.filter((h: any) => {
      const wallet = h.wallet;
      if (!wallet) return false;
      if (wallet.isSniper) return true;
      // Check if wallet was created near token creation
      if (wallet.createdAt) {
        const walletAge = Math.abs(new Date(wallet.createdAt).getTime() - new Date(token.createdAt).getTime());
        return walletAge < sniperWindow;
      }
      return false;
    });

    const sorted = [...holdings].sort((a: any, b: any) => b.percentage - a.percentage);
    const top10Pct = sorted.slice(0, 10).reduce((sum: number, h: any) => sum + (h.percentage || 0), 0);
    const sniperPct = sniperHoldings.reduce((sum: number, h: any) => sum + (h.percentage || 0), 0);

    // Score top 10 concentration
    if (top10Pct > 60) {
      score += 45;
      reasoning.push(`🚨 Top 10 wallets hold ${top10Pct.toFixed(1)}% of supply`);
      flags.push('HIGH_CONCENTRATION');
    } else if (top10Pct > 40) {
      score += 25;
      reasoning.push(`⚠️ Top 10 wallets hold ${top10Pct.toFixed(1)}% of supply`);
      flags.push('MODERATE_CONCENTRATION');
    } else {
      reasoning.push(`✅ Top 10 wallets hold ${top10Pct.toFixed(1)}% — well distributed`);
    }

    // Score sniper concentration specifically
    if (sniperPct > 30) {
      score += 40;
      reasoning.push(`🚨 ${sniperHoldings.length} sniper wallets hold ${sniperPct.toFixed(1)}% — coordinated exit risk`);
      flags.push('SNIPER_CONCENTRATION');
    } else if (sniperPct > 15) {
      score += 20;
      reasoning.push(`⚠️ ${sniperHoldings.length} sniper wallets hold ${sniperPct.toFixed(1)}%`);
    } else if (sniperHoldings.length > 0) {
      score += 10;
      reasoning.push(`📊 ${sniperHoldings.length} sniper wallets detected, holding ${sniperPct.toFixed(1)}%`);
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      reasoning,
      flags,
      weight: this.WEIGHTS.sniperConcentration,
    };
  }

  // 2. BUNDLE BEHAVIOR (20%)
  // Wallets that bought within same 3 blocks selling together = bundle exit
  private async scoreBundleBehavior(token: any): Promise<ComponentScore> {
    let score = 0;
    const reasoning: string[] = [];
    const flags: string[] = [];

    const transactions = token.transactions || [];
    if (transactions.length < 5) {
      return { score: 20, reasoning: ['📊 Insufficient transaction data for bundle analysis'], flags: [], weight: this.WEIGHTS.bundleBehavior };
    }

    const buyTxs = transactions.filter((tx: any) => tx.type === 'BUY');
    const sellTxs = transactions.filter((tx: any) => tx.type === 'SELL');

    // Find wallets that bought within same block window (3 blocks ≈ ~36 seconds on ETH)
    const blockWindow = 3;
    const bundleGroups = this.findBlockBundles(buyTxs, blockWindow);

    // Check if bundle wallets are now selling together
    let bundleExits = 0;
    let bundleExitValue = 0;
    for (const group of bundleGroups) {
      const groupWalletIds = new Set(group.map((tx: any) => tx.walletId));
      const groupSells = sellTxs.filter((tx: any) => groupWalletIds.has(tx.walletId));
      
      // If >50% of bundle wallets are selling = coordinated exit
      if (groupSells.length >= group.length * 0.5 && group.length >= 3) {
        bundleExits++;
        bundleExitValue += groupSells.reduce((sum: number, tx: any) => sum + (tx.value || 0), 0);
        flags.push('BUNDLE_EXIT_DETECTED');
      }
    }

    if (bundleExits > 0) {
      score += 60;
      reasoning.push(`🚨 ${bundleExits} bundle group(s) exiting — coordinated sell detected ($${(bundleExitValue / 1000).toFixed(0)}k)`);
      flags.push('COORDINATED_EXIT');
    } else if (bundleGroups.length > 0) {
      score += 20;
      reasoning.push(`⚠️ ${bundleGroups.length} bundle buy group(s) identified — monitor for coordinated exit`);
    } else {
      reasoning.push('✅ No suspicious bundle buying patterns detected');
    }

    // Also check for similar-amount sells in quick succession
    const recentSells = sellTxs.filter((tx: any) =>
      new Date(tx.timestamp) > new Date(Date.now() - 30 * 60 * 1000)
    );
    if (recentSells.length >= 5) {
      const amounts = recentSells.map((tx: any) => tx.amount || 0).filter(Boolean);
      if (amounts.length > 0) {
        const avg = amounts.reduce((a: number, b: number) => a + b, 0) / amounts.length;
        const similar = amounts.filter((a: number) => Math.abs(a - avg) / avg < 0.15).length;
        if (similar >= amounts.length * 0.6) {
          score += 25;
          reasoning.push(`⚠️ ${similar} sells with similar amounts in last 30min — possible bot/bundle selling`);
          flags.push('SIMILAR_AMOUNT_SELLS');
        }
      }
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      reasoning,
      flags,
      weight: this.WEIGHTS.bundleBehavior,
    };
  }

  // 3. WHALE DISTRIBUTION (20%)
  // If top 5 wallets reduced holdings >15% in 24h = WARNING
  private async scoreWhaleDistribution(token: any): Promise<ComponentScore> {
    let score = 0;
    const reasoning: string[] = [];
    const flags: string[] = [];

    const holdings = token.wallets || [];
    const sorted = [...holdings].sort((a: any, b: any) => b.percentage - a.percentage);
    const top5 = sorted.slice(0, 5);

    if (top5.length === 0) {
      return { score: 30, reasoning: ['📊 No holder data for whale analysis'], flags: [], weight: this.WEIGHTS.whaleDistribution };
    }

    // Check for wallets with reduced holdings (proxy: large sells relative to holdings)
    const transactions = token.transactions || [];
    const last24hSells = transactions.filter((tx: any) =>
      tx.type === 'SELL' &&
      new Date(tx.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    let whalesReducing = 0;
    let totalReductionValue = 0;

    for (const holding of top5) {
      if (!holding.wallet) continue;
      const walletId = holding.wallet.id || holding.walletId;
      const walletSells = last24hSells.filter((tx: any) => tx.walletId === walletId);
      const sellValue = walletSells.reduce((sum: number, tx: any) => sum + (tx.value || 0), 0);
      const holdingValue = holding.value || 0;

      // Estimate reduction: if sell value > 15% of current holding
      if (holdingValue > 0 && sellValue > holdingValue * 0.15) {
        whalesReducing++;
        totalReductionValue += sellValue;
      } else if (sellValue > 5000) {
        // Significant absolute sell even if no holding value data
        whalesReducing++;
        totalReductionValue += sellValue;
      }
    }

    if (whalesReducing >= 3) {
      score += 60;
      reasoning.push(`🚨 ${whalesReducing} of top 5 holders reducing positions — distribution phase`);
      flags.push('ACTIVE_DISTRIBUTION');
    } else if (whalesReducing >= 2) {
      score += 35;
      reasoning.push(`⚠️ ${whalesReducing} top holders reducing positions ($${(totalReductionValue / 1000).toFixed(0)}k sold in 24h)`);
      flags.push('WHALE_DISTRIBUTION');
    } else if (whalesReducing >= 1) {
      score += 15;
      reasoning.push(`📊 1 top holder reducing position ($${(totalReductionValue / 1000).toFixed(0)}k sold)`);
    } else {
      reasoning.push('✅ Top 5 holders appear to be holding positions');
    }

    // Check for top holder dominance risk
    const topHolderPct = top5[0]?.percentage || 0;
    if (topHolderPct > 15) {
      score += 20;
      reasoning.push(`⚠️ Largest holder controls ${topHolderPct.toFixed(1)}% — single point of exit risk`);
      flags.push('DOMINANT_HOLDER');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      reasoning,
      flags,
      weight: this.WEIGHTS.whaleDistribution,
    };
  }

  // 4. DEV BEHAVIOR (20%)
  // Any dev wallet sell > $5k = CRITICAL flag. Dev transfer to new wallet = suspicious.
  private async scoreDevBehavior(token: any): Promise<ComponentScore> {
    let score = 0;
    const reasoning: string[] = [];
    const flags: string[] = [];

    const devWallets = (token.wallets || []).filter((h: any) => h.wallet?.isDevWallet);

    if (devWallets.length === 0) {
      reasoning.push('⚠️ No dev wallets identified');
      return { score: 20, reasoning, flags: ['NO_DEV_IDENTIFIED'], weight: this.WEIGHTS.devBehavior };
    }

    const transactions = token.transactions || [];
    const last2h = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const devHolding of devWallets) {
      const walletId = devHolding.walletId || devHolding.wallet?.id;
      const devTxs = transactions.filter((tx: any) => tx.walletId === walletId);

      const recentSells = devTxs.filter((tx: any) =>
        tx.type === 'SELL' && new Date(tx.timestamp) > last2h
      );
      const sells24h = devTxs.filter((tx: any) =>
        tx.type === 'SELL' && new Date(tx.timestamp) > last24h
      );
      const transfers = devTxs.filter((tx: any) =>
        tx.type === 'TRANSFER' && new Date(tx.timestamp) > last24h
      );

      const recentSellValue = recentSells.reduce((sum: number, tx: any) => sum + (tx.value || 0), 0);
      const sells24hValue = sells24h.reduce((sum: number, tx: any) => sum + (tx.value || 0), 0);
      const transferValue = transfers.reduce((sum: number, tx: any) => sum + (tx.value || 0), 0);

      // CRITICAL: Dev sells > $5k
      if (recentSellValue >= 5000) {
        score += 70;
        reasoning.push(`🚨 Dev sold $${(recentSellValue / 1000).toFixed(0)}k in last 2 hours`);
        flags.push('DEV_CRITICAL_SELL');
      } else if (sells24hValue >= 5000) {
        score += 50;
        reasoning.push(`🚨 Dev sold $${(sells24hValue / 1000).toFixed(0)}k in last 24h`);
        flags.push('DEV_SELL_24H');
      } else if (sells24h.length > 0) {
        score += 25;
        reasoning.push(`⚠️ Dev made ${sells24h.length} sell transaction(s) in last 24h`);
        flags.push('DEV_SELLING');
      }

      // Transfer to new wallet = suspicious
      if (transferValue >= 3000) {
        score += 35;
        reasoning.push(`⚠️ Dev transferred $${(transferValue / 1000).toFixed(0)}k to another wallet in last 24h — possible exit preparation`);
        flags.push('DEV_TRANSFER_SUSPICIOUS');
      } else if (transfers.length > 2) {
        score += 15;
        reasoning.push(`⚠️ Dev made ${transfers.length} transfer transactions — fragmentation behavior`);
        flags.push('DEV_FRAGMENTATION');
      }
    }

    if (score === 0) {
      reasoning.push('✅ No concerning dev wallet behavior detected');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      reasoning,
      flags,
      weight: this.WEIGHTS.devBehavior,
    };
  }

  // 5. MOMENTUM DECAY (10%)
  // Volume24h < 30% of peak volume = decaying. Buy/sell ratio < 0.4 = distribution.
  private async scoreMomentumDecay(token: any): Promise<ComponentScore> {
    let score = 0;
    const reasoning: string[] = [];
    const flags: string[] = [];

    const priceHistory = token.priceHistory || [];
    const transactions = token.transactions || [];

    // Calculate peak volume from price history
    const peakVolume = priceHistory.reduce((max: number, p: any) => Math.max(max, p.volume || 0), 0);
    const currentVolume = token.volume24h || 0;

    if (peakVolume > 0 && currentVolume > 0) {
      const volumeRatio = currentVolume / peakVolume;
      if (volumeRatio < 0.20) {
        score += 50;
        reasoning.push(`🚨 Volume down ${((1 - volumeRatio) * 100).toFixed(0)}% from peak — severe decay`);
        flags.push('SEVERE_VOLUME_DECAY');
      } else if (volumeRatio < 0.30) {
        score += 35;
        reasoning.push(`⚠️ Volume down ${((1 - volumeRatio) * 100).toFixed(0)}% from yesterday's peak, sell pressure increasing`);
        flags.push('VOLUME_DECAY');
      } else if (volumeRatio < 0.50) {
        score += 15;
        reasoning.push(`📊 Volume at ${(volumeRatio * 100).toFixed(0)}% of peak — declining momentum`);
      } else {
        reasoning.push(`✅ Volume healthy at ${(volumeRatio * 100).toFixed(0)}% of peak`);
      }
    } else if (currentVolume < 5000) {
      score += 30;
      reasoning.push(`⚠️ Very low volume: $${currentVolume.toLocaleString()}`);
      flags.push('LOW_VOLUME');
    }

    // Buy/sell ratio
    const last1h = new Date(Date.now() - 60 * 60 * 1000);
    const recentTxs = transactions.filter((tx: any) => new Date(tx.timestamp) > last1h);
    const buys = recentTxs.filter((tx: any) => tx.type === 'BUY').length;
    const sells = recentTxs.filter((tx: any) => tx.type === 'SELL').length;

    if (buys + sells > 0) {
      const buyRatio = buys / (buys + sells);
      if (buyRatio < 0.25) {
        score += 40;
        reasoning.push(`🚨 Sell ratio very high: ${(sells / (buys + sells) * 100).toFixed(0)}% of trades are sells`);
        flags.push('HIGH_SELL_PRESSURE');
      } else if (buyRatio < 0.40) {
        score += 20;
        reasoning.push(`⚠️ Buy/sell ratio low: ${(buyRatio * 100).toFixed(0)}% buys — distribution mode`);
        flags.push('DISTRIBUTION_MODE');
      } else if (buyRatio > 0.65) {
        score -= 10;
        reasoning.push(`✅ Healthy buy pressure: ${(buyRatio * 100).toFixed(0)}% buys`);
      }
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      reasoning,
      flags,
      weight: this.WEIGHTS.momentumDecay,
    };
  }

  // 6. LIQUIDITY HEALTH (10%)
  // LP < 5% of FDV = dangerous. LP removed > 10% in 24h = CRITICAL.
  private async scoreLiquidityHealth(token: any): Promise<ComponentScore> {
    let score = 0;
    const reasoning: string[] = [];
    const flags: string[] = [];

    const pools = token.liquidityPools || [];
    if (pools.length === 0) {
      return { score: 80, reasoning: ['🚨 No liquidity pools found'], flags: ['NO_LIQUIDITY'], weight: this.WEIGHTS.liquidityHealth };
    }

    const totalLiquidity = pools.reduce((sum: number, p: any) => sum + (p.totalLiquidity || 0), 0);
    const fdv = token.marketCap || 0;

    // LP as % of FDV
    if (fdv > 0) {
      const lpRatio = (totalLiquidity / fdv) * 100;
      if (lpRatio < 3) {
        score += 60;
        reasoning.push(`🚨 Liquidity ratio critically low: ${lpRatio.toFixed(1)}% of FDV — severe exit risk`);
        flags.push('CRITICAL_LOW_LIQUIDITY');
      } else if (lpRatio < 5) {
        score += 40;
        reasoning.push(`⚠️ Low liquidity ratio: ${lpRatio.toFixed(1)}% of FDV — dangerous`);
        flags.push('LOW_LIQUIDITY_RATIO');
      } else if (lpRatio < 10) {
        score += 15;
        reasoning.push(`📊 Moderate liquidity ratio: ${lpRatio.toFixed(1)}% of FDV`);
      } else {
        reasoning.push(`✅ Good liquidity ratio: ${lpRatio.toFixed(1)}% of FDV`);
      }
    }

    // Check if LP is locked
    const mainPool = pools[0];
    if (!mainPool.isLocked) {
      score += 25;
      reasoning.push('⚠️ Liquidity is NOT locked — LP removal risk');
      flags.push('UNLOCKED_LP');
    } else {
      const daysLeft = mainPool.lockUntil
        ? Math.ceil((new Date(mainPool.lockUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;
      if (daysLeft < 7) {
        score += 20;
        reasoning.push(`⚠️ LP lock expires in ${daysLeft} days — risk approaching`);
        flags.push('LP_LOCK_EXPIRING');
      } else {
        reasoning.push(`✅ LP locked for ${daysLeft} more days`);
      }
    }

    // Absolute liquidity check
    if (totalLiquidity < 10000) {
      score += 20;
      reasoning.push(`⚠️ Very low absolute liquidity: $${totalLiquidity.toLocaleString()}`);
      flags.push('VERY_LOW_LIQUIDITY_ABS');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      reasoning,
      flags,
      weight: this.WEIGHTS.liquidityHealth,
    };
  }

  // ======= HELPERS =======

  private findBlockBundles(buyTxs: any[], blockWindow: number): any[][] {
    // Group buys by block number proximity
    if (buyTxs.length < 3) return [];
    
    const sorted = [...buyTxs].sort((a, b) => (a.blockNumber || 0) - (b.blockNumber || 0));
    const groups: any[][] = [];
    let current: any[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const diff = (sorted[i].blockNumber || 0) - (sorted[i - 1].blockNumber || 0);
      if (diff <= blockWindow) {
        current.push(sorted[i]);
      } else {
        if (current.length >= 3) groups.push(current);
        current = [sorted[i]];
      }
    }
    if (current.length >= 3) groups.push(current);
    return groups;
  }

  private calculateWeightedScore(components: DumpScoreComponents): number {
    return Math.round(
      components.sniperConcentration.score * this.WEIGHTS.sniperConcentration +
      components.bundleBehavior.score * this.WEIGHTS.bundleBehavior +
      components.whaleDistribution.score * this.WEIGHTS.whaleDistribution +
      components.devBehavior.score * this.WEIGHTS.devBehavior +
      components.momentumDecay.score * this.WEIGHTS.momentumDecay +
      components.liquidityHealth.score * this.WEIGHTS.liquidityHealth
    );
  }

  private getRiskLevel(score: number): 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL' {
    if (score >= 75) return 'CRITICAL';
    if (score >= 55) return 'HIGH';
    if (score >= 35) return 'ELEVATED';
    return 'LOW';
  }

  private collectSignals(components: DumpScoreComponents, token: any): DumpSignal[] {
    const signals: DumpSignal[] = [];
    const now = new Date();

    if (components.sniperConcentration.flags.includes('SNIPER_CONCENTRATION')) {
      const sniperHoldings = (token.wallets || []).filter((h: any) => h.wallet?.isSniper);
      const sniperPct = sniperHoldings.reduce((sum: number, h: any) => sum + (h.percentage || 0), 0);
      signals.push({
        type: 'SNIPER_EXIT',
        severity: sniperPct > 30 ? 'CRITICAL' : 'HIGH',
        description: `${sniperHoldings.length} sniper wallets holding ${sniperPct.toFixed(1)}% of supply — coordinated exit risk`,
        confidence: 0.8,
        detectedAt: now,
      });
    }

    if (components.bundleBehavior.flags.includes('BUNDLE_EXIT_DETECTED')) {
      signals.push({
        type: 'BUNDLE_SELLING',
        severity: 'HIGH',
        description: 'Coordinated bundle exit detected — wallets that bought together are now selling together',
        confidence: 0.85,
        detectedAt: now,
      });
    }

    if (components.whaleDistribution.flags.includes('ACTIVE_DISTRIBUTION') ||
        components.whaleDistribution.flags.includes('WHALE_DISTRIBUTION')) {
      signals.push({
        type: 'WHALE_DISTRIBUTION',
        severity: components.whaleDistribution.score > 50 ? 'HIGH' : 'MEDIUM',
        description: 'Top holders reducing positions — active distribution phase',
        confidence: 0.75,
        detectedAt: now,
      });
    }

    if (components.devBehavior.flags.includes('DEV_CRITICAL_SELL') ||
        components.devBehavior.flags.includes('DEV_SELL_24H')) {
      signals.push({
        type: 'DEV_SELL',
        severity: 'CRITICAL',
        description: components.devBehavior.reasoning.find((r: string) => r.includes('Dev sold')) || 'Dev wallet selling detected',
        confidence: 0.95,
        detectedAt: now,
      });
    }

    if (components.devBehavior.flags.includes('DEV_TRANSFER_SUSPICIOUS')) {
      signals.push({
        type: 'DEV_SELL',
        severity: 'HIGH',
        description: components.devBehavior.reasoning.find((r: string) => r.includes('Dev transferred')) || 'Dev transferring to fresh wallet',
        confidence: 0.8,
        detectedAt: now,
      });
    }

    if (components.liquidityHealth.flags.includes('CRITICAL_LOW_LIQUIDITY') ||
        components.liquidityHealth.flags.includes('UNLOCKED_LP')) {
      signals.push({
        type: 'LIQUIDITY_DRAIN',
        severity: components.liquidityHealth.score > 60 ? 'CRITICAL' : 'HIGH',
        description: 'Liquidity at risk — low ratio or unlocked LP detected',
        confidence: 0.85,
        detectedAt: now,
      });
    }

    if (components.momentumDecay.flags.includes('SEVERE_VOLUME_DECAY') ||
        components.momentumDecay.flags.includes('HIGH_SELL_PRESSURE')) {
      signals.push({
        type: 'VOLUME_COLLAPSE',
        severity: components.momentumDecay.score > 60 ? 'HIGH' : 'MEDIUM',
        description: components.momentumDecay.reasoning.find((r: string) => r.includes('Volume')) || 'Volume collapsing',
        confidence: 0.7,
        detectedAt: now,
      });
    }

    return signals;
  }

  private identifyPrimaryRisk(components: DumpScoreComponents): string {
    const scored = [
      { key: 'devBehavior', score: components.devBehavior.score, label: 'Developer wallet activity' },
      { key: 'sniperConcentration', score: components.sniperConcentration.score, label: 'Sniper wallet concentration' },
      { key: 'bundleBehavior', score: components.bundleBehavior.score, label: 'Coordinated bundle selling' },
      { key: 'whaleDistribution', score: components.whaleDistribution.score, label: 'Whale distribution' },
      { key: 'momentumDecay', score: components.momentumDecay.score, label: 'Volume/momentum decay' },
      { key: 'liquidityHealth', score: components.liquidityHealth.score, label: 'Low liquidity health' },
    ];
    scored.sort((a, b) => b.score - a.score);
    return scored[0].label;
  }

  private generateHumanReadable(score: number, components: DumpScoreComponents, signals: DumpSignal[], token: any): string {
    if (signals.length === 0) {
      if (score < 30) return 'Token shows low dump risk — normal trading patterns observed';
      return `Moderate risk detected (score: ${score}/100) — monitor closely`;
    }

    // Pick the highest severity signal for the headline
    const critical = signals.find(s => s.severity === 'CRITICAL');
    const high = signals.find(s => s.severity === 'HIGH');
    const primary = critical || high || signals[0];

    const riskLevel = this.getRiskLevel(score);
    const riskPrefix = {
      CRITICAL: '🚨 CRITICAL:',
      HIGH: '⚠️ HIGH RISK:',
      ELEVATED: '⚠️ ELEVATED:',
      LOW: '✅',
    }[riskLevel];

    return `${riskPrefix} ${primary.description}`;
  }

  private async calculateTrend(tokenAddress: string, currentScore: number): Promise<'INCREASING' | 'STABLE' | 'DECREASING'> {
    try {
      const previousKey = `dump_score_prev:${tokenAddress}`;
      const prev = await this.redis.get(previousKey);
      await this.redis.setex(previousKey, 3600, String(currentScore));

      if (!prev) return 'STABLE';
      const prevScore = parseFloat(prev);
      const delta = currentScore - prevScore;

      if (delta >= 10) return 'INCREASING';
      if (delta <= -10) return 'DECREASING';
      return 'STABLE';
    } catch {
      return 'STABLE';
    }
  }

  private async persistResult(result: DumpScoreResult): Promise<void> {
    try {
      await (this.prisma as any).dumpScore.upsert({
        where: { tokenAddress: result.tokenAddress },
        create: {
          tokenAddress: result.tokenAddress,
          score: result.finalScore,
          riskLevel: result.riskLevel,
          trend: result.trend,
          primaryRisk: result.primaryRisk,
          humanReadable: result.humanReadable,
          components: result.components as any,
          signals: result.signals as any,
        },
        update: {
          score: result.finalScore,
          riskLevel: result.riskLevel,
          trend: result.trend,
          primaryRisk: result.primaryRisk,
          humanReadable: result.humanReadable,
          components: result.components as any,
          signals: result.signals as any,
          updatedAt: new Date(),
        },
      });
    } catch (err) {
      // DB may not be migrated yet — log but don't fail
      console.warn('[DumpScorer] Could not persist to DB (migration pending?):', err);
    }
  }

  private async cacheResult(tokenAddress: string, result: DumpScoreResult): Promise<void> {
    await this.redis.setex(
      `dump_score:${tokenAddress}`,
      300, // 5 minutes
      JSON.stringify(result)
    );
  }

  async getCachedDumpScore(tokenAddress: string): Promise<DumpScoreResult | null> {
    const cached = await this.redis.get(`dump_score:${tokenAddress}`);
    return cached ? JSON.parse(cached) : null;
  }

  private async getTokenWithRelations(address: string) {
    return await this.prisma.token.findUnique({
      where: { address },
      include: {
        wallets: {
          include: { wallet: true },
          orderBy: { percentage: 'desc' },
        },
        transactions: {
          where: {
            timestamp: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
          },
          orderBy: { timestamp: 'desc' },
        },
        liquidityPools: {
          orderBy: { totalLiquidity: 'desc' },
        },
        priceHistory: {
          where: {
            timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
          orderBy: { timestamp: 'desc' },
        },
      },
    });
  }
}

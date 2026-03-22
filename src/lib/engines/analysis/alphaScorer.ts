// Alpha Score Analysis Engine - Early Opportunity Detection
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

interface AlphaScoreComponents {
  volumeGrowth: ComponentScore;
  holderGrowth: ComponentScore;
  smartMoneyInflow: ComponentScore;
  narrativeStrength: ComponentScore;
  socialMomentum: ComponentScore;
}

interface ComponentScore {
  score: number; // 0-100
  reasoning: string[];
  signals: string[];
  weight: number;
  confidence: number; // 0-1
}

interface AlphaScoreResult {
  tokenAddress: string;
  finalScore: number; // 0-100 (100 = highest alpha potential)
  alphaLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXPLOSIVE';
  components: AlphaScoreComponents;
  earlySignals: string[];
  recommendedAction: string;
  confidence: number; // Overall confidence 0-1
  timestamp: Date;
}

interface VolumeMetrics {
  volume5m: number;
  volume1h: number;
  volume6h: number;
  volume24h: number;
  growth5m: number;
  growth1h: number;
  growth6h: number;
}

interface HolderMetrics {
  newHolders5m: number;
  newHolders1h: number;
  newHolders6h: number;
  holderAcceleration: number;
  totalHolders: number;
}

export class AlphaScorer {
  private prisma: PrismaClient;
  private redis: Redis;

  // Component weights (must sum to 1.0)
  private readonly WEIGHTS = {
    volumeGrowth: 0.25,
    holderGrowth: 0.20,
    smartMoneyInflow: 0.20,
    narrativeStrength: 0.25,
    socialMomentum: 0.10,
  };

  // Smart money wallet addresses (known profitable traders)
  private readonly SMART_MONEY_WALLETS = new Set([
    // Add known successful wallet addresses
    // This would be populated from historical analysis
  ]);

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
  }

  // Main alpha scoring function
  async calculateAlphaScore(tokenAddress: string): Promise<AlphaScoreResult> {
    try {
      // Check cache first
      const cached = await this.getCachedAlphaScore(tokenAddress);
      if (cached && this.isCacheValid(cached)) {
        return cached;
      }

      // Get token data with time-based metrics
      const tokenData = await this.getTokenWithTimeMetrics(tokenAddress);
      if (!tokenData) {
        throw new Error(`Token ${tokenAddress} not found`);
      }

      // Calculate volume and holder metrics
      const volumeMetrics = await this.calculateVolumeMetrics(tokenData);
      const holderMetrics = await this.calculateHolderMetrics(tokenData);

      // Calculate each component score
      const volumeGrowth = await this.scoreVolumeGrowth(volumeMetrics);
      const holderGrowth = await this.scoreHolderGrowth(holderMetrics);
      const smartMoneyInflow = await this.scoreSmartMoneyInflow(tokenData);
      const narrativeStrength = await this.scoreNarrativeStrength(tokenData);
      const socialMomentum = await this.scoreSocialMomentum(tokenData);

      // Calculate weighted final score
      const finalScore = this.calculateWeightedScore({
        volumeGrowth,
        holderGrowth,
        smartMoneyInflow,
        narrativeStrength,
        socialMomentum,
      });

      // Calculate overall confidence
      const confidence = this.calculateConfidence({
        volumeGrowth,
        holderGrowth,
        smartMoneyInflow,
        narrativeStrength,
        socialMomentum,
      });

      // Identify early signals
      const earlySignals = this.identifyEarlySignals({
        volumeGrowth,
        holderGrowth,
        smartMoneyInflow,
        narrativeStrength,
        socialMomentum,
      });

      const result: AlphaScoreResult = {
        tokenAddress,
        finalScore,
        alphaLevel: this.getAlphaLevel(finalScore),
        components: {
          volumeGrowth,
          holderGrowth,
          smartMoneyInflow,
          narrativeStrength,
          socialMomentum,
        },
        earlySignals,
        recommendedAction: this.getRecommendedAction(finalScore, confidence, earlySignals),
        confidence,
        timestamp: new Date(),
      };

      // Cache result for 2 minutes (alpha opportunities are time-sensitive)
      await this.cacheResult(tokenAddress, result);

      return result;

    } catch (error) {
      console.error(`Error calculating alpha score for ${tokenAddress}:`, error);
      throw error;
    }
  }

  // 1. VOLUME GROWTH SCORING (25%)
  private async scoreVolumeGrowth(metrics: VolumeMetrics): Promise<ComponentScore> {
    let score = 0;
    const reasoning: string[] = [];
    const signals: string[] = [];
    let confidence = 0.5;

    // 5-minute volume surge (most important for early detection)
    if (metrics.growth5m > 500) { // 500%+ growth
      score += 40;
      reasoning.push(`🚀 EXPLOSIVE 5m volume: +${metrics.growth5m.toFixed(0)}%`);
      signals.push("VOLUME_SURGE_5M");
      confidence += 0.3;
    } else if (metrics.growth5m > 200) {
      score += 25;
      reasoning.push(`📈 Strong 5m volume: +${metrics.growth5m.toFixed(0)}%`);
      signals.push("VOLUME_GROWTH_5M");
      confidence += 0.2;
    } else if (metrics.growth5m > 50) {
      score += 10;
      reasoning.push(`📊 Moderate 5m volume: +${metrics.growth5m.toFixed(0)}%`);
    }

    // 1-hour sustained growth (confirms momentum)
    if (metrics.growth1h > 300) {
      score += 30;
      reasoning.push(`🔥 Sustained 1h growth: +${metrics.growth1h.toFixed(0)}%`);
      signals.push("SUSTAINED_GROWTH_1H");
      confidence += 0.2;
    } else if (metrics.growth1h > 100) {
      score += 15;
      reasoning.push(`📈 Good 1h growth: +${metrics.growth1h.toFixed(0)}%`);
    }

    // 6-hour trend (trend confirmation)
    if (metrics.growth6h > 200) {
      score += 20;
      reasoning.push(`📈 Strong 6h trend: +${metrics.growth6h.toFixed(0)}%`);
      signals.push("TREND_CONFIRMATION_6H");
    } else if (metrics.growth6h > 50) {
      score += 10;
      reasoning.push(`📊 Building 6h momentum: +${metrics.growth6h.toFixed(0)}%`);
    }

    // Early detection bonus (higher weight for shorter timeframes)
    if (metrics.growth5m > metrics.growth1h && metrics.growth1h > metrics.growth6h) {
      score += 15;
      reasoning.push("⚡ EARLY MOMENTUM: Volume accelerating");
      signals.push("EARLY_ACCELERATION");
      confidence += 0.1;
    }

    // Volume quality check (absolute volume matters)
    if (metrics.volume24h > 100000) { // $100k+ daily volume
      score += 5;
      reasoning.push(`✅ Adequate volume: $${(metrics.volume24h / 1000).toFixed(0)}k`);
    } else if (metrics.volume24h < 10000) {
      score -= 15;
      reasoning.push(`⚠️ Low volume: $${(metrics.volume24h / 1000).toFixed(0)}k`);
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      reasoning,
      signals,
      weight: this.WEIGHTS.volumeGrowth,
      confidence: Math.min(1, confidence),
    };
  }

  // 2. HOLDER GROWTH SCORING (20%)
  private async scoreHolderGrowth(metrics: HolderMetrics): Promise<ComponentScore> {
    let score = 0;
    const reasoning: string[] = [];
    const signals: string[] = [];
    let confidence = 0.5;

    // New holders in last 5 minutes
    if (metrics.newHolders5m > 20) {
      score += 35;
      reasoning.push(`🚀 RAPID adoption: ${metrics.newHolders5m} new holders (5m)`);
      signals.push("RAPID_ADOPTION");
      confidence += 0.3;
    } else if (metrics.newHolders5m > 10) {
      score += 20;
      reasoning.push(`📈 Strong adoption: ${metrics.newHolders5m} new holders (5m)`);
      signals.push("STRONG_ADOPTION");
      confidence += 0.2;
    } else if (metrics.newHolders5m > 5) {
      score += 10;
      reasoning.push(`📊 Growing interest: ${metrics.newHolders5m} new holders (5m)`);
    }

    // 1-hour holder growth
    if (metrics.newHolders1h > 100) {
      score += 25;
      reasoning.push(`🔥 Viral growth: ${metrics.newHolders1h} new holders (1h)`);
      signals.push("VIRAL_GROWTH");
      confidence += 0.2;
    } else if (metrics.newHolders1h > 50) {
      score += 15;
      reasoning.push(`📈 Solid growth: ${metrics.newHolders1h} new holders (1h)`);
    }

    // Holder acceleration (growth rate increasing)
    if (metrics.holderAcceleration > 2) {
      score += 20;
      reasoning.push(`⚡ ACCELERATING: Holder growth rate ${metrics.holderAcceleration.toFixed(1)}x`);
      signals.push("ACCELERATING_ADOPTION");
      confidence += 0.15;
    } else if (metrics.holderAcceleration > 1.5) {
      score += 10;
      reasoning.push(`📈 Increasing adoption rate: ${metrics.holderAcceleration.toFixed(1)}x`);
    }

    // Base holder count (context matters)
    if (metrics.totalHolders > 1000) {
      score += 5;
      reasoning.push(`✅ Established base: ${metrics.totalHolders} total holders`);
    } else if (metrics.totalHolders < 100) {
      score += 10; // Early stage bonus
      reasoning.push(`⚡ EARLY STAGE: Only ${metrics.totalHolders} holders`);
      signals.push("EARLY_STAGE");
      confidence += 0.1;
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      reasoning,
      signals,
      weight: this.WEIGHTS.holderGrowth,
      confidence: Math.min(1, confidence),
    };
  }

  // 3. SMART MONEY INFLOW SCORING (20%)
  private async scoreSmartMoneyInflow(tokenData: any): Promise<ComponentScore> {
    let score = 0;
    const reasoning: string[] = [];
    const signals: string[] = [];
    let confidence = 0.4; // Lower baseline confidence due to data limitations

    const recentTxs = tokenData.transactions?.filter((tx: any) => 
      new Date(tx.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    ) || [];

    // Smart money wallet detection
    const smartMoneyBuys = recentTxs.filter((tx: any) => 
      tx.type === 'BUY' && this.isSmartMoneyWallet(tx.wallet?.address)
    );

    if (smartMoneyBuys.length > 0) {
      score += 40;
      reasoning.push(`🧠 SMART MONEY: ${smartMoneyBuys.length} known profitable wallets buying`);
      signals.push("SMART_MONEY_ENTRY");
      confidence += 0.3;
    }

    // High-value early entries (whales getting in early)
    const largeBuys = recentTxs.filter((tx: any) => 
      tx.type === 'BUY' && tx.value > 10000 // $10k+ buys
    );

    if (largeBuys.length > 3) {
      score += 25;
      reasoning.push(`🐋 WHALE ACTIVITY: ${largeBuys.length} large purchases detected`);
      signals.push("WHALE_ACCUMULATION");
      confidence += 0.2;
    }

    // Fresh wallet activity (new wallets with significant buys)
    const freshWalletBuys = recentTxs.filter((tx: any) => 
      tx.type === 'BUY' && 
      tx.wallet?.createdAt && 
      new Date(tx.wallet.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000) &&
      tx.value > 1000
    );

    if (freshWalletBuys.length > 5) {
      score += 20;
      reasoning.push(`⚡ FRESH MONEY: ${freshWalletBuys.length} new wallets with significant buys`);
      signals.push("FRESH_CAPITAL");
      confidence += 0.1;
    }

    // Sniper wallet activity (early detection advantage)
    const sniperActivity = tokenData.wallets?.filter((h: any) => 
      h.wallet?.isSniper && h.wallet?.riskScore < 30 // Low-risk snipers
    ) || [];

    if (sniperActivity.length > 0) {
      score += 15;
      reasoning.push(`🎯 SNIPER INTEREST: ${sniperActivity.length} skilled early buyers`);
      signals.push("SNIPER_ACTIVITY");
    }

    // Buy-to-sell ratio (more buying than selling indicates accumulation)
    const buyTxs = recentTxs.filter((tx: any) => tx.type === 'BUY');
    const sellTxs = recentTxs.filter((tx: any) => tx.type === 'SELL');
    const buyRatio = buyTxs.length / (buyTxs.length + sellTxs.length);

    if (buyRatio > 0.8) {
      score += 15;
      reasoning.push(`💪 ACCUMULATION: ${(buyRatio * 100).toFixed(0)}% of transactions are buys`);
      signals.push("ACCUMULATION_PHASE");
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      reasoning,
      signals,
      weight: this.WEIGHTS.smartMoneyInflow,
      confidence: Math.min(1, confidence),
    };
  }

  // 4. NARRATIVE STRENGTH SCORING (25%)
  private async scoreNarrativeStrength(tokenData: any): Promise<ComponentScore> {
    let score = 0;
    const reasoning: string[] = [];
    const signals: string[] = [];
    let confidence = 0.6;

    const tokenName = (tokenData.name || '').toLowerCase();
    const tokenSymbol = (tokenData.symbol || '').toLowerCase();
    
    // Trending narrative detection
    const narratives = this.detectNarratives(tokenName, tokenSymbol);
    
    if (narratives.length > 0) {
      score += 30;
      reasoning.push(`🎯 NARRATIVE MATCH: ${narratives.join(', ')}`);
      signals.push("NARRATIVE_ALIGNMENT");
      confidence += 0.2;
    }

    // Hot narrative bonuses (these would be dynamically updated)
    const hotNarratives = ['ai', 'artificial', 'trump', 'maga', 'pepe', 'doge'];
    const matchingHotNarratives = hotNarratives.filter(narrative => 
      tokenName.includes(narrative) || tokenSymbol.includes(narrative)
    );

    if (matchingHotNarratives.length > 0) {
      score += 25;
      reasoning.push(`🔥 HOT NARRATIVE: ${matchingHotNarratives.join(', ')}`);
      signals.push("HOT_NARRATIVE");
      confidence += 0.15;
    }

    // Meme potential (simple heuristics)
    const memeIndicators = ['pepe', 'doge', 'shib', 'floki', 'bonk', 'wojak'];
    const memeScore = memeIndicators.filter(indicator => 
      tokenName.includes(indicator) || tokenSymbol.includes(indicator)
    ).length;

    if (memeScore > 0) {
      score += 20;
      reasoning.push(`😄 MEME POTENTIAL: ${memeScore} meme indicators`);
      signals.push("MEME_POTENTIAL");
    }

    // Political tokens (tend to be volatile/profitable)
    const politicalTerms = ['trump', 'biden', 'maga', 'america', 'patriot', 'freedom'];
    const politicalMatches = politicalTerms.filter(term => 
      tokenName.includes(term) || tokenSymbol.includes(term)
    );

    if (politicalMatches.length > 0) {
      score += 15;
      reasoning.push(`🗳️ POLITICAL THEME: ${politicalMatches.join(', ')}`);
      signals.push("POLITICAL_NARRATIVE");
    }

    // Tech/innovation narrative
    const techTerms = ['ai', 'artificial', 'intelligence', 'quantum', 'blockchain', 'defi', 'web3'];
    const techMatches = techTerms.filter(term => 
      tokenName.includes(term) || tokenSymbol.includes(term)
    );

    if (techMatches.length > 0) {
      score += 10;
      reasoning.push(`🤖 TECH NARRATIVE: ${techMatches.join(', ')}`);
      signals.push("TECH_NARRATIVE");
    }

    // Novelty bonus for very new tokens
    const tokenAge = Date.now() - new Date(tokenData.createdAt).getTime();
    const ageHours = tokenAge / (1000 * 60 * 60);

    if (ageHours < 2) {
      score += 15;
      reasoning.push(`⚡ BRAND NEW: Token is ${ageHours.toFixed(1)} hours old`);
      signals.push("ULTRA_EARLY");
      confidence += 0.1;
    } else if (ageHours < 24) {
      score += 10;
      reasoning.push(`🆕 VERY NEW: Token is ${ageHours.toFixed(0)} hours old`);
      signals.push("VERY_EARLY");
    }

    if (reasoning.length === 0) {
      reasoning.push("📊 No specific narrative detected");
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      reasoning,
      signals,
      weight: this.WEIGHTS.narrativeStrength,
      confidence: Math.min(1, confidence),
    };
  }

  // 5. SOCIAL MOMENTUM SCORING (10%) - Simplified MVP
  private async scoreSocialMomentum(tokenData: any): Promise<ComponentScore> {
    let score = 0;
    const reasoning: string[] = [];
    const signals: string[] = [];
    let confidence = 0.3; // Low confidence for MVP

    // Simplified social indicators (would integrate with social APIs later)
    const tokenName = tokenData.name || '';
    const tokenSymbol = tokenData.symbol || '';

    // Check if token has social-friendly characteristics
    const socialFriendly = this.isSocialFriendly(tokenName, tokenSymbol);
    
    if (socialFriendly) {
      score += 30;
      reasoning.push("📱 High social virality potential");
      signals.push("SOCIAL_FRIENDLY");
    }

    // Transaction velocity as social proxy
    const recentTxs = tokenData.transactions?.filter((tx: any) => 
      new Date(tx.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    ) || [];

    if (recentTxs.length > 100) {
      score += 25;
      reasoning.push(`🚀 HIGH ACTIVITY: ${recentTxs.length} transactions (1h)`);
      signals.push("HIGH_TRANSACTION_VELOCITY");
    } else if (recentTxs.length > 50) {
      score += 15;
      reasoning.push(`📈 Good activity: ${recentTxs.length} transactions (1h)`);
    }

    // Unique participant count (social breadth)
    const uniqueParticipants = new Set(recentTxs.map((tx: any) => tx.walletId)).size;
    if (uniqueParticipants > 50) {
      score += 20;
      reasoning.push(`👥 BROAD INTEREST: ${uniqueParticipants} unique participants`);
      signals.push("BROAD_PARTICIPATION");
    }

    // Placeholder for future social integrations
    reasoning.push("📊 Social data limited in MVP - using transaction patterns as proxy");

    return {
      score: Math.max(0, Math.min(100, score)),
      reasoning,
      signals,
      weight: this.WEIGHTS.socialMomentum,
      confidence,
    };
  }

  // Helper Methods
  private async calculateVolumeMetrics(tokenData: any): Promise<VolumeMetrics> {
    const now = Date.now();
    const volume5m = await this.getVolumeInTimeframe(tokenData, now - 5 * 60 * 1000, now);
    const volume1h = await this.getVolumeInTimeframe(tokenData, now - 60 * 60 * 1000, now);
    const volume6h = await this.getVolumeInTimeframe(tokenData, now - 6 * 60 * 60 * 1000, now);
    const volume24h = tokenData.volume24h || 0;

    // Calculate baseline volumes for growth calculation
    const baselineVolume5m = await this.getVolumeInTimeframe(tokenData, now - 10 * 60 * 1000, now - 5 * 60 * 1000);
    const baselineVolume1h = await this.getVolumeInTimeframe(tokenData, now - 2 * 60 * 60 * 1000, now - 60 * 60 * 1000);
    const baselineVolume6h = await this.getVolumeInTimeframe(tokenData, now - 12 * 60 * 60 * 1000, now - 6 * 60 * 60 * 1000);

    return {
      volume5m,
      volume1h,
      volume6h,
      volume24h,
      growth5m: this.calculateGrowth(volume5m, baselineVolume5m),
      growth1h: this.calculateGrowth(volume1h, baselineVolume1h),
      growth6h: this.calculateGrowth(volume6h, baselineVolume6h),
    };
  }

  private async calculateHolderMetrics(tokenData: any): Promise<HolderMetrics> {
    const now = Date.now();
    
    // Count new holders in different timeframes
    const newHolders5m = await this.getNewHoldersInTimeframe(tokenData, now - 5 * 60 * 1000, now);
    const newHolders1h = await this.getNewHoldersInTimeframe(tokenData, now - 60 * 60 * 1000, now);
    const newHolders6h = await this.getNewHoldersInTimeframe(tokenData, now - 6 * 60 * 60 * 1000, now);
    
    // Calculate acceleration (comparing growth rates)
    const previousHour = await this.getNewHoldersInTimeframe(tokenData, now - 2 * 60 * 60 * 1000, now - 60 * 60 * 1000);
    const holderAcceleration = previousHour > 0 ? newHolders1h / previousHour : newHolders1h;

    return {
      newHolders5m,
      newHolders1h,
      newHolders6h,
      holderAcceleration,
      totalHolders: tokenData.wallets?.length || 0,
    };
  }

  private detectNarratives(name: string, symbol: string): string[] {
    const narratives: string[] = [];
    const text = `${name} ${symbol}`.toLowerCase();

    const narrativeMap = {
      'ai': ['ai', 'artificial', 'intelligence', 'neural', 'machine', 'deep'],
      'meme': ['pepe', 'doge', 'shib', 'floki', 'bonk', 'wojak'],
      'political': ['trump', 'biden', 'maga', 'america', 'patriot'],
      'defi': ['defi', 'yield', 'farm', 'stake', 'swap', 'liquidity'],
      'gaming': ['game', 'play', 'nft', 'metaverse', 'virtual'],
      'environmental': ['green', 'eco', 'carbon', 'clean', 'renewable'],
    };

    Object.entries(narrativeMap).forEach(([narrative, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        narratives.push(narrative);
      }
    });

    return narratives;
  }

  private isSocialFriendly(name: string, symbol: string): boolean {
    const text = `${name} ${symbol}`.toLowerCase();
    
    // Social-friendly characteristics
    const socialIndicators = [
      'pepe', 'doge', 'cat', 'dog', 'meme', 'fun', 'lol', 'epic',
      'moon', 'rocket', 'diamond', 'ape', 'chad', 'based'
    ];

    return socialIndicators.some(indicator => text.includes(indicator));
  }

  private isSmartMoneyWallet(address: string): boolean {
    // In production, this would check against a database of known profitable wallets
    return this.SMART_MONEY_WALLETS.has(address);
  }

  private async getVolumeInTimeframe(tokenData: any, startTime: number, endTime: number): Promise<number> {
    // Calculate volume from transactions in timeframe
    const transactions = tokenData.transactions?.filter((tx: any) => {
      const txTime = new Date(tx.timestamp).getTime();
      return txTime >= startTime && txTime <= endTime;
    }) || [];

    return transactions.reduce((sum: number, tx: any) => sum + (tx.value || 0), 0);
  }

  private async getNewHoldersInTimeframe(tokenData: any, startTime: number, endTime: number): Promise<number> {
    // Count unique wallets that made their first transaction in timeframe
    const firstBuys = tokenData.transactions?.filter((tx: any) => {
      const txTime = new Date(tx.timestamp).getTime();
      return tx.type === 'BUY' && txTime >= startTime && txTime <= endTime;
    }) || [];

    const newHolders = new Set(firstBuys.map((tx: any) => tx.walletId));
    return newHolders.size;
  }

  private calculateGrowth(current: number, baseline: number): number {
    if (baseline === 0) return current > 0 ? 1000 : 0; // 1000% if going from 0 to something
    return ((current - baseline) / baseline) * 100;
  }

  private calculateWeightedScore(components: AlphaScoreComponents): number {
    return Math.round(
      components.volumeGrowth.score * this.WEIGHTS.volumeGrowth +
      components.holderGrowth.score * this.WEIGHTS.holderGrowth +
      components.smartMoneyInflow.score * this.WEIGHTS.smartMoneyInflow +
      components.narrativeStrength.score * this.WEIGHTS.narrativeStrength +
      components.socialMomentum.score * this.WEIGHTS.socialMomentum
    );
  }

  private calculateConfidence(components: AlphaScoreComponents): number {
    const confidenceSum = 
      components.volumeGrowth.confidence * this.WEIGHTS.volumeGrowth +
      components.holderGrowth.confidence * this.WEIGHTS.holderGrowth +
      components.smartMoneyInflow.confidence * this.WEIGHTS.smartMoneyInflow +
      components.narrativeStrength.confidence * this.WEIGHTS.narrativeStrength +
      components.socialMomentum.confidence * this.WEIGHTS.socialMomentum;

    return Math.round(confidenceSum * 100) / 100;
  }

  private identifyEarlySignals(components: AlphaScoreComponents): string[] {
    const allSignals: string[] = [];
    
    Object.values(components).forEach(component => {
      allSignals.push(...component.signals);
    });

    return [...new Set(allSignals)]; // Remove duplicates
  }

  private getAlphaLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'EXPLOSIVE' {
    if (score >= 85) return 'EXPLOSIVE';
    if (score >= 70) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }

  private getRecommendedAction(score: number, confidence: number, signals: string[]): string {
    const hasEarlySignals = signals.some(signal => 
      ['VOLUME_SURGE_5M', 'RAPID_ADOPTION', 'SMART_MONEY_ENTRY', 'ULTRA_EARLY'].includes(signal)
    );

    if (score >= 85 && confidence >= 0.7) {
      return "🚀 STRONG BUY: High alpha potential with strong confidence";
    } else if (score >= 70 && confidence >= 0.6) {
      return "📈 BUY: Good alpha opportunity detected";
    } else if (score >= 70 && hasEarlySignals) {
      return "⚡ EARLY ENTRY: Promising signals but monitor closely";
    } else if (score >= 40) {
      return "👀 WATCH: Moderate potential, wait for more confirmation";
    } else {
      return "❌ PASS: Low alpha potential";
    }
  }

  private isCacheValid(cached: AlphaScoreResult): boolean {
    // Alpha scores expire quickly (2 minutes)
    const ageMs = Date.now() - new Date(cached.timestamp).getTime();
    return ageMs < 2 * 60 * 1000;
  }

  private async getTokenWithTimeMetrics(address: string) {
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
            timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
          }
        },
        priceHistory: {
          where: {
            timestamp: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) } // Last 6 hours
          },
          orderBy: { timestamp: 'desc' }
        }
      }
    });
  }

  private async cacheResult(tokenAddress: string, result: AlphaScoreResult) {
    await this.redis.setex(
      `alpha_score:${tokenAddress}`,
      120, // 2 minutes - alpha is time sensitive
      JSON.stringify(result)
    );
  }

  async getCachedAlphaScore(tokenAddress: string): Promise<AlphaScoreResult | null> {
    const cached = await this.redis.get(`alpha_score:${tokenAddress}`);
    return cached ? JSON.parse(cached) : null;
  }
}
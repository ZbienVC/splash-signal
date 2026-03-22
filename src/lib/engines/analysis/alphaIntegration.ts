// Alpha Score System Integration Guide
import { AlphaScorer } from './alphaScorer';
import { RugScorer } from './rugScorer';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

// Combined Analysis Engine - Alpha + Rug Score
export class CombinedAnalysisEngine {
  private alphaScorer: AlphaScorer;
  private rugScorer: RugScorer;
  private prisma: PrismaClient;
  private redis: Redis;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL!);
    this.alphaScorer = new AlphaScorer(this.prisma, this.redis);
    this.rugScorer = new RugScorer(this.prisma, this.redis);
  }

  // Complete token analysis combining both Alpha and Rug scores
  async analyzeToken(tokenAddress: string) {
    try {
      // Run both analyses in parallel
      const [alphaResult, rugResult] = await Promise.all([
        this.alphaScorer.calculateAlphaScore(tokenAddress),
        this.rugScorer.calculateRugScore(tokenAddress)
      ]);

      // Calculate combined recommendation
      const recommendation = this.getCombinedRecommendation(alphaResult, rugResult);

      return {
        tokenAddress,
        alphaScore: alphaResult,
        rugScore: rugResult,
        combinedRecommendation: recommendation,
        timestamp: new Date()
      };

    } catch (error) {
      console.error(`Error analyzing token ${tokenAddress}:`, error);
      throw error;
    }
  }

  private getCombinedRecommendation(alphaResult: any, rugResult: any): string {
    const alpha = alphaResult.finalScore;
    const rug = rugResult.finalScore;
    const alphaConf = alphaResult.confidence;
    const rugConf = rugResult.confidence;

    // High alpha + Low rug = Strong buy
    if (alpha >= 70 && rug <= 30 && alphaConf >= 0.6) {
      return "🚀 STRONG BUY: High alpha potential with low risk";
    }
    
    // High alpha + Medium rug = Cautious buy
    if (alpha >= 70 && rug <= 50) {
      return "📈 CAUTIOUS BUY: Good opportunity but monitor risk factors";
    }
    
    // High alpha + High rug = Avoid despite potential
    if (alpha >= 70 && rug > 60) {
      return "⚠️ AVOID: High potential but too risky";
    }
    
    // Medium alpha + Low rug = Safe play
    if (alpha >= 40 && rug <= 30) {
      return "✅ SAFE PLAY: Moderate potential with low risk";
    }
    
    // Low alpha + any rug = Pass
    if (alpha < 40) {
      return "❌ PASS: Insufficient alpha potential";
    }
    
    // Default fallback
    return "👀 MONITOR: Mixed signals, requires closer analysis";
  }
}

// Real-time scanning for alpha opportunities
export async function scanForAlphaOpportunities() {
  const prisma = new PrismaClient();
  const redis = new Redis(process.env.REDIS_URL!);
  const alphaScorer = new AlphaScorer(prisma, redis);

  try {
    // Get recently active tokens (last 6 hours)
    const activeTokens = await prisma.token.findMany({
      where: {
        lastScanAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
        volume24h: { gte: 10000 } // Minimum $10k volume
      },
      select: { address: true, symbol: true, name: true, volume24h: true },
      orderBy: { volume24h: 'desc' },
      take: 50 // Top 50 by volume
    });

    const opportunities: any[] = [];

    // Score each token for alpha potential
    for (const token of activeTokens) {
      try {
        const alphaResult = await alphaScorer.calculateAlphaScore(token.address);
        
        // Only include tokens with score >= 60 and confidence >= 0.5
        if (alphaResult.finalScore >= 60 && alphaResult.confidence >= 0.5) {
          opportunities.push({
            ...token,
            alphaScore: alphaResult.finalScore,
            alphaLevel: alphaResult.alphaLevel,
            confidence: alphaResult.confidence,
            earlySignals: alphaResult.earlySignals,
            recommendation: alphaResult.recommendedAction,
            priority: alphaResult.finalScore * alphaResult.confidence
          });
        }
      } catch (error) {
        console.error(`Error scoring ${token.address}:`, error);
      }
    }

    // Sort by priority (score * confidence)
    opportunities.sort((a, b) => b.priority - a.priority);

    return opportunities;

  } finally {
    await prisma.$disconnect();
    await redis.quit();
  }
}

// API endpoint integration example
export const alphaAPIEndpoints = {
  // GET /api/alpha/score/:tokenAddress
  async getAlphaScore(tokenAddress: string) {
    const prisma = new PrismaClient();
    const redis = new Redis(process.env.REDIS_URL!);
    const alphaScorer = new AlphaScorer(prisma, redis);

    try {
      // Check cache first
      let result = await alphaScorer.getCachedAlphaScore(tokenAddress);
      
      if (!result) {
        // Calculate fresh score
        result = await alphaScorer.calculateAlphaScore(tokenAddress);
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    } finally {
      await prisma.$disconnect();
      await redis.quit();
    }
  },

  // GET /api/alpha/opportunities
  async getAlphaOpportunities() {
    try {
      const opportunities = await scanForAlphaOpportunities();
      
      return {
        success: true,
        data: {
          opportunities,
          count: opportunities.length,
          timestamp: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // GET /api/analysis/complete/:tokenAddress
  async getCompleteAnalysis(tokenAddress: string) {
    const engine = new CombinedAnalysisEngine();

    try {
      const analysis = await engine.analyzeToken(tokenAddress);
      
      return {
        success: true,
        data: analysis
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Job queue integration for background alpha scanning
export class AlphaJobProcessor {
  private alphaScorer: AlphaScorer;

  constructor(prisma: PrismaClient, redis: Redis) {
    this.alphaScorer = new AlphaScorer(prisma, redis);
  }

  // Background job to continuously scan for alpha opportunities
  async processAlphaScanJob() {
    try {
      const opportunities = await scanForAlphaOpportunities();
      
      // Generate alerts for high-priority opportunities
      const alerts = opportunities
        .filter(opp => opp.alphaLevel === 'EXPLOSIVE' || opp.alphaLevel === 'HIGH')
        .map(opp => ({
          type: 'ALPHA_ALERT',
          tokenAddress: opp.address,
          tokenSymbol: opp.symbol,
          tokenName: opp.name,
          alphaScore: opp.alphaScore,
          level: opp.alphaLevel,
          confidence: opp.confidence,
          signals: opp.earlySignals,
          recommendation: opp.recommendation,
          timestamp: new Date()
        }));

      // Send alerts to notification service
      for (const alert of alerts) {
        await this.sendAlphaAlert(alert);
      }

      return {
        opportunitiesFound: opportunities.length,
        alertsSent: alerts.length,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Error processing alpha scan job:', error);
      throw error;
    }
  }

  private async sendAlphaAlert(alert: any) {
    // Integrate with your notification service (Telegram, Discord, etc.)
    console.log('🚀 ALPHA ALERT:', alert);
    
    // Example: Send to Telegram
    // await telegramBot.sendMessage(chatId, formatAlphaAlert(alert));
    
    // Example: Send to Discord webhook
    // await discordWebhook.send(formatAlphaAlert(alert));
  }
}

// Example alert formatting
function formatAlphaAlert(alert: any): string {
  const emoji = alert.level === 'EXPLOSIVE' ? '🚀🚀🚀' : '📈';
  
  return `
${emoji} **ALPHA ALERT** ${emoji}

**Token:** ${alert.tokenSymbol} (${alert.tokenName})
**Address:** \`${alert.tokenAddress}\`

**Alpha Score:** ${alert.alphaScore}/100 (${alert.level})
**Confidence:** ${(alert.confidence * 100).toFixed(0)}%

**Early Signals:**
${alert.signals.map((signal: string) => `• ${signal}`).join('\n')}

**Recommendation:** ${alert.recommendation}

**Time:** ${alert.timestamp.toLocaleString()}
  `;
}

// Usage examples and testing
export async function testAlphaSystem() {
  console.log('🧪 Testing Alpha Scoring System...\n');

  // Test individual alpha scoring
  const prisma = new PrismaClient();
  const redis = new Redis(process.env.REDIS_URL!);
  const alphaScorer = new AlphaScorer(prisma, redis);

  try {
    // Example token analysis
    const testToken = "0x1234567890abcdef";
    console.log(`📊 Analyzing token: ${testToken}`);
    
    const result = await alphaScorer.calculateAlphaScore(testToken);
    console.log('✅ Alpha score calculated');
    console.log(`   Score: ${result.finalScore}/100 (${result.alphaLevel})`);
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    console.log(`   Signals: ${result.earlySignals.join(', ')}`);
    
    // Test opportunity scanning
    console.log('\n🔍 Scanning for opportunities...');
    const opportunities = await scanForAlphaOpportunities();
    console.log(`✅ Found ${opportunities.length} alpha opportunities`);
    
    // Test combined analysis
    console.log('\n🔬 Running combined analysis...');
    const engine = new CombinedAnalysisEngine();
    const combined = await engine.analyzeToken(testToken);
    console.log(`✅ Combined recommendation: ${combined.combinedRecommendation}`);
    
    console.log('\n🎉 Alpha system test completed successfully!');

  } catch (error) {
    console.error('❌ Alpha system test failed:', error);
  } finally {
    await prisma.$disconnect();
    await redis.quit();
  }
}

// Configuration for production deployment
export const ALPHA_SYSTEM_CONFIG = {
  scanning: {
    interval: '*/2 * * * *', // Every 2 minutes
    batchSize: 50, // Tokens per scan
    scoreThreshold: 60, // Minimum score for alerts
    confidenceThreshold: 0.5 // Minimum confidence
  },
  
  alerts: {
    explosiveThreshold: 85, // Immediate alerts
    highThreshold: 70, // Priority alerts
    mediumThreshold: 40, // Monitor alerts
    cooldown: 300, // 5 minutes between duplicate alerts
  },

  caching: {
    alphaTTL: 120, // 2 minutes (time-sensitive)
    opportunitiesTTL: 60, // 1 minute
    analysisTTL: 300 // 5 minutes for combined analysis
  }
};

export { AlphaScorer } from './alphaScorer';
export { exampleExplosiveAlphaOutput, exampleMediumAlphaOutput } from './alphaExample';
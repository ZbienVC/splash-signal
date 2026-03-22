// Alpha Score Example Outputs and Detection Heuristics
import { AlphaScorer } from './alphaScorer';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

// Example Alpha Score Output - EXPLOSIVE Potential
export function exampleExplosiveAlphaOutput() {
  return {
    "tokenAddress": "0xabcd...1234",
    "finalScore": 92,
    "alphaLevel": "EXPLOSIVE",
    "confidence": 0.85,
    "components": {
      "volumeGrowth": {
        "score": 95,
        "reasoning": [
          "🚀 EXPLOSIVE 5m volume: +1250%",
          "🔥 Sustained 1h growth: +450%",
          "📈 Strong 6h trend: +280%",
          "⚡ EARLY MOMENTUM: Volume accelerating",
          "✅ Adequate volume: $450k"
        ],
        "signals": ["VOLUME_SURGE_5M", "SUSTAINED_GROWTH_1H", "TREND_CONFIRMATION_6H", "EARLY_ACCELERATION"],
        "weight": 0.25,
        "confidence": 0.9
      },
      "holderGrowth": {
        "score": 85,
        "reasoning": [
          "🚀 RAPID adoption: 45 new holders (5m)",
          "🔥 Viral growth: 280 new holders (1h)",
          "⚡ ACCELERATING: Holder growth rate 3.2x",
          "⚡ EARLY STAGE: Only 850 holders"
        ],
        "signals": ["RAPID_ADOPTION", "VIRAL_GROWTH", "ACCELERATING_ADOPTION", "EARLY_STAGE"],
        "weight": 0.20,
        "confidence": 0.8
      },
      "smartMoneyInflow": {
        "score": 88,
        "reasoning": [
          "🧠 SMART MONEY: 3 known profitable wallets buying",
          "🐋 WHALE ACTIVITY: 8 large purchases detected",
          "⚡ FRESH MONEY: 12 new wallets with significant buys",
          "💪 ACCUMULATION: 85% of transactions are buys"
        ],
        "signals": ["SMART_MONEY_ENTRY", "WHALE_ACCUMULATION", "FRESH_CAPITAL", "ACCUMULATION_PHASE"],
        "weight": 0.20,
        "confidence": 0.75
      },
      "narrativeStrength": {
        "score": 95,
        "reasoning": [
          "🎯 NARRATIVE MATCH: ai, meme",
          "🔥 HOT NARRATIVE: ai, pepe",
          "😄 MEME POTENTIAL: 2 meme indicators",
          "🤖 TECH NARRATIVE: ai, artificial",
          "⚡ BRAND NEW: Token is 0.8 hours old"
        ],
        "signals": ["NARRATIVE_ALIGNMENT", "HOT_NARRATIVE", "MEME_POTENTIAL", "TECH_NARRATIVE", "ULTRA_EARLY"],
        "weight": 0.25,
        "confidence": 0.9
      },
      "socialMomentum": {
        "score": 75,
        "reasoning": [
          "📱 High social virality potential",
          "🚀 HIGH ACTIVITY: 180 transactions (1h)",
          "👥 BROAD INTEREST: 95 unique participants",
          "📊 Social data limited in MVP - using transaction patterns as proxy"
        ],
        "signals": ["SOCIAL_FRIENDLY", "HIGH_TRANSACTION_VELOCITY", "BROAD_PARTICIPATION"],
        "weight": 0.10,
        "confidence": 0.4
      }
    },
    "earlySignals": [
      "VOLUME_SURGE_5M",
      "SUSTAINED_GROWTH_1H", 
      "EARLY_ACCELERATION",
      "RAPID_ADOPTION",
      "VIRAL_GROWTH",
      "ACCELERATING_ADOPTION",
      "EARLY_STAGE",
      "SMART_MONEY_ENTRY",
      "WHALE_ACCUMULATION",
      "FRESH_CAPITAL",
      "NARRATIVE_ALIGNMENT",
      "HOT_NARRATIVE",
      "ULTRA_EARLY",
      "SOCIAL_FRIENDLY"
    ],
    "recommendedAction": "🚀 STRONG BUY: High alpha potential with strong confidence",
    "timestamp": "2024-03-21T20:55:00.000Z"
  };
}

// Example Medium Alpha Output
export function exampleMediumAlphaOutput() {
  return {
    "tokenAddress": "0x5678...9abc",
    "finalScore": 65,
    "alphaLevel": "MEDIUM",
    "confidence": 0.6,
    "components": {
      "volumeGrowth": {
        "score": 70,
        "reasoning": [
          "📈 Strong 5m volume: +280%",
          "📈 Good 1h growth: +150%",
          "📊 Building 6h momentum: +85%",
          "✅ Adequate volume: $180k"
        ],
        "signals": ["VOLUME_GROWTH_5M"],
        "weight": 0.25,
        "confidence": 0.7
      },
      "holderGrowth": {
        "score": 55,
        "reasoning": [
          "📈 Strong adoption: 15 new holders (5m)",
          "📈 Solid growth: 75 new holders (1h)",
          "✅ Established base: 1850 total holders"
        ],
        "signals": ["STRONG_ADOPTION"],
        "weight": 0.20,
        "confidence": 0.6
      },
      "smartMoneyInflow": {
        "score": 45,
        "reasoning": [
          "🐋 WHALE ACTIVITY: 4 large purchases detected",
          "💪 ACCUMULATION: 72% of transactions are buys"
        ],
        "signals": ["WHALE_ACCUMULATION", "ACCUMULATION_PHASE"],
        "weight": 0.20,
        "confidence": 0.5
      },
      "narrativeStrength": {
        "score": 75,
        "reasoning": [
          "🎯 NARRATIVE MATCH: defi",
          "🤖 TECH NARRATIVE: defi, yield",
          "🆕 VERY NEW: Token is 18 hours old"
        ],
        "signals": ["NARRATIVE_ALIGNMENT", "TECH_NARRATIVE", "VERY_EARLY"],
        "weight": 0.25,
        "confidence": 0.7
      },
      "socialMomentum": {
        "score": 50,
        "reasoning": [
          "📈 Good activity: 85 transactions (1h)",
          "👥 BROAD INTEREST: 45 unique participants",
          "📊 Social data limited in MVP - using transaction patterns as proxy"
        ],
        "signals": ["BROAD_PARTICIPATION"],
        "weight": 0.10,
        "confidence": 0.3
      }
    },
    "earlySignals": [
      "VOLUME_GROWTH_5M",
      "STRONG_ADOPTION",
      "WHALE_ACCUMULATION",
      "ACCUMULATION_PHASE",
      "NARRATIVE_ALIGNMENT",
      "TECH_NARRATIVE",
      "VERY_EARLY",
      "BROAD_PARTICIPATION"
    ],
    "recommendedAction": "👀 WATCH: Moderate potential, wait for more confirmation",
    "timestamp": "2024-03-21T20:55:00.000Z"
  };
}

// Detection Heuristics for Early Alpha Identification
export const ALPHA_DETECTION_HEURISTICS = {
  volume: {
    explosive: {
      growth5m: ">500%",
      growth1h: ">300%",
      pattern: "Accelerating (5m > 1h > 6h growth)",
      signals: ["VOLUME_SURGE_5M", "SUSTAINED_GROWTH_1H", "EARLY_ACCELERATION"]
    },
    strong: {
      growth5m: ">200%",
      growth1h: ">100%",
      pattern: "Sustained growth across timeframes",
      signals: ["VOLUME_GROWTH_5M", "SUSTAINED_GROWTH_1H"]
    },
    building: {
      growth5m: ">50%",
      growth6h: ">50%",
      pattern: "Steady momentum building",
      signals: ["TREND_CONFIRMATION_6H"]
    }
  },

  holders: {
    viral: {
      newHolders5m: ">20",
      newHolders1h: ">100",
      acceleration: ">2x",
      signals: ["RAPID_ADOPTION", "VIRAL_GROWTH", "ACCELERATING_ADOPTION"]
    },
    growing: {
      newHolders5m: ">10",
      newHolders1h: ">50",
      pattern: "Steady new adoption",
      signals: ["STRONG_ADOPTION"]
    },
    earlyStage: {
      totalHolders: "<100",
      bonus: "Early stage opportunity",
      signals: ["EARLY_STAGE"]
    }
  },

  smartMoney: {
    confirmed: {
      smartWallets: ">0",
      whaleActivity: ">3 large buys",
      buyRatio: ">80%",
      signals: ["SMART_MONEY_ENTRY", "WHALE_ACCUMULATION", "ACCUMULATION_PHASE"]
    },
    suspected: {
      freshCapital: ">5 new wallets with significant buys",
      sniperActivity: "Low-risk sniper wallets present",
      signals: ["FRESH_CAPITAL", "SNIPER_ACTIVITY"]
    }
  },

  narrative: {
    hot: {
      categories: ["AI", "Meme", "Political", "DeFi"],
      keywords: ["ai", "pepe", "trump", "yield"],
      bonus: "Matches trending narratives",
      signals: ["HOT_NARRATIVE", "NARRATIVE_ALIGNMENT"]
    },
    timing: {
      ultraEarly: "<2 hours old",
      veryEarly: "<24 hours old",
      signals: ["ULTRA_EARLY", "VERY_EARLY"]
    }
  },

  social: {
    viral: {
      characteristics: "Meme-friendly naming",
      activity: ">100 transactions/hour",
      participation: ">50 unique wallets",
      signals: ["SOCIAL_FRIENDLY", "HIGH_TRANSACTION_VELOCITY", "BROAD_PARTICIPATION"]
    }
  }
};

// Early Detection Strategies
export const EARLY_DETECTION_STRATEGIES = {
  volumeSurge: {
    description: "Detect sudden volume spikes in 5-minute windows",
    implementation: "Monitor 5m volume vs previous 5m baseline",
    threshold: ">500% growth",
    confidence: "High - indicates immediate interest",
    timing: "Ultra-early (minutes)",
    action: "Immediate analysis required"
  },

  smartMoneyTracking: {
    description: "Follow known profitable wallet addresses",
    implementation: "Track buy transactions from proven wallets",
    threshold: "Any smart money wallet buying",
    confidence: "Very High - these wallets have track records",
    timing: "Early (within hours)",
    action: "Strong signal to investigate"
  },

  holderAcceleration: {
    description: "Growth rate of growth rate (second derivative)",
    implementation: "Compare current hour growth to previous hour",
    threshold: ">2x acceleration",
    confidence: "Medium - could be organic or artificial",
    timing: "Early (within hours)",
    action: "Monitor for sustainability"
  },

  narrativeAlignment: {
    description: "Match tokens to trending narratives",
    implementation: "Keyword matching + context analysis",
    threshold: "Match hot narrative + recency",
    confidence: "Medium - depends on narrative strength",
    timing: "Variable (narrative dependent)",
    action: "Evaluate narrative staying power"
  },

  freshTokenScanning: {
    description: "Scan tokens <2 hours old for early signals",
    implementation: "Continuous monitoring of new token launches",
    threshold: "Age <2 hours + any positive signal",
    confidence: "Low-Medium - high noise",
    timing: "Ultra-early (minutes to hours)",
    action: "Rapid evaluation required"
  }
};

// Confidence Scoring System
export const CONFIDENCE_FACTORS = {
  dataQuality: {
    highVolume: "+0.2 confidence (>$100k daily volume)",
    manyTransactions: "+0.1 confidence (>100 transactions)",
    establishedHolders: "+0.1 confidence (>500 holders)"
  },

  signalStrength: {
    multipleSignals: "+0.15 per additional early signal",
    smartMoney: "+0.3 confidence (known profitable wallets)",
    volumeAcceleration: "+0.3 confidence (accelerating pattern)",
    narrativeMatch: "+0.2 confidence (hot narrative + timing)"
  },

  timeframe: {
    veryRecent: "+0.1 confidence (data <5 minutes old)",
    recent: "+0.05 confidence (data <1 hour old)",
    stale: "-0.2 confidence (data >6 hours old)"
  }
};

// Example Usage and Testing
export async function testAlphaScoring() {
  const prisma = new PrismaClient();
  const redis = new Redis(process.env.REDIS_URL!);
  const alphaScorer = new AlphaScorer(prisma, redis);

  try {
    // Test with example token
    const result = await alphaScorer.calculateAlphaScore("0x1234567890abcdef");
    
    console.log('\n🚀 ALPHA SCORE ANALYSIS RESULT\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Header with score and confidence
    const confidenceBar = '█'.repeat(Math.floor(result.confidence * 10));
    console.log(`📊 ALPHA SCORE: ${result.finalScore}/100 (${result.alphaLevel})`);
    console.log(`🎯 CONFIDENCE: ${(result.confidence * 100).toFixed(0)}% ${confidenceBar}\n`);
    
    // Recommended action
    console.log(`💡 RECOMMENDATION: ${result.recommendedAction}\n`);
    
    // Early signals summary
    if (result.earlySignals.length > 0) {
      console.log('⚡ EARLY SIGNALS DETECTED:');
      result.earlySignals.forEach(signal => {
        const emoji = getSignalEmoji(signal);
        console.log(`  ${emoji} ${signal}`);
      });
      console.log('');
    }
    
    // Component breakdown
    console.log('📋 COMPONENT BREAKDOWN:\n');
    
    Object.entries(result.components).forEach(([component, data]) => {
      const componentName = component.replace(/([A-Z])/g, ' $1').toUpperCase();
      const confidenceStars = '★'.repeat(Math.floor(data.confidence * 5));
      
      console.log(`${componentName} (${(data.weight * 100)}%): ${data.score}/100 ${confidenceStars}`);
      data.reasoning.forEach(reason => console.log(`  ${reason}`));
      if (data.signals.length > 0) {
        console.log(`  🎯 Signals: ${data.signals.join(', ')}`);
      }
      console.log('');
    });
    
    // Action recommendations based on score
    console.log('💡 DETAILED RECOMMENDATIONS:\n');
    
    if (result.alphaLevel === 'EXPLOSIVE') {
      console.log('🚀 EXPLOSIVE ALPHA DETECTED:');
      console.log('   • Consider immediate position');
      console.log('   • Monitor for early exit signals');
      console.log('   • High risk/reward scenario');
      console.log('   • Time-sensitive opportunity');
    } else if (result.alphaLevel === 'HIGH') {
      console.log('📈 HIGH ALPHA POTENTIAL:');
      console.log('   • Strong entry opportunity');
      console.log('   • Monitor momentum sustainability');
      console.log('   • Consider position sizing');
    } else if (result.alphaLevel === 'MEDIUM') {
      console.log('👀 MODERATE ALPHA:');
      console.log('   • Wait for more confirmation');
      console.log('   • Monitor for signal strengthening');
      console.log('   • Consider watchlist addition');
    } else {
      console.log('❌ LOW ALPHA POTENTIAL:');
      console.log('   • No immediate action recommended');
      console.log('   • Monitor for future developments');
    }
    
    return result;
    
  } catch (error) {
    console.error('Error testing alpha scoring:', error);
  } finally {
    await prisma.$disconnect();
    await redis.quit();
  }
}

function getSignalEmoji(signal: string): string {
  const emojiMap: { [key: string]: string } = {
    'VOLUME_SURGE_5M': '🚀',
    'SUSTAINED_GROWTH_1H': '🔥',
    'EARLY_ACCELERATION': '⚡',
    'RAPID_ADOPTION': '🌪️',
    'VIRAL_GROWTH': '📈',
    'SMART_MONEY_ENTRY': '🧠',
    'WHALE_ACCUMULATION': '🐋',
    'NARRATIVE_ALIGNMENT': '🎯',
    'HOT_NARRATIVE': '🔥',
    'ULTRA_EARLY': '⚡',
    'SOCIAL_FRIENDLY': '📱',
    'HIGH_TRANSACTION_VELOCITY': '🚀',
  };
  
  return emojiMap[signal] || '📊';
}

// Real-time alpha monitoring workflow
export class AlphaMonitor {
  private alphaScorer: AlphaScorer;
  private alertThreshold = 70; // Score threshold for alerts
  private confidenceThreshold = 0.6; // Confidence threshold

  constructor(alphaScorer: AlphaScorer) {
    this.alphaScorer = alphaScorer;
  }

  async scanForAlphaOpportunities(tokenAddresses: string[]) {
    const opportunities: any[] = [];
    
    for (const address of tokenAddresses) {
      try {
        const result = await this.alphaScorer.calculateAlphaScore(address);
        
        if (result.finalScore >= this.alertThreshold && 
            result.confidence >= this.confidenceThreshold) {
          opportunities.push({
            address,
            score: result.finalScore,
            level: result.alphaLevel,
            confidence: result.confidence,
            earlySignals: result.earlySignals,
            action: result.recommendedAction,
            timestamp: result.timestamp
          });
        }
      } catch (error) {
        console.error(`Error scoring ${address}:`, error);
      }
    }
    
    // Sort by score * confidence
    opportunities.sort((a, b) => 
      (b.score * b.confidence) - (a.score * a.confidence)
    );
    
    return opportunities;
  }

  generateAlphaAlert(opportunity: any) {
    return {
      type: 'ALPHA_OPPORTUNITY',
      severity: opportunity.level,
      token: {
        address: opportunity.address,
        score: opportunity.score,
        confidence: opportunity.confidence
      },
      signals: opportunity.earlySignals,
      action: opportunity.action,
      priority: opportunity.score * opportunity.confidence,
      timestamp: opportunity.timestamp
    };
  }
}
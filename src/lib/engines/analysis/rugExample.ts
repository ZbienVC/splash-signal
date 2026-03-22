// Example Rug Score Evaluation
import { RugScorer } from './rugScorer';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

// Example token evaluation output
export function exampleRugScoreOutput() {
  return {
    "tokenAddress": "0x1234...abcd",
    "finalScore": 72,
    "riskLevel": "HIGH",
    "components": {
      "contractSafety": {
        "score": 65,
        "reasoning": [
          "⚠️ Contract is NOT verified",
          "⚠️ Ownership has NOT been renounced", 
          "✅ Contract is not a proxy (non-upgradeable)",
          "🚨 High transaction tax: 12.0%"
        ],
        "flags": ["UNVERIFIED_CONTRACT", "OWNERSHIP_NOT_RENOUNCED", "HIGH_TAX"],
        "weight": 0.20
      },
      "holderDistribution": {
        "score": 85,
        "reasoning": [
          "🚨 Top 10 holders own 78.5% of supply",
          "🚨 5 whale wallets (>5% each)",
          "🚨 Single holder owns 23.1% of supply"
        ],
        "flags": ["HIGH_CONCENTRATION", "MULTIPLE_WHALES", "DOMINANT_HOLDER"],
        "weight": 0.20
      },
      "liquiditySafety": {
        "score": 55,
        "reasoning": [
          "🚨 LP is NOT locked",
          "⚠️ Moderate liquidity ratio: 8.2%",
          "✅ Adequate liquidity: $125,000"
        ],
        "flags": ["NO_LP_LOCK"],
        "weight": 0.20
      },
      "devBehavior": {
        "score": 75,
        "reasoning": [
          "🚨 Dev wallet sold 3 times in last 24h",
          "🚨 Dev wallet has 8 sell transactions",
          "🚨 Dev holds 18.5% of supply"
        ],
        "flags": ["RECENT_DEV_SELLS", "FREQUENT_DEV_SELLS", "HIGH_DEV_HOLDING"],
        "weight": 0.20
      },
      "tradingPatterns": {
        "score": 80,
        "reasoning": [
          "🚨 Possible bot buying detected",
          "🚨 Potential wash trading detected",
          "⚠️ 4 transaction clusters detected"
        ],
        "flags": ["BOT_BUYING", "WASH_TRADING", "CLUSTERED_TRANSACTIONS"],
        "weight": 0.20
      }
    },
    "summary": "⚠️ HIGH RISK: Proceed with extreme caution. Primary concern: tradingPatterns (80/100)",
    "timestamp": "2024-03-21T20:52:00.000Z"
  };
}

// Example usage and testing function
export async function testRugScoring() {
  const prisma = new PrismaClient();
  const redis = new Redis(process.env.REDIS_URL!);
  const rugScorer = new RugScorer(prisma, redis);

  // Example: Score a specific token
  try {
    const result = await rugScorer.calculateRugScore("0x1234567890abcdef");
    
    console.log('\n🛡️ RUG SCORE ANALYSIS RESULT\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`📊 FINAL SCORE: ${result.finalScore}/100 (${result.riskLevel} RISK)\n`);
    console.log(`📝 SUMMARY: ${result.summary}\n`);
    
    console.log('📋 COMPONENT BREAKDOWN:\n');
    
    Object.entries(result.components).forEach(([component, data]) => {
      console.log(`${component.toUpperCase()} (${(data.weight * 100)}%): ${data.score}/100`);
      data.reasoning.forEach(reason => console.log(`  ${reason}`));
      if (data.flags.length > 0) {
        console.log(`  🚩 Flags: ${data.flags.join(', ')}`);
      }
      console.log('');
    });
    
    // Risk level recommendations
    console.log('💡 RECOMMENDATIONS:\n');
    
    if (result.riskLevel === 'CRITICAL') {
      console.log('🚨 DO NOT INVEST: This token shows extreme rug pull indicators');
      console.log('   • Multiple critical red flags detected');
      console.log('   • High probability of being a scam');
      console.log('   • Recommend avoiding completely');
    } else if (result.riskLevel === 'HIGH') {
      console.log('⚠️ HIGH RISK: Only for experienced traders with small amounts');
      console.log('   • Significant risk factors present');
      console.log('   • Monitor closely for exit signals');
      console.log('   • Consider setting tight stop losses');
    } else if (result.riskLevel === 'MEDIUM') {
      console.log('⚠️ MODERATE RISK: Proceed with caution and due diligence');
      console.log('   • Some concerning factors identified');
      console.log('   • Research team and project thoroughly');
      console.log('   • Start with small position size');
    } else {
      console.log('✅ LOW RISK: Appears relatively safe but always DYOR');
      console.log('   • Most safety checks passed');
      console.log('   • Still monitor for changes');
      console.log('   • No guarantee of success');
    }
    
    return result;
    
  } catch (error) {
    console.error('Error testing rug scoring:', error);
  } finally {
    await prisma.$disconnect();
    await redis.quit();
  }
}

// Component scoring formulas reference
export const SCORING_FORMULAS = {
  contractSafety: {
    description: "Evaluates smart contract security and transparency",
    factors: [
      { factor: "Contract verified", impact: "+30 points", reasoning: "Code can be audited publicly" },
      { factor: "Ownership renounced", impact: "+25 points", reasoning: "Prevents malicious contract changes" },
      { factor: "Non-proxy contract", impact: "+15 points", reasoning: "Cannot be upgraded unexpectedly" },
      { factor: "Low transaction tax (<5%)", impact: "+10 points", reasoning: "Fair transaction costs" },
      { factor: "Unverified contract", impact: "-20 points", reasoning: "Cannot verify code safety" },
      { factor: "Ownership not renounced", impact: "-15 points", reasoning: "Dev can modify contract" },
      { factor: "Proxy/upgradeable contract", impact: "-30 points", reasoning: "Code can be changed anytime" },
      { factor: "High transaction tax (>10%)", impact: "-20 points", reasoning: "Prevents easy selling" }
    ],
    weight: "20%"
  },
  
  holderDistribution: {
    description: "Analyzes token distribution among wallets",
    factors: [
      { factor: "Top 10 holders >70%", impact: "+40 points", reasoning: "Extreme concentration risk" },
      { factor: "Single holder >20%", impact: "+30 points", reasoning: "Dump risk from large holder" },
      { factor: "Multiple whales (>5%)", impact: "+25 points", reasoning: "Coordinated dumping possible" },
      { factor: "Sniper concentration >30%", impact: "+35 points", reasoning: "Bot/insider dominance" },
      { factor: "Good distribution", impact: "-20 points", reasoning: "Reduced manipulation risk" }
    ],
    weight: "20%"
  },
  
  liquiditySafety: {
    description: "Evaluates liquidity security and accessibility",
    factors: [
      { factor: "LP not locked", impact: "+40 points", reasoning: "Can be removed anytime (rug)" },
      { factor: "Short lock period (<90 days)", impact: "+15 points", reasoning: "Early rug possibility" },
      { factor: "Low liquidity ratio (<5%)", impact: "+25 points", reasoning: "Easy to manipulate price" },
      { factor: "Very low absolute liquidity", impact: "+30 points", reasoning: "High slippage, hard to sell" },
      { factor: "LP locked long term", impact: "-30 points", reasoning: "Cannot be rugged easily" },
      { factor: "Adequate liquidity", impact: "-15 points", reasoning: "Better price stability" }
    ],
    weight: "20%"
  },
  
  devBehavior: {
    description: "Monitors developer wallet activity patterns",
    factors: [
      { factor: "Recent dev sells", impact: "+30 points", reasoning: "Dev dumping on holders" },
      { factor: "Frequent dev sells", impact: "+20 points", reasoning: "Pattern of selling pressure" },
      { factor: "High dev holding (>15%)", impact: "+25 points", reasoning: "Large dump potential" },
      { factor: "Multiple dev transfers", impact: "+15 points", reasoning: "Possible fund dispersal" },
      { factor: "No concerning behavior", impact: "0 points", reasoning: "Normal dev activity" }
    ],
    weight: "20%"
  },
  
  tradingPatterns: {
    description: "Detects artificial or manipulated trading activity",
    factors: [
      { factor: "Bot buying patterns", impact: "+30 points", reasoning: "Artificial volume/price" },
      { factor: "Wash trading detected", impact: "+35 points", reasoning: "Fake trading activity" },
      { factor: "Extreme volume anomalies", impact: "+25 points", reasoning: "Likely manipulation" },
      { factor: "Transaction clustering", impact: "+20 points", reasoning: "Coordinated trading" },
      { factor: "Activity spikes", impact: "+15 points", reasoning: "Possible pump attempt" },
      { factor: "Normal trading patterns", impact: "0 points", reasoning: "Organic trading activity" }
    ],
    weight: "20%"
  }
};

// Alert thresholds for different risk levels
export const RISK_THRESHOLDS = {
  CRITICAL: {
    score: 80,
    description: "Extreme rug risk - avoid completely",
    action: "AVOID",
    color: "#ff4444"
  },
  HIGH: {
    score: 60,
    description: "High rug risk - extreme caution",
    action: "CAUTION",
    color: "#ff8800"  
  },
  MEDIUM: {
    score: 30,
    description: "Moderate risk - due diligence required",
    action: "RESEARCH",
    color: "#ffaa00"
  },
  LOW: {
    score: 0,
    description: "Low risk - appears relatively safe",
    action: "MONITOR",
    color: "#00ff88"
  }
};

// Example webhook payload for alerts
export function createRugScoreAlert(result: any) {
  if (result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL') {
    return {
      type: 'RUG_ALERT',
      severity: result.riskLevel,
      token: {
        address: result.tokenAddress,
        score: result.finalScore,
        riskLevel: result.riskLevel
      },
      primaryFlags: result.components.contractSafety.flags
        .concat(result.components.holderDistribution.flags)
        .concat(result.components.liquiditySafety.flags),
      message: result.summary,
      timestamp: result.timestamp,
      action: result.riskLevel === 'CRITICAL' ? 'AVOID' : 'CAUTION'
    };
  }
  return null;
}
// Insight Engine - Transform data into actionable insights
import { PrismaClient } from '@prisma/client';

interface InsightRule {
  id: string;
  condition: (data: any) => boolean;
  insight: {
    message: string;
    emoji: string;
    action: string;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    category: 'ENTRY' | 'EXIT' | 'HOLD' | 'AVOID' | 'WARNING';
    confidence: number;
  };
  context?: string;
}

interface TokenInsights {
  primary: {
    decision: string; // "STRONG BUY" | "EXIT NOW" | "AVOID" etc
    reasoning: string;
    urgency: string;
    confidence: number;
  };
  signals: Array<{
    category: string;
    message: string;
    emoji: string;
    action: string;
    urgency: string;
    priority: number;
  }>;
  warnings: Array<{
    type: string;
    message: string;
    severity: string;
    action: string;
  }>;
  opportunities: Array<{
    type: string;
    message: string;
    potential: string;
    timeframe: string;
  }>;
  summary: {
    tldr: string;
    nextAction: string;
    timeframe: string;
  };
}

export class InsightEngine {
  private rules: InsightRule[] = [];

  constructor() {
    this.initializeRules();
  }

  private initializeRules() {
    // ============= ENTRY SIGNALS =============
    this.rules.push({
      id: 'volume_explosion',
      condition: (data) => data.volumeGrowth24h > 1000,
      insight: {
        message: "Massive volume explosion detected",
        emoji: "🚀",
        action: "Enter position immediately",
        urgency: 'CRITICAL',
        category: 'ENTRY',
        confidence: 0.9
      }
    });

    this.rules.push({
      id: 'smart_money_rush',
      condition: (data) => data.smartWalletBuys >= 5 && data.smartMoneyVolume > 100000,
      insight: {
        message: "Smart money is rushing in",
        emoji: "🧠",
        action: "Follow the smart money",
        urgency: 'HIGH',
        category: 'ENTRY',
        confidence: 0.85
      }
    });

    this.rules.push({
      id: 'early_momentum',
      condition: (data) => data.age < 6 && data.alphaScore > 70,
      insight: {
        message: "Strong early momentum in new token",
        emoji: "⚡",
        action: "Consider early position",
        urgency: 'HIGH',
        category: 'ENTRY',
        confidence: 0.8
      }
    });

    // ============= EXIT SIGNALS =============
    this.rules.push({
      id: 'dev_dumping',
      condition: (data) => data.devSells24h > 50000,
      insight: {
        message: "Developer is dumping tokens",
        emoji: "🚨",
        action: "Exit immediately",
        urgency: 'CRITICAL',
        category: 'EXIT',
        confidence: 0.95
      }
    });

    this.rules.push({
      id: 'momentum_dying',
      condition: (data) => data.volumeGrowth1h < -50 && data.priceChange1h < -20,
      insight: {
        message: "Momentum is fading fast",
        emoji: "📉",
        action: "Consider exiting position",
        urgency: 'HIGH',
        category: 'EXIT',
        confidence: 0.75
      }
    });

    this.rules.push({
      id: 'whale_exodus',
      condition: (data) => data.largeSells >= 3 && data.whaleExitVolume > 200000,
      insight: {
        message: "Whales are exiting positions",
        emoji: "🐋",
        action: "Exit before the dump",
        urgency: 'HIGH',
        category: 'EXIT',
        confidence: 0.8
      }
    });

    // ============= WARNING SIGNALS =============
    this.rules.push({
      id: 'high_concentration',
      condition: (data) => data.topHolderPercent > 30,
      insight: {
        message: "Dangerous concentration risk",
        emoji: "⚠️",
        action: "Limit position size",
        urgency: 'MEDIUM',
        category: 'WARNING',
        confidence: 0.85
      }
    });

    this.rules.push({
      id: 'low_liquidity',
      condition: (data) => data.liquidityRatio < 2,
      insight: {
        message: "Exit will be difficult in pump",
        emoji: "🚪",
        action: "Plan exit strategy now",
        urgency: 'MEDIUM',
        category: 'WARNING',
        confidence: 0.8
      }
    });

    this.rules.push({
      id: 'unverified_risk',
      condition: (data) => !data.verified && data.marketCap > 1000000,
      insight: {
        message: "Large unverified contract",
        emoji: "🔍",
        action: "Extra caution required",
        urgency: 'MEDIUM',
        category: 'WARNING',
        confidence: 0.7
      }
    });

    // ============= AVOID SIGNALS =============
    this.rules.push({
      id: 'obvious_rug',
      condition: (data) => data.rugScore > 80,
      insight: {
        message: "High probability rug pull",
        emoji: "💀",
        action: "Avoid completely",
        urgency: 'CRITICAL',
        category: 'AVOID',
        confidence: 0.9
      }
    });

    this.rules.push({
      id: 'honeypot_risk',
      condition: (data) => data.sellTax > 20 || data.buyTax > 10,
      insight: {
        message: "Suspicious tax structure",
        emoji: "🍯",
        action: "Likely honeypot - avoid",
        urgency: 'HIGH',
        category: 'AVOID',
        confidence: 0.85
      }
    });

    // ============= HOLD SIGNALS =============
    this.rules.push({
      id: 'steady_growth',
      condition: (data) => data.holderGrowth24h > 100 && data.volumeGrowth24h > 50 && data.volumeGrowth24h < 500,
      insight: {
        message: "Sustainable organic growth",
        emoji: "📈",
        action: "Hold for continued gains",
        urgency: 'LOW',
        category: 'HOLD',
        confidence: 0.75
      }
    });

    this.rules.push({
      id: 'strong_fundamentals',
      condition: (data) => data.alphaScore > 60 && data.rugScore < 30 && data.liquidity > 100000,
      insight: {
        message: "Strong fundamentals intact",
        emoji: "💎",
        action: "Diamond hands recommended",
        urgency: 'LOW',
        category: 'HOLD',
        confidence: 0.8
      }
    });
  }

  // Main insight generation function
  generateTokenInsights(tokenData: any): TokenInsights {
    const matchedRules = this.rules.filter(rule => rule.condition(tokenData));
    
    // Sort by urgency and confidence
    const sortedRules = matchedRules.sort((a, b) => {
      const urgencyWeights = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const urgencyDiff = urgencyWeights[b.insight.urgency] - urgencyWeights[a.insight.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.insight.confidence - a.insight.confidence;
    });

    // Generate primary decision
    const primaryDecision = this.generatePrimaryDecision(sortedRules, tokenData);
    
    // Categorize insights
    const signals = this.generateSignals(sortedRules);
    const warnings = this.generateWarnings(sortedRules);
    const opportunities = this.generateOpportunities(sortedRules, tokenData);
    
    // Generate summary
    const summary = this.generateSummary(primaryDecision, signals, warnings, tokenData);

    return {
      primary: primaryDecision,
      signals,
      warnings,
      opportunities,
      summary
    };
  }

  private generatePrimaryDecision(rules: InsightRule[], tokenData: any) {
    if (rules.length === 0) {
      return {
        decision: "MONITOR",
        reasoning: "Insufficient signals detected",
        urgency: "LOW",
        confidence: 0.5
      };
    }

    const topRule = rules[0];
    const criticalRules = rules.filter(r => r.insight.urgency === 'CRITICAL');
    
    // Critical signals override everything
    if (criticalRules.length > 0) {
      const critical = criticalRules[0];
      return {
        decision: critical.insight.category === 'EXIT' ? "EXIT NOW" :
                 critical.insight.category === 'ENTRY' ? "STRONG BUY" :
                 critical.insight.category === 'AVOID' ? "AVOID" : "CRITICAL ACTION",
        reasoning: critical.insight.message,
        urgency: critical.insight.urgency,
        confidence: critical.insight.confidence
      };
    }

    // Generate decision based on dominant signal type
    const categories = rules.map(r => r.insight.category);
    const entrySignals = categories.filter(c => c === 'ENTRY').length;
    const exitSignals = categories.filter(c => c === 'EXIT').length;
    const avoidSignals = categories.filter(c => c === 'AVOID').length;
    const holdSignals = categories.filter(c => c === 'HOLD').length;

    if (avoidSignals > 0) {
      return {
        decision: "AVOID",
        reasoning: `${avoidSignals} risk factor${avoidSignals > 1 ? 's' : ''} detected`,
        urgency: "HIGH",
        confidence: 0.8
      };
    }

    if (exitSignals > entrySignals) {
      return {
        decision: "EXIT POSITION",
        reasoning: `${exitSignals} exit signal${exitSignals > 1 ? 's' : ''} detected`,
        urgency: "HIGH",
        confidence: 0.75
      };
    }

    if (entrySignals >= 2) {
      return {
        decision: "STRONG BUY",
        reasoning: `Multiple bullish signals confirmed`,
        urgency: "HIGH",
        confidence: 0.8
      };
    }

    if (entrySignals === 1) {
      return {
        decision: "CONSIDER ENTRY",
        reasoning: topRule.insight.message,
        urgency: topRule.insight.urgency,
        confidence: topRule.insight.confidence
      };
    }

    if (holdSignals > 0) {
      return {
        decision: "HOLD",
        reasoning: "Steady fundamentals",
        urgency: "LOW",
        confidence: 0.7
      };
    }

    return {
      decision: "MONITOR",
      reasoning: "Mixed signals - wait for clarity",
      urgency: "LOW",
      confidence: 0.6
    };
  }

  private generateSignals(rules: InsightRule[]) {
    return rules
      .filter(r => r.insight.category !== 'WARNING')
      .slice(0, 5) // Top 5 signals
      .map((rule, index) => ({
        category: rule.insight.category,
        message: rule.insight.message,
        emoji: rule.insight.emoji,
        action: rule.insight.action,
        urgency: rule.insight.urgency,
        priority: index + 1
      }));
  }

  private generateWarnings(rules: InsightRule[]) {
    return rules
      .filter(r => r.insight.category === 'WARNING' || r.insight.urgency === 'CRITICAL')
      .map(rule => ({
        type: rule.id,
        message: rule.insight.message,
        severity: rule.insight.urgency,
        action: rule.insight.action
      }));
  }

  private generateOpportunities(rules: InsightRule[], tokenData: any) {
    const opportunities = [];

    // Early entry opportunity
    if (tokenData.age < 24 && tokenData.alphaScore > 60) {
      opportunities.push({
        type: "EARLY_ENTRY",
        message: "Token is very new with high potential",
        potential: "HIGH",
        timeframe: "6-24 hours"
      });
    }

    // Dip buying opportunity
    if (tokenData.priceChange24h < -30 && tokenData.alphaScore > 50) {
      opportunities.push({
        type: "DIP_BUY",
        message: "Strong token experiencing temporary dip",
        potential: "MEDIUM",
        timeframe: "2-12 hours"
      });
    }

    // Accumulation opportunity
    if (tokenData.volumeGrowth24h > 100 && tokenData.volumeGrowth24h < 300) {
      opportunities.push({
        type: "ACCUMULATION",
        message: "Steady volume growth suggests accumulation",
        potential: "MEDIUM",
        timeframe: "1-7 days"
      });
    }

    return opportunities;
  }

  private generateSummary(primaryDecision: any, signals: any[], warnings: any[], tokenData: any) {
    const urgentSignals = signals.filter(s => s.urgency === 'CRITICAL' || s.urgency === 'HIGH').length;
    const riskLevel = warnings.length > 2 ? "HIGH" : warnings.length > 0 ? "MEDIUM" : "LOW";
    
    let tldr = "";
    if (primaryDecision.decision === "STRONG BUY") {
      tldr = `🚀 Strong buy signal - ${urgentSignals} bullish indicator${urgentSignals !== 1 ? 's' : ''}`;
    } else if (primaryDecision.decision === "EXIT NOW") {
      tldr = `🚨 Exit immediately - critical risk detected`;
    } else if (primaryDecision.decision === "AVOID") {
      tldr = `💀 High risk token - avoid completely`;
    } else if (primaryDecision.decision === "HOLD") {
      tldr = `💎 Hold position - fundamentals remain strong`;
    } else {
      tldr = `📊 Monitor closely - mixed signals present`;
    }

    let nextAction = "";
    if (primaryDecision.urgency === 'CRITICAL') {
      nextAction = "Take action within 5 minutes";
    } else if (primaryDecision.urgency === 'HIGH') {
      nextAction = "Take action within 30 minutes";
    } else if (primaryDecision.urgency === 'MEDIUM') {
      nextAction = "Review within 2 hours";
    } else {
      nextAction = "Check again in 24 hours";
    }

    return {
      tldr,
      nextAction,
      timeframe: this.getRecommendedTimeframe(primaryDecision, tokenData)
    };
  }

  private getRecommendedTimeframe(decision: any, tokenData: any) {
    if (decision.urgency === 'CRITICAL') return "Immediate (0-5 min)";
    if (tokenData.age < 6) return "Very Short (5-30 min)";
    if (tokenData.volumeGrowth24h > 500) return "Short (30 min - 2 hours)";
    if (decision.decision.includes("HOLD")) return "Long (1-7 days)";
    return "Medium (2-24 hours)";
  }

  // Specific insight generators for different data types
  generateHolderInsights(holderData: any) {
    const insights = [];
    
    if (holderData.topHolderPercent > 50) {
      insights.push({
        message: "🚨 Extreme concentration - one holder controls majority",
        action: "Avoid or use minimal position",
        risk: "CRITICAL"
      });
    } else if (holderData.topHolderPercent > 30) {
      insights.push({
        message: "⚠️ High concentration risk - large holder can dump",
        action: "Limit position size and set tight stops",
        risk: "HIGH"
      });
    } else if (holderData.topHolderPercent > 15) {
      insights.push({
        message: "⚡ Moderate concentration - monitor top holder",
        action: "Normal position sizing acceptable",
        risk: "MEDIUM"
      });
    } else {
      insights.push({
        message: "✅ Well distributed - healthy holder structure",
        action: "Good for larger positions",
        risk: "LOW"
      });
    }

    // Sniper analysis
    if (holderData.sniperPercent > 80) {
      insights.push({
        message: "🎯 Dominated by snipers - expect volatility",
        action: "Quick entry/exit strategy needed",
        risk: "HIGH"
      });
    }

    return insights;
  }

  generateVolumeInsights(volumeData: any) {
    const insights = [];

    if (volumeData.growth24h > 2000) {
      insights.push({
        message: "🚀 Explosive volume surge - viral potential",
        action: "Consider immediate entry",
        opportunity: "MASSIVE"
      });
    } else if (volumeData.growth24h > 500) {
      insights.push({
        message: "🔥 Strong volume growth - momentum building",
        action: "Enter on next dip",
        opportunity: "HIGH"
      });
    } else if (volumeData.growth24h < -50) {
      insights.push({
        message: "📉 Volume dropping fast - interest fading",
        action: "Consider exit if holding",
        risk: "HIGH"
      });
    }

    return insights;
  }

  generateLiquidityInsights(liquidityData: any) {
    const insights = [];

    if (liquidityData.ratio < 1) {
      insights.push({
        message: "🚪 Very low liquidity - exit will move price significantly",
        action: "Plan exit in small chunks",
        risk: "HIGH"
      });
    } else if (!liquidityData.isLocked && liquidityData.total > 100000) {
      insights.push({
        message: "🔓 LP not locked but substantial - moderate risk",
        action: "Monitor for rug pulls",
        risk: "MEDIUM"
      });
    } else if (liquidityData.isLocked) {
      insights.push({
        message: "🔒 Liquidity locked - reduced rug risk",
        action: "Safer for medium-term holds",
        risk: "LOW"
      });
    }

    return insights;
  }
}

export default InsightEngine;
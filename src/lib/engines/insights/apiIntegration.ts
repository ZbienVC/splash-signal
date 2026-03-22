// API Integration - Adding Insights Layer to Existing Endpoints
import { InsightEngine } from './insightEngine';
import { NextRequest, NextResponse } from 'next/server';

// ============= ENHANCED API RESPONSES WITH INSIGHTS =============

export class InsightAPI {
  private insightEngine: InsightEngine;

  constructor() {
    this.insightEngine = new InsightEngine();
  }

  // Enhanced trending tokens endpoint
  async enhancedTrendingTokens(tokens: any[]): Promise<any> {
    const enhancedTokens = await Promise.all(
      tokens.map(async (token) => {
        // Generate insights for each token
        const insights = this.insightEngine.generateTokenInsights({
          alphaScore: token.alphaScore,
          rugScore: token.rugScore,
          volumeGrowth24h: token.trending?.volumeGrowth24h || 0,
          holderGrowth24h: token.trending?.holderGrowth24h || 0,
          priceChange24h: token.trending?.priceChange24h || 0,
          topHolderPercent: token.topHolderPercent || 0,
          liquidityRatio: token.liquidityRatio || 0,
          age: token.age || 0,
          verified: token.verified || false,
          devSells24h: token.devSells24h || 0,
          smartWalletBuys: token.smartWalletBuys || 0,
          smartMoneyVolume: token.smartMoneyVolume || 0
        });

        return {
          // Original data
          ...token,
          
          // NEW: Insights layer
          insights: {
            // Primary decision
            recommendation: {
              action: insights.primary.decision,
              reasoning: insights.primary.reasoning,
              urgency: insights.primary.urgency,
              confidence: insights.primary.confidence,
              emoji: this.getActionEmoji(insights.primary.decision)
            },

            // Top 3 signals
            keySignals: insights.signals.slice(0, 3).map(signal => ({
              message: `${signal.emoji} ${signal.message}`,
              action: signal.action,
              urgency: signal.urgency,
              priority: signal.priority
            })),

            // Most important warning (if any)
            topWarning: insights.warnings.length > 0 ? {
              message: `⚠️ ${insights.warnings[0].message}`,
              action: insights.warnings[0].action,
              severity: insights.warnings[0].severity
            } : null,

            // Quick summary
            summary: {
              tldr: insights.summary.tldr,
              nextAction: insights.summary.nextAction,
              timeframe: insights.summary.timeframe
            }
          }
        };
      })
    );

    return enhancedTokens;
  }

  // Enhanced token analysis endpoint
  async enhancedTokenAnalysis(tokenData: any): Promise<any> {
    // Generate comprehensive insights
    const insights = this.insightEngine.generateTokenInsights({
      alphaScore: tokenData.analysis.alphaScore.finalScore,
      rugScore: tokenData.analysis.rugScore.finalScore,
      volumeGrowth24h: tokenData.activity.volume24h / (tokenData.activity.volume24h * 0.3) * 100, // Simplified
      holderGrowth24h: tokenData.holders.breakdown.fresh,
      priceChange24h: tokenData.activity.priceChange['24h'],
      topHolderPercent: tokenData.holders.topHolders[0]?.percentage || 0,
      liquidityRatio: tokenData.liquidity.liquidityRatio,
      age: parseFloat(tokenData.token.age.split(' ')[0]) || 0,
      verified: tokenData.token.verified,
      devSells24h: tokenData.activity.devActivity.totalDevSells24h,
      smartWalletBuys: 0, // Would be calculated from actual data
      smartMoneyVolume: 0,
      liquidity: tokenData.liquidity.totalLiquidity,
      isLocked: tokenData.liquidity.isLocked,
      sellTax: tokenData.token.sellTax,
      buyTax: tokenData.token.buyTax
    });

    // Generate specific insights for different aspects
    const holderInsights = this.insightEngine.generateHolderInsights({
      topHolderPercent: tokenData.holders.topHolders[0]?.percentage || 0,
      sniperPercent: (tokenData.holders.breakdown.snipers / tokenData.holders.total) * 100,
      whaleCount: tokenData.holders.breakdown.whales
    });

    const volumeInsights = this.insightEngine.generateVolumeInsights({
      growth24h: tokenData.activity.priceChange['24h'] // Simplified - would use actual volume growth
    });

    const liquidityInsights = this.insightEngine.generateLiquidityInsights({
      ratio: tokenData.liquidity.liquidityRatio,
      total: tokenData.liquidity.totalLiquidity,
      isLocked: tokenData.liquidity.isLocked
    });

    return {
      // Original comprehensive analysis
      ...tokenData,
      
      // NEW: Insights layer
      insights: {
        // Executive Summary
        executiveSummary: {
          decision: insights.primary.decision,
          reasoning: insights.primary.reasoning,
          confidence: `${Math.round(insights.primary.confidence * 100)}%`,
          urgency: insights.primary.urgency,
          riskLevel: this.calculateRiskLevel(tokenData.analysis.rugScore.finalScore),
          recommendedAllocation: this.getRecommendedAllocation(insights.primary),
          timeframe: insights.summary.timeframe
        },

        // Action Plan
        actionPlan: {
          primary: {
            action: insights.primary.decision,
            instructions: this.getDetailedInstructions(insights.primary),
            timing: insights.summary.nextAction,
            allocation: this.getRecommendedAllocation(insights.primary)
          },
          contingency: {
            ifPumps: this.getContingencyPlan("PUMP", insights.primary),
            ifDumps: this.getContingencyPlan("DUMP", insights.primary),
            stopLoss: this.getStopLossRecommendation(tokenData),
            takeProfit: this.getTakeProfitLevels(tokenData)
          }
        },

        // Detailed Analysis
        detailedInsights: {
          holders: holderInsights,
          volume: volumeInsights,
          liquidity: liquidityInsights,
          riskFactors: insights.warnings.map(w => w.message),
          opportunities: insights.opportunities.map(o => o.message),
          catalysts: this.identifyCatalysts(tokenData),
          redFlags: this.identifyRedFlags(tokenData)
        },

        // Human-readable explanations
        explanations: {
          whyBuy: this.generateBuyReasoning(insights),
          whyAvoid: this.generateAvoidReasoning(insights),
          timeline: this.generateTimelineExplanation(insights),
          risks: this.generateRiskExplanation(insights),
          opportunities: this.generateOpportunityExplanation(insights)
        },

        // Quick reference
        quickRef: {
          tldr: insights.summary.tldr,
          emoji: this.getActionEmoji(insights.primary.decision),
          color: this.getActionColor(insights.primary.decision),
          shortAction: this.getShortAction(insights.primary.decision),
          riskScore: `${tokenData.analysis.rugScore.finalScore}/100`,
          alphaScore: `${tokenData.analysis.alphaScore.finalScore}/100`
        }
      }
    };
  }

  // Helper methods for generating insights
  private getActionEmoji(action: string): string {
    const emojiMap = {
      'STRONG BUY': '🚀',
      'CONSIDER ENTRY': '⚡',
      'EXIT NOW': '🚨',
      'EXIT POSITION': '📉',
      'AVOID': '💀',
      'HOLD': '💎',
      'MONITOR': '👀'
    };
    return emojiMap[action as keyof typeof emojiMap] || '📊';
  }

  private getActionColor(action: string): string {
    const colorMap = {
      'STRONG BUY': '#00ff88',
      'CONSIDER ENTRY': '#00d4ff',
      'EXIT NOW': '#ff0000',
      'EXIT POSITION': '#ff4400',
      'AVOID': '#8b0000',
      'HOLD': '#4169e1',
      'MONITOR': '#888888'
    };
    return colorMap[action as keyof typeof colorMap] || '#888888';
  }

  private getShortAction(action: string): string {
    const shortMap = {
      'STRONG BUY': 'BUY',
      'CONSIDER ENTRY': 'BUY',
      'EXIT NOW': 'SELL',
      'EXIT POSITION': 'SELL',
      'AVOID': 'AVOID',
      'HOLD': 'HOLD',
      'MONITOR': 'WATCH'
    };
    return shortMap[action as keyof typeof shortMap] || 'WATCH';
  }

  private calculateRiskLevel(rugScore: number): string {
    if (rugScore >= 80) return 'CRITICAL';
    if (rugScore >= 60) return 'HIGH';
    if (rugScore >= 40) return 'MEDIUM';
    if (rugScore >= 20) return 'LOW';
    return 'VERY LOW';
  }

  private getRecommendedAllocation(decision: any): string {
    switch (decision.decision) {
      case 'STRONG BUY':
        return decision.confidence > 0.8 ? '5-10% of portfolio' : '3-5% of portfolio';
      case 'CONSIDER ENTRY':
        return '1-3% of portfolio';
      case 'EXIT NOW':
      case 'EXIT POSITION':
        return '0% - Exit immediately';
      case 'AVOID':
        return '0% - Do not buy';
      case 'HOLD':
        return 'Maintain current position';
      default:
        return '0-1% exploratory position';
    }
  }

  private getDetailedInstructions(decision: any): string {
    switch (decision.decision) {
      case 'STRONG BUY':
        return 'Enter position with market buy or limit order within 5% of current price. Consider scaling in over 2-3 transactions if position size is large.';
      case 'CONSIDER ENTRY':
        return 'Wait for next 10-15% dip for optimal entry. Set buy orders at support levels. Monitor for confirmation of momentum.';
      case 'EXIT NOW':
        return 'Sell immediately with market orders. Split into 2-3 transactions to minimize slippage if position is large.';
      case 'EXIT POSITION':
        return 'Exit over next 30-60 minutes. Use limit orders slightly below market price for better fills.';
      case 'AVOID':
        return 'Do not enter any position. If already holding, exit on next pump. Too many red flags present.';
      case 'HOLD':
        return 'Maintain current position. Monitor daily for changes in fundamentals. Consider adding on significant dips.';
      default:
        return 'Watch for clearer signals. Paper trade for now to understand token behavior.';
    }
  }

  private getContingencyPlan(scenario: 'PUMP' | 'DUMP', decision: any): string {
    if (scenario === 'PUMP') {
      if (decision.decision.includes('BUY')) {
        return 'Take partial profits at 2x, 5x, 10x levels. Let rest ride with trailing stop.';
      }
      return 'Use pump to exit if holding. Avoid FOMO entries during parabolic moves.';
    } else { // DUMP
      if (decision.decision.includes('BUY')) {
        return 'Add to position if fundamentals remain intact and dump is >40%. Otherwise respect stops.';
      }
      return 'Confirm exit strategy working. Avoid trying to catch falling knife.';
    }
  }

  private getStopLossRecommendation(tokenData: any): string {
    const rugScore = tokenData.analysis.rugScore.finalScore;
    const volatility = Math.abs(tokenData.activity.priceChange['24h']);
    
    if (rugScore > 70) return '10-15% (high rug risk)';
    if (volatility > 100) return '20-30% (high volatility)';
    if (volatility > 50) return '15-25% (medium volatility)';
    return '20-30% (normal volatility)';
  }

  private getTakeProfitLevels(tokenData: any): string[] {
    const alphaScore = tokenData.analysis.alphaScore.finalScore;
    
    if (alphaScore >= 90) {
      return ['2x (25%)', '5x (25%)', '10x (25%)', '20x+ (25%)'];
    } else if (alphaScore >= 70) {
      return ['2x (33%)', '5x (33%)', '10x (34%)'];
    } else if (alphaScore >= 50) {
      return ['1.5x (50%)', '3x (50%)'];
    } else {
      return ['1.2x (100%) - quick flip'];
    }
  }

  private identifyCatalysts(tokenData: any): string[] {
    const catalysts = [];
    
    if (tokenData.token.age.includes('hours') && parseFloat(tokenData.token.age) < 24) {
      catalysts.push('Very new token - viral potential');
    }
    
    if (tokenData.activity.buyVsSell.ratio > 2) {
      catalysts.push('Strong buy pressure - momentum building');
    }
    
    if (tokenData.holders.breakdown.fresh > 100) {
      catalysts.push('Rapid adoption - new holders flooding in');
    }
    
    return catalysts;
  }

  private identifyRedFlags(tokenData: any): string[] {
    const redFlags = [];
    
    if (!tokenData.token.verified) {
      redFlags.push('Unverified contract');
    }
    
    if (!tokenData.token.ownershipRenounced) {
      redFlags.push('Ownership not renounced');
    }
    
    if (!tokenData.liquidity.isLocked) {
      redFlags.push('Liquidity not locked');
    }
    
    if (tokenData.activity.devActivity.totalDevSells24h > 10000) {
      redFlags.push('Recent dev sells detected');
    }
    
    if (tokenData.holders.topHolders[0]?.percentage > 30) {
      redFlags.push('High concentration risk');
    }
    
    return redFlags;
  }

  private generateBuyReasoning(insights: any): string {
    const reasons = insights.signals
      .filter((s: any) => s.category === 'ENTRY')
      .map((s: any) => s.message)
      .slice(0, 3);
    
    return reasons.length > 0 
      ? `Strong buy signals: ${reasons.join(', ')}`
      : 'Limited buy signals present';
  }

  private generateAvoidReasoning(insights: any): string {
    const warnings = insights.warnings.map((w: any) => w.message).slice(0, 3);
    
    return warnings.length > 0
      ? `Risk factors: ${warnings.join(', ')}`
      : 'No major risk factors identified';
  }

  private generateTimelineExplanation(insights: any): string {
    const urgency = insights.primary.urgency;
    
    switch (urgency) {
      case 'CRITICAL':
        return 'Time-sensitive opportunity - market moves fast at these levels';
      case 'HIGH':
        return 'Act soon - momentum building but window may close quickly';
      case 'MEDIUM':
        return 'Good setup but not urgent - plan entry/exit carefully';
      case 'LOW':
        return 'Long-term play - can afford to be patient and strategic';
      default:
        return 'Neutral timing - wait for better setup';
    }
  }

  private generateRiskExplanation(insights: any): string {
    const highRiskSignals = insights.warnings.filter((w: any) => 
      w.severity === 'HIGH' || w.severity === 'CRITICAL'
    );
    
    if (highRiskSignals.length >= 2) {
      return 'Multiple high-risk factors present - approach with extreme caution';
    } else if (highRiskSignals.length === 1) {
      return 'Elevated risk detected - limit position size and monitor closely';
    } else {
      return 'Normal risk levels - standard risk management applies';
    }
  }

  private generateOpportunityExplanation(insights: any): string {
    const opportunities = insights.opportunities;
    
    if (opportunities.length === 0) {
      return 'Limited upside opportunity identified at current levels';
    }
    
    const highPotential = opportunities.filter((o: any) => o.potential === 'HIGH');
    
    if (highPotential.length > 0) {
      return `High opportunity potential: ${highPotential[0].message}`;
    }
    
    return `Moderate opportunity: ${opportunities[0].message}`;
  }
}

// ============= EXAMPLE API RESPONSE WITH INSIGHTS =============
export const EXAMPLE_ENHANCED_RESPONSE = {
  // Original token data
  address: "0x1234567890abcdef1234567890abcdef12345678",
  symbol: "PEPAI",
  name: "Pepe AI",
  alphaScore: 92,
  rugScore: 23,
  price: 0.000045,
  volume24h: 1250000,

  // NEW: Insights layer
  insights: {
    executiveSummary: {
      decision: "STRONG BUY",
      reasoning: "Explosive volume surge with smart money accumulation",
      confidence: "87%",
      urgency: "CRITICAL",
      riskLevel: "LOW",
      recommendedAllocation: "5-10% of portfolio",
      timeframe: "Hold 2-7 days for 5-20x potential"
    },

    actionPlan: {
      primary: {
        action: "STRONG BUY",
        instructions: "Enter position with market buy within 5% of current price",
        timing: "Within next 5 minutes",
        allocation: "5-10% of portfolio"
      },
      contingency: {
        ifPumps: "Take partial profits at 2x, 5x, 10x levels",
        ifDumps: "Add to position if dump is >40% and fundamentals intact",
        stopLoss: "15-20% (normal volatility)",
        takeProfit: "2x (25%), 5x (25%), 10x (25%), 20x+ (25%)"
      }
    },

    quickRef: {
      tldr: "🚀 Strong buy signal - explosive volume with smart money inflow",
      emoji: "🚀",
      color: "#00ff88",
      shortAction: "BUY",
      riskScore: "23/100",
      alphaScore: "92/100"
    }
  }
};

export default InsightAPI;
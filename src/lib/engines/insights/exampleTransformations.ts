// Example Transformations - Raw Data → Actionable Insights

export const TRANSFORMATION_EXAMPLES = {

  // ============= HOLDER ANALYSIS TRANSFORMATIONS =============
  holderAnalysis: {
    rawData: {
      topHolderPercent: 45,
      totalHolders: 1250,
      distribution: {
        whales: 3,
        snipers: 180,
        normal: 1067
      }
    },
    
    // BEFORE: Raw data output
    before: {
      topHolder: "45%",
      whales: 3,
      snipers: 180,
      distribution: "3 whales, 180 snipers, 1067 normal"
    },

    // AFTER: Actionable insights
    after: {
      primary: "⚠️ Dangerous concentration - top holder can crash price",
      action: "🎯 Limit position to 1-2% of portfolio max",
      warning: "🚨 Single wallet dump risk - set 15% stop loss",
      context: "With 45% concentration, this token can move 50%+ instantly"
    }
  },

  // ============= VOLUME ANALYSIS TRANSFORMATIONS =============
  volumeAnalysis: {
    rawData: {
      volume24h: 1250000,
      volumeGrowth24h: 1850, // 1850% growth
      volumeGrowth1h: 45,
      previousVolume: 67500
    },

    // BEFORE: Raw metrics
    before: {
      volume: "$1,250,000",
      growth24h: "+1850%",
      growth1h: "+45%"
    },

    // AFTER: Strategic insights  
    after: {
      primary: "🚀 EXPLOSIVE VOLUME - Viral momentum detected",
      action: "⚡ Enter position NOW - peak FOMO incoming",
      urgency: "🔥 CRITICAL: Act within 5 minutes",
      context: "1850% volume spike = potential 10-50x move incoming"
    }
  },

  // ============= DEV ACTIVITY TRANSFORMATIONS =============
  devActivity: {
    rawData: {
      devSells24h: 125000, // $125k in dev sells
      devHolding: 8.5, // 8.5% remaining
      recentSells: [
        { amount: 50000, time: "10 minutes ago" },
        { amount: 45000, time: "25 minutes ago" },
        { amount: 30000, time: "1 hour ago" }
      ]
    },

    // BEFORE: Transaction data
    before: {
      devSells: "$125,000",
      devHolding: "8.5%",
      recentActivity: "3 sells in last hour"
    },

    // AFTER: Clear warnings
    after: {
      primary: "🚨 DEVELOPER DUMPING - Exit immediately",
      action: "💰 SELL NOW - Dev is cashing out",
      urgency: "🔴 EMERGENCY: Exit within 2 minutes",
      context: "$125k dev sells = likely coordinated dump incoming"
    }
  },

  // ============= PRICE MOMENTUM TRANSFORMATIONS =============
  priceAction: {
    rawData: {
      priceChange5m: 45.2,
      priceChange1h: 125.8,
      priceChange24h: 185.7,
      volume5m: 450000,
      buyPressure: 0.75 // 75% buys vs sells
    },

    // BEFORE: Price statistics
    before: {
      "5min": "+45.2%",
      "1hour": "+125.8%", 
      "24hour": "+185.7%",
      buyRatio: "75%"
    },

    // AFTER: Momentum insights
    after: {
      primary: "🚀 PARABOLIC MOVE - Momentum accelerating",
      action: "🎯 Enter on next 10% dip for optimal entry",
      timing: "⏰ Peak likely in 30-60 minutes",
      context: "185% daily gain with acceleration = classic pump setup"
    }
  },

  // ============= LIQUIDITY ANALYSIS TRANSFORMATIONS =============
  liquidityAnalysis: {
    rawData: {
      totalLiquidity: 85000,
      liquidityRatio: 1.8, // 1.8% of market cap
      isLocked: false,
      marketCap: 4700000,
      exitDifficulty: "HIGH"
    },

    // BEFORE: Liquidity metrics
    before: {
      liquidity: "$85,000",
      ratio: "1.8%",
      locked: false,
      difficulty: "HIGH"
    },

    // AFTER: Exit strategy
    after: {
      primary: "🚪 LOW LIQUIDITY TRAP - Exit will be difficult",
      action: "📉 Sell in 3-5 chunks max to avoid slippage",
      warning: "⚠️ Your sell might drop price 10-20%",
      context: "Only $85k liquidity for $4.7M cap = thin orderbook"
    }
  },

  // ============= SMART MONEY TRANSFORMATIONS =============
  smartMoneyActivity: {
    rawData: {
      smartWalletBuys: 8,
      smartMoneyVolume: 380000,
      averageSmartBuySize: 47500,
      smartWalletConfidence: 0.85
    },

    // BEFORE: Smart money metrics
    before: {
      smartBuys: "8 wallets",
      volume: "$380,000",
      avgSize: "$47,500"
    },

    // AFTER: Follow-the-leader insights
    after: {
      primary: "🧠 SMART MONEY ACCUMULATING - Follow the pros",
      action: "💡 Match their position sizing - $40-50k range",
      confidence: "✅ High confidence signal - 85% accuracy",
      context: "8 profitable wallets buying = institutional interest"
    }
  },

  // ============= RUG RISK TRANSFORMATIONS =============
  rugRisk: {
    rawData: {
      rugScore: 75,
      verified: false,
      ownershipRenounced: false,
      lpLocked: false,
      suspiciousFlags: ["UNVERIFIED", "OWNERSHIP_ACTIVE", "NO_LP_LOCK"]
    },

    // BEFORE: Risk metrics
    before: {
      rugScore: "75/100",
      verified: false,
      ownership: "Not renounced",
      flags: 3
    },

    // AFTER: Clear warnings
    after: {
      primary: "💀 HIGH RUG PROBABILITY - Avoid completely",
      action: "🚫 DO NOT BUY - Multiple red flags",
      reasoning: "Unverified + Active ownership + Unlocked LP = Classic rug setup",
      alternative: "Wait for similar token with better fundamentals"
    }
  },

  // ============= ALPHA SCORE TRANSFORMATIONS =============
  alphaSignal: {
    rawData: {
      alphaScore: 92,
      components: {
        volumeGrowth: 95,
        narrativeStrength: 88,
        smartMoney: 90,
        holderGrowth: 85
      },
      confidence: 0.87
    },

    // BEFORE: Score breakdown
    before: {
      alphaScore: "92/100",
      volume: "95/100",
      narrative: "88/100",
      smartMoney: "90/100"
    },

    // AFTER: Investment thesis
    after: {
      primary: "🎯 EXCEPTIONAL ALPHA - Rare high-conviction setup",
      action: "💰 STRONG BUY - Allocate 5-10% portfolio",
      reasoning: "All 4 alpha factors firing - volume+narrative+smart money+growth",
      timeline: "Hold 2-7 days for 5-20x potential"
    }
  }
};

// ============= INSIGHT COMBINATION EXAMPLES =============
export const COMBINED_INSIGHTS = {
  
  // Scenario 1: Perfect Setup
  perfectSetup: {
    signals: [
      "🚀 Explosive volume surge detected",
      "🧠 Smart money rushing in", 
      "✅ Healthy holder distribution",
      "🔒 Liquidity locked safely"
    ],
    decision: {
      action: "🎯 STRONG BUY",
      reasoning: "All systems green - rare high-conviction setup",
      allocation: "5-10% of portfolio",
      timeline: "Hold 2-7 days for 5-20x potential",
      stopLoss: "Set at -25% (below major support)"
    }
  },

  // Scenario 2: Mixed Signals
  mixedSignals: {
    signals: [
      "🚀 Strong volume growth detected",
      "⚠️ High concentration risk present",
      "🔓 LP not locked - rug risk",
      "💡 Early momentum building"
    ],
    decision: {
      action: "⚡ CAUTIOUS ENTRY",
      reasoning: "Good momentum but elevated risks",
      allocation: "1-2% of portfolio max",
      timeline: "Quick flip - exit within 2-6 hours",
      stopLoss: "Tight stop at -15% due to risks"
    }
  },

  // Scenario 3: Exit Signal
  exitNow: {
    signals: [
      "🚨 Developer dumping detected",
      "📉 Volume dropping rapidly",
      "🐋 Whales selling positions",
      "⚠️ Momentum broken"
    ],
    decision: {
      action: "🚨 EXIT IMMEDIATELY",
      reasoning: "Multiple bearish signals confirmed",
      method: "Market sell in 2-3 chunks",
      urgency: "Within 5 minutes",
      expected: "Price likely to drop 30-60%"
    }
  }
};

// ============= MESSAGE TEMPLATES =============
export const MESSAGE_TEMPLATES = {
  
  // Entry messages
  strongBuy: "🚀 **STRONG BUY SIGNAL** 🚀\n{reasoning}\n\n💰 **Action:** {action}\n⏰ **Urgency:** {urgency}\n🎯 **Target:** {target}",
  
  entry: "⚡ **ENTRY OPPORTUNITY** ⚡\n{reasoning}\n\n🎯 **Action:** {action}\n⚠️ **Risk Level:** {risk}\n📈 **Potential:** {potential}",

  // Exit messages  
  exitCritical: "🚨 **EXIT IMMEDIATELY** 🚨\n{reasoning}\n\n💰 **Action:** Sell now\n⏰ **Urgency:** Within 5 minutes\n📉 **Risk:** Major dump likely",

  exitHigh: "📉 **CONSIDER EXIT** 📉\n{reasoning}\n\n🎯 **Action:** {action}\n⏰ **Timeframe:** {timeframe}",

  // Warning messages
  warning: "⚠️ **WARNING** ⚠️\n{message}\n\n🎯 **Action:** {action}\n🛡️ **Protection:** {protection}",

  // Hold messages
  hold: "💎 **DIAMOND HANDS** 💎\n{reasoning}\n\n🎯 **Action:** Continue holding\n📈 **Outlook:** {outlook}\n⏰ **Review:** {nextCheck}"
};

// ============= INSIGHT PRIORITY SYSTEM =============
export const INSIGHT_PRIORITIES = {
  CRITICAL: {
    level: 1,
    color: "#8B0000",
    emoji: "🚨",
    urgency: "IMMEDIATE",
    timeframe: "0-5 minutes"
  },
  HIGH: {
    level: 2, 
    color: "#FF4500",
    emoji: "🔥",
    urgency: "URGENT", 
    timeframe: "5-30 minutes"
  },
  MEDIUM: {
    level: 3,
    color: "#FFA500", 
    emoji: "⚠️",
    urgency: "SOON",
    timeframe: "30 minutes - 2 hours"
  },
  LOW: {
    level: 4,
    color: "#32CD32",
    emoji: "💡",
    urgency: "WHEN_CONVENIENT", 
    timeframe: "2-24 hours"
  }
};

// ============= CONTEXT BUILDERS =============
export class InsightContextBuilder {
  
  static buildVolumeContext(volumeData: any): string {
    if (volumeData.growth24h > 1000) {
      return `${volumeData.growth24h}% volume explosion signals viral breakout potential`;
    }
    if (volumeData.growth24h > 300) {
      return `${volumeData.growth24h}% volume surge indicates strong momentum building`;  
    }
    if (volumeData.growth24h < -50) {
      return `${Math.abs(volumeData.growth24h)}% volume drop signals momentum dying`;
    }
    return `Volume growth of ${volumeData.growth24h}% shows moderate interest`;
  }

  static buildHolderContext(holderData: any): string {
    if (holderData.topHolderPercent > 40) {
      return `${holderData.topHolderPercent}% concentration means single wallet controls price`;
    }
    if (holderData.sniperPercent > 70) {
      return `${holderData.sniperPercent}% sniper dominance = high volatility expected`;
    }
    if (holderData.distribution.whales > 5) {
      return `${holderData.distribution.whales} whale wallets can coordinate dumps`;
    }
    return `Healthy distribution with ${holderData.totalHolders} holders`;
  }

  static buildLiquidityContext(liquidityData: any): string {
    const ratio = liquidityData.ratio;
    if (ratio < 2) {
      return `Only ${ratio}% liquidity ratio = difficult exits during pumps`;
    }
    if (!liquidityData.isLocked && liquidityData.total > 50000) {
      return `$${liquidityData.total.toLocaleString()} unlocked LP = rug risk present`;
    }
    if (liquidityData.isLocked) {
      return `Locked LP reduces rug risk significantly`;
    }
    return `Adequate liquidity for normal trading`;
  }

  static buildTimingContext(urgency: string): string {
    switch (urgency) {
      case 'CRITICAL':
        return "Market moves fast - hesitation costs money";
      case 'HIGH': 
        return "Window of opportunity closing soon";
      case 'MEDIUM':
        return "Good setup but not time-sensitive";
      case 'LOW':
        return "Patient approach recommended";
      default:
        return "Monitor for better entry/exit timing";
    }
  }
}

export default TRANSFORMATION_EXAMPLES;
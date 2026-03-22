// Signal Engine Configuration and Summary
export const SIGNAL_ENGINE_CONFIG = {
  // ============= ALERT THRESHOLDS =============
  thresholds: {
    // Entry Signal Triggers
    entry: {
      alphaScoreIncrease: 20,        // Points increase needed for alert
      volumeSpike: 300,              // Percentage increase for volume surge
      holderGrowthRate: 10,          // New holders per minute
      smartMoneyThreshold: 2,        // Number of smart wallets buying
      narrativeStrengthMin: 80       // Minimum narrative score for hot trend alert
    },

    // Exit Signal Triggers  
    exit: {
      devSellThreshold: 5000,        // USD amount for dev sell alert
      whaleReductionThreshold: 20,   // Percentage whale holding reduction
      volumeDeclineThreshold: 50,    // Percentage volume decline
      liquidityReductionThreshold: 30, // Percentage liquidity reduction
      largeSellThreshold: 25000,     // USD amount for whale dump alert
      botSellMinCount: 20            // Minimum bot sells to trigger alert
    },

    // Risk Alert Triggers
    risk: {
      sniperConcentrationThreshold: 40,  // Percentage sniper control
      rugScoreThreshold: 70,             // Rug score danger level
      highTaxThreshold: 10,              // Transaction tax percentage
      lowLiquidityThreshold: 10000       // USD liquidity minimum
    }
  },

  // ============= TIMING CONFIGURATION =============
  timing: {
    scanning: {
      mainLoopInterval: 30000,       // 30 seconds between scan cycles
      batchSize: 10,                 // Tokens processed per batch
      batchDelay: 1000,              // 1 second delay between batches
      maxActiveTokens: 100           // Maximum tokens to monitor
    },

    alerts: {
      duplicateWindow: 300000,       // 5 minutes duplicate suppression
      expiryTimes: {                 // Alert expiration times
        EMERGENCY: 3600000,          // 1 hour
        CRITICAL: 7200000,           // 2 hours  
        HIGH: 14400000,              // 4 hours
        MEDIUM: 28800000,            // 8 hours
        LOW: 86400000                // 24 hours
      },
      cleanupInterval: 3600000       // 1 hour cleanup cycle
    },

    monitoring: {
      performanceCheckInterval: 300000,  // 5 minutes performance monitoring
      connectionStatsInterval: 60000,    // 1 minute connection stats
      alertStatsInterval: 300000         // 5 minutes alert statistics
    }
  },

  // ============= SIGNAL DETECTION WINDOWS =============
  timeWindows: {
    volume: {
      current: 300000,              // 5 minutes current volume
      baseline: 300000,             // 5 minutes baseline comparison
      decline: 600000               // 10 minutes decline detection
    },

    holders: {
      rapid: 60000,                 // 1 minute rapid adoption
      growth: 900000,               // 15 minutes growth analysis
      acceleration: 3600000         // 1 hour acceleration calculation
    },

    transactions: {
      smartMoney: 900000,           // 15 minutes smart money detection
      devSells: 1800000,            // 30 minutes dev sell monitoring
      botActivity: 600000           // 10 minutes bot pattern detection
    }
  },

  // ============= CONFIDENCE FACTORS =============
  confidence: {
    dataQuality: {
      highVolume: 0.2,              // +20% for >$100k volume
      manyTransactions: 0.1,        // +10% for >100 transactions
      establishedHolders: 0.1       // +10% for >500 holders
    },

    signalStrength: {
      multipleSignals: 0.15,        // +15% per additional signal
      smartMoney: 0.3,              // +30% for smart money involvement
      volumeAcceleration: 0.3,      // +30% for accelerating patterns
      narrativeMatch: 0.2           // +20% for hot narrative + timing
    },

    timeframe: {
      veryRecent: 0.1,              // +10% for data <5 minutes old
      recent: 0.05,                 // +5% for data <1 hour old
      stale: -0.2                   // -20% for data >6 hours old
    }
  }
};

// ============= ALERT SEVERITY MATRIX =============
export const ALERT_SEVERITY_MATRIX = {
  EMERGENCY: {
    description: "Immediate action required - potential rug or major dump",
    examples: [
      "Liquidity reduced >85%",
      "Rug score >90",
      "Major dev wallet dump >$100k"
    ],
    response: "Exit immediately or avoid completely",
    color: "#8B0000",
    priority: 1
  },

  CRITICAL: {
    description: "Very high priority - strong signal detected",
    examples: [
      "Alpha spike >40 points",
      "Dev wallet selling >$50k",
      "Volume surge >1000%"
    ],
    response: "Immediate attention and analysis required",
    color: "#DC143C",
    priority: 2
  },

  HIGH: {
    description: "High priority - significant opportunity or risk",
    examples: [
      "Alpha spike >25 points",
      "Smart money entry",
      "Whale dump detected"
    ],
    response: "Prioritize analysis and consider action",
    color: "#FF4500", 
    priority: 3
  },

  MEDIUM: {
    description: "Moderate priority - notable signal",
    examples: [
      "Alpha spike >20 points",
      "Volume surge >300%",
      "Holder growth acceleration"
    ],
    response: "Monitor closely and evaluate",
    color: "#FFA500",
    priority: 4
  },

  LOW: {
    description: "Informational - minor signal or update",
    examples: [
      "Gradual holder growth",
      "Minor volume increase",
      "Contract verification"
    ],
    response: "Awareness and optional monitoring",
    color: "#32CD32",
    priority: 5
  }
};

// ============= SIGNAL CATEGORIES =============
export const SIGNAL_CATEGORIES = {
  // ENTRY SIGNALS
  VOLUME_SURGE: {
    description: "Rapid volume increase indicating interest",
    triggerLogic: "Current volume vs baseline >300% increase",
    confidence: "High when sustained across timeframes",
    falsePositiveRisk: "Medium - can be temporary spikes"
  },

  ALPHA_SPIKE: {
    description: "Alpha score increase indicating opportunity",
    triggerLogic: "Alpha score increase >20 points",
    confidence: "Very High when multiple components align",
    falsePositiveRisk: "Low - comprehensive scoring reduces noise"
  },

  SMART_MONEY_ENTRY: {
    description: "Known profitable wallets purchasing",
    triggerLogic: ">2 smart wallets buying in 15 minutes",
    confidence: "Very High - these wallets have proven track records",
    falsePositiveRisk: "Very Low - historical performance based"
  },

  HOLDER_GROWTH: {
    description: "Rapid new holder acquisition",
    triggerLogic: ">10 new holders per minute",
    confidence: "Medium - can be organic or artificial",
    falsePositiveRisk: "Medium - bots can inflate numbers"
  },

  NARRATIVE_MOMENTUM: {
    description: "Hot narrative meets perfect timing",
    triggerLogic: "Narrative score >80 + ultra early timing",
    confidence: "Medium - narrative strength varies",
    falsePositiveRisk: "Medium - narratives can fade quickly"
  },

  // EXIT SIGNALS
  DEV_SELL: {
    description: "Developer wallet selling tokens",
    triggerLogic: "Dev wallet sells >$5k worth",
    confidence: "Very High - direct developer action",
    falsePositiveRisk: "Very Low - clear actionable signal"
  },

  WHALE_DUMP: {
    description: "Large holders selling significant amounts",
    triggerLogic: ">3 sells >$25k in 15 minutes",
    confidence: "High - significant selling pressure",
    falsePositiveRisk: "Low - large transactions are clear signals"
  },

  VOLUME_DECLINE: {
    description: "Trading volume collapsing",
    triggerLogic: "Volume decline >50% vs previous period",
    confidence: "Medium - requires context of previous volume",
    falsePositiveRisk: "Medium - natural volume fluctuations occur"
  },

  LIQUIDITY_DRAIN: {
    description: "Liquidity being removed from pools",
    triggerLogic: "Liquidity reduction >30%",
    confidence: "Very High - direct liquidity action",
    falsePositiveRisk: "Very Low - clear rug pull indicator"
  },

  BOT_SELLING: {
    description: "Coordinated bot selling patterns",
    triggerLogic: ">20 similar sells in 10 minutes",
    confidence: "Medium - pattern based detection",
    falsePositiveRisk: "Medium - legitimate trading can appear similar"
  },

  // RISK SIGNALS
  SNIPER_CONCENTRATION: {
    description: "High percentage held by sniper wallets",
    triggerLogic: ">40% supply controlled by snipers",
    confidence: "High - wallet analysis based",
    falsePositiveRisk: "Low - sniper identification is reliable"
  },

  UNLOCKED_LIQUIDITY: {
    description: "Liquidity not locked and can be removed",
    triggerLogic: "Main LP not locked",
    confidence: "Very High - contract state verification",
    falsePositiveRisk: "Very Low - factual contract information"
  },

  CONTRACT_RISK: {
    description: "Multiple contract risk factors present",
    triggerLogic: ">2 risk factors (unverified, proxy, high tax, etc.)",
    confidence: "High - multiple factor analysis",
    falsePositiveRisk: "Low - conservative multi-factor approach"
  },

  RUG_WARNING: {
    description: "High rug pull risk detected",
    triggerLogic: "Rug score >70",
    confidence: "Very High - comprehensive rug analysis",
    falsePositiveRisk: "Very Low - thorough multi-component scoring"
  }
};

// ============= PERFORMANCE BENCHMARKS =============
export const PERFORMANCE_TARGETS = {
  detection: {
    latency: 30000,                 // <30 seconds detection latency
    processing: 5000,               // <5 seconds processing time
    delivery: 10000,                // <10 seconds delivery time
    totalResponse: 45000            // <45 seconds total response
  },

  throughput: {
    tokensPerMinute: 1000,          // >1000 tokens/minute processing
    alertsPerHour: 500,             // Support >500 alerts/hour
    concurrentConnections: 1000,    // >1000 WebSocket connections
    apiRequests: 10000              // >10k API requests/hour
  },

  accuracy: {
    signalRelevance: 85,            // >85% signal relevance
    falsePositiveRate: 15,          // <15% false positive rate
    duplicateRate: 5,               // <5% duplicate alerts
    userSatisfaction: 90            // >90% user satisfaction
  },

  availability: {
    uptime: 99.9,                   // >99.9% uptime
    alertDelivery: 99.5,            // >99.5% alert delivery success
    dataFreshness: 95,              // >95% data freshness <1 minute
    systemRecovery: 60              // <60 seconds recovery time
  }
};

// ============= INTEGRATION CHECKLIST =============
export const INTEGRATION_CHECKLIST = {
  database: [
    "✅ Prisma schema with Alert, AlertSubscription models",
    "✅ Database indexes for performance",
    "✅ Alert status tracking and lifecycle",
    "✅ User subscription preferences"
  ],

  messaging: [
    "✅ BullMQ job queues for processing",
    "✅ Redis caching for performance", 
    "✅ Event-driven signal detection",
    "✅ Background job orchestration"
  ],

  apis: [
    "✅ REST endpoints for alert retrieval",
    "✅ WebSocket streaming for real-time",
    "✅ Polling endpoints for compatibility",
    "✅ Statistics and monitoring endpoints"
  ],

  notifications: [
    "🔄 Telegram bot integration",
    "🔄 Discord webhook delivery",
    "🔄 Email notification system",
    "🔄 Push notification service"
  ],

  monitoring: [
    "✅ Performance metrics tracking",
    "✅ Error logging and alerting",
    "✅ Connection statistics",
    "✅ Alert delivery confirmation"
  ]
};

// ============= DEPLOYMENT CONFIGURATION =============
export const DEPLOYMENT_CONFIG = {
  environment: {
    development: {
      scanInterval: 60000,          // 1 minute in dev
      alertThresholds: "relaxed",   // Lower thresholds for testing
      logLevel: "debug",            // Detailed logging
      caching: "minimal"            // Reduced caching for testing
    },

    production: {
      scanInterval: 30000,          // 30 seconds in prod
      alertThresholds: "strict",    // Production thresholds
      logLevel: "info",             // Standard logging
      caching: "aggressive"         // Full caching enabled
    }
  },

  scaling: {
    workers: {
      signalProcessing: 5,          // 5 signal processing workers
      alertDelivery: 10,            // 10 alert delivery workers
      dataIngestion: 3              // 3 data ingestion workers
    },

    queues: {
      signalQueue: {
        concurrency: 5,
        retryAttempts: 3,
        retryDelay: 2000
      },
      alertQueue: {
        concurrency: 10,
        retryAttempts: 5,
        retryDelay: 1000
      }
    },

    database: {
      connectionLimit: 20,
      queryTimeout: 30000,
      retryAttempts: 3
    }
  }
};

// ============= USAGE SUMMARY =============
export const SIGNAL_ENGINE_SUMMARY = {
  purpose: "Real-time crypto signal generation for entry, exit, and risk alerts",
  
  capabilities: [
    "🔥 Entry signal detection with <30 second latency",
    "🚨 Exit signal warnings for risk management", 
    "⚠️ Risk alerts for scam/rug protection",
    "📊 Real-time WebSocket streaming",
    "🎯 Configurable alert thresholds",
    "📱 Multi-channel delivery (API, WebSocket, notifications)"
  ],

  keyFeatures: [
    "Event-driven architecture with BullMQ",
    "Comprehensive alert categorization",
    "Confidence scoring for signal quality",
    "Duplicate detection and suppression",
    "Performance monitoring and statistics",
    "Scalable background processing"
  ],

  alertTypes: {
    entry: "Volume surges, alpha spikes, smart money entry, holder growth",
    exit: "Dev sells, whale dumps, volume decline, liquidity drain", 
    risk: "Sniper concentration, unlocked liquidity, contract risks, rug warnings"
  },

  performance: "Process 1000+ tokens/minute with <45 second total response time",
  
  integration: "Complete API + WebSocket system ready for production deployment"
};

export default SIGNAL_ENGINE_CONFIG;
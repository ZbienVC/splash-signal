// Signal Engine - Example Alert Outputs and Processing Flow
import { SignalEngine } from './signalEngine';
import { AlertType, AlertSeverity, AlertCategory } from '@prisma/client';

// ============= ENTRY SIGNAL EXAMPLES =============

export const ENTRY_SIGNAL_EXAMPLES = {
  alphaSpike: {
    "id": "alert_001",
    "type": "ENTRY_SIGNAL",
    "severity": "CRITICAL",
    "category": "ALPHA_SPIKE",
    "tokenAddress": "0x1234...abcd",
    "tokenSymbol": "PEPAI",
    "tokenName": "Pepe AI",
    "title": "🔥 Alpha Score Spike Detected",
    "message": "Alpha score increased by 35 points to 88/100",
    "data": {
      "previousScore": 53,
      "currentScore": 88,
      "increase": 35,
      "confidence": 0.82,
      "signals": ["VOLUME_SURGE_5M", "SMART_MONEY_ENTRY", "HOT_NARRATIVE"]
    },
    "triggeredBy": "alpha_spike_detector",
    "confidence": 0.82,
    "timestamp": "2024-03-21T21:00:15.123Z",
    "status": "ACTIVE",
    "priority": "IMMEDIATE"
  },

  volumeExplosion: {
    "id": "alert_002", 
    "type": "ENTRY_SIGNAL",
    "severity": "HIGH",
    "category": "VOLUME_SURGE",
    "tokenAddress": "0x5678...efgh",
    "tokenSymbol": "TRUMP47",
    "tokenName": "Trump 2024",
    "title": "🚀 Volume Explosion",
    "message": "Instant volume surge: $450k in 5 minutes",
    "data": {
      "volume": 450000,
      "timeframe": "5m",
      "baseline": 0,
      "isNewToken": true
    },
    "triggeredBy": "volume_surge_detector",
    "confidence": 0.8,
    "timestamp": "2024-03-21T21:01:32.456Z",
    "status": "ACTIVE",
    "priority": "HIGH"
  },

  smartMoneyAlert: {
    "id": "alert_003",
    "type": "ENTRY_SIGNAL", 
    "severity": "HIGH",
    "category": "SMART_MONEY_ENTRY",
    "tokenAddress": "0x9abc...def0",
    "tokenSymbol": "AIDOG",
    "tokenName": "AI Dog Coin",
    "title": "🧠 Smart Money Alert",
    "message": "4 smart wallets buying ($125k total)",
    "data": {
      "smartWalletCount": 4,
      "totalValue": 125000,
      "wallets": [
        {
          "address": "0xabc...123",
          "value": 45000,
          "timestamp": "2024-03-21T21:00:10.000Z"
        },
        {
          "address": "0xdef...456", 
          "value": 32000,
          "timestamp": "2024-03-21T21:00:25.000Z"
        }
      ]
    },
    "triggeredBy": "smart_money_detector",
    "confidence": 0.85,
    "timestamp": "2024-03-21T21:00:45.789Z",
    "status": "ACTIVE",
    "priority": "HIGH"
  },

  rapidAdoption: {
    "id": "alert_004",
    "type": "ENTRY_SIGNAL",
    "severity": "MEDIUM",
    "category": "HOLDER_GROWTH", 
    "tokenAddress": "0x1122...3344",
    "tokenSymbol": "MEMEV2",
    "tokenName": "Meme Version 2",
    "title": "👥 Rapid Adoption",
    "message": "25 new holders in last minute",
    "data": {
      "newHolders": 25,
      "timeframe": "1m",
      "growthRate": 1500
    },
    "triggeredBy": "holder_growth_detector",
    "confidence": 0.7,
    "timestamp": "2024-03-21T21:02:15.321Z",
    "status": "ACTIVE",
    "priority": "MEDIUM"
  },

  narrativeMomentum: {
    "id": "alert_005",
    "type": "ENTRY_SIGNAL",
    "severity": "HIGH",
    "category": "NARRATIVE_MOMENTUM",
    "tokenAddress": "0x5566...7788",
    "tokenSymbol": "QAI",
    "tokenName": "Quantum AI",
    "title": "🎯 Hot Narrative + Ultra Early",
    "message": "Perfect storm: trending narrative meets brand new token",
    "data": {
      "narrativeScore": 92,
      "signals": ["HOT_NARRATIVE", "ULTRA_EARLY", "TECH_NARRATIVE"],
      "reasoning": [
        "🔥 HOT NARRATIVE: ai, quantum",
        "⚡ BRAND NEW: Token is 0.3 hours old",
        "🤖 TECH NARRATIVE: ai, quantum, intelligence"
      ]
    },
    "triggeredBy": "narrative_momentum_detector",
    "confidence": 0.78,
    "timestamp": "2024-03-21T21:02:45.654Z",
    "status": "ACTIVE", 
    "priority": "HIGH"
  }
};

// ============= EXIT SIGNAL EXAMPLES =============

export const EXIT_SIGNAL_EXAMPLES = {
  devSell: {
    "id": "alert_006",
    "type": "EXIT_SIGNAL",
    "severity": "CRITICAL",
    "category": "DEV_SELL",
    "tokenAddress": "0x9999...aaaa",
    "tokenSymbol": "RUGME",
    "tokenName": "Definitely Not A Rug",
    "title": "🚨 Dev Wallet Selling",
    "message": "Dev sold $85k worth of tokens",
    "data": {
      "devWallet": "0xdev...wallet",
      "sellValue": 85000,
      "sellCount": 3,
      "transactions": [
        {
          "amount": 1500000,
          "value": 45000,
          "timestamp": "2024-03-21T20:58:10.000Z"
        },
        {
          "amount": 800000,
          "value": 25000,
          "timestamp": "2024-03-21T20:59:30.000Z"
        },
        {
          "amount": 500000,
          "value": 15000,
          "timestamp": "2024-03-21T21:01:15.000Z"
        }
      ]
    },
    "triggeredBy": "dev_sell_detector", 
    "confidence": 0.95,
    "timestamp": "2024-03-21T21:01:30.987Z",
    "status": "ACTIVE",
    "priority": "EMERGENCY"
  },

  whaleDump: {
    "id": "alert_007",
    "type": "EXIT_SIGNAL",
    "severity": "HIGH", 
    "category": "WHALE_DUMP",
    "tokenAddress": "0xbbbb...cccc",
    "tokenSymbol": "DUMP",
    "tokenName": "Whale Food",
    "title": "🐋 Whale Dump Alert",
    "message": "5 large sells totaling $380k",
    "data": {
      "sellCount": 5,
      "totalValue": 380000,
      "averageSize": 76000,
      "timeframe": "15m"
    },
    "triggeredBy": "whale_dump_detector",
    "confidence": 0.8,
    "timestamp": "2024-03-21T21:03:12.234Z",
    "status": "ACTIVE",
    "priority": "HIGH"
  },

  volumeCollapse: {
    "id": "alert_008",
    "type": "EXIT_SIGNAL",
    "severity": "MEDIUM",
    "category": "VOLUME_DECLINE",
    "tokenAddress": "0xdddd...eeee",
    "tokenSymbol": "FADE",
    "tokenName": "Fading Fast",
    "title": "📉 Volume Collapse",
    "message": "Volume dropped 75% to $45k",
    "data": {
      "currentVolume": 45000,
      "previousVolume": 180000,
      "decline": 75,
      "timeframe": "10m"
    },
    "triggeredBy": "volume_decline_detector",
    "confidence": 0.7,
    "timestamp": "2024-03-21T21:03:45.567Z",
    "status": "ACTIVE",
    "priority": "MEDIUM"
  },

  liquidityDrain: {
    "id": "alert_009",
    "type": "EXIT_SIGNAL",
    "severity": "EMERGENCY",
    "category": "LIQUIDITY_DRAIN",
    "tokenAddress": "0xffff...0000",
    "tokenSymbol": "DRAIN", 
    "tokenName": "Liquidity Drain",
    "title": "💧 Liquidity Drain Alert",
    "message": "Liquidity reduced 85% to $25k",
    "data": {
      "currentLiquidity": 25000,
      "previousLiquidity": 165000,
      "reduction": 85,
      "remainingLiquidity": 25000
    },
    "triggeredBy": "liquidity_drain_detector",
    "confidence": 0.9,
    "timestamp": "2024-03-21T21:04:20.890Z",
    "status": "ACTIVE",
    "priority": "EMERGENCY"
  },

  botSelling: {
    "id": "alert_010",
    "type": "EXIT_SIGNAL",
    "severity": "HIGH",
    "category": "BOT_SELLING",
    "tokenAddress": "0x1111...2222",
    "tokenSymbol": "BOTS",
    "tokenName": "Bot Paradise",
    "title": "🤖 Bot Selling Detected",
    "message": "32 similar-sized sells in 10 minutes",
    "data": {
      "sellCount": 32,
      "similarAmountPercentage": 87,
      "avgSellAmount": 125000,
      "timeframe": "10m"
    },
    "triggeredBy": "bot_selling_detector",
    "confidence": 0.75,
    "timestamp": "2024-03-21T21:04:55.123Z",
    "status": "ACTIVE",
    "priority": "HIGH"
  }
};

// ============= RISK ALERT EXAMPLES =============

export const RISK_ALERT_EXAMPLES = {
  sniperRisk: {
    "id": "alert_011",
    "type": "RISK_WARNING",
    "severity": "HIGH",
    "category": "SNIPER_CONCENTRATION", 
    "tokenAddress": "0x3333...4444",
    "tokenSymbol": "SNIPE",
    "tokenName": "Sniper Target",
    "title": "⚠️ Sniper Wallet Risk",
    "message": "65.8% of supply controlled by sniper wallets",
    "data": {
      "sniperPercentage": 65.8,
      "sniperCount": 12,
      "avgSniperHolding": 5.48
    },
    "triggeredBy": "sniper_concentration_detector",
    "confidence": 0.8,
    "timestamp": "2024-03-21T21:05:30.456Z",
    "status": "ACTIVE",
    "priority": "HIGH"
  },

  liquidityRisk: {
    "id": "alert_012",
    "type": "RISK_WARNING",
    "severity": "MEDIUM",
    "category": "UNLOCKED_LIQUIDITY",
    "tokenAddress": "0x5555...6666",
    "tokenSymbol": "UNLOCK",
    "tokenName": "Unlocked Risk",
    "title": "🔓 Unlocked Liquidity Risk", 
    "message": "$180k liquidity is not locked",
    "data": {
      "liquidityAmount": 180000,
      "poolAddress": "0xpool...address",
      "dex": "uniswap"
    },
    "triggeredBy": "liquidity_risk_detector",
    "confidence": 0.9,
    "timestamp": "2024-03-21T21:06:15.789Z",
    "status": "ACTIVE",
    "priority": "MEDIUM"
  },

  contractRisk: {
    "id": "alert_013",
    "type": "RISK_WARNING",
    "severity": "HIGH",
    "category": "CONTRACT_RISK",
    "tokenAddress": "0x7777...8888",
    "tokenSymbol": "RISKY",
    "tokenName": "Risky Business",
    "title": "⚠️ Contract Risk Detected",
    "message": "3 risk factors: Unverified contract, Ownership not renounced, High transaction tax: 15.0%",
    "data": {
      "riskCount": 3,
      "risks": [
        "Unverified contract",
        "Ownership not renounced", 
        "High transaction tax: 15.0%"
      ],
      "verified": false,
      "ownershipRenounced": false,
      "isProxy": false,
      "avgTax": 15.0
    },
    "triggeredBy": "contract_risk_detector",
    "confidence": 0.85,
    "timestamp": "2024-03-21T21:07:00.234Z",
    "status": "ACTIVE",
    "priority": "HIGH"
  },

  rugWarning: {
    "id": "alert_014",
    "type": "RISK_WARNING",
    "severity": "EMERGENCY",
    "category": "RUG_WARNING",
    "tokenAddress": "0x9999...aaaa",
    "tokenSymbol": "RUGME",
    "tokenName": "Definitely Not A Rug",
    "title": "🚨 High Rug Risk",
    "message": "Rug score: 92/100 (CRITICAL)",
    "data": {
      "rugScore": 92,
      "riskLevel": "CRITICAL",
      "primaryFlags": [
        "UNVERIFIED_CONTRACT",
        "HIGH_CONCENTRATION",
        "NO_LP_LOCK",
        "RECENT_DEV_SELLS", 
        "BOT_BUYING"
      ],
      "summary": "🚨 AVOID: Extremely high rug risk detected. Primary concern: devBehavior (85/100)"
    },
    "triggeredBy": "rug_risk_detector",
    "confidence": 0.9,
    "timestamp": "2024-03-21T21:07:45.567Z",
    "status": "ACTIVE",
    "priority": "EMERGENCY"
  }
};

// ============= EVENT PROCESSING FLOW =============

export const EVENT_PROCESSING_FLOW = {
  description: "Signal Engine Event Processing Architecture",
  
  stages: [
    {
      stage: "1. Event Detection",
      description: "Continuous monitoring triggers events",
      triggers: [
        "New transaction detected",
        "Price/volume change detected", 
        "Holder count change detected",
        "Liquidity change detected",
        "Contract interaction detected"
      ],
      frequency: "Real-time (websockets, polling)"
    },
    
    {
      stage: "2. Signal Analysis", 
      description: "Events are analyzed for signal patterns",
      processes: [
        "Alpha Score calculation",
        "Rug Score calculation", 
        "Volume surge detection",
        "Smart money tracking",
        "Holder growth analysis"
      ],
      duration: "< 5 seconds per token"
    },
    
    {
      stage: "3. Alert Generation",
      description: "Qualified signals become alerts",
      conditions: [
        "Signal exceeds threshold",
        "Not duplicate within time window",
        "Confidence level sufficient",
        "Token meets minimum criteria"
      ],
      outputs: ["Database alert record", "Queue job for delivery"]
    },
    
    {
      stage: "4. Alert Processing",
      description: "Alerts are processed and delivered",
      actions: [
        "Format alert message",
        "Determine delivery channels",
        "Apply user preferences",
        "Send notifications",
        "Update alert status"
      ],
      delivery: ["WebSocket", "Telegram", "Discord", "Email", "Push"]
    },
    
    {
      stage: "5. Alert Management",
      description: "Ongoing alert lifecycle management",
      operations: [
        "Track alert status",
        "Handle user interactions",
        "Expire old alerts", 
        "Aggregate statistics",
        "Learn from feedback"
      ]
    }
  ],

  performance: {
    "Detection Latency": "< 30 seconds",
    "Processing Time": "< 5 seconds",
    "Delivery Time": "< 10 seconds", 
    "Total Response": "< 45 seconds",
    "Throughput": "1000+ tokens/minute",
    "Accuracy": "> 85% signal relevance"
  }
};

// ============= ALERT FORMATTING HELPERS =============

export class AlertFormatter {
  static formatForTelegram(alert: any): string {
    const severityEmoji = {
      'LOW': '💡',
      'MEDIUM': '⚠️',
      'HIGH': '🚨', 
      'CRITICAL': '🔥',
      'EMERGENCY': '🚨🚨🚨'
    };

    const typeEmoji = {
      'ENTRY_SIGNAL': '🚀',
      'EXIT_SIGNAL': '📉', 
      'RISK_WARNING': '⚠️'
    };

    return `
${severityEmoji[alert.severity]} **${alert.title}** ${typeEmoji[alert.type]}

**Token:** ${alert.tokenSymbol} (${alert.tokenName})
**Address:** \`${alert.tokenAddress}\`

**Message:** ${alert.message}

**Confidence:** ${(alert.confidence * 100).toFixed(0)}%
**Time:** ${new Date(alert.timestamp).toLocaleString()}

${alert.type === 'ENTRY_SIGNAL' ? '🎯 Consider entry' : 
  alert.type === 'EXIT_SIGNAL' ? '🚪 Consider exit' : 
  '⚠️ Risk assessment required'}
    `.trim();
  }

  static formatForDiscord(alert: any): any {
    const colors = {
      'LOW': 0x95a5a6,
      'MEDIUM': 0xf39c12,
      'HIGH': 0xe74c3c,
      'CRITICAL': 0x9b59b6,
      'EMERGENCY': 0x992d22
    };

    return {
      embeds: [{
        title: alert.title,
        description: alert.message,
        color: colors[alert.severity],
        fields: [
          {
            name: "Token",
            value: `${alert.tokenSymbol} (${alert.tokenName})`,
            inline: true
          },
          {
            name: "Confidence", 
            value: `${(alert.confidence * 100).toFixed(0)}%`,
            inline: true
          },
          {
            name: "Type",
            value: alert.type.replace('_', ' '),
            inline: true
          }
        ],
        footer: {
          text: `Alert ID: ${alert.id}`
        },
        timestamp: alert.timestamp
      }]
    };
  }

  static formatForWebSocket(alert: any): any {
    return {
      type: 'SIGNAL_ALERT',
      data: {
        id: alert.id,
        alertType: alert.type,
        severity: alert.severity,
        category: alert.category,
        token: {
          address: alert.tokenAddress,
          symbol: alert.tokenSymbol,
          name: alert.tokenName
        },
        alert: {
          title: alert.title,
          message: alert.message,
          confidence: alert.confidence,
          timestamp: alert.timestamp
        },
        data: alert.data
      }
    };
  }

  static formatPriorityText(alert: any): string {
    if (alert.severity === 'EMERGENCY') return 'URGENT ACTION REQUIRED';
    if (alert.severity === 'CRITICAL') return 'IMMEDIATE ATTENTION';
    if (alert.severity === 'HIGH') return 'HIGH PRIORITY';
    if (alert.severity === 'MEDIUM') return 'MONITOR CLOSELY';
    return 'INFORMATIONAL';
  }
}

// ============= REAL-TIME STREAMING EXAMPLE =============

export class AlertStreamer {
  private signalEngine: SignalEngine;

  constructor(signalEngine: SignalEngine) {
    this.signalEngine = signalEngine;
  }

  // WebSocket handler for real-time alerts
  async streamAlerts(websocket: any, filters?: {
    severity?: string[];
    types?: string[];
    tokens?: string[];
  }) {
    try {
      // Send recent alerts immediately  
      const recentAlerts = await this.signalEngine.getRecentAlerts(10);
      const filteredAlerts = this.applyFilters(recentAlerts, filters);
      
      for (const alert of filteredAlerts) {
        websocket.send(JSON.stringify(AlertFormatter.formatForWebSocket(alert)));
      }

      // Set up real-time streaming (pseudo-code)
      // This would integrate with Redis pub/sub or similar
      setInterval(async () => {
        const newAlerts = await this.signalEngine.getRecentAlerts(5);
        const filtered = this.applyFilters(newAlerts, filters);
        
        for (const alert of filtered) {
          websocket.send(JSON.stringify(AlertFormatter.formatForWebSocket(alert)));
        }
      }, 5000); // Check every 5 seconds

    } catch (error) {
      console.error('Error streaming alerts:', error);
    }
  }

  private applyFilters(alerts: any[], filters?: any): any[] {
    if (!filters) return alerts;
    
    return alerts.filter(alert => {
      if (filters.severity && !filters.severity.includes(alert.severity)) return false;
      if (filters.types && !filters.types.includes(alert.type)) return false;
      if (filters.tokens && !filters.tokens.includes(alert.tokenAddress)) return false;
      return true;
    });
  }

  // Polling endpoint for systems that can't use WebSockets
  async pollAlerts(lastTimestamp?: string, filters?: any): Promise<any> {
    const since = lastTimestamp ? new Date(lastTimestamp) : new Date(Date.now() - 60000); // Last minute
    
    // This would query database for alerts since timestamp
    const alerts = await this.getAlertsSince(since);
    const filtered = this.applyFilters(alerts, filters);
    
    return {
      alerts: filtered,
      timestamp: new Date().toISOString(),
      count: filtered.length
    };
  }

  private async getAlertsSince(timestamp: Date): Promise<any[]> {
    // Implement database query for alerts since timestamp
    return [];
  }
}

// Usage Examples
export const USAGE_EXAMPLES = {
  initialization: `
// Initialize Signal Engine
const signalEngine = new SignalEngine();

// Trigger token scan
await signalEngine.triggerTokenScan('0x1234...abcd');

// Get recent alerts
const alerts = await signalEngine.getRecentAlerts(20);

// Stream alerts via WebSocket
const streamer = new AlertStreamer(signalEngine);
await streamer.streamAlerts(websocket, {
  severity: ['HIGH', 'CRITICAL', 'EMERGENCY'],
  types: ['ENTRY_SIGNAL', 'EXIT_SIGNAL']
});
  `,

  apiIntegration: `
// API endpoint for alerts
app.get('/api/alerts/recent', async (req, res) => {
  const alerts = await signalEngine.getRecentAlerts(50);
  res.json({ alerts, timestamp: new Date() });
});

// WebSocket endpoint  
app.ws('/alerts/stream', (ws, req) => {
  const filters = req.query;
  streamer.streamAlerts(ws, filters);
});

// Token-specific alerts
app.get('/api/alerts/:tokenAddress', async (req, res) => {
  const alerts = await signalEngine.getTokenAlerts(req.params.tokenAddress);
  res.json({ alerts });
});
  `,

  backgroundProcessing: `
// Set up background scanning
setInterval(async () => {
  const activeTokens = await getActiveTokens();
  
  for (const token of activeTokens) {
    await signalEngine.triggerTokenScan(token.address);
  }
}, 30000); // Scan every 30 seconds
  `
};

export { SignalEngine } from './signalEngine';
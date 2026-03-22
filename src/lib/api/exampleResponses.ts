// Example API Responses for Documentation and Testing
export const EXAMPLE_API_RESPONSES = {

  // ============= TRENDING TOKENS RESPONSE =============
  trendingTokens: {
    success: true,
    cached: false,
    data: {
      tokens: [
        {
          address: "0x1234567890abcdef1234567890abcdef12345678",
          symbol: "PEPAI",
          name: "Pepe AI",
          alphaScore: 92,
          rugScore: 23,
          price: 0.000045,
          volume24h: 1250000,
          liquidity: 380000,
          marketCap: 4500000,
          holders: 1250,
          age: 2.5,
          trending: {
            volumeGrowth24h: 1250,
            holderGrowth24h: 450,
            priceChange24h: 185.7
          },
          signals: [
            "VOLUME_SURGE_5M",
            "SMART_MONEY_ENTRY", 
            "HOT_NARRATIVE",
            "RAPID_ADOPTION"
          ],
          confidence: 0.87,
          lastUpdated: "2024-03-21T21:10:00Z"
        },
        {
          address: "0x9876543210fedcba9876543210fedcba98765432",
          symbol: "TRUMP47",
          name: "Trump 2024",
          alphaScore: 78,
          rugScore: 35,
          price: 0.00234,
          volume24h: 850000,
          liquidity: 220000,
          marketCap: 2100000,
          holders: 890,
          age: 6.2,
          trending: {
            volumeGrowth24h: 420,
            holderGrowth24h: 180,
            priceChange24h: 67.3
          },
          signals: [
            "POLITICAL_NARRATIVE",
            "WHALE_ACCUMULATION",
            "TREND_CONFIRMATION_6H"
          ],
          confidence: 0.72,
          lastUpdated: "2024-03-21T21:10:00Z"
        },
        {
          address: "0xabcdef1234567890abcdef1234567890abcdef12",
          symbol: "DOGE2",
          name: "Doge Reborn",
          alphaScore: 65,
          rugScore: 42,
          price: 0.000156,
          volume24h: 450000,
          liquidity: 125000,
          marketCap: 890000,
          holders: 567,
          age: 12.8,
          trending: {
            volumeGrowth24h: 180,
            holderGrowth24h: 95,
            priceChange24h: 23.4
          },
          signals: [
            "MEME_POTENTIAL",
            "VOLUME_GROWTH_5M",
            "SOCIAL_FRIENDLY"
          ],
          confidence: 0.64,
          lastUpdated: "2024-03-21T21:10:00Z"
        }
      ],
      count: 3,
      timestamp: "2024-03-21T21:10:00Z",
      filters: {
        limit: 20,
        minAlpha: 40,
        maxRug: 70,
        timeframe: "24h"
      },
      metadata: {
        totalProcessed: 47,
        avgAlphaScore: 78.3,
        avgRugScore: 33.3
      }
    }
  },

  // ============= TOKEN ANALYSIS RESPONSE =============
  tokenAnalysis: {
    success: true,
    cached: false,
    data: {
      token: {
        address: "0x1234567890abcdef1234567890abcdef12345678",
        symbol: "PEPAI",
        name: "Pepe AI",
        chainId: 1,
        price: 0.000045,
        marketCap: 4500000,
        volume24h: 1250000,
        liquidity: 380000,
        verified: true,
        ownershipRenounced: true,
        isProxy: false,
        buyTax: 1.0,
        sellTax: 2.0,
        createdAt: "2024-03-21T18:35:00Z",
        age: "2.5 hours"
      },

      analysis: {
        alphaScore: {
          finalScore: 92,
          alphaLevel: "EXPLOSIVE",
          confidence: 0.87,
          components: {
            volumeGrowth: {
              score: 95,
              reasoning: [
                "🚀 EXPLOSIVE 5m volume: +1250%",
                "🔥 Sustained 1h growth: +450%",
                "⚡ EARLY MOMENTUM: Volume accelerating"
              ],
              signals: ["VOLUME_SURGE_5M", "SUSTAINED_GROWTH_1H"],
              weight: 0.25,
              confidence: 0.9
            },
            narrativeStrength: {
              score: 95,
              reasoning: [
                "🔥 HOT NARRATIVE: ai, pepe",
                "⚡ BRAND NEW: Token is 2.5 hours old",
                "😄 MEME POTENTIAL: 2 meme indicators"
              ],
              signals: ["HOT_NARRATIVE", "ULTRA_EARLY", "MEME_POTENTIAL"],
              weight: 0.25,
              confidence: 0.85
            }
          },
          earlySignals: [
            "VOLUME_SURGE_5M",
            "SMART_MONEY_ENTRY",
            "HOT_NARRATIVE",
            "ULTRA_EARLY"
          ],
          recommendedAction: "🚀 STRONG BUY: High alpha potential with strong confidence"
        },

        rugScore: {
          finalScore: 23,
          riskLevel: "LOW",
          components: {
            contractSafety: {
              score: 15,
              reasoning: [
                "✅ Contract is verified on block explorer",
                "✅ Ownership has been renounced",
                "✅ Contract is not a proxy (non-upgradeable)",
                "✅ Low transaction tax: 1.5%"
              ],
              flags: [],
              weight: 0.20
            },
            liquiditySafety: {
              score: 25,
              reasoning: [
                "🔓 LP is NOT locked",
                "✅ Good liquidity ratio: 8.4%",
                "✅ Adequate liquidity: $380k"
              ],
              flags: ["NO_LP_LOCK"],
              weight: 0.20
            }
          },
          summary: "✅ LOW RISK: Appears relatively safe. Primary concern: liquiditySafety (25/100)"
        },

        recommendation: {
          action: "STRONG_BUY",
          reasoning: "Excellent opportunity: High alpha (92) with low risk (23) and strong confidence",
          confidence: 0.95,
          riskLevel: "LOW"
        }
      },

      holders: {
        total: 1250,
        breakdown: {
          whales: 3,
          snipers: 85,
          normal: 1142,
          fresh: 450
        },
        distribution: [
          { range: ">10%", count: 1, percentage: 0.1 },
          { range: "5-10%", count: 2, percentage: 0.2 },
          { range: "1-5%", count: 15, percentage: 1.2 },
          { range: "0.1-1%", count: 180, percentage: 14.4 },
          { range: "<0.1%", count: 1052, percentage: 84.1 }
        ],
        topHolders: [
          {
            address: "0xdev123...",
            percentage: 12.5,
            type: "DEV",
            isSniper: false,
            firstBuy: "2024-03-21T18:35:00Z"
          },
          {
            address: "0xwhale456...",
            percentage: 6.8,
            type: "WHALE",
            isSniper: false,
            firstBuy: "2024-03-21T18:37:00Z"
          }
        ]
      },

      liquidity: {
        pools: [
          {
            address: "0xpool123...",
            dex: "uniswap",
            pairedWith: "WETH",
            totalLiquidity: 380000,
            token0Reserve: 2500000000,
            token1Reserve: 150.5,
            isLocked: false,
            lockUntil: null,
            lockProvider: null
          }
        ],
        totalLiquidity: 380000,
        liquidityRatio: 8.4,
        isLocked: false,
        riskLevel: "MEDIUM"
      },

      activity: {
        transactions24h: 2850,
        volume24h: 1250000,
        uniqueTraders24h: 780,
        buyVsSell: {
          buys: 1950,
          sells: 900,
          ratio: 2.17
        },
        priceChange: {
          "5m": 45.2,
          "1h": 125.8,
          "24h": 185.7
        },
        devActivity: {
          recentSells: [],
          totalDevSells24h: 0,
          devHolding: 12.5,
          riskLevel: "LOW"
        }
      },

      signals: {
        recent: [
          {
            type: "ENTRY_SIGNAL",
            severity: "CRITICAL",
            message: "Alpha score increased by 35 points to 92/100",
            timestamp: "2024-03-21T21:05:00Z"
          },
          {
            type: "ENTRY_SIGNAL", 
            severity: "HIGH",
            message: "4 smart wallets buying ($125k total)",
            timestamp: "2024-03-21T21:03:00Z"
          }
        ],
        activeCount: 2
      },

      metadata: {
        lastUpdated: "2024-03-21T21:10:00Z",
        dataFreshness: "5 minutes ago",
        analysisTime: 2350
      }
    }
  },

  // ============= ALERTS RESPONSE =============
  alerts: {
    success: true,
    cached: false,
    data: {
      alerts: [
        {
          id: "alert_001",
          type: "ENTRY_SIGNAL",
          severity: "CRITICAL",
          category: "ALPHA_SPIKE",
          token: {
            address: "0x1234567890abcdef1234567890abcdef12345678",
            symbol: "PEPAI",
            name: "Pepe AI",
            price: 0.000045,
            marketCap: 4500000
          },
          alert: {
            title: "🔥 Alpha Score Spike Detected",
            message: "Alpha score increased by 35 points to 92/100",
            confidence: 0.87,
            timestamp: "2024-03-21T21:05:00Z",
            expiresAt: "2024-03-21T23:05:00Z"
          },
          data: {
            previousScore: 57,
            currentScore: 92,
            increase: 35,
            signals: ["VOLUME_SURGE_5M", "SMART_MONEY_ENTRY"]
          },
          metadata: {
            triggeredBy: "alpha_spike_detector",
            age: "5m ago",
            priority: 1
          }
        },
        {
          id: "alert_002",
          type: "EXIT_SIGNAL",
          severity: "HIGH",
          category: "WHALE_DUMP",
          token: {
            address: "0x9876543210fedcba9876543210fedcba98765432",
            symbol: "DUMP",
            name: "Whale Food",
            price: 0.00156,
            marketCap: 890000
          },
          alert: {
            title: "🐋 Whale Dump Alert",
            message: "5 large sells totaling $380k",
            confidence: 0.8,
            timestamp: "2024-03-21T21:03:00Z",
            expiresAt: "2024-03-21T01:03:00Z"
          },
          data: {
            sellCount: 5,
            totalValue: 380000,
            averageSize: 76000
          },
          metadata: {
            triggeredBy: "whale_dump_detector",
            age: "7m ago",
            priority: 3
          }
        },
        {
          id: "alert_003",
          type: "RISK_WARNING",
          severity: "EMERGENCY",
          category: "RUG_WARNING",
          token: {
            address: "0xabcdef1234567890abcdef1234567890abcdef12",
            symbol: "RUGME",
            name: "Definitely Not A Rug",
            price: 0.00001,
            marketCap: 120000
          },
          alert: {
            title: "🚨 High Rug Risk",
            message: "Rug score: 95/100 (CRITICAL)",
            confidence: 0.92,
            timestamp: "2024-03-21T20:58:00Z",
            expiresAt: "2024-03-21T21:58:00Z"
          },
          data: {
            rugScore: 95,
            riskLevel: "CRITICAL",
            primaryFlags: [
              "UNVERIFIED_CONTRACT",
              "NO_LP_LOCK", 
              "HIGH_CONCENTRATION",
              "RECENT_DEV_SELLS"
            ]
          },
          metadata: {
            triggeredBy: "rug_risk_detector",
            age: "12m ago",
            priority: 1
          }
        }
      ],

      pagination: {
        total: 156,
        page: 1,
        limit: 20,
        hasMore: true
      },

      filters: {
        type: ["ENTRY_SIGNAL", "EXIT_SIGNAL", "RISK_WARNING"],
        severity: ["HIGH", "CRITICAL", "EMERGENCY"],
        timeframe: "24h"
      },

      metadata: {
        timestamp: "2024-03-21T21:10:00Z",
        activeAlerts: 89,
        alertsByType: {
          "ENTRY_SIGNAL": 45,
          "EXIT_SIGNAL": 28,
          "RISK_WARNING": 16
        },
        alertsBySeverity: {
          "EMERGENCY": 3,
          "CRITICAL": 12,
          "HIGH": 34,
          "MEDIUM": 28,
          "LOW": 12
        }
      }
    }
  },

  // ============= WALLET ANALYSIS RESPONSE =============
  walletAnalysis: {
    success: true,
    cached: false,
    data: {
      wallet: {
        address: "0xsmartmoney123456789012345678901234567890",
        type: "WHALE",
        isDevWallet: false,
        isSniper: true,
        riskScore: 15,
        labels: ["Sniper", "Whale", "High Volume", "Low Risk"],
        createdAt: "2023-08-15T10:30:00Z",
        lastActivity: "2024-03-21T20:45:00Z",
        age: "218 days"
      },

      portfolio: {
        totalValue: 2750000,
        totalTokens: 45,
        activePosistions: 38,
        portfolioHealth: "EXCELLENT",
        diversification: 72,
        holdings: [
          {
            token: {
              address: "0x1234567890abcdef1234567890abcdef12345678",
              symbol: "PEPAI",
              name: "Pepe AI",
              price: 0.000045
            },
            position: {
              balance: 50000000,
              percentage: 2.3,
              value: 2250,
              costBasis: 1800,
              pnl: 450,
              pnlPercentage: 25.0
            },
            activity: {
              firstBuy: "2024-03-21T18:40:00Z",
              lastTx: "2024-03-21T19:15:00Z",
              transactions: 3,
              totalBought: 55000000,
              totalSold: 5000000,
              avgBuyPrice: 0.000032,
              avgSellPrice: 0.000041
            },
            risk: {
              concentration: 0.08,
              liquidityRisk: "LOW",
              rugRisk: 23,
              exitDifficulty: "EASY"
            }
          }
        ]
      },

      trading: {
        summary: {
          totalTransactions: 1450,
          winRate: 78.5,
          totalVolume: 15750000,
          avgPositionSize: 10862,
          avgHoldTime: 72.5,
          mostTradedToken: "PEPE"
        },
        performance: {
          realizedPnL: 450000,
          unrealizedPnL: 125000,
          totalPnL: 575000,
          bestTrade: {
            token: "SHIB",
            pnl: 85000,
            percentage: 450.0,
            date: "2024-02-15T14:20:00Z"
          },
          worstTrade: {
            token: "SAFEMOON",
            pnl: -12000,
            percentage: -95.0,
            date: "2024-01-08T09:30:00Z"
          }
        },
        patterns: {
          tradingFrequency: "ACTIVE",
          avgSessionDuration: 45,
          preferredTimeOfDay: "Morning",
          riskTolerance: "HIGH",
          strategyType: "SWING"
        },
        recent: [
          {
            token: {
              address: "0x1234567890abcdef1234567890abcdef12345678",
              symbol: "PEPAI",
              name: "Pepe AI"
            },
            type: "BUY",
            amount: 25000000,
            value: 1125,
            price: 0.000045,
            timestamp: "2024-03-21T19:15:00Z",
            age: "1h 55m ago"
          },
          {
            token: {
              address: "0x9876543210fedcba9876543210fedcba98765432",
              symbol: "TRUMP47",
              name: "Trump 2024"
            },
            type: "SELL",
            amount: 500000,
            value: 1170,
            price: 0.00234,
            timestamp: "2024-03-21T18:30:00Z",
            age: "2h 40m ago"
          }
        ]
      },

      reputation: {
        smartMoneyScore: 85,
        isKnownProfitable: true,
        followersCount: 450,
        successRate: 78.5,
        riskAssessment: "NORMAL",
        trustLevel: "HIGH",
        flags: [],
        achievements: [
          "High Volume Trader",
          "Successful Sniper",
          "Whale Wallet",
          "Consistent Profits"
        ]
      },

      activity: {
        timeline: [
          {
            date: "2024-03-21",
            transactions: 8,
            volume: 15750,
            tokensTraded: 4,
            pnl: 1250
          },
          {
            date: "2024-03-20",
            transactions: 12,
            volume: 28900,
            tokensTraded: 6,
            pnl: 3400
          }
        ],
        heatmap: {
          "0": 2, "1": 1, "2": 0, "3": 0, "4": 0, "5": 1,
          "6": 5, "7": 8, "8": 12, "9": 15, "10": 18, "11": 22,
          "12": 20, "13": 25, "14": 30, "15": 28, "16": 24, "17": 18,
          "18": 15, "19": 12, "20": 8, "21": 6, "22": 4, "23": 3
        },
        chains: [
          {
            chainId: 1,
            chainName: "Ethereum",
            transactionCount: 1450,
            volume: 15750000
          }
        ]
      },

      metadata: {
        lastUpdated: "2024-03-21T21:10:00Z",
        dataCompleteness: 95,
        analysisConfidence: 88,
        limitations: [
          "Historical data may be incomplete",
          "Cross-chain activity not fully tracked",
          "Some DEX trades may be missing"
        ]
      }
    }
  },

  // ============= ERROR RESPONSES =============
  errors: {
    invalidAddress: {
      success: false,
      error: "Invalid token address format"
    },
    tokenNotFound: {
      success: false,
      error: "Token not found"
    },
    rateLimited: {
      success: false,
      error: "Rate limit exceeded. Please try again later."
    },
    serverError: {
      success: false,
      error: "Internal server error"
    }
  }
};

// ============= API RESPONSE SCHEMAS =============
export const API_SCHEMAS = {
  // Standard response wrapper
  baseResponse: {
    success: "boolean",
    cached: "boolean?",
    data: "object",
    error: "string?"
  },

  // Trending tokens schema
  trendingTokensSchema: {
    tokens: [
      {
        address: "string",
        symbol: "string", 
        name: "string",
        alphaScore: "number (0-100)",
        rugScore: "number (0-100)",
        price: "number | null",
        volume24h: "number | null",
        liquidity: "number | null",
        marketCap: "number | null",
        holders: "number",
        age: "number (hours)",
        trending: {
          volumeGrowth24h: "number (%)",
          holderGrowth24h: "number",
          priceChange24h: "number (%)"
        },
        signals: ["string"],
        confidence: "number (0-1)",
        lastUpdated: "ISO string"
      }
    ],
    count: "number",
    timestamp: "ISO string",
    filters: "object",
    metadata: {
      totalProcessed: "number",
      avgAlphaScore: "number",
      avgRugScore: "number"
    }
  },

  // Token analysis schema
  tokenAnalysisSchema: {
    token: {
      address: "string",
      symbol: "string",
      name: "string",
      chainId: "number",
      price: "number | null",
      marketCap: "number | null",
      volume24h: "number | null",
      liquidity: "number | null",
      verified: "boolean",
      ownershipRenounced: "boolean",
      isProxy: "boolean",
      buyTax: "number | null",
      sellTax: "number | null",
      createdAt: "ISO string",
      age: "string"
    },
    analysis: {
      alphaScore: "AlphaScoreResult object",
      rugScore: "RugScoreResult object", 
      recommendation: {
        action: "string",
        reasoning: "string",
        confidence: "number (0-1)",
        riskLevel: "string"
      }
    },
    holders: "HolderAnalysis object",
    liquidity: "LiquidityAnalysis object",
    activity: "ActivityAnalysis object",
    signals: {
      recent: ["RecentAlert"],
      activeCount: "number"
    },
    metadata: {
      lastUpdated: "ISO string",
      dataFreshness: "string",
      analysisTime: "number (ms)"
    }
  }
};

// ============= FRONTEND INTEGRATION EXAMPLES =============
export const FRONTEND_EXAMPLES = {
  // React component examples
  tokenCard: `
import { useAPI } from '@/lib/api/apiIntegration';

const TokenCard = ({ token }) => {
  const { formatCurrency, formatPercentage, getRecommendationColor } = useAPI();
  
  const getScoreColor = (score) => {
    if (score >= 80) return '#00ff88';
    if (score >= 60) return '#ffaa00';
    return '#ff4444';
  };

  return (
    <div className="token-card">
      <div className="token-header">
        <h3>{token.symbol}</h3>
        <span className="token-age">{token.age}h old</span>
      </div>
      
      <div className="token-scores">
        <div className="score" style={{ color: getScoreColor(token.alphaScore) }}>
          Alpha: {token.alphaScore}/100
        </div>
        <div className="score" style={{ color: getScoreColor(100 - token.rugScore) }}>
          Safety: {100 - token.rugScore}/100
        </div>
      </div>
      
      <div className="token-metrics">
        <div>Price: {formatCurrency(token.price)}</div>
        <div>Volume: {formatCurrency(token.volume24h)}</div>
        <div>24h: {formatPercentage(token.trending.priceChange24h)}</div>
      </div>
      
      <div className="token-signals">
        {token.signals.slice(0, 3).map((signal, i) => (
          <span key={i} className="signal-tag">{signal}</span>
        ))}
      </div>
    </div>
  );
};
  `,

  alertComponent: `
const AlertItem = ({ alert }) => {
  const { getAlertColor, getAlertEmoji, formatTimeAgo } = useAPI();
  
  return (
    <div 
      className="alert-item"
      style={{ borderLeft: \`4px solid \${getAlertColor(alert.severity)}\` }}
    >
      <div className="alert-header">
        <span className="alert-emoji">{getAlertEmoji(alert.severity)}</span>
        <h4>{alert.alert.title}</h4>
        <span className="alert-age">{formatTimeAgo(alert.alert.timestamp)}</span>
      </div>
      
      <div className="alert-content">
        <p>{alert.alert.message}</p>
        <div className="alert-token">
          <strong>{alert.token.symbol}</strong> - {alert.token.name}
        </div>
      </div>
      
      <div className="alert-footer">
        <span className="confidence">Confidence: {Math.round(alert.alert.confidence * 100)}%</span>
        <span className="severity">{alert.severity}</span>
      </div>
    </div>
  );
};
  `,

  realtimeAlerts: `
import { AlertWebSocketClient } from '@/lib/api/apiIntegration';

const useRealtimeAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [client, setClient] = useState(null);

  useEffect(() => {
    const alertClient = new AlertWebSocketClient('ws://localhost:3000/alerts/stream');
    
    alertClient.on('alert', (newAlert) => {
      setAlerts(prev => [newAlert, ...prev].slice(0, 100)); // Keep last 100
      
      // Show notification
      if (newAlert.severity === 'CRITICAL' || newAlert.severity === 'EMERGENCY') {
        showNotification(newAlert);
      }
    });

    alertClient.connect({
      severity: ['HIGH', 'CRITICAL', 'EMERGENCY'],
      type: ['ENTRY_SIGNAL', 'EXIT_SIGNAL']
    });

    setClient(alertClient);
    
    return () => alertClient.disconnect();
  }, []);

  const subscribeToToken = (tokenAddress) => {
    client?.subscribeToken(tokenAddress);
  };

  return { alerts, subscribeToToken };
};
  `
};

export default EXAMPLE_API_RESPONSES;
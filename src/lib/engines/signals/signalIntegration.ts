// Signal Engine Integration - API Endpoints and Real-time System
import { NextRequest, NextResponse } from 'next/server';
import { SignalEngine } from './signalEngine';
import { AlertFormatter, AlertStreamer } from './alertExamples';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

// ============= API ENDPOINTS =============

export class SignalAPI {
  private signalEngine: SignalEngine;
  private alertStreamer: AlertStreamer;

  constructor() {
    this.signalEngine = new SignalEngine();
    this.alertStreamer = new AlertStreamer(this.signalEngine);
  }

  // GET /api/signals/alerts - Recent alerts
  async getRecentAlerts(request: NextRequest) {
    try {
      const searchParams = request.nextUrl.searchParams;
      const limit = parseInt(searchParams.get('limit') || '20');
      const severity = searchParams.get('severity')?.split(',');
      const type = searchParams.get('type')?.split(',');

      const alerts = await this.signalEngine.getRecentAlerts(limit);
      
      // Apply filters
      const filtered = alerts.filter(alert => {
        if (severity && !severity.includes(alert.severity)) return false;
        if (type && !type.includes(alert.type)) return false;
        return true;
      });

      return NextResponse.json({
        success: true,
        data: {
          alerts: filtered,
          count: filtered.length,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }

  // GET /api/signals/alerts/:tokenAddress - Token-specific alerts
  async getTokenAlerts(request: NextRequest, { params }: { params: { tokenAddress: string } }) {
    try {
      const tokenAddress = params.tokenAddress;
      const searchParams = request.nextUrl.searchParams;
      const hours = parseInt(searchParams.get('hours') || '24');

      const alerts = await this.signalEngine.getTokenAlerts(tokenAddress, hours);

      return NextResponse.json({
        success: true,
        data: {
          tokenAddress,
          alerts,
          count: alerts.length,
          timeframe: `${hours}h`
        }
      });

    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }

  // POST /api/signals/scan/:tokenAddress - Manual scan trigger
  async triggerTokenScan(request: NextRequest, { params }: { params: { tokenAddress: string } }) {
    try {
      const tokenAddress = params.tokenAddress;
      
      await this.signalEngine.triggerTokenScan(tokenAddress);

      return NextResponse.json({
        success: true,
        data: {
          message: `Scan triggered for token ${tokenAddress}`,
          tokenAddress,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }

  // GET /api/signals/poll - Polling endpoint for systems without WebSocket
  async pollAlerts(request: NextRequest) {
    try {
      const searchParams = request.nextUrl.searchParams;
      const lastTimestamp = searchParams.get('since');
      const severity = searchParams.get('severity')?.split(',');
      const type = searchParams.get('type')?.split(',');

      const filters = { severity, type };
      const result = await this.alertStreamer.pollAlerts(lastTimestamp || undefined, filters);

      return NextResponse.json({
        success: true,
        data: result
      });

    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }

  // GET /api/signals/stats - Signal engine statistics
  async getSignalStats(request: NextRequest) {
    try {
      const prisma = new PrismaClient();
      const redis = new Redis(process.env.REDIS_URL!);

      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last1h = new Date(now.getTime() - 60 * 60 * 1000);

      // Get alert statistics
      const [total24h, total1h, byType, bySeverity, activeAlerts] = await Promise.all([
        prisma.alert.count({
          where: { createdAt: { gte: last24h } }
        }),
        prisma.alert.count({
          where: { createdAt: { gte: last1h } }
        }),
        prisma.alert.groupBy({
          by: ['type'],
          where: { createdAt: { gte: last24h } },
          _count: true
        }),
        prisma.alert.groupBy({
          by: ['severity'],
          where: { createdAt: { gte: last24h } },
          _count: true
        }),
        prisma.alert.count({
          where: { status: 'ACTIVE' }
        })
      ]);

      return NextResponse.json({
        success: true,
        data: {
          period: {
            last24Hours: total24h,
            lastHour: total1h,
            activeAlerts
          },
          breakdown: {
            byType: byType.reduce((acc, item) => {
              acc[item.type] = item._count;
              return acc;
            }, {} as Record<string, number>),
            bySeverity: bySeverity.reduce((acc, item) => {
              acc[item.severity] = item._count;
              return acc;
            }, {} as Record<string, number>)
          },
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }
}

// ============= WEBSOCKET HANDLER =============

export class SignalWebSocketHandler {
  private signalEngine: SignalEngine;
  private alertStreamer: AlertStreamer;
  private connections: Map<string, any> = new Map();

  constructor() {
    this.signalEngine = new SignalEngine();
    this.alertStreamer = new AlertStreamer(this.signalEngine);
  }

  // Handle new WebSocket connection
  handleConnection(ws: any, connectionId: string) {
    console.log(`🔗 New WebSocket connection: ${connectionId}`);
    
    this.connections.set(connectionId, {
      ws,
      filters: {},
      connectedAt: new Date()
    });

    // Send initial data
    this.sendRecentAlerts(connectionId);

    // Handle messages from client
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        this.handleClientMessage(connectionId, data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log(`❌ WebSocket disconnected: ${connectionId}`);
      this.connections.delete(connectionId);
    });

    ws.on('error', (error: any) => {
      console.error(`❌ WebSocket error for ${connectionId}:`, error);
      this.connections.delete(connectionId);
    });
  }

  // Handle client messages (filter updates, etc.)
  private handleClientMessage(connectionId: string, message: any) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    switch (message.type) {
      case 'SET_FILTERS':
        connection.filters = message.filters;
        console.log(`🎛️ Updated filters for ${connectionId}:`, message.filters);
        break;

      case 'GET_RECENT':
        this.sendRecentAlerts(connectionId);
        break;

      case 'SUBSCRIBE_TOKEN':
        // Add token-specific subscription
        if (!connection.filters.tokens) connection.filters.tokens = [];
        connection.filters.tokens.push(message.tokenAddress);
        break;

      case 'UNSUBSCRIBE_TOKEN':
        // Remove token-specific subscription
        if (connection.filters.tokens) {
          connection.filters.tokens = connection.filters.tokens.filter(
            (addr: string) => addr !== message.tokenAddress
          );
        }
        break;

      default:
        console.log(`❓ Unknown message type: ${message.type}`);
    }
  }

  // Send recent alerts to specific connection
  private async sendRecentAlerts(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      const alerts = await this.signalEngine.getRecentAlerts(20);
      const filtered = this.applyFilters(alerts, connection.filters);

      connection.ws.send(JSON.stringify({
        type: 'RECENT_ALERTS',
        alerts: filtered.map(alert => AlertFormatter.formatForWebSocket(alert))
      }));
    } catch (error) {
      console.error(`Error sending recent alerts to ${connectionId}:`, error);
    }
  }

  // Broadcast new alert to all relevant connections
  async broadcastAlert(alert: any) {
    const alertFormatted = AlertFormatter.formatForWebSocket(alert);

    for (const [connectionId, connection] of this.connections) {
      try {
        // Check if this alert matches connection filters
        if (this.alertMatchesFilters(alert, connection.filters)) {
          connection.ws.send(JSON.stringify({
            type: 'NEW_ALERT',
            alert: alertFormatted
          }));
        }
      } catch (error) {
        console.error(`Error broadcasting to ${connectionId}:`, error);
        // Remove failed connection
        this.connections.delete(connectionId);
      }
    }
  }

  private applyFilters(alerts: any[], filters: any): any[] {
    return alerts.filter(alert => this.alertMatchesFilters(alert, filters));
  }

  private alertMatchesFilters(alert: any, filters: any): boolean {
    if (filters.severity && !filters.severity.includes(alert.severity)) return false;
    if (filters.type && !filters.type.includes(alert.type)) return false;
    if (filters.tokens && !filters.tokens.includes(alert.tokenAddress)) return false;
    return true;
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      totalConnections: this.connections.size,
      connections: Array.from(this.connections.entries()).map(([id, conn]) => ({
        id,
        connectedAt: conn.connectedAt,
        filters: conn.filters
      }))
    };
  }
}

// ============= BACKGROUND JOB ORCHESTRATOR =============

export class SignalOrchestrator {
  private signalEngine: SignalEngine;
  private wsHandler: SignalWebSocketHandler;
  private prisma: PrismaClient;
  private isRunning: boolean = false;

  constructor() {
    this.signalEngine = new SignalEngine();
    this.wsHandler = new SignalWebSocketHandler();
    this.prisma = new PrismaClient();
  }

  // Start background signal monitoring
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Signal orchestrator already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting Signal Orchestrator...');

    // Start main scanning loop
    this.startScanningLoop();

    // Start alert cleanup
    this.startAlertCleanup();

    // Start performance monitoring  
    this.startPerformanceMonitoring();

    console.log('✅ Signal Orchestrator started successfully');
  }

  // Stop background monitoring
  async stop() {
    this.isRunning = false;
    console.log('🛑 Signal Orchestrator stopped');
  }

  private async startScanningLoop() {
    while (this.isRunning) {
      try {
        // Get active tokens to scan
        const activeTokens = await this.getActiveTokens();
        console.log(`🔍 Scanning ${activeTokens.length} active tokens...`);

        // Process tokens in batches to avoid overwhelming the system
        const batchSize = 10;
        for (let i = 0; i < activeTokens.length; i += batchSize) {
          const batch = activeTokens.slice(i, i + batchSize);
          
          await Promise.all(
            batch.map(token => this.scanToken(token.address))
          );

          // Small delay between batches
          await this.sleep(1000);
        }

        console.log('✅ Scanning cycle completed');

        // Wait before next cycle (30 seconds)
        await this.sleep(30000);

      } catch (error) {
        console.error('❌ Error in scanning loop:', error);
        await this.sleep(10000); // Wait 10 seconds on error
      }
    }
  }

  private async scanToken(tokenAddress: string) {
    try {
      await this.signalEngine.triggerTokenScan(tokenAddress);
    } catch (error) {
      console.error(`❌ Error scanning token ${tokenAddress}:`, error);
    }
  }

  private async getActiveTokens() {
    // Get tokens with recent activity
    const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 hours ago

    return await this.prisma.token.findMany({
      where: {
        OR: [
          { lastScanAt: { gte: cutoff } },
          { volume24h: { gte: 10000 } }, // Min $10k volume
          { createdAt: { gte: cutoff } } // New tokens
        ]
      },
      select: { address: true, symbol: true },
      orderBy: { volume24h: 'desc' },
      take: 100 // Limit to top 100 tokens
    });
  }

  private async startAlertCleanup() {
    while (this.isRunning) {
      try {
        // Clean up expired alerts every hour
        const now = new Date();
        
        const expired = await this.prisma.alert.updateMany({
          where: {
            expiresAt: { lt: now },
            status: 'ACTIVE'
          },
          data: {
            status: 'EXPIRED'
          }
        });

        if (expired.count > 0) {
          console.log(`🧹 Cleaned up ${expired.count} expired alerts`);
        }

        await this.sleep(60 * 60 * 1000); // Wait 1 hour

      } catch (error) {
        console.error('❌ Error in alert cleanup:', error);
        await this.sleep(10 * 60 * 1000); // Wait 10 minutes on error
      }
    }
  }

  private async startPerformanceMonitoring() {
    while (this.isRunning) {
      try {
        const stats = {
          timestamp: new Date(),
          connections: this.wsHandler.getConnectionStats(),
          alerts: await this.getAlertStats(),
          system: process.memoryUsage()
        };

        console.log('📊 Performance Stats:', {
          connections: stats.connections.totalConnections,
          alertsLast24h: stats.alerts.last24h,
          memoryUsage: `${Math.round(stats.system.heapUsed / 1024 / 1024)}MB`
        });

        await this.sleep(5 * 60 * 1000); // Monitor every 5 minutes

      } catch (error) {
        console.error('❌ Error in performance monitoring:', error);
        await this.sleep(60 * 1000); // Wait 1 minute on error
      }
    }
  }

  private async getAlertStats() {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return {
      last24h: await this.prisma.alert.count({
        where: { createdAt: { gte: last24h } }
      }),
      active: await this.prisma.alert.count({
        where: { status: 'ACTIVE' }
      })
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============= INITIALIZATION EXAMPLE =============

export const SIGNAL_SYSTEM_INIT = `
// Initialize the complete signal system
async function initializeSignalSystem() {
  console.log('🚀 Initializing Splash Signal Engine...');

  // 1. Start Signal Orchestrator (background scanning)
  const orchestrator = new SignalOrchestrator();
  await orchestrator.start();

  // 2. Initialize API handlers
  const signalAPI = new SignalAPI();

  // 3. Set up WebSocket handler
  const wsHandler = new SignalWebSocketHandler();

  // 4. Set up API routes
  app.get('/api/signals/alerts', signalAPI.getRecentAlerts);
  app.get('/api/signals/alerts/:tokenAddress', signalAPI.getTokenAlerts);
  app.post('/api/signals/scan/:tokenAddress', signalAPI.triggerTokenScan);
  app.get('/api/signals/poll', signalAPI.pollAlerts);
  app.get('/api/signals/stats', signalAPI.getSignalStats);

  // 5. WebSocket endpoint
  app.ws('/signals/stream', (ws, req) => {
    const connectionId = generateId();
    wsHandler.handleConnection(ws, connectionId);
  });

  console.log('✅ Signal System initialized successfully');
  
  return { orchestrator, signalAPI, wsHandler };
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down Signal System...');
  await orchestrator.stop();
  process.exit(0);
});
`;

export { SignalEngine } from './signalEngine';
export { AlertFormatter, AlertStreamer } from './alertExamples';
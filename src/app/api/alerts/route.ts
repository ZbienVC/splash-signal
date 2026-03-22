// /api/alerts - Live alerts feed with filtering
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL!);

interface AlertsResponse {
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    category: string;
    token: {
      address: string;
      symbol: string;
      name: string;
      price: number | null;
      marketCap: number | null;
    };
    alert: {
      title: string;
      message: string;
      confidence: number;
      timestamp: string;
      expiresAt: string | null;
    };
    data: any;
    metadata: {
      triggeredBy: string;
      age: string;
      priority: number;
    };
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  filters: {
    type?: string[];
    severity?: string[];
    category?: string[];
    token?: string;
    timeframe?: string;
  };
  metadata: {
    timestamp: string;
    activeAlerts: number;
    alertsByType: Record<string, number>;
    alertsBySeverity: Record<string, number>;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // Filters
    const typeFilter = searchParams.get('type')?.split(',').filter(Boolean);
    const severityFilter = searchParams.get('severity')?.split(',').filter(Boolean);
    const categoryFilter = searchParams.get('category')?.split(',').filter(Boolean);
    const tokenFilter = searchParams.get('token');
    const timeframe = searchParams.get('timeframe') || '24h';
    const status = searchParams.get('status') || 'active';

    // Time range
    const timeframeHours = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
      '7d': 168,
      'all': 24 * 30 // 30 days max
    };
    const hours = timeframeHours[timeframe as keyof typeof timeframeHours] || 24;
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Build where clause
    const whereClause: any = {
      createdAt: { gte: cutoff }
    };

    // Status filter
    if (status === 'active') {
      whereClause.status = 'ACTIVE';
    } else if (status === 'resolved') {
      whereClause.status = 'RESOLVED';
    } else if (status === 'expired') {
      whereClause.status = 'EXPIRED';
    }

    // Type filter
    if (typeFilter && typeFilter.length > 0) {
      whereClause.type = { in: typeFilter };
    }

    // Severity filter
    if (severityFilter && severityFilter.length > 0) {
      whereClause.severity = { in: severityFilter };
    }

    // Category filter
    if (categoryFilter && categoryFilter.length > 0) {
      whereClause.category = { in: categoryFilter };
    }

    // Token filter
    if (tokenFilter) {
      whereClause.token = { address: tokenFilter.toLowerCase() };
    }

    // Check cache for recent requests
    const cacheKey = `alerts:${JSON.stringify(whereClause)}:${page}:${limit}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return NextResponse.json({
        success: true,
        cached: true,
        data: JSON.parse(cached)
      });
    }

    console.log(`📊 Fetching alerts with filters:`, { whereClause, page, limit });

    // Get alerts with token info
    const [alerts, totalCount] = await Promise.all([
      prisma.alert.findMany({
        where: whereClause,
        include: {
          token: {
            select: {
              address: true,
              symbol: true,
              name: true,
              price: true,
              marketCap: true
            }
          }
        },
        orderBy: [
          { severity: 'asc' }, // EMERGENCY first, LOW last
          { createdAt: 'desc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.alert.count({ where: whereClause })
    ]);

    // Get aggregated statistics
    const [alertsByType, alertsBySeverity, activeCount] = await Promise.all([
      prisma.alert.groupBy({
        by: ['type'],
        where: { ...whereClause, status: 'ACTIVE' },
        _count: { id: true }
      }),
      prisma.alert.groupBy({
        by: ['severity'],
        where: { ...whereClause, status: 'ACTIVE' },
        _count: { id: true }
      }),
      prisma.alert.count({ where: { status: 'ACTIVE' } })
    ]);

    // Format alerts for response
    const formattedAlerts = alerts.map(alert => ({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      category: alert.category,
      token: {
        address: alert.token.address,
        symbol: alert.token.symbol,
        name: alert.token.name,
        price: alert.token.price,
        marketCap: alert.token.marketCap
      },
      alert: {
        title: alert.title,
        message: alert.message,
        confidence: alert.confidence,
        timestamp: alert.createdAt.toISOString(),
        expiresAt: alert.expiresAt?.toISOString() || null
      },
      data: alert.data,
      metadata: {
        triggeredBy: alert.triggeredBy,
        age: formatTimeSince(alert.createdAt),
        priority: getSeverityPriority(alert.severity)
      }
    }));

    const response: AlertsResponse = {
      alerts: formattedAlerts,
      pagination: {
        total: totalCount,
        page,
        limit,
        hasMore: totalCount > page * limit
      },
      filters: {
        type: typeFilter,
        severity: severityFilter,
        category: categoryFilter,
        token: tokenFilter || undefined,
        timeframe
      },
      metadata: {
        timestamp: new Date().toISOString(),
        activeAlerts: activeCount,
        alertsByType: alertsByType.reduce((acc, item) => {
          acc[item.type] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        alertsBySeverity: alertsBySeverity.reduce((acc, item) => {
          acc[item.severity] = item._count.id;
          return acc;
        }, {} as Record<string, number>)
      }
    };

    // Cache for 1 minute (alerts change frequently)
    await redis.setex(cacheKey, 60, JSON.stringify(response));

    console.log(`✅ Fetched ${alerts.length}/${totalCount} alerts`);

    return NextResponse.json({
      success: true,
      cached: false,
      data: response
    });

  } catch (error) {
    console.error('Error in /api/alerts:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST endpoint for creating alerts (internal use)
export async function POST(request: NextRequest) {
  try {
    // This would be used internally by the Signal Engine
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['type', 'severity', 'category', 'tokenAddress', 'title', 'message'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

    // Find token
    const token = await prisma.token.findUnique({
      where: { address: body.tokenAddress.toLowerCase() },
      select: { id: true }
    });

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token not found'
      }, { status: 404 });
    }

    // Create alert
    const alert = await prisma.alert.create({
      data: {
        type: body.type,
        severity: body.severity,
        category: body.category,
        tokenId: token.id,
        title: body.title,
        message: body.message,
        data: body.data || {},
        triggeredBy: body.triggeredBy || 'manual',
        confidence: body.confidence || 0.5,
        conditions: body.conditions || {},
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null
      },
      include: {
        token: {
          select: {
            address: true,
            symbol: true,
            name: true
          }
        }
      }
    });

    // Invalidate relevant caches
    const keys = await redis.keys('alerts:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    // Add to real-time alert stream
    await redis.lpush('recent_alerts', JSON.stringify({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      tokenAddress: alert.token.address,
      tokenSymbol: alert.token.symbol,
      title: alert.title,
      message: alert.message,
      timestamp: alert.createdAt.toISOString()
    }));
    await redis.ltrim('recent_alerts', 0, 99); // Keep last 100

    return NextResponse.json({
      success: true,
      data: {
        id: alert.id,
        message: 'Alert created successfully',
        alert: {
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          token: alert.token,
          title: alert.title,
          message: alert.message,
          timestamp: alert.createdAt.toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH endpoint for updating alert status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, status, userId } = body;

    if (!alertId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Missing alertId or status'
      }, { status: 400 });
    }

    const validStatuses = ['ACTIVE', 'RESOLVED', 'DISMISSED', 'EXPIRED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status'
      }, { status: 400 });
    }

    const updateData: any = { 
      status,
      ...(status === 'RESOLVED' && { resolvedAt: new Date() })
    };

    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: updateData,
      select: {
        id: true,
        status: true,
        resolvedAt: true
      }
    });

    // Invalidate caches
    const keys = await redis.keys('alerts:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Alert status updated',
        alert
      }
    });

  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function formatTimeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getSeverityPriority(severity: string): number {
  const priorities = {
    'EMERGENCY': 1,
    'CRITICAL': 2,
    'HIGH': 3,
    'MEDIUM': 4,
    'LOW': 5
  };
  return priorities[severity as keyof typeof priorities] || 5;
}
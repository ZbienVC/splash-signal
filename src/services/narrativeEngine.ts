import { NarrativePerformance, NarrativeToken, MarketAlert } from "../types/signalos";

export class NarrativeEngine {
  private narratives: NarrativePerformance[] = [];
  private history: Map<string, { timestamp: number; mentions: number }[]> = new Map();
  private lastUpdate: number = 0;

  constructor() {}

  async syncFromClient(detectedNarratives: any[]) {
    console.log('[NarrativeEngine] Syncing intelligence from client...');
    
    try {
      const updatedNarratives: NarrativePerformance[] = [];
      const now = Date.now();
      
      for (const narrative of detectedNarratives) {
        const tokens = await this.findTokensForNarrative(narrative);
        
        // Track history for alerts
        const narrativeId = narrative.name!.toLowerCase();
        if (!this.history.has(narrativeId)) {
          this.history.set(narrativeId, []);
        }
        const history = this.history.get(narrativeId)!;
        history.push({ timestamp: now, mentions: narrative.newsMentions || 0 });
        
        // Keep only last 24 hours
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        this.history.set(narrativeId, history.filter(h => h.timestamp > oneDayAgo));

        // Calculate metrics
        const avgPriceChange = tokens.length > 0 
          ? tokens.reduce((acc, t) => acc + t.change24h, 0) / tokens.length 
          : 0;
        
        const totalMarketCap = tokens.reduce((acc, t) => acc + t.marketCap, 0);
        
        updatedNarratives.push({
          name: narrative.name!,
          description: narrative.description || '',
          socialMentions: narrative.newsMentions || 0,
          socialVelocity: narrative.socialVelocity || 0,
          volumeGrowth: narrative.volumeGrowth || 0,
          volumeChange24h: narrative.volumeGrowth || 0,
          sentiment: narrative.sentiment || 'neutral',
          priceMomentum: narrative.socialVelocity || 0,
          tokenLaunchCount: tokens.length,
          walletGrowth: Math.floor(Math.random() * 1000),
          tokens,
          tokenCount: tokens.length,
          avgPriceChange24h: avgPriceChange,
          marketCap: totalMarketCap,
          topTokens: tokens.slice(0, 3).map(t => t.symbol),
          trend: this.determineTrend(narrative, tokens)
        });
      }

      this.narratives = updatedNarratives;
      this.lastUpdate = now;
      
      return this.narratives;
    } catch (error) {
      console.error('[NarrativeEngine] Sync failed:', error);
      return this.narratives;
    }
  }

  async updateIntelligence() {
    console.log('[NarrativeEngine] Refreshing token data for narratives...');
    if (this.narratives.length === 0) return [];

    const updatedNarratives: NarrativePerformance[] = [];
    for (const narrative of this.narratives) {
      const tokens = await this.findTokensForNarrative(narrative);
      const avgPriceChange = tokens.length > 0 
        ? tokens.reduce((acc, t) => acc + t.change24h, 0) / tokens.length 
        : 0;
      const totalMarketCap = tokens.reduce((acc, t) => acc + t.marketCap, 0);

      updatedNarratives.push({
        ...narrative,
        tokens,
        tokenCount: tokens.length,
        avgPriceChange24h: avgPriceChange,
        marketCap: totalMarketCap,
        topTokens: tokens.slice(0, 3).map(t => t.symbol),
        trend: this.determineTrend(narrative, tokens)
      });
    }
    this.narratives = updatedNarratives;
    return this.narratives;
  }

  private async findTokensForNarrative(narrative: Partial<NarrativePerformance>): Promise<NarrativeToken[]> {
    const keywords = narrative.name?.split(' ') || [];
    const searchKeyword = keywords[0] || 'crypto';
    
    try {
      // Search DexScreener (includes Pump.fun tokens once they reach Raydium)
      const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${searchKeyword}`);
      if (!response.ok) return [];
      const data = await response.json();
      
      const pairs = (data.pairs || []).filter((p: any) => p.chainId === 'solana').slice(0, 10);
      
      return pairs.map((p: any) => ({
        id: p.pairAddress,
        narrativeId: narrative.name || 'unknown',
        name: p.baseToken.name,
        symbol: p.baseToken.symbol,
        mint: p.baseToken.address,
        priceUsd: parseFloat(p.priceUsd || '0'),
        change24h: p.priceChange?.h24 || 0,
        marketCap: p.fdv || 0,
        liquidity: p.liquidity?.usd || 0,
        volume24h: p.volume?.h24 || 0,
        launchTime: p.pairCreatedAt || Date.now() - (Math.random() * 86400000),
        matchReason: `Keyword match: ${searchKeyword}`,
        source: p.url.includes('pump.fun') ? 'pumpfun' : 'dexscreener',
        link: p.url
      }));
    } catch (e) {
      console.error(`[NarrativeEngine] Token search failed for ${narrative.name}:`, e);
      return [];
    }
  }

  private determineTrend(narrative: any, tokens: NarrativeToken[]): 'Rising' | 'Peaking' | 'Cooling' {
    const velocity = narrative.socialVelocity || 0;
    if (velocity > 80) return 'Rising';
    if (velocity > 50) return 'Peaking';
    return 'Cooling';
  }

  getNarratives() {
    return this.narratives;
  }

  generateAlerts(): MarketAlert[] {
    const alerts: MarketAlert[] = [];
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    
    for (const n of this.narratives) {
      const narrativeId = n.name.toLowerCase();
      const history = this.history.get(narrativeId) || [];
      
      // Step 6: Alert threshold - mentions increase > 300% within 1 hour
      const hourAgoPoint = history.find(h => h.timestamp >= oneHourAgo);
      if (hourAgoPoint && hourAgoPoint.mentions > 0) {
        const increase = ((n.socialMentions - hourAgoPoint.mentions) / hourAgoPoint.mentions) * 100;
        if (increase > 300) {
          alerts.push({
            id: `narrative-surge-${now}-${n.name}`,
            type: 'narrative_surge',
            token: {
              name: n.name,
              symbol: n.topTokens[0] || 'N/A',
              mint: 'N/A'
            },
            trigger: `Mention Surge: +${Math.round(increase)}% in 1h`,
            confidence: 0.95,
            priority: 'critical',
            description: `CRITICAL: Narrative "${n.name}" mentions increased by ${Math.round(increase)}% in the last hour. High probability of viral breakout.`,
            timestamp: now,
            source: 'Narrative Discovery Engine',
            link: '#'
          });
        }
      }

      // Legacy velocity alert
      if (n.socialVelocity > 90 && !alerts.find(a => a.id.includes(n.name))) {
        alerts.push({
          id: `narrative-velocity-${now}-${n.name}`,
          type: 'narrative_surge',
          token: {
            name: n.name,
            symbol: n.topTokens[0] || 'N/A',
            mint: 'N/A'
          },
          trigger: 'Social Velocity Spike > 90%',
          confidence: 0.88,
          priority: 'high',
          description: `Narrative "${n.name}" is showing extreme social velocity (${n.socialVelocity}%).`,
          timestamp: now,
          source: 'Narrative Discovery Engine',
          link: '#'
        });
      }
    }
    
    return alerts;
  }
}

export const narrativeEngine = new NarrativeEngine();

import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';
import { HunterToken, HunterLifecycleStage } from '../types/signalos';
import { narrativeEngine } from './narrativeEngine';

// Mocking the collectors for the environment
export class HunterService {
  private db: any;
  private ws: WebSocket | null = null;

  constructor(db: any) {
    this.db = db;
    this.updateSolPrice();
    // Update SOL price every 30 seconds
    setInterval(() => this.updateSolPrice(), 30000);
  }

  startPumpFunCollector() {
    console.log('[Hunter] Starting Pump.fun Collector...');
    const connect = () => {
      this.ws = new WebSocket('wss://pumpportal.fun/api/data');

      this.ws.on('open', () => {
        console.log('[Hunter] Pump.fun WebSocket connected');
        this.ws?.send(JSON.stringify({ method: "subscribeNewToken" }));
        this.ws?.send(JSON.stringify({ method: "subscribeTokenTrade" }));
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.method === "newToken" || (message.mint && message.name)) {
            this.handlePumpFunEvent(message);
          } else if (message.txType === "buy" || message.txType === "sell") {
            this.handlePumpFunTrade(message);
          }
        } catch (e) {
          console.error('[Hunter] Failed to parse Pump.fun message:', e);
        }
      });

      this.ws.on('error', (err) => {
        console.error('[Hunter] Pump.fun WebSocket error:', err);
      });

      this.ws.on('close', () => {
        console.log('[Hunter] Pump.fun WebSocket closed. Reconnecting in 5s...');
        setTimeout(connect, 5000);
      });
    };

    connect();
  }

  startDexScreenerCollector() {
    console.log('[Hunter] Starting DexScreener Collector...');
    const refresh = async () => {
      try {
        // Fetch trending Solana tokens
        const res = await fetch('https://api.dexscreener.com/latest/dex/search?q=solana');
        if (res.ok) {
          const data = await res.json();
          if (data.pairs) {
            for (const pair of data.pairs.slice(0, 20)) {
              if (pair.chainId === 'solana') {
                await this.discoverToken(
                  pair.baseToken.address,
                  pair.baseToken.name,
                  pair.baseToken.symbol,
                  'DexScreener'
                );
              }
            }
          }
        }
      } catch (e) {
        console.error('[Hunter] DexScreener collection failed:', e);
      }
      setTimeout(refresh, 60000); // Refresh every minute
    };
    refresh();
  }

  private solPrice: number = 185;
  private lastSolPriceUpdate: number = 0;

  private async updateSolPrice() {
    const now = Date.now();
    if (now - this.lastSolPriceUpdate < 30000) return; // Update every 30 seconds
    try {
      const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT');
      if (res.ok) {
        const data = await res.json();
        if (data.price) {
          this.solPrice = parseFloat(data.price);
          this.lastSolPriceUpdate = now;
          console.log(`[Hunter] Updated SOL price: $${this.solPrice}`);
        }
      }
    } catch (e) {
      console.error('[Hunter] Failed to update SOL price:', e);
    }
  }

  private ensureScheme(url: string): string {
    if (!url) return '';
    // If it's already a full URL, return it
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // Handle IPFS
    if (url.startsWith('ipfs://')) return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    // If it's a CID (common in Solana metadata)
    if (url.length === 46 && url.startsWith('Qm')) return `https://ipfs.io/ipfs/${url}`;
    // If it looks like a relative path or just a filename, it's likely invalid for direct fetch without a base
    if (!url.includes('.')) return ''; 
    
    return `https://${url}`;
  }

  private async fetchMetadata(url: string, retries = 2): Promise<any> {
    const fullUrl = this.ensureScheme(url);
    if (!fullUrl) return null;

    const gateways = [
      fullUrl,
      fullUrl.includes('ipfs.io') ? fullUrl.replace('ipfs.io', 'gateway.pinata.cloud') : null,
      fullUrl.includes('ipfs.io') ? fullUrl.replace('ipfs.io', 'cloudflare-ipfs.com') : null,
    ].filter(Boolean) as string[];

    for (const gatewayUrl of gateways) {
      for (let i = 0; i < retries; i++) {
        try {
          const res = await fetch(gatewayUrl, { 
            headers: { 'Accept': 'application/json' }
          });
          if (res.ok) {
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              return await res.json();
            }
          }
        } catch (e: any) {
          if (i === retries - 1 && gatewayUrl === gateways[gateways.length - 1]) {
            // Only throw on the last attempt of the last gateway
            throw e;
          }
          // Wait a bit before retry
          await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        }
      }
    }
    return null;
  }

  private normalizeUnits(vSol: number, vToken: number, solAmount?: number) {
    let normalizedVSol = vSol;
    let normalizedVToken = vToken;
    let normalizedSolAmount = solAmount || 0;

    // Normalize SOL (if > 1M, it's lamports)
    if (normalizedVSol > 1000000) normalizedVSol /= 1e9;
    if (normalizedSolAmount > 1000000) normalizedSolAmount /= 1e9;

    // Normalize Tokens (if > 1e12, it's raw units with 6 decimals)
    if (normalizedVToken > 1e12) normalizedVToken /= 1e6;

    return {
      vSol: normalizedVSol,
      vToken: normalizedVToken,
      solAmount: normalizedSolAmount
    };
  }

  public async handlePumpFunEvent(data: any) {
    await this.updateSolPrice();
    console.log('[Hunter] Full New Token Data:', JSON.stringify(data));
    const mint = data.mint;
    const name = data.name;
    const symbol = data.symbol;
    const traderPublicKey = data.traderPublicKey;
    const vSolInBondingCurveRaw = Number(data.vSolInBondingCurve || 0);
    const vTokenInBondingCurveRaw = Number(data.vTokensInBondingCurve || data.vTokenInBondingCurve || 0);
    const marketCapSol = Number(data.marketCapSol || 0);
    const uri = data.uri;

    const { vSol, vToken } = this.normalizeUnits(vSolInBondingCurveRaw, vTokenInBondingCurveRaw);
    
    console.log(`[Hunter] New token event for ${symbol} (${mint}): vSol=${vSol}, mcSol=${marketCapSol}`);
    
    // 1. Discover or Update Token
    await this.discoverToken(mint, name, symbol, traderPublicKey);

    // Fetch image from URI
    let image = undefined;
    if (uri) {
      try {
        const metaData = await this.fetchMetadata(uri);
        if (metaData && metaData.image) {
          image = metaData.image;
        }
      } catch (e: any) {
        // Only log if it's not a timeout or a common DNS failure for junk data
        const isCommonError = e.name === 'TimeoutError' || 
                            e.message.includes('getaddrinfo') || 
                            e.message.includes('fetch failed') ||
                            e.message.includes('undici');
        
        if (!isCommonError) {
          console.error(`[Hunter] Failed to fetch metadata for ${mint}:`, e.message);
        } else {
          // Log a more subtle warning for common network issues
          console.warn(`[Hunter] Metadata fetch skipped for ${mint} (Network/Link Issue)`);
        }
      }
    }

    const solPrice = this.solPrice; 
    let liquidity = 0;
    let priceUsd = 0;
    let fdv = 0;

    if (vSol > 0 && vToken > 0) {
      const priceSol = vSol / vToken;
      priceUsd = priceSol * solPrice;
      // Total supply is 1B tokens
      fdv = priceSol * 1000000000 * solPrice; 
      // Liquidity is usually 2x the SOL in the bonding curve (SOL + Token value)
      liquidity = vSol * solPrice * 2;
    } else if (marketCapSol > 0) {
      // If marketCapSol is provided, it's usually the FDV in SOL
      // Normalize marketCapSol too if needed
      const normalizedMcSol = marketCapSol > 1000000 ? marketCapSol / 1e9 : marketCapSol;
      fdv = normalizedMcSol * solPrice;
      priceUsd = fdv / 1000000000;
      liquidity = fdv * 0.1;
    }

    // 2. Log the event
    this.logEvent(mint, 'PUMPFUN_LAUNCH', {
      creator: traderPublicKey,
      vSol,
      vToken,
      initialPrice: priceUsd,
      liquidity
    });

    // 3. Update Lifecycle and Market Data
    const token = this.getToken(mint);
    if (token) {
      if (token.lifecycle.stage === 'DISCOVERED') {
        token.lifecycle.stage = 'PUMPFUN_LAUNCH';
        token.lifecycle.lastTransition = Date.now();
        token.signals.push({ type: 'PUMPFUN_LAUNCH', timestamp: Date.now() });
      }
      
      const currentVolume = token.market?.volume24h || 0;
      token.market = {
        priceUsd,
        liquidity,
        volume24h: currentVolume,
        fdv
      };

      if (image) token.image = image;

      // Calculate bonding curve progress (85 SOL is the target, starts at 30 virtual SOL)
      // If vSol is absolute, it starts at 30. If it's relative, it starts at 0.
      const progressBase = vSol >= 30 ? vSol - 30 : vSol;
      token.bondingCurveProgress = Math.min(100, Math.max(0, (progressBase / 55) * 100));

      console.log(`[Hunter] Set market data for ${symbol}: FDV=$${token.market.fdv.toFixed(2)}, Progress=${token.bondingCurveProgress.toFixed(1)}%`);

      // Developer Reputation
      if (traderPublicKey) {
        token.devReputation = this.getDeveloperReputation(traderPublicKey);
        this.updateDeveloperStats(traderPublicKey, mint, fdv);
      }

      token.alphaRating = this.calculateAlphaRating(token, data);
      token.pumpProbability = this.calculatePumpProbability(token);
      token.athMc = Math.max(token.athMc || 0, fdv);
      
      this.saveToken(token);
    }
  }

  public async handlePumpFunTrade(data: any) {
    await this.updateSolPrice();
    console.log('[Hunter] Full Trade Data:', JSON.stringify(data));
    const mint = data.mint;
    const vSolInBondingCurveRaw = Number(data.vSolInBondingCurve || 0);
    const vTokenInBondingCurveRaw = Number(data.vTokensInBondingCurve || data.vTokenInBondingCurve || 0);
    const solAmountRaw = Number(data.solAmount || 0);
    const marketCapSol = Number(data.marketCapSol || 0);
    const traderPublicKey = data.traderPublicKey;
    const txType = data.txType; // buy or sell
    const solPrice = this.solPrice; 

    const { vSol, vToken, solAmount } = this.normalizeUnits(vSolInBondingCurveRaw, vTokenInBondingCurveRaw, solAmountRaw);
    const tradeValue = solAmount * solPrice;

    console.log(`[Hunter] Trade for ${mint}: solAmount=${solAmount}, vSol=${vSol}, mcSol=${marketCapSol}`);

    const token = this.getToken(mint);
    if (!token) return;

    if (!token.market) {
      token.market = { priceUsd: 0, liquidity: 0, volume24h: 0, fdv: 0 };
    }

    const oldPrice = token.market.priceUsd;
    token.market.volume24h += tradeValue;
    
    // Use vSol if available, otherwise fallback to marketCapSol
    if (vSol > 0 && vToken > 0) {
      token.market.priceUsd = (vSol / vToken) * solPrice;
      token.market.liquidity = vSol * solPrice * 2;
      token.market.fdv = token.market.priceUsd * 1e9;
    } else if (marketCapSol > 0) {
      const normalizedMcSol = marketCapSol > 1000000 ? marketCapSol / 1e9 : marketCapSol;
      token.market.fdv = normalizedMcSol * solPrice;
      token.market.priceUsd = token.market.fdv / 1e9;
      token.market.liquidity = token.market.fdv * 0.1; // Estimate 10% liquidity
    }

    // ATH Tracking
    if (token.market.fdv > (token.athMc || 0)) {
      token.athMc = token.market.fdv;
      token.signals.push({ type: 'NEW_ATH', timestamp: Date.now(), payload: { mc: token.athMc } });
    }

    // Update bonding curve progress
    const progressBase = vSol >= 30 ? vSol - 30 : vSol;
    token.bondingCurveProgress = Math.min(100, Math.max(0, (progressBase / 55) * 100));

    // Wallet Tracking
    if (traderPublicKey) {
      const walletTier = this.getWalletTier(traderPublicKey);
      this.trackWalletTrade(traderPublicKey, mint, tradeValue, txType);
      
      if (walletTier === 'Legend' || walletTier === 'Smart') {
        if (!token.smartWalletSignals) {
          token.smartWalletSignals = { count: 0, tier: 'Neutral', wallets: [] };
        }
        if (!token.smartWalletSignals.wallets.includes(traderPublicKey)) {
          token.smartWalletSignals.wallets.push(traderPublicKey);
          token.smartWalletSignals.count++;
          token.smartWalletSignals.tier = token.smartWalletSignals.count > 3 ? 'Legendary' : 'Smart';
          token.signals.push({ 
            type: 'SMART_WALLET_ENTRY', 
            timestamp: Date.now(), 
            payload: { wallet: traderPublicKey, tier: walletTier } 
          });
        }
      }
    }

    // Momentum Detection
    if (oldPrice > 0) {
      const priceChange = ((token.market.priceUsd - oldPrice) / oldPrice) * 100;
      if (priceChange > 5 && tradeValue > 100) {
        token.signals.push({ 
          type: 'MOMENTUM_SPIKE', 
          timestamp: Date.now(),
          payload: { priceChange, tradeValue }
        });
      }
    }

    // Whale Detection
    if (tradeValue > 500) {
      token.signals.push({ 
        type: 'WHALE_BUY', 
        timestamp: Date.now(),
        payload: { value: tradeValue }
      });
    }

    token.alphaRating = this.calculateAlphaRating(token, data);
    token.pumpProbability = this.calculatePumpProbability(token);
    token.updatedAt = Date.now();
    
    this.saveToken(token);
  }

  private getDeveloperReputation(address: string): any {
    const row = this.db.prepare('SELECT * FROM hunter_developers WHERE address = ?').get(address) as any;
    if (!row) {
      // Generate a more varied initial reputation for demo purposes
      const rand = Math.random();
      let label = 'Neutral';
      if (rand > 0.9) label = 'Trusted';
      else if (rand > 0.75) label = 'Suspicious';
      
      return {
        score: label === 'Trusted' ? 80 : label === 'Suspicious' ? 30 : 50,
        label: label === 'Neutral' ? 'Neutral Dev' : label,
        totalTokens: 0,
        rugs: 0,
        maxMc: 0
      };
    }
    return {
      score: row.tier === 'Trusted' ? 90 : row.tier === 'Rugger' ? 10 : 50,
      label: row.tier,
      totalTokens: row.tokens_deployed,
      rugs: row.rugs,
      maxMc: row.max_mc_achieved
    };
  }

  private updateDeveloperStats(address: string, mint: string, mc: number) {
    const now = Date.now();
    const row = this.db.prepare('SELECT * FROM hunter_developers WHERE address = ?').get(address);
    if (!row) {
      this.db.prepare(`
        INSERT INTO hunter_developers (address, tier, tokens_deployed, rugs, successful_launches, max_mc_achieved, last_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(address, 'Neutral', 1, 0, 0, mc, now);
    } else {
      const tokens = row.tokens_deployed + 1;
      const maxMc = Math.max(row.max_mc_achieved, mc);
      const successful = row.successful_launches + (mc > 100000 ? 1 : 0);
      const tier = successful > 2 ? 'Trusted' : row.rugs > 1 ? 'Rugger' : 'Neutral';
      
      this.db.prepare(`
        UPDATE hunter_developers 
        SET tokens_deployed = ?, max_mc_achieved = ?, successful_launches = ?, tier = ?, last_active = ?
        WHERE address = ?
      `).run(tokens, maxMc, successful, tier, now, address);
    }
  }

  private getWalletTier(address: string): string {
    const row = this.db.prepare('SELECT tier FROM hunter_wallets WHERE address = ?').get(address);
    return row ? row.tier : 'Neutral';
  }

  private trackWalletTrade(address: string, mint: string, value: number, type: 'buy' | 'sell') {
    const now = Date.now();
    const token = this.getToken(mint);
    const mc = token?.market?.fdv || 0;
    const symbol = token?.symbol || 'UNKNOWN';

    // Log activity
    try {
      const activityId = uuidv4();
      this.db.prepare(`
        INSERT INTO wallet_activity (id, wallet_address, token_mint, token_symbol, type, amount_usd, market_cap_at_event, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(activityId, address, mint, symbol, type.toUpperCase(), value, mc, now);
    } catch (e) {
      console.error('[Hunter] Failed to log wallet activity:', e);
    }

    const row = this.db.prepare('SELECT * FROM hunter_wallets WHERE address = ?').get(address) as any;
    if (!row) {
      const isEarly = type === 'buy' && mc < 100000;
      const tier = value > 2000 ? 'Smart' : 'Neutral';
      const initialScore = isEarly ? 20 : 0;
      this.db.prepare(`
        INSERT INTO hunter_wallets (address, tier, total_trades, profitable_trades, early_entries, pnl_usd, win_rate, score, last_seen)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(address, tier, 1, 0, isEarly ? 1 : 0, 0, 0, initialScore, now);
    } else {
      const trades = row.total_trades + 1;
      const isEarly = type === 'buy' && mc < 100000;
      const earlyEntries = row.early_entries + (isEarly ? 1 : 0);
      
      // Simplified PnL/WinRate logic for demo
      let profitableTrades = row.profitable_trades;
      let pnlUsd = row.pnl_usd;
      if (type === 'sell' && Math.random() > 0.4) { 
        profitableTrades++;
        pnlUsd += value * 0.2; 
      }

      const winRate = (profitableTrades / trades) * 100;
      const earlyEntryRate = (earlyEntries / trades) * 100;
      
      // WalletScore = profitability (pnl/1000) + win rate + early entry %
      const score = (pnlUsd / 1000) + winRate + earlyEntryRate;
      const tier = score > 150 ? 'Legend' : score > 80 ? 'Smart' : 'Neutral';
      
      this.db.prepare(`
        UPDATE hunter_wallets 
        SET total_trades = ?, profitable_trades = ?, early_entries = ?, pnl_usd = ?, win_rate = ?, score = ?, tier = ?, last_seen = ?
        WHERE address = ?
      `).run(trades, profitableTrades, earlyEntries, pnlUsd, winRate, score, tier, now, address);
    }
  }

  private calculatePumpProbability(token: HunterToken): number {
    // Start with bonding curve progress as the base (0-100)
    let score = token.bondingCurveProgress || 0;

    if (token.market) {
      // Market Cap acceleration (bonus points)
      if (token.market.fdv > 50000) score += 10;
      if (token.market.fdv > 200000) score += 10;
      
      // Volume velocity
      if (token.market.volume24h > 5000) score += 5;
      if (token.market.volume24h > 20000) score += 10;
    }

    // Alpha Rating bonus
    if (token.alphaRating?.label === 'S') score += 15;
    if (token.alphaRating?.label === 'A') score += 10;

    // Smart Wallets
    if (token.smartWalletSignals) {
      score += token.smartWalletSignals.count * 3;
    }

    // Dev Reputation
    if (token.devReputation?.label === 'Trusted') score += 15;
    if (token.devReputation?.label === 'Suspicious') score -= 20;
    if (token.devReputation?.label === 'Rugger') score -= 50;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private calculateAlphaRating(token: HunterToken, eventData?: any): any {
    // AlphaScore = volume momentum + wallet growth + liquidity depth + narrative alignment + dev behavior
    
    // 1. Volume Momentum (0-20)
    const volume = token.market?.volume24h || 0;
    const volumeMomentum = Math.min(20, (volume / 10000) * 20); // 10k vol = 20 points
    
    // 2. Wallet Growth (0-20)
    const walletGrowth = Math.min(20, (token.smartWalletSignals?.count || 0) * 4); // 5 smart wallets = 20 points
    
    // 3. Liquidity Depth (0-20)
    const liquidity = token.market?.liquidity || 0;
    const liquidityDepth = Math.min(20, (liquidity / 50000) * 20); // 50k liquidity = 20 points
    
    // 4. Narrative Alignment (0-20)
    const activeNarratives = (narrativeEngine as any).getNarratives?.() || [];
    const name = token.name.toLowerCase();
    const symbol = token.symbol.toLowerCase();
    const isAligned = activeNarratives.some((n: any) => 
      name.includes(n.name.toLowerCase()) || 
      symbol.includes(n.name.toLowerCase().slice(0, 3))
    );
    const narrativeAlignment = isAligned ? 20 : 0;

    // 5. Developer Behavior (0-20)
    let devBehavior = 10; // Neutral start
    if (token.devReputation?.label === 'Trusted') devBehavior = 20;
    if (token.devReputation?.label === 'Suspicious') devBehavior = 5;
    if (token.devReputation?.label === 'Rugger') devBehavior = 0;

    const score = Math.round(volumeMomentum + walletGrowth + liquidityDepth + narrativeAlignment + devBehavior);
    const reasoning = [
      `Volume Momentum: ${volumeMomentum.toFixed(1)}/20`,
      `Wallet Growth: ${walletGrowth.toFixed(1)}/20`,
      `Liquidity Depth: ${liquidityDepth.toFixed(1)}/20`,
      `Narrative Alignment: ${narrativeAlignment.toFixed(1)}/20`,
      `Dev Behavior: ${devBehavior}/20`
    ];

    let label: 'S' | 'A' | 'B' | 'C' | 'D' = 'D';
    if (score >= 80) label = 'S';
    else if (score >= 60) label = 'A';
    else if (score >= 40) label = 'B';
    else if (score >= 20) label = 'C';

    return { score, label, reasoning };
  }

  private logEvent(mint: string, type: string, payload: any) {
    const id = uuidv4();
    const now = Date.now();
    try {
      this.db.prepare(`
        INSERT INTO hunter_events (id, mint, type, payload_json, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, mint, type, JSON.stringify(payload), now);
    } catch (e) {
      console.error(`[Hunter] Failed to log event for ${mint}:`, e);
    }
  }

  async discoverToken(mint: string, name: string, symbol: string, creator?: string) {
    const now = Date.now();
    console.log(`[Hunter] Discovering token: ${name} (${symbol}) - ${mint}`);
    
    // Check if exists
    const existing = this.db.prepare('SELECT mint FROM hunter_tokens WHERE mint = ?').get(mint);
    if (existing) {
      console.log(`[Hunter] Token ${symbol} already exists, skipping discovery.`);
      return;
    }

    const token: HunterToken = {
      mint,
      name,
      symbol,
      creator,
      createdAt: now,
      updatedAt: now,
      lifecycle: {
        stage: 'DISCOVERED',
        lastTransition: now
      },
      signals: [{ type: 'NEW_LAUNCH', timestamp: now }],
      // Default market data for new discoveries to ensure they pass filters
      market: {
        priceUsd: 0.000005,
        liquidity: 5000,
        volume24h: 0,
        fdv: 5000
      }
    };

    this.saveToken(token);
    
    // Start async enrichment
    this.enrichToken(mint);
  }

  async enrichToken(mint: string) {
    console.log(`[Hunter] Enriching token: ${mint}`);
    try {
      // 1. DexScreener Enrichment
      const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
      if (!dexRes.ok) {
        if (dexRes.status !== 404) {
          console.warn(`[Hunter] DexScreener API returned ${dexRes.status} for ${mint}`);
        }
        return;
      }
      
      const dexData = await dexRes.json();
      
      const token = this.getToken(mint);
      if (!token) return;

      if (dexData.pairs && dexData.pairs.length > 0) {
        const pair = dexData.pairs[0];
        token.market = {
          priceUsd: parseFloat(pair.priceUsd),
          liquidity: pair.liquidity?.usd || 0,
          volume24h: pair.volume?.h24 || 0,
          fdv: pair.fdv || 0,
          pairAddress: pair.pairAddress
        };
        token.socials = {
          website: pair.info?.websites?.[0]?.url,
          twitter: pair.info?.socials?.find((s: any) => s.type === 'twitter')?.url,
          telegram: pair.info?.socials?.find((s: any) => s.type === 'telegram')?.url,
        };
        token.lifecycle.stage = 'DEXSCREENER_INDEXED';
        token.lifecycle.lastTransition = Date.now();
      }

      // 2. Risk Triage
      token.risk = this.calculateRisk(token);

      // 3. Classification
      token.classification = await this.classifyToken(token);

      token.updatedAt = Date.now();
      this.saveToken(token);
      
      console.log(`[Hunter] Enrichment complete for: ${token.symbol}`);
    } catch (e) {
      console.error(`[Hunter] Enrichment failed for ${mint}:`, e);
    }
  }

  private calculateRisk(token: HunterToken) {
    let score = 20; // Base risk
    const tags = [];

    if (!token.socials?.website) {
      score += 15;
      tags.push('NO_WEBSITE');
    }
    if (token.market && token.market.liquidity < 5000) {
      score += 25;
      tags.push('LOW_LIQUIDITY');
    }
    
    // Mocking on-chain checks
    const mintAuth = Math.random() > 0.8;
    const freezeAuth = Math.random() > 0.9;
    
    if (mintAuth) {
      score += 40;
      tags.push('MINT_ENABLED');
    }
    if (freezeAuth) {
      score += 30;
      tags.push('FREEZE_ENABLED');
    }

    return {
      score: Math.min(100, score),
      tags,
      mintAuthority: mintAuth,
      freezeAuthority: freezeAuth,
      topHolderPercent: 15 + Math.random() * 40,
      isRenounced: !mintAuth && !freezeAuth
    };
  }

  private async classifyToken(token: HunterToken): Promise<any> {
    // Heuristic first
    const name = token.name.toLowerCase();
    if (name.includes('ai') || name.includes('gpt')) return { category: 'AI', confidence: 0.9, reasoning: 'Name contains AI keywords' };
    if (name.includes('pepe') || name.includes('dog') || name.includes('inu')) return { category: 'MEME', confidence: 0.95, reasoning: 'Name contains meme keywords' };

    return { category: 'UNKNOWN', confidence: 0.5, reasoning: 'Insufficient data for classification' };
  }

  updateTokenClassification(mint: string, classification: any) {
    const token = this.getToken(mint);
    if (!token) return;
    token.classification = classification;
    token.updatedAt = Date.now();
    this.saveToken(token);
  }

  private saveToken(token: HunterToken) {
    console.log(`[Hunter] Saving token to DB: ${token.symbol} (${token.mint})`);
    this.db.prepare(`
      INSERT OR REPLACE INTO hunter_tokens (
        mint, name, symbol, image, description, creator, created_at, updated_at,
        socials_json, market_json, risk_json, classification_json,
        lifecycle_stage, lifecycle_updated_at, signals_json, alpha_rating_json,
        dev_reputation_json, smart_wallet_signals_json, pump_probability, 
        bonding_curve_progress, market_cap, ath_mc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      token.mint,
      token.name,
      token.symbol,
      token.image || null,
      token.description || null,
      token.creator || null,
      token.createdAt,
      token.updatedAt,
      JSON.stringify(token.socials || {}),
      JSON.stringify(token.market || {}),
      JSON.stringify(token.risk || {}),
      JSON.stringify(token.classification || {}),
      token.lifecycle.stage,
      token.lifecycle.lastTransition,
      JSON.stringify(token.signals),
      JSON.stringify(token.alphaRating || null),
      JSON.stringify(token.devReputation || null),
      JSON.stringify(token.smartWalletSignals || null),
      token.pumpProbability || 0,
      token.bondingCurveProgress || 0,
      token.market?.fdv || 0,
      token.athMc || 0
    );
  }

  getToken(mint: string): HunterToken | null {
    const row = this.db.prepare('SELECT * FROM hunter_tokens WHERE mint = ?').get(mint);
    if (!row) return null;
    return this.mapRowToToken(row);
  }

  getRecentTokens(limit: number = 500): HunterToken[] {
    // Order by updatedAt to catch momentum tokens, but keep a bias for new ones
    // Increased limit to 500 to ensure the frontend has a massive pool to filter from
    const rows = this.db.prepare('SELECT * FROM hunter_tokens ORDER BY updated_at DESC LIMIT ?').all(limit);
    return rows.map((row: any) => this.mapRowToToken(row));
  }

  getRankedTokens(limit: number = 10): HunterToken[] {
    // Rank by a combination of Alpha Score and Market Cap
    // We parse the alpha_rating_json to get the score
    const rows = this.db.prepare(`
      SELECT *, 
      CAST(json_extract(alpha_rating_json, '$.score') AS FLOAT) as alpha_score
      FROM hunter_tokens 
      WHERE market_cap > 0
      ORDER BY alpha_score DESC, market_cap DESC 
      LIMIT ?
    `).all(limit);
    return rows.map((row: any) => this.mapRowToToken(row));
  }

  private mapRowToToken(row: any): HunterToken {
    return {
      mint: row.mint,
      name: row.name,
      symbol: row.symbol,
      image: row.image,
      description: row.description,
      creator: row.creator,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      socials: JSON.parse(row.socials_json || '{}'),
      market: JSON.parse(row.market_json || '{}'),
      risk: JSON.parse(row.risk_json || '{}'),
      classification: JSON.parse(row.classification_json || '{}'),
      lifecycle: {
        stage: row.lifecycle_stage,
        lastTransition: row.lifecycle_updated_at
      },
      signals: JSON.parse(row.signals_json || '[]'),
      alphaRating: row.alpha_rating_json ? JSON.parse(row.alpha_rating_json) : undefined,
      devReputation: row.dev_reputation_json ? JSON.parse(row.dev_reputation_json) : undefined,
      smartWalletSignals: row.smart_wallet_signals_json ? JSON.parse(row.smart_wallet_signals_json) : undefined,
      pumpProbability: row.pump_probability,
      bondingCurveProgress: row.bonding_curve_progress,
      athMc: row.ath_mc
    };
  }
}

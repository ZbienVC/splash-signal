import { 
  GlobalIntelligence, 
  NarrativeIntelligence, 
  WhaleTransaction, 
  MarketAlert,
  HunterToken
} from '../types/signalos';
import { v4 as uuidv4 } from 'uuid';

export class IngestionService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // --- Cache Helpers ---
  private getCache(key: string, maxAgeMs: number = 15 * 60 * 1000) {
    const row = this.db.prepare('SELECT * FROM data_cache WHERE key = ?').get(key) as any;
    if (!row) return null;
    
    const now = Date.now();
    if (now - row.fetched_at > maxAgeMs) return null;
    
    return JSON.parse(row.payload_json);
  }

  private setCache(key: string, payload: any) {
    this.db.prepare('INSERT OR REPLACE INTO data_cache (key, payload_json, fetched_at) VALUES (?, ?, ?)')
      .run(key, JSON.stringify(payload), Date.now());
  }

  // --- Ingestion Tasks ---

  /**
   * Fetch DEX price data (every 30 seconds)
   * Sources: DexScreener
   */
  async ingestDexPrices() {
    console.log('[Ingestion] Fetching DEX prices...');
    try {
      // In a real app, we'd fetch top pairs or specific watchlist
      // For now, we simulate or fetch a sample
      const response = await fetch('https://api.dexscreener.com/latest/dex/search?q=solana');
      if (response.ok) {
        const data = await response.json();
        this.setCache('dex-prices', data.pairs || []);
      }
    } catch (e) {
      console.error('[Ingestion] DexScreener fetch failed:', e);
    }
  }

  /**
   * Fetch Solana transactions (every 10 seconds)
   * Sources: Solana RPC
   */
  async ingestSolanaTransactions() {
    // console.log('[Ingestion] Fetching Solana transactions...');
    // Real implementation would use @solana/web3.js to getRecentBlockhash or getSignaturesForAddress
    // For this demo, we'll simulate high-frequency transaction ingestion
    const mockTx = {
      id: uuidv4(),
      timestamp: Date.now(),
      count: Math.floor(Math.random() * 500) + 2000,
      tps: Math.floor(Math.random() * 100) + 2500
    };
    this.setCache('solana-tx-state', mockTx);
  }

  /**
   * Fetch Narrative signals (every 5 minutes)
   * Sources: Google Trends, GDELT
   */
  async ingestNarratives() {
    console.log('[Ingestion] Fetching Narrative signals...');
    // This would call Google Trends API (or scrape) and GDELT
    // We'll use the existing refreshNarrativeIntelligence logic but integrated here
    const now = Date.now();
    const narratives: NarrativeIntelligence = {
      signals: [
        {
          id: 'nar-ai-agents',
          name: 'AI Agents',
          momentumScore: 'High',
          momentumValue: 92,
          description: 'Autonomous AI entities performing on-chain tasks.',
          keywords: ['ai agent', 'eliza', 'zerebro'],
          sources: [{ name: 'Google Trends', link: 'https://trends.google.com' }],
          detectedAt: now
        }
      ],
      news: [
        {
          id: uuidv4(),
          title: 'AI Agents Dominate Solana Volume',
          summary: 'New frameworks are driving massive adoption.',
          source: 'GDELT',
          link: 'https://gdeltproject.org',
          timestamp: now,
          sentiment: 'positive',
          relevance: 0.9
        }
      ],
      tokens: [],
      timestamp: now
    };
    this.setCache('narrative-intelligence', narratives);
  }

  /**
   * Fetch News feeds (every 10 minutes)
   * Sources: GDELT, RSS
   */
  async ingestNews() {
    console.log('[Ingestion] Fetching News feeds...');
    // Simulated news ingestion
    const news = [
      {
        id: uuidv4(),
        title: 'Global Crypto Regulation Update',
        summary: 'New guidelines released for stablecoin issuers.',
        source: 'Reuters',
        link: 'https://reuters.com',
        timestamp: Date.now(),
        sentiment: 'neutral',
        relevance: 0.8
      }
    ];
    this.setCache('global-news', news);
  }

  /**
   * Market State (every 5 minutes)
   * Sources: CoinGecko, DefiLlama
   */
  async ingestMarketState() {
    console.log('[Ingestion] Fetching Market State...');
    try {
      // Fetch real prices from CoinGecko
      const cgResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,solana,ethereum&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true');
      
      let btcPrice = 98000;
      let solPrice = 180;
      let ethPrice = 2800;
      let btcChange = 0;
      let solChange = 0;

      if (cgResponse.ok) {
        const cgData = await cgResponse.json();
        btcPrice = cgData.bitcoin?.usd || btcPrice;
        solPrice = cgData.solana?.usd || solPrice;
        ethPrice = cgData.ethereum?.usd || ethPrice;
        btcChange = cgData.bitcoin?.usd_24h_change || 0;
        solChange = cgData.solana?.usd_24h_change || 0;
      }

      // Fetch Global Market Cap (TOTAL)
      const globalResponse = await fetch('https://api.coingecko.com/api/v3/global');
      let btcDom = 54.2;
      if (globalResponse.ok) {
        const globalData = await globalResponse.json();
        btcDom = globalData.data?.market_cap_percentage?.btc || btcDom;
      }

      const now = Date.now();
      
      // Create a snapshot for history
      const snapshot = {
        timestamp: now,
        btc: btcPrice,
        sol: solPrice,
        eth: ethPrice,
        btc_change: btcChange,
        sol_change: solChange,
        btc_dom: btcDom,
        volume_24h: 84.2 * 1e9 // Mock for now or fetch
      };

      // Store in history table
      this.db.prepare('INSERT INTO market_intelligence_history (data_json, timestamp) VALUES (?, ?)').run(
        JSON.stringify(snapshot),
        now
      );

      // Update current state cache
      const state: GlobalIntelligence = {
        marketMode: {
          mode: btcChange > 2 && solChange > 5 ? 'Risk-On' : btcChange < -2 ? 'Risk-Off' : 'Neutral',
          confidence: 85,
          signals: [
            { 
              label: 'BTC Price', 
              value: `$${btcPrice.toLocaleString()}`, 
              change24h: `${btcChange.toFixed(1)}%`, 
              interpretation: btcChange > 0 ? 'Bullish Momentum' : 'Consolidation', 
              status: btcChange > 0 ? 'positive' : 'negative',
              sourceLink: 'https://www.coingecko.com/en/coins/bitcoin'
            },
            { 
              label: 'SOL Price', 
              value: `$${solPrice.toLocaleString()}`, 
              change24h: `${solChange.toFixed(1)}%`, 
              interpretation: solChange > 0 ? 'Ecosystem Growth' : 'Healthy Pullback', 
              status: solChange > 0 ? 'positive' : 'negative',
              sourceLink: 'https://www.coingecko.com/en/coins/solana'
            },
            { 
              label: 'BTC Dominance', 
              value: `${btcDom.toFixed(1)}%`, 
              change24h: '0.2%', 
              interpretation: btcDom > 55 ? 'BTC Leading' : 'Alt Rotation Potential', 
              status: btcDom > 55 ? 'negative' : 'positive',
              sourceLink: 'https://www.coingecko.com/en/global-charts'
            }
          ]
        },
        altStrength: {
          index: Math.round(40 + (solChange * 2)),
          trend: solChange > 0 ? 'rising' : 'falling',
          comparisonData: [] // Will be populated by server from history
        },
        narratives: [],
        narrativeRotation: [],
        memeHealth: {
          launchesPerHour: 45,
          launches24h: 1200,
          bondedCount24h: 150,
          avgSurvivalTime: '4h',
          medianMarketCap: 15000,
          medianLiquidity: 4500,
          bondingSuccessRate: 12.5,
          launchRateData: [],
          timestamp: now
        },
        whaleActivity: {
          totalBuyVolume: 15000000,
          totalSellVolume: 12000000,
          topAccumulatedTokens: [],
          whaleFlowData: [],
          recentTransactions: []
        },
        alerts: [],
        timestamp: now
      };
      this.setCache('market-state', state);
    } catch (e) {
      console.error('[Ingestion] Market state fetch failed:', e);
    }
  }

  /**
   * Token Launches
   * Sources: Pump.fun
   */
  async ingestTokenLaunches() {
    console.log('[Ingestion] Fetching Token Launches...');
    // In a real app, this would listen to Pump.fun program logs via Websocket
    const launches: any[] = [
      {
        mint: 'PUMP_' + uuidv4().slice(0, 8),
        name: 'New Pump Token',
        symbol: 'PUMP',
        createdAt: Date.now(),
        lifecycle: { stage: 'PUMPFUN_LAUNCH', lastTransition: Date.now() }
      }
    ];
    this.setCache('token-launches', launches);
  }

  // --- Scheduler ---
  start() {
    // DEX price data → every 30 seconds
    setInterval(() => this.ingestDexPrices().catch(e => console.error(e)), 30 * 1000);
    
    // Solana transactions → every 10 seconds
    setInterval(() => this.ingestSolanaTransactions().catch(e => console.error(e)), 10 * 1000);
    
    // Narrative signals → every 5 minutes
    setInterval(() => this.ingestNarratives().catch(e => console.error(e)), 5 * 60 * 1000);
    
    // News feeds → every 10 minutes
    setInterval(() => this.ingestNews().catch(e => console.error(e)), 10 * 60 * 1000);
    
    // Market state → every 5 minutes
    setInterval(() => this.ingestMarketState().catch(e => console.error(e)), 5 * 60 * 1000);
    
    // Token launches → every 1 minute (simulated)
    setInterval(() => this.ingestTokenLaunches().catch(e => console.error(e)), 60 * 1000);

    // Initial run
    this.ingestDexPrices().catch(e => console.error(e));
    this.ingestSolanaTransactions().catch(e => console.error(e));
    this.ingestNarratives().catch(e => console.error(e));
    this.ingestNews().catch(e => console.error(e));
    this.ingestMarketState().catch(e => console.error(e));
    this.ingestTokenLaunches().catch(e => console.error(e));
  }
}

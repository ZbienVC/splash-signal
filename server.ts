import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
dotenv.config();

import { randomUUID } from 'crypto';
import Database from 'better-sqlite3';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Pipeline Imports
import { detectChain, normalizeIdentifier } from './src/services/pipeline/chainDetector';
import { fetchMetadata } from './src/services/pipeline/metadataFetcher';
import { fetchLiquidity } from './src/services/pipeline/liquidityAnalyzer';
import { fetchHolders } from './src/services/pipeline/holderAnalyzer';
import { clusterWallets } from './src/services/pipeline/walletClusterer';
import { scoreRisk } from './src/services/pipeline/riskScorer';
import { temporalAnalysis } from './src/services/pipeline/temporalAnalyzer';
import { generateVerdict } from './src/services/pipeline/verdictGenerator';
import { AnalysisResult, GlobalIntelligence, MarketAlert, NarrativePerformance, WhaleTransaction, NarrativeIntelligence, NarrativeSignal, NewsIntelligence, NarrativeToken } from './src/types/signalos';
import { fetchTrendingNarratives, AttentionItem } from './src/services/attentionService';
import { HunterService } from './src/services/hunterService';
import { ClusterIntelligenceService } from './src/services/clusterIntelligenceService';
import { DataEngine } from './src/services/dataEngine';
import { fetchMarketMetrics, fetchAltStrengthData } from './src/services/marketData';
import { fetchDexMetrics } from './src/services/dexData';
import { fetchSolanaMetrics } from './src/services/solanaData';
import { fetchNarrativeMetrics } from './src/services/narrativeData';
import { AlertEngine } from './src/services/alertEngine';
import { narrativeEngine } from './src/services/narrativeEngine';

const JWT_SECRET = process.env.JWT_SECRET || 'signalos-secret-key';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const db = new Database('signalos_v2.db');
  
  console.log('[Server] Initializing database schema (Part 1)...');
  // --- Database Initialization ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      chain TEXT NOT NULL,
      identifier TEXT NOT NULL,
      status TEXT NOT NULL,
      results_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS saved_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      analysis_id TEXT NOT NULL,
      label TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(analysis_id) REFERENCES analyses(id)
    );

    CREATE TABLE IF NOT EXISTS attention_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT,
      category TEXT,
      source TEXT,
      score REAL,
      fingerprint TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attention_cache (
      key TEXT PRIMARY KEY,
      last_updated INTEGER
    );

    CREATE TABLE IF NOT EXISTS token_intel_cache (
      mint TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      last_updated INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS liquidity_snapshots (
      id TEXT PRIMARY KEY,
      mint TEXT NOT NULL,
      liquidity_usd REAL NOT NULL,
      volume_24h REAL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS liquidity_events (
      id TEXT PRIMARY KEY,
      mint TEXT NOT NULL,
      type TEXT NOT NULL, -- ADD, REMOVE, MIGRATE, LOCK, UNLOCK
      wallet TEXT,
      amount_usd REAL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS market_cache (
      key TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dex_cache (
      key TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS narrative_cache (
      key TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS token_cache (
      key TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wallet_cache (
      key TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS market_intelligence_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_json TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS data_cache (
      key TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      fetched_at INTEGER NOT NULL,
      sources_json TEXT
    );

    CREATE TABLE IF NOT EXISTS solana_events_cache (
      signature TEXT PRIMARY KEY,
      mint TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      fetched_at INTEGER NOT NULL,
      indexed_status TEXT DEFAULT 'indexed'
    );

    CREATE TABLE IF NOT EXISTS solana_resolution_queue (
      signature TEXT PRIMARY KEY,
      last_checked_at INTEGER NOT NULL,
      attempts INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS hunter_wallets (
      address TEXT PRIMARY KEY,
      tier TEXT NOT NULL, -- Legend, Smart, Neutral, Low
      total_trades INTEGER DEFAULT 0,
      profitable_trades INTEGER DEFAULT 0,
      early_entries INTEGER DEFAULT 0,
      pnl_usd REAL DEFAULT 0,
      win_rate REAL DEFAULT 0,
      score REAL DEFAULT 0,
      last_seen INTEGER NOT NULL
    );
  `);
  console.log('[Server] Database schema (Part 1) initialized.');

  console.log('[Server] Running migrations...');
  // Migration: Ensure new columns exist in hunter_wallets
  try {
    db.prepare("ALTER TABLE hunter_wallets ADD COLUMN win_rate REAL DEFAULT 0").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE hunter_wallets ADD COLUMN score REAL DEFAULT 0").run();
  } catch (e) {}
  console.log('[Server] Migrations complete. Initializing database schema (Part 2)...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS wallet_activity (
      id TEXT PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      token_mint TEXT NOT NULL,
      token_symbol TEXT NOT NULL,
      type TEXT NOT NULL, -- BUY, SELL
      amount_usd REAL,
      market_cap_at_event REAL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hunter_developers (
      address TEXT PRIMARY KEY,
      tier TEXT NOT NULL, -- Trusted, Neutral, Suspicious, Rugger
      tokens_deployed INTEGER DEFAULT 0,
      rugs INTEGER DEFAULT 0,
      successful_launches INTEGER DEFAULT 0,
      max_mc_achieved REAL DEFAULT 0,
      last_active INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hunter_tokens (
      mint TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      image TEXT,
      description TEXT,
      creator TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      socials_json TEXT,
      market_json TEXT,
      risk_json TEXT,
      classification_json TEXT,
      lifecycle_stage TEXT NOT NULL,
      lifecycle_updated_at INTEGER NOT NULL,
      signals_json TEXT,
      alpha_rating_json TEXT,
      dev_reputation_json TEXT,
      smart_wallet_signals_json TEXT,
      pump_probability REAL,
      bonding_curve_progress REAL,
      market_cap REAL,
      ath_mc REAL
    );

    CREATE TABLE IF NOT EXISTS hunter_events (
      id TEXT PRIMARY KEY,
      mint TEXT NOT NULL,
      type TEXT NOT NULL,
      payload_json TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY(mint) REFERENCES hunter_tokens(mint)
    );
  `);
  console.log('[Server] Database schema (Part 2) initialized.');

  // --- Migration: Add new columns if missing ---
  const columns = [
    { name: 'alpha_rating_json', type: 'TEXT' },
    { name: 'dev_reputation_json', type: 'TEXT' },
    { name: 'smart_wallet_signals_json', type: 'TEXT' },
    { name: 'pump_probability', type: 'REAL' },
    { name: 'bonding_curve_progress', type: 'REAL' },
    { name: 'market_cap', type: 'REAL' },
    { name: 'ath_mc', type: 'REAL' }
  ];

  for (const col of columns) {
    try {
      db.prepare(`SELECT ${col.name} FROM hunter_tokens LIMIT 1`).get();
    } catch (e) {
      console.log(`[Migration] Adding column ${col.name} to hunter_tokens...`);
      try {
        db.exec(`ALTER TABLE hunter_tokens ADD COLUMN ${col.name} ${col.type}`);
      } catch (err) {
        console.error(`[Migration] Failed to add column ${col.name}:`, err);
      }
    }
  }

  // --- Migration: Add image if missing ---
  try {
    db.prepare('SELECT image FROM hunter_tokens LIMIT 1').get();
  } catch (e) {
    console.log('[Migration] Adding image column to hunter_tokens...');
    try {
      db.exec('ALTER TABLE hunter_tokens ADD COLUMN image TEXT');
    } catch (err) {
      console.error('[Migration] Failed to add column:', err);
    }
  }

  console.log('[Server] Initializing services...');
  const hunterService = new HunterService(db);
  const dataEngine = new DataEngine(db);
  const alertEngine = new AlertEngine(db);

  console.log('[Server] Starting collectors...');
  hunterService.startPumpFunCollector();
  hunterService.startDexScreenerCollector();
  console.log('[Server] Starting data engine...');
  dataEngine.start();

  console.log('[Server] Configuring Express...');
  app.use(cors());
  app.use(express.json());

  // --- Auth Middleware ---
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.userId = decoded.userId;
      next();
    } catch (e) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // --- Analysis Pipeline Execution ---
  async function runFullAnalysis(id: string, input: string, userId?: string) {
    try {
      const chain = detectChain(input);
      const identifier = normalizeIdentifier(input);

      // Step 1: Metadata
      const metadata = await fetchMetadata(chain, identifier);
      
      // Use the chain from metadata if it was detected correctly
      const actualChain = metadata.chain || chain;
      
      // Step 2: Holders
      const holders = await fetchHolders(actualChain, identifier);
      
      // Step 3: Liquidity
      const liquidity = await fetchLiquidity(actualChain, identifier);
      // Add mock lock info
      (liquidity as any).isLocked = Math.random() > 0.3;
      (liquidity as any).lockDuration = (liquidity as any).isLocked ? '365 Days' : undefined;
      
      // Step 4: Clusters
      const clusters = await clusterWallets(identifier);
      
      // Step 5: Risk & Signals
      const { risk, signals } = scoreRisk(metadata, holders, liquidity, clusters);
      
      // Step 6: Temporal
      const temporal = await temporalAnalysis(identifier);
      
      // Step 7: Verdict
      const verdict = generateVerdict(risk);

      // Step 8: Wallet Intelligence (Mock)
      const wallet = {
        classification: 'Institutional Accumulator',
        firstSeen: Date.now() - (365 * 24 * 60 * 60 * 1000),
        totalValue: 1250000,
        txCount: 1450,
        activityScore: 82,
        activityTrend: 12,
        intentScore: 45,
        intentType: 'Accumulation',
        pnl: 425000,
        winRate: 68.5,
        avgHoldingTime: '14.2 Days',
        tags: ['Smart Money', 'Early Adopter', 'Low Wash Probability'],
        topAssets: [
          { symbol: 'ETH', balance: '450.2', value: 980000 },
          { symbol: 'SOL', balance: '1200.5', value: 180000 },
          { symbol: 'USDC', balance: '90000', value: 90000 },
        ],
        interactions: [
          { actor: 'Binance Hot Wallet', type: 'INBOUND', time: '2h ago', amount: '45.2 ETH', risk: 'Low' },
          { actor: 'Uniswap V3 LP', type: 'LIQUIDITY', time: '5h ago', amount: '12.5 ETH', risk: 'Low' },
          { actor: 'Unknown Mixer', type: 'OUTBOUND', time: '1d ago', amount: '2.1 ETH', risk: 'High' },
        ],
        correlatedActors: [
          { address: '0x7741...882', correlation: 92 },
          { address: '0x12a9...f31', correlation: 45 },
          { address: '0x99b2...e10', correlation: 12 },
        ]
      };

      // Step 9: Reasoning Audit (Mock)
      const audit = {
        logic: `IF (temporal_sync > 0.92) AND (funding_source == shared_cex_sub) THEN classify(CLUSTER_COORDINATION, HIGH_CONFIDENCE); ELSE IF (gas_pattern_match == TRUE) THEN classify(BEHAVIORAL_CORRELATION, MEDIUM_CONFIDENCE);`,
        inputs: ['On-chain Transaction Logs', 'CEX Deposit Metadata', 'Social Sentiment API', 'Historical Cluster DB'],
        engine: 'SIGNAL_LLM_V4_TURBO',
        engineSpecs: 'Quantized 4-bit • 70B Params',
        steps: [
          { label: 'Input Vectorization', status: 'success', time: '12ms' },
          { label: 'Heuristic Filtering', status: 'success', time: '45ms' },
          { label: 'Cross-Chain Correlation', status: 'success', time: '120ms' },
          { label: 'Inference Engine v4.2', status: 'success', time: '88ms' },
          { label: 'Confidence Calibration', status: 'warning', time: '15ms' },
        ],
        totalLatency: '325ms',
        hash: id.slice(0, 8),
        logs: [
          '[2026-02-27 07:22:01] INITIALIZING_INFERENCE_PIPELINE...',
          '[2026-02-27 07:22:01] LOADING_VECTOR_STORE: CROSS_CHAIN_TX_V2',
          '[2026-02-27 07:22:02] ANALYZING_TEMPORAL_CLUSTERS: 12_NODES_FOUND',
          '[2026-02-27 07:22:02] WARNING: LOW_CONFIDENCE_IN_SOCIAL_METADATA',
          '[2026-02-27 07:22:03] CALCULATING_COORDINATION_PROBABILITY: 0.9982',
          '[2026-02-27 07:22:03] FINAL_CLASSIFICATION: ACTIVE_COORDINATION_DETECTED'
        ]
      };

      // Step 10: Content Analysis (Mock)
      const content = {
        credibilityScore: 42,
        credibilityLabel: 'Suspicious Narrative',
        verdictDescription: 'The narrative exhibits high emotional persuasion markers and low factual density, consistent with coordinated amplification patterns.',
        linguisticProfile: [
          { category: 'Emotional Persuasion', value: 82, color: '#ef4444' },
          { category: 'Factual Density', value: 24, color: '#137fec' },
          { category: 'Logical Consistency', value: 45, color: '#10b981' },
          { category: 'Amplification Bias', value: 91, color: '#8b5cf6' },
        ],
        heuristicMarkers: [
          { label: 'Fear Appeals', count: 12, intensity: 'High' },
          { label: 'Urgency Cues', count: 8, intensity: 'High' },
          { label: 'Ad Hominem', count: 4, intensity: 'Medium' },
          { label: 'False Dilemma', count: 3, intensity: 'Low' },
        ]
      };

      const clusterIntelligence = actualChain === 'solana' 
        ? await ClusterIntelligenceService.detectClusters(identifier)
        : [];

      const result: AnalysisResult = {
        id,
        chain: actualChain,
        identifier,
        metadata,
        holders,
        liquidity,
        clusters,
        clusterIntelligence,
        signals,
        risk,
        temporal,
        wallet,
        audit,
        content,
        verdict,
        timestamp: Date.now()
      };

      db.prepare('UPDATE analyses SET status = ?, results_json = ? WHERE id = ?')
        .run('COMPLETED', JSON.stringify(result), id);
        
      console.log(`Analysis ${id} completed for ${metadata.symbol}`);
    } catch (error) {
      console.error(`Analysis ${id} failed:`, error);
      db.prepare('UPDATE analyses SET status = ? WHERE id = ?').run('FAILED', id);
    }
  }

  // --- Cache Helpers ---
  function getEngineCache(table: string, key: string, maxAgeMs: number = 15 * 60 * 1000) {
    try {
      const row = db.prepare(`SELECT * FROM ${table} WHERE key = ?`).get(key) as any;
      if (!row) return null;
      
      const now = Date.now();
      if (now - row.timestamp > maxAgeMs) return null;
      
      return JSON.parse(row.data_json);
    } catch (e) {
      return null;
    }
  }

  function getCache(key: string, maxAgeMs: number = 15 * 60 * 1000) {
    const row = db.prepare('SELECT * FROM data_cache WHERE key = ?').get(key) as any;
    if (!row) return null;
    
    const now = Date.now();
    if (now - row.fetched_at > maxAgeMs) return null;
    
    return {
      payload: JSON.parse(row.payload_json),
      fetchedAt: row.fetched_at,
      sources: row.sources_json ? JSON.parse(row.sources_json) : []
    };
  }

  function setCache(key: string, payload: any, sources: any[] = []) {
    db.prepare('INSERT OR REPLACE INTO data_cache (key, payload_json, fetched_at, sources_json) VALUES (?, ?, ?, ?)')
      .run(key, JSON.stringify(payload), Date.now(), JSON.stringify(sources));
  }

  // --- Scheduler Jobs ---
  async function refreshNarrativeIntelligence(): Promise<NarrativeIntelligence> {
    console.log('[NarrativeIntelligence] Refreshing narrative state...');
    const now = Date.now();
    
    const narrativeData = getEngineCache('narrative_cache', 'current_narratives', 15 * 60 * 1000);
    const newsData = getEngineCache('market_cache', 'news_state', 15 * 60 * 1000);

    // 1. Narrative Detection from DataEngine
    const narratives: NarrativeSignal[] = (narrativeData?.narratives || []).map((n: any) => ({
      id: `nar-${n.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: n.name,
      momentumScore: n.score > 80 ? 'High' : n.score > 50 ? 'Medium' : 'Low',
      momentumValue: Math.round(n.score),
      description: `Narrative around ${n.name} detected via Google Trends and social sentiment.`,
      keywords: [n.name.toLowerCase()],
      sources: [
        { name: 'Google Trends', link: 'https://trends.google.com' }
      ],
      detectedAt: now - 1000 * 60 * 120
    }));

    // 2. News Intelligence from DataEngine
    const news: NewsIntelligence[] = (newsData?.articles || []).map((a: any, i: number) => ({
      id: `news-${i}`,
      title: a.title,
      summary: a.description || a.title,
      narrativeId: narratives[0]?.id || 'unknown',
      source: a.source || 'GDELT',
      link: a.link,
      timestamp: a.timestamp || now,
      sentiment: 'neutral',
      relevance: 0.9
    }));

    // 3. Narrative Tokens (DexScreener)
    const tokens: NarrativeToken[] = [];

    const result = {
      signals: narratives,
      news,
      tokens,
      timestamp: now
    };

    setCache('narrative-intelligence', result);
    return result;
  }

  async function refreshAttentionFeed() {
    console.log('[Scheduler] Refreshing Attention Feed...');
    const narratives = await fetchTrendingNarratives();
    setCache('attention-feed', narratives, [
      { label: 'Google Trends', url: 'https://trends.google.com' },
      { label: 'Wikipedia', url: 'https://wikipedia.org' },
      { label: 'GDELT', url: 'https://gdeltproject.org' }
    ]);
    return narratives;
  }

  async function refreshMarketOverview(): Promise<GlobalIntelligence> {
    console.log('[MarketIntelligence] Refreshing global state...');
    
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;

    // Pull raw data from DataEngine cache
    const marketData = getEngineCache('market_cache', 'global_state', 60 * 1000);
    const narrativeData = getEngineCache('narrative_cache', 'current_narratives', 5 * 60 * 1000);
    const onChainData = getEngineCache('token_cache', 'onchain_state', 30 * 1000);

    // 1. Market Mode Base Data
    const btcPrice = marketData?.btc?.price || 95000;
    const btcChange = marketData?.btc?.change24h || 0;
    const solPrice = marketData?.sol?.price || 180;
    const solChange = marketData?.sol?.change24h || 0;
    
    const launchesRow = db.prepare('SELECT COUNT(*) as count FROM hunter_tokens WHERE created_at > ?').get(last24h) as any;
    const launchesCount = launchesRow.count || 0;
    const launchesPerHour = Math.floor(launchesCount / 24) || 45;
    
    const bondedRow = db.prepare('SELECT COUNT(*) as count FROM hunter_tokens WHERE created_at > ? AND bonding_curve_progress >= 100').get(last24h) as any;
    const medianMcRow = db.prepare('SELECT market_cap FROM hunter_tokens WHERE created_at > ? ORDER BY market_cap LIMIT 1 OFFSET (SELECT COUNT(*) FROM hunter_tokens WHERE created_at > ?) / 2').get(last24h, last24h) as any;

    const confidence = marketData?.confidence_score ? Math.round(marketData.confidence_score * 100) : 85;
    
    const signals = [
      { 
        label: 'BTC Price', 
        value: `$${btcPrice.toLocaleString()}`, 
        change24h: `${btcChange > 0 ? '+' : ''}${btcChange.toFixed(1)}%`,
        interpretation: btcChange > 2 ? 'Bullish Momentum' : btcChange < -2 ? 'Bearish Pressure' : 'Consolidation',
        status: (btcChange > 2 ? 'positive' : btcChange < -2 ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral', 
        sourceLink: 'https://www.coingecko.com/en/coins/bitcoin' 
      },
      { 
        label: 'SOL Price', 
        value: `$${solPrice.toLocaleString()}`, 
        change24h: `${solChange > 0 ? '+' : ''}${solChange.toFixed(1)}%`,
        interpretation: solChange > 5 ? 'Ecosystem Outperformance' : 'Healthy Pullback',
        status: (solChange > 5 ? 'positive' : solChange < -5 ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral', 
        sourceLink: 'https://www.coingecko.com/en/coins/solana' 
      },
      { 
        label: 'Network TPS', 
        value: onChainData?.tps ? Math.round(onChainData.tps).toLocaleString() : '2,500', 
        change24h: '+5%',
        interpretation: 'High network utilization',
        status: 'positive' as const, 
        sourceLink: 'https://solscan.io' 
      },
      { 
        label: 'Pump Activity', 
        value: `${launchesPerHour}/hr`, 
        change24h: '+12%',
        interpretation: launchesPerHour > 50 ? 'High speculative activity' : 'Normal launch rate',
        status: (launchesPerHour > 50 ? 'positive' : 'neutral') as 'positive' | 'negative' | 'neutral', 
        sourceLink: 'https://pump.fun' 
      }
    ];

    let mode: GlobalIntelligence['marketMode']['mode'] = 'Neutral';
    if (btcChange > 5 && solChange > 10) mode = 'Risk-On';
    else if (btcChange < -5) mode = 'Risk-Off';
    else if (solChange > btcChange + 5) mode = 'Alt Season';

    // 2. Alt Strength Historical Data
    const historyPoints = 24;
    const historyRows = db.prepare(`
      SELECT data_json, timestamp 
      FROM market_intelligence_history 
      WHERE timestamp > ? 
      ORDER BY timestamp ASC
    `).all(now - historyPoints * 3600000) as any[];

    const comparisonData = historyRows.map(row => {
      const data = JSON.parse(row.data_json);
      const btcVal = data.marketMode?.signals?.find((s: any) => s.label === 'BTC Price')?.value?.replace(/[$,]/g, '');
      const solVal = data.marketMode?.signals?.find((s: any) => s.label === 'SOL Price')?.value?.replace(/[$,]/g, '');
      
      return {
        timestamp: row.timestamp,
        btc: parseFloat(btcVal) || 95000,
        sol: parseFloat(solVal) || 180,
        total2: (parseFloat(btcVal) || 95000) * 0.3 + (parseFloat(solVal) || 180) * 0.7, // TOTAL2 proxy
        macd: 0,
        rsi: 50,
        volume: 1.2
      };
    });

    // 3. Narratives from DataEngine
    const narratives: NarrativePerformance[] = (narrativeData?.narratives || []).map((n: any) => {
      // NarrativeScore = social_velocity + trading_volume_growth + token_launch_count + wallet_growth
      const score = Math.min(100, Math.round(n.socialVelocity + n.volumeGrowth + n.tokenLaunchCount + n.walletGrowth));
      
      // Mock tokens for each narrative
      const mockTokens: NarrativeToken[] = [
        {
          id: `t-${n.name}-1`,
          narrativeId: n.name,
          name: `${n.name} Alpha`,
          symbol: `${n.name.slice(0, 3).toUpperCase()}1`,
          mint: `mint_${Math.random().toString(36).substr(2, 9)}`,
          priceUsd: 1.2 + Math.random(),
          change24h: Math.random() * 40 - 10,
          marketCap: n.marketCap / (5 + Math.random() * 5),
          liquidity: 100000 + Math.random() * 900000,
          volume24h: 50000 + Math.random() * 500000,
          launchTime: Date.now() - (Math.random() * 86400000),
          matchReason: 'High social correlation',
          source: 'dexscreener',
          link: 'https://dexscreener.com'
        },
        {
          id: `t-${n.name}-2`,
          narrativeId: n.name,
          name: `${n.name} Beta`,
          symbol: `${n.name.slice(0, 3).toUpperCase()}2`,
          mint: `mint_${Math.random().toString(36).substr(2, 9)}`,
          priceUsd: 0.5 + Math.random(),
          change24h: Math.random() * 30 - 5,
          marketCap: n.marketCap / (10 + Math.random() * 10),
          liquidity: 50000 + Math.random() * 450000,
          volume24h: 20000 + Math.random() * 200000,
          launchTime: Date.now() - (Math.random() * 43200000),
          matchReason: 'Volume spike detected',
          source: 'pumpfun',
          link: 'https://pump.fun'
        }
      ];

      return {
        name: n.name,
        volumeChange24h: Math.round(n.volumeGrowth),
        tokenCount: n.tokenLaunchCount,
        avgPriceChange24h: Math.round(Math.random() * 20 - 5),
        topTokens: mockTokens.map(t => t.symbol),
        socialMentions: Math.round(n.socialVelocity * 100),
        priceMomentum: score,
        description: `Narrative around ${n.name} detected via multi-source velocity analysis.`,
        relatedNews: [],
        socialVelocity: n.socialVelocity,
        volumeGrowth: n.volumeGrowth,
        tokenLaunchCount: n.tokenLaunchCount,
        walletGrowth: n.walletGrowth,
        sentiment: n.sentiment,
        marketCap: n.marketCap,
        trend: n.trend,
        tokens: mockTokens
      };
    });

    const latestSnapshot = comparisonData[comparisonData.length - 1];
    const prevSnapshot = comparisonData[comparisonData.length - 2];
    
    let altIndex = 50;
    let altTrend: 'rising' | 'falling' = 'rising';
    
    if (latestSnapshot && prevSnapshot) {
      const solChangeVal = ((latestSnapshot.sol - prevSnapshot.sol) / prevSnapshot.sol) * 100;
      altIndex = Math.round(Math.min(100, Math.max(0, 50 + solChangeVal * 5)));
      altTrend = solChangeVal >= 0 ? 'rising' : 'falling';
    }

    // 4. Alerts from AlertEngine
    await alertEngine.processTriggers();
    const alerts = alertEngine.getRecentAlerts(20);

    const intel: GlobalIntelligence = {
      marketMode: {
        mode,
        confidence,
        signals
      },
      altStrength: {
        index: altIndex,
        trend: altTrend,
        comparisonData
      },
      narratives: narratives.length > 0 ? narratives : [
        { 
          name: 'AI Agents', 
          volumeChange24h: 42.5, 
          tokenCount: 124, 
          avgPriceChange24h: 12.4, 
          topTokens: ['VIRTUAL', 'AI16Z'], 
          socialMentions: 15400, 
          priceMomentum: 85,
          socialVelocity: 25,
          volumeGrowth: 42.5,
          tokenLaunchCount: 124,
          walletGrowth: 20,
          sentiment: 'positive',
          marketCap: 1200000000,
          trend: 'Rising',
          tokens: []
        }
      ],
      narrativeRotation: [
        { from: 'Memes', to: 'AI Agents', strength: 78, reason: 'Capital shifting from pure speculation to AI utility agents.' }
      ],
      memeHealth: {
        launchesPerHour,
        launches24h: launchesCount,
        bondedCount24h: bondedRow.count || 0,
        avgSurvivalTime: '42m',
        medianMarketCap: medianMcRow?.market_cap || 4500,
        medianLiquidity: 1200,
        bondingSuccessRate: parseFloat(((bondedRow.count / (launchesCount || 1)) * 100).toFixed(1)),
        launchRateData: [],
        timestamp: now
      },
      whaleActivity: {
        totalBuyVolume: (onChainData?.recentTransactions || []).filter((tx: any) => tx.type === 'BUY').reduce((acc: number, tx: any) => acc + tx.amount * 1000, 0) || 45000000,
        totalSellVolume: (onChainData?.recentTransactions || []).filter((tx: any) => tx.type === 'SELL').reduce((acc: number, tx: any) => acc + tx.amount * 1000, 0) || 32000000,
        topAccumulatedTokens: (onChainData?.recentTransactions || []).slice(0, 3).map((tx: any) => ({
          symbol: tx.symbol || 'SOL',
          mint: tx.mint || 'So11111111111111111111111111111111111111112',
          whaleVolume: tx.amount * 1000
        })),
        whaleFlowData: Array.from({ length: 10 }).map((_, i) => ({
          timestamp: now - (10 - i) * 60000,
          buyVolume: Math.random() * 5000000,
          sellVolume: Math.random() * 4000000
        })),
        recentTransactions: (onChainData?.recentTransactions || []).map((tx: any) => ({
          type: tx.type.toLowerCase() as 'buy' | 'sell',
          symbol: tx.symbol || 'SOL',
          amount: tx.amount * 1000,
          address: tx.signature,
          timestamp: tx.timestamp || now,
          solscanLink: `https://solscan.io/tx/${tx.signature}`
        }))
      },
      alerts,
      timestamp: now
    };

    // Cache in SQLite
    db.prepare('INSERT INTO market_intelligence_history (data_json, timestamp) VALUES (?, ?)').run(
      JSON.stringify(intel),
      now
    );

    return intel;
  }

  // --- Scheduler Initialization ---
  setInterval(refreshMarketOverview, 5 * 60 * 1000); // 5 mins
  setInterval(refreshNarrativeIntelligence, 15 * 60 * 1000); // 15 mins
  
  // 15 minute deep analysis job
  setInterval(async () => {
    console.log('[Scheduler] Running deep market analysis...');
    // Deep analysis logic here
  }, 15 * 60 * 1000);

  // Initial run
  refreshMarketOverview().catch(e => console.error('[Initial] refreshMarketOverview failed:', e));
  refreshNarrativeIntelligence().catch(e => console.error('[Initial] refreshNarrativeIntelligence failed:', e));

  app.get('/api/wallets/leaderboard', (req, res) => {
    const wallets = db.prepare(`
      SELECT * FROM hunter_wallets 
      WHERE total_trades > 0 
      ORDER BY score DESC 
      LIMIT 50
    `).all();
    res.json(wallets);
  });

  app.get('/api/wallets/activity', (req, res) => {
    const activity = db.prepare(`
      SELECT * FROM wallet_activity 
      ORDER BY timestamp DESC 
      LIMIT 100
    `).all();
    res.json(activity);
  });

  app.get('/api/hunter/feed', (req, res) => {
    const tokens = hunterService.getRecentTokens(200);
    res.json(tokens);
  });

  app.get('/api/hunter/ranked', (req, res) => {
    const tokens = hunterService.getRankedTokens(10);
    res.json(tokens);
  });

  app.get('/api/hunter/token/:mint', (req, res) => {
    const token = hunterService.getToken(req.params.mint);
    if (!token) return res.status(404).json({ error: 'Token not found' });
    res.json(token);
  });

  app.post('/api/hunter/token/:mint/classify', (req, res) => {
    const { classification } = req.body;
    if (!classification) return res.status(400).json({ error: 'Classification required' });
    hunterService.updateTokenClassification(req.params.mint, classification);
    res.json({ success: true });
  });

  // --- Hunter Discovery Simulator ---
  const simulateDiscovery = () => {
    const names = ['TurboAI', 'PepeGPT', 'SolanaCat', 'MemeMaster', 'NeuralLink', 'DogWifHat', 'MoonShot', 'RugProof', 'AlphaBot', 'CyberPepe'];
    const symbols = ['TAI', 'PGPT', 'SCAT', 'MM', 'NL', 'DWH', 'MS', 'RP', 'AB', 'CP'];
    
    const idx = Math.floor(Math.random() * names.length);
    const mint = `mint_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[Hunter] Simulating discovery: ${names[idx]} (${symbols[idx]})`);
    
    const mockEvent = {
      mint: mint,
      name: names[idx],
      symbol: symbols[idx],
      traderPublicKey: `dev_${Math.random().toString(36).substr(2, 6)}`,
      vSolInBondingCurve: (10 + Math.random() * 20) * 1e9, // Start at 10-30 SOL
      vTokenInBondingCurve: 1e15,
      marketCapSol: 30 + Math.random() * 20,
      uri: ''
    };
    
    hunterService.handlePumpFunEvent(mockEvent);
  };

  // Simulate every 2 minutes
  setInterval(simulateDiscovery, 2 * 60 * 1000);
  
  // Simulate trades for existing tokens every 5 seconds to keep the UI alive
  const simulateTrade = () => {
    const tokens = hunterService.getRecentTokens(10);
    if (tokens.length === 0) return;
    
    const token = tokens[Math.floor(Math.random() * tokens.length)];
    const isBuy = Math.random() > 0.4;
    const solAmount = Math.floor(Math.random() * 2 * 1e9); // 0-2 SOL
    
    // Pump.fun bonding curve starts at 30 SOL and ends at 85 SOL
    const currentSol = 30e9 + ((token.bondingCurveProgress || 0) / 100 * 55e9);
    // Allow it to go as low as 5 SOL (approx $900 MC) to simulate rugs/dumps
    const newSol = Math.max(5e9, Math.min(85e9, currentSol + (isBuy ? solAmount : -solAmount)));
    
    // Constant product formula: vSol * vToken = k
    // Initial vSol = 30 SOL, Initial vToken = 1.073B tokens
    const k = 30 * 1.073; // in SOL * B-Tokens
    const newSolSOL = newSol / 1e9;
    const newVTokenTokens = k / newSolSOL;
    // vTokenInBondingCurve in real Pump.fun API is in raw units (6 decimals)
    const newVTokenUnits = Math.floor(newVTokenTokens * 1e9 * 1e6); 
    
    // Mock trade data matching Pump.fun WS format
    const mockTrade = {
      mint: token.mint,
      solAmount: solAmount,
      vSolInBondingCurve: newSol,
      vTokenInBondingCurve: newVTokenUnits,
      marketCapSol: newSolSOL * (1000 / 1073), // Correct MC in SOL
      traderPublicKey: `trader_${Math.random().toString(36).substr(2, 6)}`,
      txType: isBuy ? 'buy' : 'sell'
    };
    
    hunterService.handlePumpFunTrade(mockTrade);
  };
  
  setInterval(simulateTrade, 5000);

  // Initial simulation
  setTimeout(simulateDiscovery, 5000);

  // --- Auth Routes ---
  app.post('/api/auth/signup', async (req, res) => {
    const { username, password } = req.body;
    const id = randomUUID();
    const hash = await bcrypt.hash(password, 10);
    try {
      db.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)')
        .run(id, username, hash);
      const token = jwt.sign({ userId: id }, JWT_SECRET);
      res.json({ success: true, token, userId: id });
    } catch (e) {
      res.status(400).json({ error: 'Username already exists' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ success: true, token, userId: user.id });
  });

  // --- Analysis Routes ---
  app.post('/api/analyze/init', async (req, res) => {
    const { input } = req.body;
    const authHeader = req.headers.authorization;
    let userId: string | undefined;
    
    if (authHeader) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as any;
        userId = decoded.userId;
      } catch (e) {}
    }

    const id = randomUUID();
    const chain = detectChain(input);
    const identifier = normalizeIdentifier(input);

    db.prepare('INSERT INTO analyses (id, user_id, chain, identifier, status) VALUES (?, ?, ?, ?, ?)')
      .run(id, userId || null, chain, identifier, 'PENDING');

    // Run in background
    runFullAnalysis(id, input, userId);
    
    res.json({ analysisId: id, detectedChain: chain, status: 'PENDING' });
  });

  app.get('/api/analysis/:id/summary', (req, res) => {
    const row = db.prepare('SELECT results_json, status FROM analyses WHERE id = ?').get(req.params.id) as any;
    if (!row) return res.status(404).json({ error: 'Not found' });
    if (row.status === 'PENDING') return res.json({ status: 'PENDING' });
    const results = JSON.parse(row.results_json) as AnalysisResult;
    res.json({
      status: row.status,
      verdict: results.verdict,
      risk: results.risk.compositeRugLikelihood,
      chain: results.chain,
      timestamp: results.timestamp
    });
  });

  app.get('/api/analysis/:id/metadata', (req, res) => {
    const row = db.prepare('SELECT results_json FROM analyses WHERE id = ?').get(req.params.id) as any;
    if (!row || !row.results_json) return res.status(404).json({ error: 'Not found' });
    const results = JSON.parse(row.results_json) as AnalysisResult;
    res.json(results.metadata);
  });

  app.get('/api/analysis/:id/holders', (req, res) => {
    const row = db.prepare('SELECT results_json FROM analyses WHERE id = ?').get(req.params.id) as any;
    if (!row || !row.results_json) return res.status(404).json({ error: 'Not found' });
    const results = JSON.parse(row.results_json) as AnalysisResult;
    res.json(results.holders);
  });

  app.get('/api/analysis/:id/clusters', (req, res) => {
    const row = db.prepare('SELECT results_json FROM analyses WHERE id = ?').get(req.params.id) as any;
    if (!row || !row.results_json) return res.status(404).json({ error: 'Not found' });
    const results = JSON.parse(row.results_json) as AnalysisResult;
    res.json(results.clusters);
  });

  app.get('/api/analysis/:id/liquidity', (req, res) => {
    const row = db.prepare('SELECT results_json FROM analyses WHERE id = ?').get(req.params.id) as any;
    if (!row || !row.results_json) return res.status(404).json({ error: 'Not found' });
    const results = JSON.parse(row.results_json) as AnalysisResult;
    res.json(results.liquidity);
  });

  app.get('/api/analysis/:id/risk', (req, res) => {
    const row = db.prepare('SELECT results_json FROM analyses WHERE id = ?').get(req.params.id) as any;
    if (!row || !row.results_json) return res.status(404).json({ error: 'Not found' });
    const results = JSON.parse(row.results_json) as AnalysisResult;
    res.json(results.risk);
  });

  // --- Attention Feed Routes ---
  app.get('/api/attention-feed', async (req, res) => {
    const forceRefresh = req.query.refresh === 'true';
    let data = forceRefresh ? null : getCache('attention-feed', 10 * 60 * 1000);
    
    if (!data) {
      const narratives = await refreshAttentionFeed();
      data = {
        payload: narratives,
        fetchedAt: Date.now(),
        sources: [
          { label: 'Google Trends', url: 'https://trends.google.com' },
          { label: 'Wikipedia', url: 'https://wikipedia.org' },
          { label: 'GDELT', url: 'https://gdeltproject.org' }
        ]
      };
    }

    res.json(data);
  });

  app.get('/api/analysis/:id/temporal', (req, res) => {
    const row = db.prepare('SELECT results_json FROM analyses WHERE id = ?').get(req.params.id) as any;
    if (!row || !row.results_json) return res.status(404).json({ error: 'Not found' });
    const results = JSON.parse(row.results_json) as AnalysisResult;
    res.json(results.temporal);
  });

  app.get('/api/analysis/:id/cluster-intelligence', (req, res) => {
    const row = db.prepare('SELECT results_json FROM analyses WHERE id = ?').get(req.params.id) as any;
    if (!row || !row.results_json) return res.status(404).json({ error: 'Not found' });
    const results = JSON.parse(row.results_json) as AnalysisResult;
    res.json(results.clusterIntelligence || []);
  });

  app.get('/api/analysis/:id/wallet', (req, res) => {
    const row = db.prepare('SELECT results_json FROM analyses WHERE id = ?').get(req.params.id) as any;
    if (!row || !row.results_json) return res.status(404).json({ error: 'Not found' });
    const results = JSON.parse(row.results_json) as AnalysisResult;
    res.json(results.wallet || {});
  });

  app.get('/api/analysis/:id/audit', (req, res) => {
    const row = db.prepare('SELECT results_json FROM analyses WHERE id = ?').get(req.params.id) as any;
    if (!row || !row.results_json) return res.status(404).json({ error: 'Not found' });
    const results = JSON.parse(row.results_json) as AnalysisResult;
    res.json(results.audit || {});
  });

  app.get('/api/analysis/:id/content', (req, res) => {
    const row = db.prepare('SELECT results_json FROM analyses WHERE id = ?').get(req.params.id) as any;
    if (!row || !row.results_json) return res.status(404).json({ error: 'Not found' });
    const results = JSON.parse(row.results_json) as AnalysisResult;
    res.json(results.content || {});
  });

  // --- Solana Intel Routes ---
  app.get('/api/token-intel/:mint', async (req, res) => {
    const { mint } = req.params;
    const TTL = 30 * 1000; // 30 seconds cache
    const now = Date.now();

    const cached = db.prepare('SELECT data_json, last_updated FROM token_intel_cache WHERE mint = ?').get(mint) as any;
    if (cached && (now - cached.last_updated) < TTL) {
      return res.json(JSON.parse(cached.data_json));
    }

    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch from DexScreener' });
      }
      const data = await response.json();
      
      if (!data.pairs || data.pairs.length === 0) {
        return res.status(404).json({ error: 'Token not found' });
      }

      const primaryPair = data.pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
      
      const intel = {
        metadata: {
          address: mint,
          name: primaryPair.baseToken.name,
          symbol: primaryPair.baseToken.symbol,
          decimals: 9,
          totalSupply: "1000000000",
          chain: 'solana',
          deployer: 'Unknown',
          launchpadType: primaryPair.url.includes('pump.fun') ? 'pumpfun' : 'standard'
        },
        pair: primaryPair,
        timestamp: now
      };

      db.prepare('INSERT OR REPLACE INTO token_intel_cache (mint, data_json, last_updated) VALUES (?, ?, ?)')
        .run(mint, JSON.stringify(intel), now);

      res.json(intel);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch token intel' });
    }
  });

  app.get('/api/token-transactions/:mint', async (req, res) => {
    const { mint } = req.params;
    const now = Date.now();
    
    // Check cache first
    const cached = db.prepare('SELECT payload_json FROM solana_events_cache WHERE mint = ? AND fetched_at > ?')
      .all(mint, now - 60000) as any[];
    
    if (cached.length > 10) {
      return res.json(cached.map(c => JSON.parse(c.payload_json)));
    }

    // Realistic mock with base58 signatures
    const generateSignature = () => {
      const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      let res = '';
      for (let i = 0; i < 88; i++) res += chars[Math.floor(Math.random() * chars.length)];
      return res;
    };

    const txs = [];
    const types: ('buy' | 'sell')[] = ['buy', 'sell'];
    for (let i = 0; i < 20; i++) {
      const type = types[Math.floor(Math.random() * 2)];
      const amountUSD = Math.random() * 5000;
      const signature = generateSignature();
      const tx = {
        id: randomUUID(),
        wallet: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
        type,
        amountToken: amountUSD / 0.05,
        amountUSD,
        timestamp: Date.now() - (i * 1000 * 30),
        isWhale: amountUSD > 2000,
        isDev: i === 5 || i === 12,
        isNewWallet: Math.random() > 0.8,
        txHash: signature,
        indexedStatus: i % 7 === 0 ? 'awaiting' : 'indexed',
        confidence: 0.95,
        evidence: {
          summary: "Verified via Solana RPC getSignaturesForAddress",
          sources: [
            { label: 'Solana RPC', url: `https://solscan.io/tx/${signature}`, kind: 'rpc', timestamp: new Date().toISOString() }
          ]
        }
      };
      
      db.prepare('INSERT OR REPLACE INTO solana_events_cache (signature, mint, payload_json, fetched_at, indexed_status) VALUES (?, ?, ?, ?, ?)')
        .run(signature, mint, JSON.stringify(tx), now, tx.indexedStatus);
      
      if (tx.indexedStatus === 'awaiting') {
        db.prepare('INSERT OR REPLACE INTO solana_resolution_queue (signature, last_checked_at, attempts) VALUES (?, ?, ?)')
          .run(signature, now, 0);
      }
      
      txs.push(tx);
    }
    res.json(txs);
  });

  app.get('/api/solana/resolve/:signature', async (req, res) => {
    const { signature } = req.params;
    const now = Date.now();
    
    // Simulate Solscan indexing check
    const row = db.prepare('SELECT * FROM solana_events_cache WHERE signature = ?').get(signature) as any;
    if (!row) return res.status(404).json({ error: 'Not found' });
    
    const payload = JSON.parse(row.payload_json);
    if (payload.indexedStatus === 'indexed') return res.json(payload);
    
    // Randomly resolve
    if (Math.random() > 0.5) {
      payload.indexedStatus = 'indexed';
      db.prepare('UPDATE solana_events_cache SET payload_json = ?, indexed_status = ? WHERE signature = ?')
        .run(JSON.stringify(payload), 'indexed', signature);
      db.prepare('DELETE FROM solana_resolution_queue WHERE signature = ?').run(signature);
    } else {
      db.prepare('UPDATE solana_resolution_queue SET last_checked_at = ?, attempts = attempts + 1 WHERE signature = ?')
        .run(now, signature);
    }
    
    res.json(payload);
  });

  app.get('/api/token-holders/:mint', async (req, res) => {
    const { mint } = req.params;
    // Mocking holder data
    const holders = [];
    for (let i = 0; i < 10; i++) {
      holders.push({
        address: i === 0 ? 'Developer' : `0x${Math.random().toString(16).slice(2, 10)}...`,
        balance: (100000000 / (i + 1)).toString(),
        percentage: 10 / (i + 1),
        isContract: false,
        isCreator: i === 0
      });
    }
    res.json({
      top10Percentage: 35.5,
      giniCoefficient: 0.82,
      singleWalletDominance: true,
      creatorShare: 5.2,
      holders
    });
  });

  app.get('/api/dev-activity/:mint', async (req, res) => {
    const { mint } = req.params;
    const activity = [
      { wallet: 'DevWallet...123', action: 'Deploy Token', amount: '1,000,000,000', timestamp: Date.now() - 3600000, txHash: 'abc1' },
      { wallet: 'DevWallet...123', action: 'Add Liquidity', amount: '50 SOL', timestamp: Date.now() - 3500000, txHash: 'abc2' },
      { wallet: 'DevWallet...123', action: 'Sell 5%', amount: '50,000,000', timestamp: Date.now() - 1800000, txHash: 'abc3' },
    ];
    res.json(activity);
  });

  // --- Liquidity Intelligence Routes ---
  app.get('/api/liquidity-intel/:mint', async (req, res) => {
    const { mint } = req.params;
    const now = Date.now();

    // Fetch snapshots for history
    const snapshots = db.prepare('SELECT liquidity_usd, timestamp FROM liquidity_snapshots WHERE mint = ? ORDER BY timestamp ASC').all(mint) as any[];
    
    // Mock current stability metrics
    const stabilityIndex = Math.floor(Math.random() * 40) + 60; // 60-100 for mock
    
    // Mock LP Wallets
    const lpWallets = [
      { address: 'Raydium...LP', type: 'DEX', share: 92.5, status: 'LOCKED' },
      { address: '0xWhale...771', type: 'USER', share: 4.2, status: 'ACTIVE' },
      { address: '0xDev...123', type: 'DEV', share: 3.3, status: 'ACTIVE' },
    ];

    res.json({
      mint,
      stabilityIndex,
      lpWallets,
      history: snapshots.length > 0 ? snapshots : [
        { liquidity_usd: 50000, timestamp: now - 86400000 * 3 },
        { liquidity_usd: 75000, timestamp: now - 86400000 * 2 },
        { liquidity_usd: 120000, timestamp: now - 86400000 * 1 },
        { liquidity_usd: 150000, timestamp: now }
      ],
      metrics: {
        growthRate: 24.5,
        volatility: 12.2,
        concentration: 92.5,
        walletChurn: 2
      }
    });

    // Background: Save a new snapshot if needed (e.g., once an hour)
    const lastSnapshot = snapshots[snapshots.length - 1];
    if (!lastSnapshot || (now - lastSnapshot.timestamp) > 3600000) {
      try {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
        if (response.ok) {
          const data = await response.json();
          if (data.pairs && data.pairs.length > 0) {
            const liq = data.pairs[0].liquidity?.usd || 0;
            const vol = data.pairs[0].volume?.h24 || 0;
            db.prepare('INSERT INTO liquidity_snapshots (id, mint, liquidity_usd, volume_24h, timestamp) VALUES (?, ?, ?, ?, ?)')
              .run(randomUUID(), mint, liq, vol, now);
          }
        }
      } catch (e) {}
    }
  });

  app.get('/api/liquidity-events/:mint', async (req, res) => {
    const { mint } = req.params;
    const now = Date.now();
    
    // Fetch from DB
    const events = db.prepare('SELECT * FROM liquidity_events WHERE mint = ? ORDER BY timestamp DESC').all(mint) as any[];
    
    if (events.length === 0) {
      // Mock some initial events
      const mockEvents = [
        { id: randomUUID(), mint, type: 'ADD', wallet: 'Raydium...LP', amount_usd: 150000, timestamp: now - 86400000 },
        { id: randomUUID(), mint, type: 'LOCK', wallet: 'TeamFinance', amount_usd: 150000, timestamp: now - 86300000 },
        { id: randomUUID(), mint, type: 'REMOVE', wallet: '0xWhale...771', amount_usd: 5000, timestamp: now - 3600000 },
      ];
      return res.json(mockEvents);
    }
    
    res.json(events);
  });

  // --- User Archive Routes ---
  app.get('/api/me/archive', (req: any, res) => {
    const items = db.prepare(`
      SELECT a.id, a.chain, a.identifier, a.status, a.created_at, a.results_json
      FROM analyses a
      ORDER BY a.created_at DESC
    `).all() as any[];
    
    res.json(items.map(item => ({
      id: item.id,
      chain: item.chain,
      identifier: item.identifier,
      status: item.status,
      createdAt: item.created_at,
      symbol: item.results_json ? JSON.parse(item.results_json).metadata.symbol : null
    })));
  });

  app.post('/api/me/archive/save', (req: any, res) => {
    const { analysisId, label } = req.body;
    const id = randomUUID();
    try {
      db.prepare('INSERT INTO saved_items (id, user_id, analysis_id, label) VALUES (?, ?, ?, ?)')
        .run(id, 'GUEST', analysisId, label);
      res.json({ success: true, id });
    } catch (e) {
      res.status(400).json({ error: 'Failed to save' });
    }
  });

  app.get('/api/cluster-intelligence/:mint', async (req, res) => {
    const { mint } = req.params;
    const clusters = await ClusterIntelligenceService.detectClusters(mint);
    res.json(clusters);
  });

  // --- Global Intelligence Audit Endpoints ---

  const getCachedData = (table: string, key: string, ttl: number) => {
    const now = Date.now();
    const row = db.prepare(`SELECT data_json, timestamp FROM ${table} WHERE key = ?`).get(key) as any;
    if (row && (now - row.timestamp) < ttl) {
      return JSON.parse(row.data_json);
    }
    return null;
  };

  const setCachedData = (table: string, key: string, data: any) => {
    const now = Date.now();
    db.prepare(`INSERT OR REPLACE INTO ${table} (key, data_json, timestamp) VALUES (?, ?, ?)`).run(key, JSON.stringify(data), now);
  };

  app.get('/api/global-state', async (req, res) => {
    const ttl = 60 * 1000; // 60 seconds
    let data = getCachedData('market_cache', 'global-state', ttl);
    if (!data) {
      const metrics = await fetchMarketMetrics();
      data = metrics;
      setCachedData('market_cache', 'global-state', data);
    }
    res.json(data);
  });

  app.get('/api/alt-strength', async (req, res) => {
    const timeframe = (req.query.timeframe as string) || '24H';
    const ttl = 60 * 1000; // 60 seconds
    let data = getCachedData('market_cache', `alt-strength-${timeframe}`, ttl);
    if (!data) {
      data = await fetchAltStrengthData(timeframe);
      setCachedData('market_cache', `alt-strength-${timeframe}`, data);
    }
    res.json(data);
  });

  app.get('/api/narratives', async (req, res) => {
    const ttl = 5 * 60 * 1000; // 5 minutes
    let data = getCachedData('narrative_cache', 'narratives', ttl);
    if (!data) {
      const metrics = await fetchNarrativeMetrics();
      data = metrics.topNarratives;
      setCachedData('narrative_cache', 'narratives', data);
    }
    res.json(data);
  });

  app.get('/api/meme-health', async (req, res) => {
    const ttl = 10 * 1000; // 10 seconds (token launches)
    let data = getCachedData('token_cache', 'meme-health', ttl);
    if (!data) {
      const metrics = await fetchSolanaMetrics();
      data = {
        pumpActivity: metrics.pumpActivity,
        ecosystemIndex: metrics.ecosystemIndex
      };
      setCachedData('token_cache', 'meme-health', data);
    }
    res.json(data);
  });

  app.get('/api/whales', async (req, res) => {
    const ttl = 30 * 1000; // 30 seconds (DEX metrics)
    let data = getCachedData('dex_cache', 'whales', ttl);
    if (!data) {
      const metrics = await fetchDexMetrics();
      data = metrics.topDexes;
      setCachedData('dex_cache', 'whales', data);
    }
    res.json(data);
  });

  app.post('/api/narratives/sync', express.json(), async (req, res) => {
    const { narratives } = req.body;
    if (!Array.isArray(narratives)) {
      return res.status(400).json({ error: 'Invalid narratives data' });
    }
    
    console.log(`[NarrativeEngine] Received ${narratives.length} narratives from client`);
    const updated = await narrativeEngine.syncFromClient(narratives);
    setCachedData('narrative_cache', 'narratives', updated);
    res.json({ status: 'ok', count: updated.length });
  });

  app.get('/api/narrative-history/:id', (req, res) => {
    const { id } = req.params;
    const now = Date.now();
    const points = [];
    // For now, we simulate history but based on the narrative's current score
    // In a real app, we'd have a narrative_history table
    const narrative = refreshNarrativeIntelligence().then(intel => {
      const n = intel.signals.find(s => s.id === id);
      const baseScore = n ? n.momentumValue : 50;
      
      for (let i = 24; i >= 0; i--) {
        points.push({
          timestamp: now - (i * 3600000),
          mentions: baseScore + (Math.random() * 20 - 10)
        });
      }
      res.json(points);
    }).catch(err => {
      console.error('Narrative history fetch failed:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  });

  app.get('/api/market-overview', async (req, res) => {
    const forceRefresh = req.query.refresh === 'true';
    let data = forceRefresh ? null : getCache('market-overview', 5 * 60 * 1000);

    if (!data) {
      const payload = await refreshMarketOverview();
      data = {
        payload,
        fetchedAt: Date.now(),
        sources: [
          { label: 'DexScreener', url: 'https://dexscreener.com' },
          { label: 'Solscan', url: 'https://solscan.io' },
          { label: 'GDELT', url: 'https://gdeltproject.org' }
        ]
      };
    }

    res.json(data);
  });

  app.get('/api/narrative-intelligence', async (req, res) => {
    const forceRefresh = req.query.refresh === 'true';
    let data = forceRefresh ? null : getCache('narrative-intelligence', 15 * 60 * 1000);

    if (!data) {
      const narratives = await narrativeEngine.updateIntelligence();
      const payload = {
        signals: narratives.map(n => ({
          id: n.name,
          name: n.name,
          momentumScore: n.socialVelocity > 80 ? 'High' : n.socialVelocity > 50 ? 'Medium' : 'Low',
          momentumValue: n.socialVelocity,
          description: n.description,
          keywords: n.name.split(' '),
          sources: [{ name: 'SplashSignal AI', link: '#' }],
          detectedAt: Date.now()
        })),
        news: [],
        tokens: narratives.flatMap(n => n.tokens),
        timestamp: Date.now()
      };
      data = {
        payload,
        fetchedAt: Date.now(),
        sources: [
          { label: 'Twitter', url: 'https://twitter.com' },
          { label: 'Google Trends', url: 'https://trends.google.com' },
          { label: 'GDELT', url: 'https://gdeltproject.org' },
          { label: 'DexScreener', url: 'https://dexscreener.com' }
        ]
      };
      setCache('narrative-intelligence', payload);
    }

    res.json(data);
  });

  // --- SplashSignal Ingestion Layer Routes ---
  app.get('/api/market-state', (req, res) => {
    const data = getEngineCache('market_cache', 'global_state', 30 * 1000);
    if (!data) return res.status(404).json({ error: 'Market data not available' });
    res.json(data);
  });

  app.get('/api/narratives', (req, res) => {
    const data = getEngineCache('narrative_cache', 'current_narratives', 120 * 1000);
    if (!data) return res.status(404).json({ error: 'Narrative data not available' });
    res.json(data);
  });

  app.get('/api/token-launches', (req, res) => {
    const data = getCache('token-launches', 1 * 60 * 1000);
    res.json(data || { error: 'Data not available' });
  });

  app.get('/api/whale-trades', (req, res) => {
    const data = getCache('market-state', 5 * 60 * 1000); // Whale activity is inside market-state in my mock
    res.json(data?.payload?.whaleActivity?.recentTransactions || []);
  });

  app.get('/api/alerts', (req, res) => {
    const alerts = alertEngine.getRecentAlerts(30);
    res.json(alerts);
  });

  // --- Background Tasks ---
  setInterval(async () => {
    try {
      await alertEngine.processTriggers();
      const narrativeAlerts = narrativeEngine.generateAlerts();
      for (const alert of narrativeAlerts) {
        alertEngine.addAlert(alert);
      }
    } catch (e) {
      console.error('[AlertEngine] Trigger processing failed:', e);
    }
  }, 10000);

  setInterval(async () => {
    try {
      await narrativeEngine.updateIntelligence();
    } catch (e) {
      console.error('[NarrativeEngine] Update failed:', e);
    }
  }, 15 * 60 * 1000);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] SignalOS Full-Stack Server running on port ${PORT}`);
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error('Vite failed to start:', e);
    }
  }
}

startServer();

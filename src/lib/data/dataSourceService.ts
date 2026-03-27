// Multi-Source Data Service
// Fetches token, holder, trade, and discovery data with Redis caching + fallbacks.
//
// Required env vars:
//   VITE_BIRDEYE_API_KEY  - get free key at birdeye.so
//   VITE_HELIUS_API_KEY   - get free key at helius.dev
//   VITE_SOLSCAN_API_KEY  - optional, improves Solscan rate limits
//   (DexScreener is free, no key needed)
//
// Optional:
//   REDIS_URL             - defaults to localhost:6379

import { Redis } from 'ioredis';
import {
  NormalizedToken,
  NormalizedWalletTrade,
  NormalizedHolder,
  normalizeDexScreenerPair,
  normalizeBirdeyeToken,
  normalizeHeliusTransaction,
  normalizeSolscanHolder,
} from './normalizer';

// ---- Cache TTLs ----
const TTL = {
  tokenPrice: 15,        // 15s — hot token price
  holderSnapshot: 300,   // 5min
  recentTrades: 30,      // 30s
  newTokens: 60,         // 60s
  walletHistory: 300,    // 5min
};

// ---- DataFetch log ----
interface DataFetch {
  key: string;
  source: string;
  success: boolean;
  fetchedAt: Date;
  error?: string;
}

function logFetch(record: DataFetch): void {
  if (record.success) {
    console.debug(`[DataSourceService] ${record.key} from ${record.source}`);
  } else {
    console.warn(`[DataSourceService] ${record.key} failed (${record.source}): ${record.error}`);
  }
}

// ---- Fetch helpers ----

async function safeFetch<T>(url: string, headers: Record<string, string> = {}): Promise<T | null> {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

// ---- Main service ----

export class DataSourceService {
  private redis: Redis;

  constructor(redis?: Redis) {
    this.redis = redis ?? new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  }

  // ---- Token data: DexScreener primary, Birdeye fallback ----
  async getToken(address: string): Promise<NormalizedToken | null> {
    const cacheKey = `token:${address}`;

    // 1. Cache check
    const cached = await this.getCache<NormalizedToken>(cacheKey);
    if (cached) return cached;

    // 2. DexScreener (no key needed)
    try {
      const dex = await safeFetch<any>(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
      if (dex?.pairs?.length > 0) {
        const token = normalizeDexScreenerPair(dex.pairs[0]);
        await this.setCache(cacheKey, token, TTL.tokenPrice);
        logFetch({ key: cacheKey, source: 'dexscreener', success: true, fetchedAt: new Date() });
        return token;
      }
    } catch (err) {
      logFetch({ key: cacheKey, source: 'dexscreener', success: false, fetchedAt: new Date(), error: String(err) });
    }

    // 3. Birdeye fallback
    // Requires: VITE_BIRDEYE_API_KEY
    const birdeyeKey = process.env.VITE_BIRDEYE_API_KEY;
    if (birdeyeKey) {
      try {
        const birdeye = await safeFetch<any>(
          `https://public-api.birdeye.so/defi/token_overview?address=${address}`,
          { 'X-API-KEY': birdeyeKey, 'x-chain': 'solana' }
        );
        if (birdeye?.data) {
          const token = normalizeBirdeyeToken(birdeye.data);
          await this.setCache(cacheKey, token, TTL.tokenPrice);
          logFetch({ key: cacheKey, source: 'birdeye', success: true, fetchedAt: new Date() });
          return token;
        }
      } catch (err) {
        logFetch({ key: cacheKey, source: 'birdeye', success: false, fetchedAt: new Date(), error: String(err) });
      }
    }

    return null;
  }

  // ---- Holder data: Solscan primary, Birdeye fallback ----
  async getHolders(tokenAddress: string, limit = 50): Promise<NormalizedHolder[]> {
    const cacheKey = `holders:${tokenAddress}:${limit}`;

    const cached = await this.getCache<NormalizedHolder[]>(cacheKey);
    if (cached) return cached;

    // Solscan primary
    // Requires: VITE_SOLSCAN_API_KEY (optional but recommended)
    const solscanKey = process.env.VITE_SOLSCAN_API_KEY;
    try {
      const headers: Record<string, string> = { 'accept': 'application/json' };
      if (solscanKey) headers['token'] = solscanKey;
      const res = await safeFetch<any>(
        `https://pro-api.solscan.io/v2.0/token/holders?address=${tokenAddress}&page=1&page_size=${limit}`,
        headers
      );
      if (res?.data?.result?.length > 0) {
        const holders = res.data.result.map((h: any) => ({
          ...normalizeSolscanHolder(h),
          tokenAddress,
        }));
        await this.setCache(cacheKey, holders, TTL.holderSnapshot);
        logFetch({ key: cacheKey, source: 'solscan', success: true, fetchedAt: new Date() });
        return holders;
      }
    } catch (err) {
      logFetch({ key: cacheKey, source: 'solscan', success: false, fetchedAt: new Date(), error: String(err) });
    }

    // Birdeye fallback
    // Requires: VITE_BIRDEYE_API_KEY
    const birdeyeKey = process.env.VITE_BIRDEYE_API_KEY;
    if (birdeyeKey) {
      try {
        const res = await safeFetch<any>(
          `https://public-api.birdeye.so/defi/v3/token/holder?address=${tokenAddress}&limit=${limit}`,
          { 'X-API-KEY': birdeyeKey, 'x-chain': 'solana' }
        );
        if (res?.data?.items?.length > 0) {
          const holders: NormalizedHolder[] = res.data.items.map((h: any) => ({
            walletAddress: h.owner,
            tokenAddress,
            balance: h.uiAmount ?? 0,
            balanceUsd: h.valueUsd ?? 0,
            percentOfSupply: h.percentage ?? 0,
            lastChanged: new Date(),
            source: 'birdeye' as const,
          }));
          await this.setCache(cacheKey, holders, TTL.holderSnapshot);
          logFetch({ key: cacheKey, source: 'birdeye', success: true, fetchedAt: new Date() });
          return holders;
        }
      } catch (err) {
        logFetch({ key: cacheKey, source: 'birdeye', success: false, fetchedAt: new Date(), error: String(err) });
      }
    }

    return [];
  }

  // ---- Recent trades: Birdeye primary, Helius fallback ----
  async getRecentTrades(tokenAddress: string, limit = 50): Promise<NormalizedWalletTrade[]> {
    const cacheKey = `trades:${tokenAddress}:${limit}`;

    const cached = await this.getCache<NormalizedWalletTrade[]>(cacheKey);
    if (cached) return cached;

    // Birdeye primary
    // Requires: VITE_BIRDEYE_API_KEY
    const birdeyeKey = process.env.VITE_BIRDEYE_API_KEY;
    if (birdeyeKey) {
      try {
        const res = await safeFetch<any>(
          `https://public-api.birdeye.so/defi/txs/token?address=${tokenAddress}&limit=${limit}&tx_type=swap`,
          { 'X-API-KEY': birdeyeKey, 'x-chain': 'solana' }
        );
        if (res?.data?.items?.length > 0) {
          const trades: NormalizedWalletTrade[] = res.data.items.map((t: any) => ({
            walletAddress: t.owner,
            tokenAddress,
            tokenSymbol: t.symbol ?? '',
            type: t.side === 'buy' ? 'BUY' as const : 'SELL' as const,
            amountUsd: t.volumeUsd ?? 0,
            timestamp: new Date(t.blockUnixTime * 1000),
            mcapAtTrade: 0,
            txHash: t.txHash,
            source: 'birdeye' as const,
          }));
          await this.setCache(cacheKey, trades, TTL.recentTrades);
          logFetch({ key: cacheKey, source: 'birdeye', success: true, fetchedAt: new Date() });
          return trades;
        }
      } catch (err) {
        logFetch({ key: cacheKey, source: 'birdeye', success: false, fetchedAt: new Date(), error: String(err) });
      }
    }

    // Helius fallback
    // Requires: VITE_HELIUS_API_KEY
    const heliusKey = process.env.VITE_HELIUS_API_KEY;
    if (heliusKey) {
      try {
        const res = await safeFetch<any>(
          `https://api.helius.xyz/v0/addresses/${tokenAddress}/transactions?api-key=${heliusKey}&limit=${limit}&type=SWAP`
        );
        if (Array.isArray(res) && res.length > 0) {
          const trades = res
            .map(normalizeHeliusTransaction)
            .filter(t => t.walletAddress && t.txHash);
          await this.setCache(cacheKey, trades, TTL.recentTrades);
          logFetch({ key: cacheKey, source: 'helius', success: true, fetchedAt: new Date() });
          return trades;
        }
      } catch (err) {
        logFetch({ key: cacheKey, source: 'helius', success: false, fetchedAt: new Date(), error: String(err) });
      }
    }

    return [];
  }

  // ---- Wallet trades: Helius primary, Birdeye fallback ----
  async getWalletTrades(walletAddress: string, limit = 50): Promise<NormalizedWalletTrade[]> {
    const cacheKey = `wallet_trades:${walletAddress}:${limit}`;

    const cached = await this.getCache<NormalizedWalletTrade[]>(cacheKey);
    if (cached) return cached;

    // Helius primary
    // Requires: VITE_HELIUS_API_KEY
    const heliusKey = process.env.VITE_HELIUS_API_KEY;
    if (heliusKey) {
      try {
        const res = await safeFetch<any>(
          `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${heliusKey}&limit=${limit}&type=SWAP`
        );
        if (Array.isArray(res) && res.length > 0) {
          const trades = res.map(normalizeHeliusTransaction);
          await this.setCache(cacheKey, trades, TTL.walletHistory);
          logFetch({ key: cacheKey, source: 'helius', success: true, fetchedAt: new Date() });
          return trades;
        }
      } catch (err) {
        logFetch({ key: cacheKey, source: 'helius', success: false, fetchedAt: new Date(), error: String(err) });
      }
    }

    // Birdeye fallback
    // Requires: VITE_BIRDEYE_API_KEY
    const birdeyeKey = process.env.VITE_BIRDEYE_API_KEY;
    if (birdeyeKey) {
      try {
        const res = await safeFetch<any>(
          `https://public-api.birdeye.so/defi/txs/wallet/token?wallet=${walletAddress}&limit=${limit}`,
          { 'X-API-KEY': birdeyeKey, 'x-chain': 'solana' }
        );
        if (res?.data?.items?.length > 0) {
          const trades: NormalizedWalletTrade[] = res.data.items.map((t: any) => ({
            walletAddress,
            tokenAddress: t.tokenAddress ?? '',
            tokenSymbol: t.symbol ?? '',
            type: t.side === 'buy' ? 'BUY' as const : 'SELL' as const,
            amountUsd: t.volumeUsd ?? 0,
            timestamp: new Date(t.blockUnixTime * 1000),
            mcapAtTrade: 0,
            txHash: t.txHash,
            source: 'birdeye' as const,
          }));
          await this.setCache(cacheKey, trades, TTL.walletHistory);
          logFetch({ key: cacheKey, source: 'birdeye', success: true, fetchedAt: new Date() });
          return trades;
        }
      } catch (err) {
        logFetch({ key: cacheKey, source: 'birdeye', success: false, fetchedAt: new Date(), error: String(err) });
      }
    }

    return [];
  }

  // ---- Discover new tokens: DexScreener new pairs ----
  // DexScreener is free, no key needed
  async discoverNewTokens(chain: string, minLiquidityUsd = 5000): Promise<NormalizedToken[]> {
    const cacheKey = `new_tokens:${chain}:${minLiquidityUsd}`;

    const cached = await this.getCache<NormalizedToken[]>(cacheKey);
    if (cached) return cached;

    try {
      const chainMap: Record<string, string> = {
        SOL: 'solana',
        ETH: 'ethereum',
        BSC: 'bsc',
        BASE: 'base',
      };
      const dexChain = chainMap[chain.toUpperCase()] ?? chain.toLowerCase();

      // Use DexScreener boosted/new pairs endpoint
      const res = await safeFetch<any>(
        `https://api.dexscreener.com/token-profiles/latest/v1`
      );

      let pairs: any[] = [];

      // Fallback: search new pairs by chain
      if (!res?.length) {
        const r2 = await safeFetch<any>(`https://api.dexscreener.com/latest/dex/search?q=${dexChain}`);
        pairs = r2?.pairs ?? [];
      } else {
        // token-profiles doesn't have pair data — fetch latest search
        const r2 = await safeFetch<any>(`https://api.dexscreener.com/latest/dex/search?q=new`);
        pairs = (r2?.pairs ?? []).filter((p: any) => p.chainId === dexChain);
      }

      const tokens = pairs
        .filter((p: any) => (p.liquidity?.usd ?? 0) >= minLiquidityUsd)
        .map(normalizeDexScreenerPair)
        .slice(0, 50);

      await this.setCache(cacheKey, tokens, TTL.newTokens);
      logFetch({ key: cacheKey, source: 'dexscreener', success: true, fetchedAt: new Date() });
      return tokens;
    } catch (err) {
      logFetch({ key: cacheKey, source: 'dexscreener', success: false, fetchedAt: new Date(), error: String(err) });
      return [];
    }
  }

  // ---- Cache helpers ----

  private async getCache<T>(key: string): Promise<T | null> {
    try {
      const val = await this.redis.get(key);
      return val ? (JSON.parse(val) as T) : null;
    } catch {
      return null;
    }
  }

  private async setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch {
      // Non-fatal
    }
  }
}

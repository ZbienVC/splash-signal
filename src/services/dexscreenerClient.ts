// Client-side DexScreener API wrapper
// DexScreener is free, no API key needed
// Rate limit: ~300 requests/min

const DEXSCREENER_BASE = 'https://api.dexscreener.com/latest/dex';

export interface DexToken {
  address: string;
  symbol: string;
  name: string;
  chain: string;
  chainLabel: string; // "SOL" | "ETH" | "BSC" | "BASE"
  pairAddress: string;
  price: number;
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  volume: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  liquidity: number;
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
  ageMinutes: number;
  ageLabel: string; // "2h old" | "3d old"
  url: string; // DexScreener pair URL
}

// Fetch token data by address
export async function getTokenByAddress(address: string): Promise<DexToken | null> {
  try {
    const res = await fetch(`${DEXSCREENER_BASE}/tokens/${address}`);
    if (!res.ok) return null;
    const data = await res.json() as { pairs?: unknown[] };
    const pair = data.pairs?.[0];
    if (!pair) return null;
    return normalizePair(pair);
  } catch {
    return null;
  }
}

// Search tokens by name/symbol
export async function searchTokens(query: string): Promise<DexToken[]> {
  try {
    const res = await fetch(`${DEXSCREENER_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json() as { pairs?: unknown[] };
    return (data.pairs ?? []).slice(0, 20).map(normalizePair).filter((t): t is DexToken => t !== null);
  } catch {
    return [];
  }
}

// Get new/trending Solana pairs
export async function getTrendingPairs(chain = 'solana'): Promise<DexToken[]> {
  try {
    const res = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
    if (!res.ok) return [];
    const data = await res.json() as Array<{ chainId?: string; tokenAddress?: string }>;
    const solTokens = (data ?? [])
      .filter(t => t.chainId === chain)
      .slice(0, 30)
      .map(t => t.tokenAddress)
      .filter((addr): addr is string => Boolean(addr));

    if (!solTokens.length) return [];

    const batchRes = await fetch(`${DEXSCREENER_BASE}/tokens/${solTokens.slice(0, 10).join(',')}`);
    if (!batchRes.ok) return [];
    const batchData = await batchRes.json() as { pairs?: unknown[] };
    return (batchData.pairs ?? []).map(normalizePair).filter((t): t is DexToken => t !== null);
  } catch {
    return [];
  }
}

// Get latest new pairs on Solana
export async function getNewPairs(minLiquidityUsd = 5000): Promise<DexToken[]> {
  try {
    const res = await fetch('https://api.dexscreener.com/token-boosts/latest/v1');
    if (!res.ok) return [];
    const data = await res.json() as Array<{ chainId?: string; tokenAddress?: string }>;
    const addrs = (data ?? [])
      .filter(t => t.chainId === 'solana')
      .slice(0, 20)
      .map(t => t.tokenAddress)
      .filter((addr): addr is string => Boolean(addr));

    if (!addrs.length) return [];

    const batchRes = await fetch(`${DEXSCREENER_BASE}/tokens/${addrs.join(',')}`);
    if (!batchRes.ok) return [];
    const batchData = await batchRes.json() as { pairs?: unknown[] };
    return (batchData.pairs ?? [])
      .map(normalizePair)
      .filter((t): t is DexToken => t !== null && t.liquidity >= minLiquidityUsd);
  } catch {
    return [];
  }
}

function buildAgeLabel(pairCreatedAt: number): string {
  const minutesOld = (Date.now() - pairCreatedAt) / 60000;
  if (minutesOld < 60) return `${Math.round(minutesOld)}m old`;
  if (minutesOld < 1440) return `${Math.round(minutesOld / 60)}h old`;
  return `${Math.round(minutesOld / 1440)}d old`;
}

function buildChainLabel(chainId: string): string {
  const map: Record<string, string> = {
    solana: 'SOL',
    ethereum: 'ETH',
    bsc: 'BSC',
    base: 'BASE',
    arbitrum: 'ARB',
  };
  return map[chainId] ?? chainId.toUpperCase().slice(0, 4);
}

interface RawTxnSide { buys?: number; sells?: number }
interface RawPair {
  baseToken?: { address?: string; symbol?: string; name?: string };
  chainId?: string;
  pairAddress?: string;
  priceUsd?: string;
  priceChange?: { m5?: number; h1?: number; h6?: number; h24?: number };
  volume?: { m5?: number; h1?: number; h6?: number; h24?: number };
  txns?: { m5?: RawTxnSide; h1?: RawTxnSide; h6?: RawTxnSide; h24?: RawTxnSide };
  liquidity?: { usd?: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  url?: string;
}

function normalizePair(pair: unknown): DexToken | null {
  const p = pair as RawPair;
  if (!p?.baseToken?.address) return null;
  const createdAt = p.pairCreatedAt ?? Date.now();
  const chainId = p.chainId ?? 'unknown';
  return {
    address: p.baseToken.address,
    symbol: p.baseToken.symbol ?? '???',
    name: p.baseToken.name ?? p.baseToken.symbol ?? 'Unknown',
    chain: chainId,
    chainLabel: buildChainLabel(chainId),
    pairAddress: p.pairAddress ?? '',
    price: parseFloat(p.priceUsd ?? '0'),
    priceChange: {
      m5: p.priceChange?.m5 ?? 0,
      h1: p.priceChange?.h1 ?? 0,
      h6: p.priceChange?.h6 ?? 0,
      h24: p.priceChange?.h24 ?? 0,
    },
    volume: {
      m5: p.volume?.m5 ?? 0,
      h1: p.volume?.h1 ?? 0,
      h6: p.volume?.h6 ?? 0,
      h24: p.volume?.h24 ?? 0,
    },
    txns: {
      m5: { buys: p.txns?.m5?.buys ?? 0, sells: p.txns?.m5?.sells ?? 0 },
      h1: { buys: p.txns?.h1?.buys ?? 0, sells: p.txns?.h1?.sells ?? 0 },
      h6: { buys: p.txns?.h6?.buys ?? 0, sells: p.txns?.h6?.sells ?? 0 },
      h24: { buys: p.txns?.h24?.buys ?? 0, sells: p.txns?.h24?.sells ?? 0 },
    },
    liquidity: p.liquidity?.usd ?? 0,
    fdv: p.fdv ?? 0,
    marketCap: p.marketCap ?? p.fdv ?? 0,
    pairCreatedAt: createdAt,
    ageMinutes: (Date.now() - createdAt) / 60000,
    ageLabel: buildAgeLabel(createdAt),
    url: p.url ?? `https://dexscreener.com/${chainId}/${p.pairAddress ?? ''}`,
  };
}

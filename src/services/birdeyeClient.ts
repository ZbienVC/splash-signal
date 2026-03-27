// Client-side Birdeye API wrapper
// Free tier: https://birdeye.so/
// Env var: VITE_BIRDEYE_API_KEY
// If key is missing, all functions return empty/null silently.

const BIRDEYE_BASE = 'https://public-api.birdeye.so';

function birdeyeHeaders(): Record<string, string> {
  const key = import.meta.env.VITE_BIRDEYE_API_KEY as string | undefined;
  return key ? { 'X-API-KEY': key } : {};
}

function hasKey(): boolean {
  return Boolean(import.meta.env.VITE_BIRDEYE_API_KEY);
}

export interface BirdeyeTrade {
  txHash: string;
  side: 'buy' | 'sell';
  price: number;
  priceUsd: number;
  volume: number;
  volumeUsd: number;
  from: string;
  to: string;
  timestamp: number;
}

export interface BirdeyeHolder {
  address: string;
  balance: number;
  percentage: number; // % of supply
  uiAmount: number;
}

export interface BirdeyeTokenInfo {
  address: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  mc: number;
  holder: number;
  logoURI?: string;
}

// Get token overview
export async function getBirdeyeToken(address: string): Promise<BirdeyeTokenInfo | null> {
  if (!hasKey()) return null;
  try {
    const res = await fetch(
      `${BIRDEYE_BASE}/defi/token_overview?address=${address}&chain=solana`,
      { headers: birdeyeHeaders() },
    );
    if (!res.ok) return null;
    const data = await res.json() as { success?: boolean; data?: Record<string, unknown> };
    if (!data.success) return null;
    const d = data.data ?? {};
    return {
      address,
      symbol: (d.symbol as string) ?? '???',
      name: (d.name as string) ?? (d.symbol as string) ?? 'Unknown',
      price: (d.price as number) ?? 0,
      priceChange24h: (d.priceChange24hPercent as number) ?? 0,
      volume24h: (d.v24hUSD as number) ?? 0,
      liquidity: (d.liquidity as number) ?? 0,
      mc: (d.mc as number) ?? 0,
      holder: (d.holder as number) ?? 0,
      logoURI: d.logoURI as string | undefined,
    };
  } catch {
    return null;
  }
}

// Get top holders
export async function getBirdeyeHolders(address: string, limit = 20): Promise<BirdeyeHolder[]> {
  if (!hasKey()) return [];
  try {
    const res = await fetch(
      `${BIRDEYE_BASE}/v1/token/holder?address=${address}&limit=${limit}&chain=solana`,
      { headers: birdeyeHeaders() },
    );
    if (!res.ok) return [];
    const data = await res.json() as { data?: { items?: Array<Record<string, unknown>> } };
    return (data.data?.items ?? []).map(h => ({
      address: (h.owner as string) ?? '',
      balance: (h.uiAmount as number) ?? (h.amount as number) ?? 0,
      uiAmount: (h.uiAmount as number) ?? 0,
      percentage: (h.percentage as number) ?? 0,
    }));
  } catch {
    return [];
  }
}

// Get recent trades for a token
export async function getBirdeyeTrades(address: string, limit = 50): Promise<BirdeyeTrade[]> {
  if (!hasKey()) return [];
  try {
    const res = await fetch(
      `${BIRDEYE_BASE}/defi/txs/token?address=${address}&limit=${limit}&chain=solana`,
      { headers: birdeyeHeaders() },
    );
    if (!res.ok) return [];
    const data = await res.json() as { data?: { items?: Array<Record<string, unknown>> } };
    return (data.data?.items ?? []).map(t => ({
      txHash: (t.txHash as string) ?? '',
      side: (t.side as string) === 'buy' ? 'buy' : 'sell',
      price: (t.price as number) ?? 0,
      priceUsd: (t.priceUsd as number) ?? 0,
      volume: (t.volume as number) ?? 0,
      volumeUsd: (t.volumeUsd as number) ?? (t.volume as number) ?? 0,
      from: (t.source as string) ?? (t.from as string) ?? '',
      to: (t.target as string) ?? (t.to as string) ?? '',
      timestamp: (t.blockUnixTime as number) ?? Date.now() / 1000,
    }));
  } catch {
    return [];
  }
}

// Get wallet's recent trades
export async function getBirdeyeWalletTrades(walletAddress: string, limit = 30): Promise<BirdeyeTrade[]> {
  if (!hasKey()) return [];
  try {
    const res = await fetch(
      `${BIRDEYE_BASE}/v1/wallet/tx_list?wallet=${walletAddress}&limit=${limit}&chain=solana`,
      { headers: birdeyeHeaders() },
    );
    if (!res.ok) return [];
    const data = await res.json() as { data?: { solana?: Array<Record<string, unknown>> } };
    return (data.data?.solana ?? []).map(t => ({
      txHash: (t.txHash as string) ?? '',
      side: (t.side as string) === 'buy' ? 'buy' : 'sell',
      price: (t.price as number) ?? 0,
      priceUsd: (t.price as number) ?? 0,
      volume: (t.volume as number) ?? 0,
      volumeUsd: (t.volumeUsd as number) ?? 0,
      from: walletAddress,
      to: (t.to as string) ?? '',
      timestamp: (t.blockTime as number) ?? Date.now() / 1000,
    }));
  } catch {
    return [];
  }
}

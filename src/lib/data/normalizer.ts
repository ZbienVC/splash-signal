// Data Normalizer — internal normalized types + adapter functions
// Frontend should never touch raw API shapes. Use these everywhere.

// ---- Normalized types ----

export interface NormalizedToken {
  address: string;
  symbol: string;
  name: string;
  chain: 'SOL' | 'ETH' | 'BSC' | 'BASE';
  price: number;
  priceChange1h: number;
  priceChange24h: number;
  marketCap: number;
  fdv: number;
  liquidity: number;
  volume1h: number;
  volume6h: number;
  volume24h: number;
  txns1h: { buys: number; sells: number };
  txns24h: { buys: number; sells: number };
  pairAddress: string;
  pairCreatedAt: number; // unix timestamp (seconds)
  ageMinutes: number;    // derived from pairCreatedAt
  source: 'dexscreener' | 'birdeye' | 'internal';
  fetchedAt: Date;
}

export interface NormalizedWalletTrade {
  walletAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  type: 'BUY' | 'SELL';
  amountUsd: number;
  timestamp: Date;
  mcapAtTrade: number;
  txHash: string;
  source: 'helius' | 'solscan' | 'birdeye' | 'internal';
}

export interface NormalizedHolder {
  walletAddress: string;
  tokenAddress: string;
  balance: number;
  balanceUsd: number;
  percentOfSupply: number;
  lastChanged: Date;
  source: 'solscan' | 'birdeye' | 'internal';
}

// ---- Chain ID mapping ----

function mapChain(chainId: string): NormalizedToken['chain'] {
  const map: Record<string, NormalizedToken['chain']> = {
    solana: 'SOL',
    ethereum: 'ETH',
    bsc: 'BSC',
    base: 'BASE',
    eth: 'ETH',
    bnb: 'BSC',
  };
  return map[chainId?.toLowerCase()] ?? 'SOL';
}

// ---- DexScreener ----

/**
 * Normalize a DexScreener pair response object.
 * Raw shape: https://docs.dexscreener.com/api/reference
 */
export function normalizeDexScreenerPair(raw: any): NormalizedToken {
  const pairCreatedAt = raw.pairCreatedAt
    ? Math.floor(Number(raw.pairCreatedAt) / 1000) // DexScreener uses ms
    : Math.floor(Date.now() / 1000);

  const ageMinutes = Math.floor((Date.now() / 1000 - pairCreatedAt) / 60);

  return {
    address: raw.baseToken?.address ?? '',
    symbol: raw.baseToken?.symbol ?? '',
    name: raw.baseToken?.name ?? '',
    chain: mapChain(raw.chainId ?? 'solana'),
    price: parseFloat(raw.priceUsd ?? '0') || 0,
    priceChange1h: raw.priceChange?.h1 ?? 0,
    priceChange24h: raw.priceChange?.h24 ?? 0,
    marketCap: raw.marketCap ?? raw.fdv ?? 0,
    fdv: raw.fdv ?? raw.marketCap ?? 0,
    liquidity: raw.liquidity?.usd ?? 0,
    volume1h: raw.volume?.h1 ?? 0,
    volume6h: raw.volume?.h6 ?? 0,
    volume24h: raw.volume?.h24 ?? 0,
    txns1h: {
      buys: raw.txns?.h1?.buys ?? 0,
      sells: raw.txns?.h1?.sells ?? 0,
    },
    txns24h: {
      buys: raw.txns?.h24?.buys ?? 0,
      sells: raw.txns?.h24?.sells ?? 0,
    },
    pairAddress: raw.pairAddress ?? '',
    pairCreatedAt,
    ageMinutes: Math.max(0, ageMinutes),
    source: 'dexscreener',
    fetchedAt: new Date(),
  };
}

// ---- Birdeye ----

/**
 * Normalize a Birdeye token overview response.
 * Env: VITE_BIRDEYE_API_KEY
 * Raw shape: GET /defi/token_overview
 */
export function normalizeBirdeyeToken(raw: any): NormalizedToken {
  const createdAt = raw.createdAt
    ? Math.floor(Number(raw.createdAt))
    : Math.floor(Date.now() / 1000);

  const ageMinutes = Math.floor((Date.now() / 1000 - createdAt) / 60);

  return {
    address: raw.address ?? '',
    symbol: raw.symbol ?? '',
    name: raw.name ?? '',
    chain: mapChain(raw.chain ?? 'solana'),
    price: raw.price ?? 0,
    priceChange1h: raw.priceChange1hPercent ?? 0,
    priceChange24h: raw.priceChange24hPercent ?? 0,
    marketCap: raw.mc ?? raw.marketCap ?? 0,
    fdv: raw.fdv ?? raw.mc ?? 0,
    liquidity: raw.liquidity ?? 0,
    volume1h: raw.v1h ?? raw.volume1h ?? 0,
    volume6h: raw.v6h ?? raw.volume6h ?? 0,
    volume24h: raw.v24h ?? raw.volume24h ?? 0,
    txns1h: {
      buys: raw.buy1h ?? 0,
      sells: raw.sell1h ?? 0,
    },
    txns24h: {
      buys: raw.buy24h ?? 0,
      sells: raw.sell24h ?? 0,
    },
    pairAddress: raw.pairAddress ?? raw.address ?? '',
    pairCreatedAt: createdAt,
    ageMinutes: Math.max(0, ageMinutes),
    source: 'birdeye',
    fetchedAt: new Date(),
  };
}

// ---- Helius ----

/**
 * Normalize a Helius enhanced transaction.
 * Env: VITE_HELIUS_API_KEY
 * Raw shape: https://docs.helius.dev/solana-apis/enhanced-transactions-api
 */
export function normalizeHeliusTransaction(raw: any): NormalizedWalletTrade {
  // Determine trade direction from nativeTransfers / tokenTransfers
  const tokenTransfer = raw.tokenTransfers?.[0];
  const type: 'BUY' | 'SELL' = raw.type === 'SWAP'
    ? (tokenTransfer?.toUserAccount === raw.feePayer ? 'BUY' : 'SELL')
    : 'BUY';

  const amountUsd =
    raw.nativeTransfers?.reduce((sum: number, t: any) => sum + Math.abs(t.amount ?? 0), 0) / 1e9 || 0;

  return {
    walletAddress: raw.feePayer ?? raw.accountData?.[0]?.account ?? '',
    tokenAddress: tokenTransfer?.mint ?? '',
    tokenSymbol: raw.description?.match(/\b([A-Z]{2,10})\b/)?.[1] ?? '',
    type,
    amountUsd,
    timestamp: raw.timestamp ? new Date(raw.timestamp * 1000) : new Date(),
    mcapAtTrade: 0, // Helius doesn't provide mcap
    txHash: raw.signature ?? '',
    source: 'helius',
  };
}

// ---- Solscan ----

/**
 * Normalize a Solscan token holder entry.
 * Env: VITE_SOLSCAN_API_KEY (optional, improves rate limits)
 * Raw shape: GET /token/holders
 */
export function normalizeSolscanHolder(raw: any): NormalizedHolder {
  const balance = Number(raw.amount ?? raw.uiAmount ?? 0);
  const percentOfSupply = raw.percent ?? raw.percentage ?? 0;

  return {
    walletAddress: raw.owner ?? raw.address ?? '',
    tokenAddress: raw.tokenAddress ?? raw.mint ?? '',
    balance,
    balanceUsd: raw.valueUsd ?? raw.value ?? 0,
    percentOfSupply: percentOfSupply * (percentOfSupply <= 1 ? 100 : 1), // normalize to 0-100
    lastChanged: raw.lastTx ? new Date(raw.lastTx * 1000) : new Date(),
    source: 'solscan',
  };
}

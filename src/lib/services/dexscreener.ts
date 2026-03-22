// DexScreener API Integration
import { PrismaClient } from '@prisma/client';

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity?: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  pairCreatedAt: number;
}

interface DexScreenerResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[];
}

export class DexScreenerService {
  private baseUrl = 'https://api.dexscreener.com/latest';
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Discover new tokens from latest pairs
  async discoverNewTokens(chain: string = 'ethereum'): Promise<string[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/dex/tokens/trending?chain=${chain}`
      );
      const data: DexScreenerResponse = await response.json();
      
      const newTokenAddresses: string[] = [];
      
      for (const pair of data.pairs) {
        const tokenAddress = pair.baseToken.address;
        
        // Check if token already exists
        const existingToken = await this.prisma.token.findUnique({
          where: { address: tokenAddress }
        });
        
        if (!existingToken) {
          newTokenAddresses.push(tokenAddress);
          
          // Create new token record
          await this.createTokenFromPair(pair);
        } else {
          // Update existing token data
          await this.updateTokenFromPair(existingToken.id, pair);
        }
      }
      
      return newTokenAddresses;
    } catch (error) {
      console.error('Error discovering new tokens:', error);
      return [];
    }
  }

  // Get detailed token data
  async getTokenData(tokenAddress: string): Promise<DexScreenerPair | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/dex/tokens/${tokenAddress}`
      );
      const data: DexScreenerResponse = await response.json();
      
      return data.pairs?.[0] || null;
    } catch (error) {
      console.error(`Error fetching token data for ${tokenAddress}:`, error);
      return null;
    }
  }

  // Create token from DexScreener pair data
  private async createTokenFromPair(pair: DexScreenerPair) {
    const chainIdMap: { [key: string]: number } = {
      'ethereum': 1,
      'bsc': 56,
      'solana': 1399
    };

    return await this.prisma.token.create({
      data: {
        address: pair.baseToken.address,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
        chainId: chainIdMap[pair.chainId] || 1,
        price: parseFloat(pair.priceUsd) || null,
        marketCap: pair.fdv || null,
        volume24h: pair.volume.h24 || null,
        liquidity: pair.liquidity?.usd || null,
        lastScanAt: new Date(),
        
        // Create initial price history
        priceHistory: {
          create: {
            price: parseFloat(pair.priceUsd) || 0,
            volume: pair.volume.h24 || null,
            marketCap: pair.fdv || null,
            liquidity: pair.liquidity?.usd || null,
            timestamp: new Date(),
          }
        }
      }
    });
  }

  // Update existing token from pair data
  private async updateTokenFromPair(tokenId: string, pair: DexScreenerPair) {
    await this.prisma.token.update({
      where: { id: tokenId },
      data: {
        price: parseFloat(pair.priceUsd) || null,
        marketCap: pair.fdv || null,
        volume24h: pair.volume.h24 || null,
        liquidity: pair.liquidity?.usd || null,
        lastScanAt: new Date(),
      }
    });

    // Add price history entry
    await this.prisma.priceHistory.upsert({
      where: {
        tokenId_timestamp: {
          tokenId,
          timestamp: new Date()
        }
      },
      update: {
        price: parseFloat(pair.priceUsd) || 0,
        volume: pair.volume.h24 || null,
        marketCap: pair.fdv || null,
        liquidity: pair.liquidity?.usd || null,
      },
      create: {
        tokenId,
        price: parseFloat(pair.priceUsd) || 0,
        volume: pair.volume.h24 || null,
        marketCap: pair.fdv || null,
        liquidity: pair.liquidity?.usd || null,
        timestamp: new Date(),
      }
    });
  }

  // Get trending tokens with high volume/activity
  async getTrendingTokens(limit: number = 50): Promise<DexScreenerPair[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/dex/search/?q=*&limit=${limit}`
      );
      const data: DexScreenerResponse = await response.json();
      
      // Filter and sort by volume and activity
      return data.pairs
        .filter(pair => 
          pair.volume.h24 > 1000 && // Min $1k volume
          pair.liquidity && pair.liquidity.usd > 5000 && // Min $5k liquidity
          pair.txns.h24.buys + pair.txns.h24.sells > 10 // Min transaction activity
        )
        .sort((a, b) => (b.volume.h24 || 0) - (a.volume.h24 || 0));
    } catch (error) {
      console.error('Error fetching trending tokens:', error);
      return [];
    }
  }
}
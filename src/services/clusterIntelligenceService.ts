
import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { ClusterIntelligence, ClusterEvidence } from '../types/signalos';
import { v4 as uuidv4 } from 'uuid';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

export class ClusterIntelligenceService {
  private static txCache = new Map<string, any>();

  static async detectClusters(tokenAddress: string): Promise<ClusterIntelligence[]> {
    try {
      const pubkey = new PublicKey(tokenAddress);
      
      // 1. Get recent signatures
      const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 50 });
      
      if (signatures.length === 0) return [];

      // 2. Fetch and parse transactions
      const events: ClusterEvidence[] = [];
      
      for (const sigInfo of signatures) {
        const signature = sigInfo.signature;
        
        // Check cache
        if (this.txCache.has(signature)) {
          events.push(this.txCache.get(signature));
          continue;
        }

        try {
          const tx = await connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (!tx || !tx.meta) continue;

          const event = this.parseTransaction(tx, tokenAddress, signature);
          if (event) {
            this.txCache.set(signature, event);
            events.push(event);
          }
        } catch (e) {
          console.error(`Error parsing tx ${signature}:`, e);
        }
      }

      // 3. Sort events by timestamp
      events.sort((a, b) => a.timestamp - b.timestamp);

      // 4. Detect clusters
      return this.runDetectionAlgorithm(events);
    } catch (error) {
      console.error('Cluster detection failed:', error);
      return [];
    }
  }

  private static parseTransaction(tx: ParsedTransactionWithMeta, tokenAddress: string, signature: string): ClusterEvidence | null {
    const timestamp = tx.blockTime ? tx.blockTime * 1000 : Date.now();
    const wallet = tx.transaction.message.accountKeys[0].pubkey.toString();
    
    // Simple parsing for SPL token transfers
    // We look for token transfers involving the tokenAddress
    const postTokenBalances = tx.meta?.postTokenBalances || [];
    const preTokenBalances = tx.meta?.preTokenBalances || [];

    const walletPost = postTokenBalances.find(b => b.owner === wallet && b.mint === tokenAddress);
    const walletPre = preTokenBalances.find(b => b.owner === wallet && b.mint === tokenAddress);

    const postAmount = walletPost?.uiTokenAmount.uiAmount || 0;
    const preAmount = walletPre?.uiTokenAmount.uiAmount || 0;
    const diff = postAmount - preAmount;

    if (diff === 0) return null;

    // Mock USD value for demo (in a real app, we'd fetch the price at that timestamp)
    // We'll assume a price of $0.01 for now or use a random value for variety
    const mockPrice = 0.05; 
    const usdValue = Math.abs(diff) * mockPrice;

    return {
      wallet,
      signature,
      amount: diff,
      timestamp,
      usdValue
    };
  }

  private static runDetectionAlgorithm(events: ClusterEvidence[]): ClusterIntelligence[] {
    const clusters: ClusterIntelligence[] = [];
    const windowSize = 60000; // 60 seconds

    for (let i = 0; i < events.length; i++) {
      const windowEvents = events.filter(e => 
        e.timestamp >= events[i].timestamp && 
        e.timestamp <= events[i].timestamp + windowSize
      );

      // Whale Accumulation: 3+ whale buys (> $25k)
      const whaleBuys = windowEvents.filter(e => e.amount > 0 && e.usdValue > 25000);
      if (whaleBuys.length >= 3) {
        const id = `whale-acc-${events[i].timestamp}`;
        if (!clusters.find(c => c.id === id)) {
          clusters.push({
            id,
            clusterType: 'Whale Accumulation',
            signalStrength: whaleBuys.length > 5 ? 'High' : 'Medium',
            interpretation: 'Several large wallets bought within a short window. This may indicate early accumulation before a price move.',
            wallets: [...new Set(whaleBuys.map(e => e.wallet))],
            transactions: whaleBuys.map(e => e.signature),
            totalVolume: whaleBuys.reduce((sum, e) => sum + e.usdValue, 0),
            startTime: Math.min(...whaleBuys.map(e => e.timestamp)),
            endTime: Math.max(...whaleBuys.map(e => e.timestamp)),
            evidence: whaleBuys,
            confidence: 0.9
          });
        }
      }

      // Distribution: 3+ whale sells (> $25k)
      const whaleSells = windowEvents.filter(e => e.amount < 0 && e.usdValue > 25000);
      if (whaleSells.length >= 3) {
        const id = `dist-${events[i].timestamp}`;
        if (!clusters.find(c => c.id === id)) {
          clusters.push({
            id,
            clusterType: 'Distribution',
            signalStrength: whaleSells.length > 5 ? 'High' : 'Medium',
            interpretation: 'Multiple large wallets sold within a short window. This may indicate profit taking or exit liquidity.',
            wallets: [...new Set(whaleSells.map(e => e.wallet))],
            transactions: whaleSells.map(e => e.signature),
            totalVolume: whaleSells.reduce((sum, e) => sum + e.usdValue, 0),
            startTime: Math.min(...whaleSells.map(e => e.timestamp)),
            endTime: Math.max(...whaleSells.map(e => e.timestamp)),
            evidence: whaleSells,
            confidence: 0.85
          });
        }
      }

      // Bot Activity: 5+ wallets within 3 seconds, similar trade sizes
      const botWindow = 3000; // 3 seconds
      const botEvents = windowEvents.filter(e => 
        e.timestamp >= events[i].timestamp && 
        e.timestamp <= events[i].timestamp + botWindow
      );

      if (botEvents.length >= 5) {
        // Check for similar trade sizes (within 20% of each other)
        const avgAmount = botEvents.reduce((sum, e) => sum + Math.abs(e.amount), 0) / botEvents.length;
        const similarSizes = botEvents.every(e => {
          const diff = Math.abs(Math.abs(e.amount) - avgAmount);
          return diff / avgAmount < 0.2;
        });

        if (similarSizes) {
          const id = `bot-${events[i].timestamp}`;
          if (!clusters.find(c => c.id === id)) {
            clusters.push({
              id,
              clusterType: 'Bot Activity',
              signalStrength: botEvents.length > 10 ? 'High' : 'Medium',
              interpretation: 'Many small wallets bought simultaneously with identical sizes. This often indicates automated trading or coordinated buying.',
              wallets: [...new Set(botEvents.map(e => e.wallet))],
              transactions: botEvents.map(e => e.signature),
              totalVolume: botEvents.reduce((sum, e) => sum + e.usdValue, 0),
              startTime: Math.min(...botEvents.map(e => e.timestamp)),
              endTime: Math.max(...botEvents.map(e => e.timestamp)),
              evidence: botEvents,
              confidence: 0.8
            });
          }
        }
      }
    }

    // Deduplicate clusters (keep only the strongest/longest ones)
    return this.deduplicateClusters(clusters);
  }

  private static deduplicateClusters(clusters: ClusterIntelligence[]): ClusterIntelligence[] {
    // Simple deduplication: if clusters overlap significantly, keep one
    const result: ClusterIntelligence[] = [];
    const sorted = clusters.sort((a, b) => b.totalVolume - a.totalVolume);

    for (const cluster of sorted) {
      const isDuplicate = result.some(r => 
        r.clusterType === cluster.clusterType && 
        Math.abs(r.startTime - cluster.startTime) < 30000
      );
      if (!isDuplicate) {
        result.push(cluster);
      }
    }

    return result;
  }
}

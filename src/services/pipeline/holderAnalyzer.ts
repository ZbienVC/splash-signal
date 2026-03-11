
import { Chain, Holder, HolderAnalysis } from '../../types/signalos';
import { getDeterministicScore } from '../marketService';

export async function fetchHolders(chain: Chain, address: string): Promise<HolderAnalysis> {
  const holders: Holder[] = [];
  let totalTop10 = 0;

  for (let i = 0; i < 10; i++) {
    const percentage = getDeterministicScore(address + i, 'holder_perc', 1, 15);
    holders.push({
      address: chain === 'solana' ? `wallet_${i}_${address.slice(0, 4)}` : `0x${i}...${address.slice(-4)}`,
      balance: (percentage * 1000000).toString(),
      percentage,
      isContract: i === 0, // Assume top holder might be a pool/contract
      isCreator: i === 5 // Randomly assign creator
    });
    totalTop10 += percentage;
  }

  return {
    top10Percentage: totalTop10,
    giniCoefficient: getDeterministicScore(address, 'gini', 30, 90) / 100,
    singleWalletDominance: holders[0].percentage > 20,
    creatorShare: holders.find(h => h.isCreator)?.percentage || 0,
    holders
  };
}

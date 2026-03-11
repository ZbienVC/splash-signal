
import { Chain, TokenMetadata } from '../../types/signalos';
import { getDeterministicScore } from '../marketService';

export async function fetchMetadata(chain: Chain, address: string): Promise<TokenMetadata> {
  try {
    // Check if it's a valid address-like string, otherwise search
    const isAddress = /^(0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})$/.test(address);
    const url = isAddress 
      ? `https://api.dexscreener.com/latest/dex/tokens/${address}`
      : `https://api.dexscreener.com/latest/dex/search?q=${address}`;
      
    const response = await fetch(url);
    if (!response.ok) throw new Error('DexScreener API error');
    const data = await response.json();
    
    if (data.pairs && data.pairs.length > 0) {
      // Sort by liquidity to get the most relevant pair
      const pair = data.pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
      
      return {
        address: pair.baseToken.address,
        name: pair.baseToken.name,
        symbol: pair.baseToken.symbol,
        decimals: 18,
        totalSupply: "0",
        chain: pair.chainId as Chain,
        deployer: "Contract Address", // DexScreener doesn't provide deployer
      };
    }
  } catch (error) {
    console.error('Error fetching real metadata:', error);
  }

  // Fallback to deterministic simulation if API fails or no pairs found
  const nameSeed = getDeterministicScore(address, 'name', 0, 1000);
  const names = ['Unknown Asset', 'Generic Token', 'DeFi Asset', 'Network Token', 'Protocol Asset'];
  const symbols = ['TOKEN', 'ASSET', 'DEFI', 'NET', 'PROT'];
  
  const name = names[nameSeed % names.length];
  const symbol = symbols[nameSeed % symbols.length];
  
  const metadata: TokenMetadata = {
    address,
    name,
    symbol,
    decimals: chain === 'solana' ? 6 : 18,
    totalSupply: "1000000000000000",
    chain,
    creationBlock: chain === 'solana' ? undefined : 18000000 + (nameSeed * 100),
    creationSlot: chain === 'solana' ? 250000000 + (nameSeed * 1000) : undefined,
    deployer: `0x${address.slice(2, 10)}...${address.slice(-4)}`,
  };

  // Solana Launchpad Logic
  if (chain === 'solana') {
    const isPumpFun = address.toLowerCase().endsWith('pump'); // Heuristic
    if (isPumpFun) {
      metadata.launchpadType = 'pumpfun';
      metadata.bondingCurveProgress = getDeterministicScore(address, 'bonding', 0, 100);
      metadata.isGraduated = metadata.bondingCurveProgress === 100;
    } else if (nameSeed % 5 === 0) {
      metadata.launchpadType = 'bonk';
    } else {
      metadata.launchpadType = 'standard';
    }
  }

  return metadata;
}


import { Chain } from '../../types/signalos';

export function detectChain(input: string): Chain {
  // EVM address: 0x followed by 40 hex chars
  if (/^0x[a-fA-F0-9]{40}$/.test(input)) {
    // For now, default to ethereum, but in a real app we'd probe RPC
    // We can simulate base detection if the input contains 'base' or similar, 
    // but usually it's just an address.
    return 'ethereum'; 
  }

  // Solana address: base58, usually 32-44 chars
  // Simple check for base58-like characters and length
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input)) {
    return 'solana';
  }

  // Default fallback
  return 'ethereum';
}

export function normalizeIdentifier(input: string): string {
  let normalized = input.trim();
  
  // Handle URLs (e.g. dexscreener, etherscan)
  if (normalized.includes('/')) {
    const parts = normalized.split('/');
    normalized = parts[parts.length - 1] || parts[parts.length - 2];
  }

  // Remove any query params
  normalized = normalized.split('?')[0];

  return normalized;
}

export const isValidSolanaSignature = (signature: string): boolean => {
  // Solana signatures are base58 encoded and typically 88 characters long (can vary slightly but 87-89 is common)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{87,89}$/;
  return base58Regex.test(signature);
};

export const isValidSolanaAddress = (address: string): boolean => {
  // Solana addresses are base58 encoded and typically 32-44 characters long
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
};

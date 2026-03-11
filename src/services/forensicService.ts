import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  return new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY as string) });
};

async function callGeminiWithRetry(params: any, retries = 3, delay = 2000) {
  const ai = getAI();
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.code === 429;
      if (isRateLimit && i < retries - 1) {
        console.warn(`[Gemini] Rate limited (429). Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}

export interface ForensicNode {
  id: string;
  type: 'wallet' | 'contract' | 'lp';
  label: string;
  value?: number;
}

export interface ForensicEdge {
  source: string;
  target: string;
  type: 'transfer' | 'funding' | 'swap';
  amount?: string;
}

export interface FundingChain {
  targetWallet: string;
  sourceWallets: { address: string; amount: string; time: string; hop: number }[];
}

export interface LPStatus {
  pairAddress: string;
  isLocked: boolean;
  unlockTime?: string;
  percentLocked: number;
  provider: string;
  owner: string;
}

export interface BundleAnalysis {
  bundlePercentage: number;
  bundleWallets: string[];
  bundleTime: string;
  isBundled: boolean;
}

export interface ForensicData {
  nodes: ForensicNode[];
  edges: ForensicEdge[];
  fundingChains: FundingChain[];
  lpStatus: LPStatus;
  clusters: { id: string; members: string[]; coordinationScore: number }[];
  bundleAnalysis: BundleAnalysis;
}

export async function fetchForensicData(mint: string): Promise<ForensicData | null> {
  try {
    const response = await callGeminiWithRetry({
      model: "gemini-3-flash-preview",
      contents: `Perform a deep forensic investigation of the Solana token mint: "${mint}".
      
      Generate a realistic forensic dataset including:
      1. A transaction graph (nodes: wallets, contracts, LPs; edges: transfers, funding, swaps).
      2. Wallet funding chains (tracing where the top holders got their initial SOL).
      3. LP unlock detection (check if liquidity is locked and when it unlocks).
      4. Cluster relationships (identify groups of wallets that seem coordinated).
      5. Bundle Analysis: Detect if there were coordinated "bundled" buys at launch (multiple wallets buying in the same block or within seconds).
      
      Context: This is for a high-end institutional forensic terminal. The data should feel precise and professional.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, description: "wallet, contract, or lp" },
                  label: { type: Type.STRING }
                },
                required: ["id", "type", "label"]
              }
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  type: { type: Type.STRING, description: "transfer, funding, or swap" },
                  amount: { type: Type.STRING }
                },
                required: ["source", "target", "type"]
              }
            },
            fundingChains: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  targetWallet: { type: Type.STRING },
                  sourceWallets: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        address: { type: Type.STRING },
                        amount: { type: Type.STRING },
                        time: { type: Type.STRING },
                        hop: { type: Type.NUMBER }
                      },
                      required: ["address", "amount", "time", "hop"]
                    }
                  }
                },
                required: ["targetWallet", "sourceWallets"]
              }
            },
            lpStatus: {
              type: Type.OBJECT,
              properties: {
                pairAddress: { type: Type.STRING },
                isLocked: { type: Type.BOOLEAN },
                unlockTime: { type: Type.STRING },
                percentLocked: { type: Type.NUMBER },
                provider: { type: Type.STRING },
                owner: { type: Type.STRING }
              },
              required: ["pairAddress", "isLocked", "percentLocked", "provider", "owner"]
            },
            clusters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  members: { type: Type.ARRAY, items: { type: Type.STRING } },
                  coordinationScore: { type: Type.NUMBER }
                },
                required: ["id", "members", "coordinationScore"]
              }
            },
            bundleAnalysis: {
              type: Type.OBJECT,
              properties: {
                bundlePercentage: { type: Type.NUMBER },
                bundleWallets: { type: Type.ARRAY, items: { type: Type.STRING } },
                bundleTime: { type: Type.STRING },
                isBundled: { type: Type.BOOLEAN }
              },
              required: ["bundlePercentage", "bundleWallets", "bundleTime", "isBundled"]
            }
          },
          required: ["nodes", "edges", "fundingChains", "lpStatus", "clusters", "bundleAnalysis"]
        }
      }
    });

    if (!response) return null;
    return JSON.parse(response.text || "null");
  } catch (error) {
    console.error("Error fetching forensic data:", error);
    return null;
  }
}

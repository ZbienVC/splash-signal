import { Type, GoogleGenAI } from "@google/genai";
import { Evidence } from "../types";

const ai = new GoogleGenAI({ apiKey: (typeof window === "undefined" ? process.env.GEMINI_API_KEY as string : "") });

export interface SmartAlert {
  id: string;
  type: 'Narrative Spike' | 'Dev Selling' | 'Whale Accumulation' | 'Liquidity Collapse' | 'Bot Swarm';
  confidence: number;
  triggerData: string;
  timeDetected: string;
  description: string;
  severity: 'critical' | 'high' | 'medium';
  targetAsset?: string;
  evidence?: Evidence;
}

export async function fetchSmartAlerts(): Promise<SmartAlert[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 3-5 highly realistic, real-time "Smart Market Alerts" for the crypto market as of March 2026.
      
      Alert Types to choose from:
      - Narrative Spike Alert: Sudden surge in specific topic discussion.
      - Dev Selling Alert: Developer wallet offloading significant supply.
      - Whale Accumulation Alert: Large wallets increasing positions significantly.
      - Liquidity Collapse Alert: Rapid removal of liquidity from pools.
      - Bot Swarm Detection: Coordinated automated trading or social activity.
      
      For each alert, provide:
      1. Type (from the list above)
      2. Confidence (0-100)
      3. Trigger data (specific metric that triggered it, e.g., "Dev sold 6.2% of supply in 15m")
      4. Time detected (ISO string, very recent)
      5. Description (A brief professional explanation)
      6. Severity (critical, high, medium)
      7. Target Asset (e.g., "SOL", "PEPE", "WIF")
      8. Evidence object containing a summary of the proof and a list of sources used to verify this alert.

      The alerts should feel forensic, urgent, and data-driven.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              triggerData: { type: Type.STRING },
              timeDetected: { type: Type.STRING },
              description: { type: Type.STRING },
              severity: { type: Type.STRING },
              targetAsset: { type: Type.STRING },
              evidence: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING },
                  sources: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        url: { type: Type.STRING },
                        kind: { type: Type.STRING, description: "One of: dexscreener, solscan, pumpfun, gdelt, wiki, trends, twitter, rpc, internal, other" }
                      },
                      required: ["label", "url", "kind"]
                    }
                  }
                },
                required: ["summary", "sources"]
              }
            },
            required: ["type", "confidence", "triggerData", "timeDetected", "description", "severity", "evidence"]
          }
        }
      }
    });

    const data = JSON.parse(response.text || "[]");
    return data.map((alert: any) => ({
      ...alert,
      id: `smart-${Math.random().toString(36).substr(2, 9)}`
    }));
  } catch (error) {
    console.error("Error fetching smart alerts:", error);
    // Fallback mock data if Gemini fails
    const now = new Date().toISOString();
    return [
      {
        id: 'smart-fallback-1',
        type: 'Dev Selling',
        confidence: 98,
        triggerData: 'Dev sold 5.4% of supply in 12m',
        timeDetected: now,
        description: 'Coordinated sell-off detected from known developer-linked wallets on Raydium.',
        severity: 'critical',
        targetAsset: 'MEME_COIN_X',
        evidence: {
          summary: "Wallet cluster 0x72...a1 (Dev) moved 5.4% of total supply to Raydium LP and executed 12 sell orders.",
          sources: [
            { label: "Solscan Transaction", url: "https://solscan.io", kind: "solscan", timestamp: now }
          ]
        }
      },
      {
        id: 'smart-fallback-2',
        type: 'Narrative Spike',
        confidence: 85,
        triggerData: 'Velocity spike +450% in 1h',
        timeDetected: now,
        description: 'Sudden surge in "AI Agent" narrative across social nodes and news aggregators.',
        severity: 'high',
        targetAsset: 'AI_SECTOR',
        evidence: {
          summary: "Keyword 'AI Agent' frequency increased 4.5x in last 60 minutes across Twitter and GDELT.",
          sources: [
            { label: "Twitter Trends", url: "https://twitter.com", kind: "twitter", timestamp: now },
            { label: "GDELT Global News", url: "https://www.gdeltproject.org", kind: "gdelt", timestamp: now }
          ]
        }
      }
    ];
  }
}

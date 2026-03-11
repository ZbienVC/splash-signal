import { GoogleGenAI, Type } from "@google/genai";
import { Evidence } from "../types";

const ai = new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY as string) });

export interface AttentionItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  score: number;
  created_at: string;
  url?: string;
  isLive?: boolean;
  evidence?: Evidence;
}

export async function fetchLiveNarratives(): Promise<AttentionItem[]> {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Search for the most critical and high-impact crypto market signals occurring right now. 
        Focus on: 
        1. Major protocol upgrades or technical shifts (category: 'protocol')
        2. Significant whale movements or liquidity shifts (category: 'liquidity')
        3. Critical security alerts or risk anomalies (category: 'security')
        4. Major regulatory or macro-economic news affecting crypto (category: 'macro')
        5. Significant shifts in social sentiment or viral narratives (category: 'sentiment')

        Provide a highly selective list of 5-6 items. 
        For each item, include:
        - A concise, punchy title.
        - A 2-sentence summary explaining the immediate impact.
        - A category from the list above.
        - A specific, real external URL (news article, block explorer, or official tweet) for verification.
        - A source name (e.g., 'The Block', 'Whale Alert', 'Coindesk').
        - A signal strength score (0.0 to 1.0).
        - An evidence object containing a summary of the proof and a list of sources used to verify this signal.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                category: { type: Type.STRING },
                source: { type: Type.STRING },
                url: { type: Type.STRING },
                score: { type: Type.NUMBER },
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
              required: ["title", "summary", "category", "source", "score", "url", "evidence"]
            }
          }
        }
      });

      const results = JSON.parse(response.text || "[]");
      return results.map((item: any, index: number) => ({
        ...item,
        id: `live-${Date.now()}-${index}`,
        created_at: new Date().toISOString(),
        isLive: true
      }));
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
      const isTransient = error?.message?.includes('500') || error?.message?.includes('UNKNOWN') || error?.message?.includes('xhr error');
      
      if ((isRateLimit || isTransient) && retryCount < maxRetries) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
        console.warn(`[AttentionService] Gemini API error (${error?.message}). Retrying in ${Math.round(delay)}ms... (Attempt ${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      console.error("Error fetching live narratives from Gemini:", error);
      return [];
    }
  }
  return [];
}

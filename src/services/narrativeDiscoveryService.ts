import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[NarrativeDiscovery] GEMINI_API_KEY not found');
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

export interface DiscoveredNarrative {
  name: string;
  description: string;
  keywords: string[];
  sentiment: string;
  socialVelocity: number;
  newsMentions: number;
  volumeGrowth: number;
}

export async function discoverNarratives(): Promise<DiscoveredNarrative[]> {
  const ai = getAI();
  const prompt = `Analyze current global trends (March 2026) by monitoring:
  1. Google Trends (search volume surges)
  2. Twitter keyword velocity (viral topics and hashtags)
  3. GDELT news database (global media coverage)

  Identify 5 emerging themes that could influence the crypto meme market. 
  Perform "Narrative Clustering": Group related keywords into cohesive themes (e.g., if you see "hippo", "baby hippo", and "zoo hippo", cluster them into a single "HIPPO" narrative).

  For each narrative, provide:
  - Name (short, catchy, e.g., "HIPPO MANIA")
  - Description (how it's evolving across news and social)
  - Keywords (3-5 keywords for token matching)
  - Sentiment (positive, negative, neutral)
  - Social Velocity (0-100 score based on Twitter/Social growth)
  - News Mentions (estimated count of recent articles/reports)
  - Volume Growth (percentage increase in discussion volume over the last hour)
  
  Return as a JSON array.`;

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                sentiment: { type: Type.STRING },
                socialVelocity: { type: Type.NUMBER },
                newsMentions: { type: Type.NUMBER },
                volumeGrowth: { type: Type.NUMBER }
              },
              required: ["name", "description", "sentiment", "socialVelocity", "newsMentions", "volumeGrowth"]
            }
          }
        }
      });

      const text = response.text;
      if (!text) return [];
      
      return JSON.parse(text);
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
      const isTransient = error?.message?.includes('500') || error?.message?.includes('UNKNOWN') || error?.message?.includes('xhr error');
      
      if ((isRateLimit || isTransient) && retryCount < maxRetries) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
        console.warn(`[NarrativeDiscovery] Gemini API error (${error?.message}). Retrying in ${Math.round(delay)}ms... (Attempt ${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      console.error("Narrative discovery failed:", error);
      return [];
    }
  }
  return [];
}

export async function syncNarrativesToServer(narratives: DiscoveredNarrative[]) {
  try {
    await fetch('/api/narratives/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ narratives })
    });
  } catch (error) {
    console.error("Failed to sync narratives to server:", error);
  }
}

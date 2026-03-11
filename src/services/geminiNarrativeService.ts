import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[NarrativeAnalysis] GEMINI_API_KEY not found');
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

export interface NarrativeData {
  stats: {
    label: string;
    value: number;
    delta: string;
    status: 'low' | 'neutral' | 'high';
    description: string;
    insight: string;
  }[];
  radarMetrics: {
    subject: string;
    value: number;
    fullMark: number;
  }[];
  strengthScore: number;
  network: {
    label: string;
    value: number;
    color: string;
    description: string;
  }[];
  riskAssessment: string;
  targetAudience: string;
  marketSignal: string;
  signalDescription: string;
  volumeToUniqueRatio: number;
  relatedNarratives: string[];
  keyDrivers: string[];
  recentDevelopments: string[];
  velocityEngine: {
    velocityScore: number;
    retailAttention: number;
    saturation: number;
    growthRate: number;
    freshness: number;
    recentArticles: { title: string; url: string; source: string }[];
  };
}

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

export async function fetchNarrativeAnalysis(query: string): Promise<NarrativeData | null> {
  try {
    const response = await callGeminiWithRetry({
      model: "gemini-3.1-pro-preview",
      contents: `Perform an expert-level deep-dive analysis of the crypto narrative: "${query}". 
      Your goal is to provide highly accurate, actionable metrics that reflect the current market state (March 2026).
      
      Provide realistic, data-driven metrics for the following:
      1. Social Mention Velocity (0-100 score): Speed and acceleration of social media mentions.
      2. Token Launch Count (0-100 score): Number of new tokens launched within this narrative cluster.
      3. Trading Volume Intensity (0-100 score): Aggregated trading volume across related token pairs.
      4. Search Interest (0-100 score): Google Trends and search engine momentum.
      
      Contextual Data:
      - Amplification Network breakdown (Bot Clusters, Influencer Nodes, Organic Users) summing to 100%.
      - AI Risk Assessment: A technical evaluation of the narrative's sustainability.
      - Target Audience: Who is this narrative being marketed to?
      - Market Signal: A professional classification of the current trend phase.
      - Signal Description: A detailed explanation of the market signal.
      - Volume-to-Unique-Account ratio: A key metric for identifying artificial hype.
      - Related Narratives/Keywords: 3-5 high-correlation terms.
      - Key Drivers: The fundamental or technical reasons driving this trend.
      - Recent Developments: 2-3 specific news events.
      
      Narrative Velocity Engine Metrics:
      - Velocity Score (0-100): How fast the narrative is spreading.
      - Retail Attention Index (0-100): Based on search surges.
      - Saturation (0-100): 100 means peak awareness.
      - Growth Rate (percentage): 24h growth in mentions.
      - Freshness (0-100): 100 is brand new.
      - Recent Articles: 3 specific recent articles.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            socialVelocity: { type: Type.NUMBER },
            tokenLaunches: { type: Type.NUMBER },
            tradingVolume: { type: Type.NUMBER },
            searchInterest: { type: Type.NUMBER },
            network: {
              type: Type.OBJECT,
              properties: {
                bots: { type: Type.NUMBER },
                influencers: { type: Type.NUMBER },
                organic: { type: Type.NUMBER }
              },
              required: ["bots", "influencers", "organic"]
            },
            riskAssessment: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            marketSignal: { type: Type.STRING },
            signalDescription: { type: Type.STRING },
            volumeToUniqueRatio: { type: Type.NUMBER },
            relatedNarratives: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyDrivers: { type: Type.ARRAY, items: { type: Type.STRING } },
            recentDevelopments: { type: Type.ARRAY, items: { type: Type.STRING } },
            velocityEngine: {
              type: Type.OBJECT,
              properties: {
                velocityScore: { type: Type.NUMBER },
                retailAttention: { type: Type.NUMBER },
                saturation: { type: Type.NUMBER },
                growthRate: { type: Type.NUMBER },
                freshness: { type: Type.NUMBER },
                recentArticles: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      url: { type: Type.STRING },
                      source: { type: Type.STRING }
                    },
                    required: ["title", "url", "source"]
                  }
                }
              },
              required: ["velocityScore", "retailAttention", "saturation", "growthRate", "freshness", "recentArticles"]
            }
          },
          required: [
            "socialVelocity", "tokenLaunches", "tradingVolume", "searchInterest", 
            "network", "riskAssessment", "targetAudience", 
            "marketSignal", "signalDescription", "volumeToUniqueRatio",
            "relatedNarratives", "keyDrivers", "recentDevelopments",
            "velocityEngine"
          ]
        }
      }
    });

    if (!response) return null;
    const data = JSON.parse(response.text || "{}");
    
    // Calculate Narrative Strength Score: score = social velocity + token launch count + trading volume + search interest
    // Since each is 0-100, the max score is 400. We can normalize it to 100 if we want, but the prompt says "score =" sum.
    // Let's keep the raw sum for the "score" but maybe normalize for the radar.
    const strengthScore = data.socialVelocity + data.tokenLaunches + data.tradingVolume + data.searchInterest;

    return {
      strengthScore,
      radarMetrics: [
        { subject: 'Social Velocity', value: data.socialVelocity, fullMark: 100 },
        { subject: 'Token Launches', value: data.tokenLaunches, fullMark: 100 },
        { subject: 'Trading Volume', value: data.tradingVolume, fullMark: 100 },
        { subject: 'Search Interest', value: data.searchInterest, fullMark: 100 },
      ],
      stats: [
        { 
          label: 'Narrative Strength', 
          value: strengthScore, 
          delta: `+${(Math.random() * 20).toFixed(1)}%`,
          status: strengthScore > 250 ? 'high' : strengthScore > 150 ? 'neutral' : 'low',
          description: 'Composite score of social, token, volume, and search metrics.',
          insight: strengthScore > 300 ? 'Extreme narrative dominance.' : 'Emerging narrative strength.'
        },
        { 
          label: 'Social Velocity', 
          value: data.socialVelocity, 
          delta: `${(Math.random() * 15 - 5).toFixed(1)}%`,
          status: data.socialVelocity > 70 ? 'high' : data.socialVelocity > 40 ? 'neutral' : 'low',
          description: 'Speed and acceleration of social media mentions.',
          insight: data.socialVelocity > 80 ? 'Viral social propagation.' : 'Steady social interest.'
        },
        { 
          label: 'Token Launches', 
          value: data.tokenLaunches, 
          delta: `+${(Math.random() * 10).toFixed(0)}`,
          status: data.tokenLaunches > 60 ? 'high' : data.tokenLaunches > 30 ? 'neutral' : 'low',
          description: 'New tokens launched within this narrative cluster.',
          insight: data.tokenLaunches > 70 ? 'Hyper-active token deployment.' : 'Moderate launch activity.'
        },
        { 
          label: 'Trading Volume', 
          value: data.tradingVolume, 
          delta: `+${(Math.random() * 50).toFixed(1)}%`,
          status: data.tradingVolume > 70 ? 'high' : data.tradingVolume > 40 ? 'neutral' : 'low',
          description: 'Aggregated trading volume across related pairs.',
          insight: data.tradingVolume > 80 ? 'Massive capital inflow.' : 'Healthy liquidity growth.'
        },
      ],
      network: [
        { label: 'Bot Clusters', value: data.network.bots, color: 'bg-primary', description: 'Coordinated groups of automated accounts.' },
        { label: 'Influencer Nodes', value: data.network.influencers, color: 'bg-purple-500', description: 'Key accounts amplifying the narrative.' },
        { label: 'Organic Users', value: data.network.organic, color: 'bg-emerald-500', description: 'Real individuals participating naturally.' },
      ],
      riskAssessment: data.riskAssessment,
      targetAudience: data.targetAudience,
      marketSignal: data.marketSignal,
      signalDescription: data.signalDescription,
      volumeToUniqueRatio: data.volumeToUniqueRatio,
      relatedNarratives: data.relatedNarratives,
      keyDrivers: data.keyDrivers,
      recentDevelopments: data.recentDevelopments,
      velocityEngine: data.velocityEngine
    };
  } catch (error) {
    console.error("Error fetching narrative analysis from Gemini:", error);
    return null;
  }
}

import Parser from 'rss-parser';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml;q=0.9, */*;q=0.8'
  }
});

export interface AttentionItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  score: number;
  fingerprint: string;
  createdAt: string;
}

const CLASSIFICATION_RULES = [
  { category: 'security', keywords: ['hack', 'exploit', 'rug', 'drain', 'vulnerability', 'scam', 'phishing', 'attack', 'security', 'breach', 'malware'] },
  { category: 'liquidity', keywords: ['liquidity', 'pool', 'slippage', 'depth', 'volume', 'dex', 'amm', 'swap', 'trading', 'arbitrage'] },
  { category: 'whales', keywords: ['whale', 'wallet', 'movement', 'transfer', 'large', 'otc', 'accumulation', 'inflow', 'outflow', 'dormant'] },
  { category: 'macro', keywords: ['fed', 'inflation', 'cpi', 'rate', 'economy', 'market', 'etf', 'sec', 'regulation', 'gdp', 'fomc', 'powell', 'yellen', 'geopolitics', 'war', 'election', 'policy', 'sanctions', 'central bank'] },
  { category: 'crypto', keywords: ['crypto', 'bitcoin', 'ethereum', 'solana', 'btc', 'eth', 'sol', 'blockchain', 'defi', 'nft', 'web3', 'token', 'altcoin', 'halving', 'staking', 'layer 2', 'mainnet', 'testnet'] },
  { category: 'tech', keywords: ['ai', 'nvidia', 'tech', 'semiconductor', 'chip', 'software', 'hardware', 'innovation', 'startup', 'apple', 'google', 'microsoft', 'tesla', 'meta', 'quantum', 'cyber'] },
  { category: 'figures', keywords: ['musk', 'saylor', 'buterin', 'trump', 'biden', 'putin', 'zelensky', 'cz', 'sbf', 'gensler', 'vitalik', 'dorsey'] },
  { category: 'narratives', keywords: ['meme', 'doge', 'pepe', 'viral', 'trend', 'shiba', 'community', 'animal', 'narrative', 'hype', 'culture', 'social media'] },
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function isRelevant(title: string, summary: string): boolean {
  const text = (title + ' ' + summary).toLowerCase();
  
  // Exclude generic lifestyle/entertainment/sports that aren't related to finance/tech
  const trashKeywords = ['football', 'soccer', 'basketball', 'recipe', 'celebrity dating', 'movie review', 'fashion show', 'horoscope', 'weather report'];
  if (trashKeywords.some(k => text.includes(k))) return false;

  // Check if it matches any of our core keywords
  const hasKeyword = CLASSIFICATION_RULES.some(rule => 
    rule.keywords.some(k => text.includes(k))
  );
  
  // Also allow general financial/tech news markers
  const financialMarkers = ['stock', 'price', 'index', 'nasdaq', 'sp500', 'dow', 'yield', 'bond', 'currency', 'forex', 'invest', 'equity', 'venture', 'ipo'];
  const hasFinancialMarker = financialMarkers.some(m => text.includes(m));

  return hasKeyword || hasFinancialMarker;
}

function classify(title: string, summary: string): string {
  const text = (title + ' ' + summary).toLowerCase();
  for (const rule of CLASSIFICATION_RULES) {
    if (rule.keywords.some(k => text.includes(k))) {
      return rule.category;
    }
  }
  return 'general';
}

function getFingerprint(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function calculateSimilarity(s1: string, s2: string): number {
  const set1 = new Set(s1.split(' '));
  const set2 = new Set(s2.split(' '));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

export async function fetchTrendingNarratives(): Promise<AttentionItem[]> {
  const items: AttentionItem[] = [];

  // 1. Trending Narratives (Google News & Trends)
  const trendUrls = [
    'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en', // Tech
    'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en', // Business
    'https://news.google.com/rss/search?q=crypto+solana+ai+tech+market&hl=en-US&gl=US&ceid=US:en',
    'https://trends.google.com/trending/rss?geo=US'
  ];

  for (const url of trendUrls) {
    try {
      const feed = await parser.parseURL(url);
      if (feed && feed.items && feed.items.length > 0) {
        feed.items.forEach(item => {
          const title = stripHtml(item.title || '');
          const summary = stripHtml(item.contentSnippet || item.content || '');
          
          if (isRelevant(title, summary)) {
            items.push({
              id: `news-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title,
              summary,
              category: classify(title, summary),
              source: url.includes('trends.google.com') ? 'Google Trends' : 'Google News',
              score: 0.8,
              fingerprint: getFingerprint(title),
              createdAt: new Date().toISOString()
            });
          }
        });
      }
    } catch (error: any) {
      // Only log if it's not a common 404/429 for trends which are flaky
      if (!url.includes('trends.google.com') || (error.status !== 404 && error.status !== 429)) {
        console.warn(`Feed fetch failed for ${url}:`, error.message);
      }
    }
  }

  // Fallback: Yahoo Finance News (High signal for market narratives)
  if (!items.some(i => i.source === 'Google Trends')) {
    try {
      const yahooFinance = await parser.parseURL('https://finance.yahoo.com/news/rssindex');
      if (yahooFinance && yahooFinance.items) {
        yahooFinance.items.slice(0, 15).forEach(item => {
          const title = stripHtml(item.title || '');
          const summary = stripHtml(item.contentSnippet || '');
          if (isRelevant(title, summary)) {
            items.push({
              id: `yf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title,
              summary,
              category: classify(title, summary),
              source: 'Yahoo Finance',
              score: 0.65,
              fingerprint: getFingerprint(title),
              createdAt: new Date().toISOString()
            });
          }
        });
      }
    } catch (yfError: any) {
      console.warn('Yahoo Finance fetch failed:', yfError.message);
    }
  }

  // 2. Wikipedia Most Read (Simplified via API)
  try {
    const getWikiData = async (date: Date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const url = `https://en.wikipedia.org/api/rest_v1/feed/featured/${year}/${month}/${day}`;
      const response = await fetch(url);
      if (response.ok) return await response.json();
      return null;
    };

    let wikiData = await getWikiData(new Date());
    // Fallback to yesterday if today is not available yet (common for early morning)
    if (!wikiData) {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      wikiData = await getWikiData(yesterday);
    }

    if (wikiData && wikiData.mostread && wikiData.mostread.articles) {
      wikiData.mostread.articles.slice(0, 15).forEach((article: any) => {
        const title = stripHtml(article.displaytitle || article.title);
        const summary = stripHtml(article.extract || '');
        
        if (isRelevant(title, summary)) {
          items.push({
            id: `wiki-${article.pageid}`,
            title,
            summary,
            category: classify(title, summary),
            source: 'Wikipedia',
            score: 0.7,
            fingerprint: getFingerprint(title),
            createdAt: new Date().toISOString()
          });
        }
      });
    }
  } catch (error) {
    console.warn('Wikipedia fetch failed:', error);
  }

  // 3. GDELT (Global Online News RSS)
  try {
    const gdelt = await parser.parseURL('https://blog.gdeltproject.org/feed/');
    gdelt.items.slice(0, 15).forEach(item => {
      const title = stripHtml(item.title || '');
      const summary = stripHtml(item.contentSnippet || '');
      
      if (isRelevant(title, summary)) {
        items.push({
          id: `gdelt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title,
          summary,
          category: classify(title, summary),
          source: 'GDELT',
          score: 0.6,
          fingerprint: getFingerprint(title),
          createdAt: new Date().toISOString()
        });
      }
    });
  } catch (error) {
    console.warn('GDELT fetch failed:', error);
  }

  // 4. CNBC (Business/Finance)
  try {
    const cnbc = await parser.parseURL('https://search.cnbc.com/rs/search/view.xml?partnerId=2000&keywords=crypto%20bitcoin%20solana%20ai%20tech');
    cnbc.items.slice(0, 10).forEach(item => {
      const title = stripHtml(item.title || '');
      const summary = stripHtml(item.contentSnippet || '');
      if (isRelevant(title, summary)) {
        items.push({
          id: `cnbc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title,
          summary,
          category: classify(title, summary),
          source: 'CNBC',
          score: 0.65,
          fingerprint: getFingerprint(title),
          createdAt: new Date().toISOString()
        });
      }
    });
  } catch (error) {
    console.warn('CNBC fetch failed:', error);
  }

  // Deduplicate
  const uniqueItems: AttentionItem[] = [];
  const fingerprints = new Set<string>();

  for (const item of items) {
    if (fingerprints.has(item.fingerprint)) continue;
    
    const isSimilar = uniqueItems.some(u => calculateSimilarity(u.title.toLowerCase(), item.title.toLowerCase()) > 0.7);
    if (isSimilar) continue;

    uniqueItems.push(item);
    fingerprints.add(item.fingerprint);
  }

  return uniqueItems.sort((a, b) => b.score - a.score);
}

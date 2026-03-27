# Splash Signal — Setup Guide

This guide explains how to get API keys for each data source and what features each unlocks.

---

## Always-Available (No Key Needed)

### DexScreener
- **Free**, no sign-up required
- **What it powers:** Token price, volume, buy/sell counts, new pair discovery, trending tokens
- **Used in:** Alpha Hunter (live token list), Dump Detector (price + volume data)
- Rate limit: ~300 req/min — plenty for normal usage

---

## Optional Keys (Unlock Additional Features)

### Birdeye (`VITE_BIRDEYE_API_KEY`)
- **Sign up:** https://birdeye.so → Developer → API Key
- **Free tier:** Available (limited requests/day)
- **What it unlocks:**
  - Top holder list (% concentration per wallet)
  - Recent trades (buy/sell pressure analysis)
  - Wallet trade history
- **Without it:** Dump Detector still works via DexScreener; holder data shows as unavailable

**Setup:**
1. Go to https://birdeye.so
2. Connect wallet or sign up with email
3. Navigate to API section and generate a key
4. Add to `.env`: `VITE_BIRDEYE_API_KEY=your_key_here`

---

### Helius (`VITE_HELIUS_API_KEY`)
- **Sign up:** https://helius.dev
- **Free tier:** 100,000 credits/month
- **What it unlocks:**
  - Real-time Solana transaction streaming
  - Wallet monitoring and alerts
  - Enhanced token metadata
- **Without it:** Real-time wallet tracking is unavailable; historical data still works

**Setup:**
1. Go to https://helius.dev and create an account
2. Create a new project / API key
3. Add to `.env`: `VITE_HELIUS_API_KEY=your_key_here`

---

### Solscan (`VITE_SOLSCAN_API_KEY`)
- **Sign up:** https://pro-api.solscan.io
- **Free tier:** Limited (check current pricing)
- **What it unlocks:**
  - Supplemental holder data (higher accuracy)
  - Token supply verification
- **Without it:** Falls back to Birdeye for holder data

**Setup:**
1. Go to https://pro-api.solscan.io and register
2. Generate an API key from your dashboard
3. Add to `.env`: `VITE_SOLSCAN_API_KEY=your_key_here`

---

## Server-Side Keys

### Gemini AI (`GEMINI_API_KEY`)
- Required for narrative generation and AI-powered summaries
- In Google AI Studio: automatically injected from Secrets panel
- For local dev: get a key at https://makersuite.google.com/app/apikey

### Database (`DATABASE_URL`)
- Required for persisting alerts, watchlists, and analysis history
- Local dev: install PostgreSQL and create a `splashsignal` database
- Production: use Supabase, Railway, or Neon (all have free tiers)

### Redis (`REDIS_URL`)
- Optional — enables alert deduplication and response caching
- Local dev: `redis://localhost:6379` (install Redis locally)
- Production: Upstash Redis has a free tier (https://upstash.com)

---

## Feature Matrix

| Feature | DexScreener | Birdeye | Helius | DB |
|---|---|---|---|---|
| Alpha Hunter (token list) | ✅ | — | — | — |
| Token price + volume | ✅ | — | — | — |
| Dump risk score | ✅ | ✅ | — | — |
| Top holder concentration | — | ✅ | — | — |
| Recent trades | — | ✅ | — | — |
| Wallet monitoring | — | — | ✅ | — |
| Alerts + watchlists | — | — | — | ✅ |
| AI narratives | — | — | — | ✅ (Gemini) |

---

## Quick Start (Minimum Setup)

The app works out of the box with **zero API keys** — DexScreener powers the core token discovery.

For the best experience, add a Birdeye key to unlock holder analysis and trade pressure data in Dump Detector.

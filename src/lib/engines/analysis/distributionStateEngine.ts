// Distribution State Engine — classifies token into lifecycle states
import { Redis } from 'ioredis';

export type DistributionState =
  | 'QUIET'
  | 'HEALTHY_ACCUMULATION'
  | 'WATCH_FOR_ROTATION'
  | 'EARLY_DISTRIBUTION'
  | 'ACTIVE_DISTRIBUTION'
  | 'HIGH_DUMP_RISK'
  | 'BROKEN_STRUCTURE';

export interface DistributionAnalysis {
  tokenAddress: string;
  state: DistributionState;
  stateEmoji: string;
  stateLabel: string;
  confidence: number; // 0-100
  explanation: string;
  priceFlowDivergence: boolean;
  timeInCurrentState: number; // minutes
  previousState?: DistributionState;
  stateChangedAt?: Date;
  factors: {
    topHolderNetFlow: 'ACCUMULATING' | 'NEUTRAL' | 'DISTRIBUTING';
    smartWalletNetFlow: 'ACCUMULATING' | 'NEUTRAL' | 'DISTRIBUTING';
    volumeTrend: 'ACCELERATING' | 'STABLE' | 'DECAYING';
    buySellRatio: number;
    liquidityTrend: 'GROWING' | 'STABLE' | 'SHRINKING';
  };
}

export interface DistributionInput {
  tokenAddress: string;
  priceChange1h: number; // percent
  volume24h: number;
  peakVolume?: number;
  buySellRatio: number; // buys/(buys+sells), 0-1
  holderGrowth1h?: number;
  topHolderNetFlow: 'ACCUMULATING' | 'NEUTRAL' | 'DISTRIBUTING';
  smartWalletNetFlow: 'ACCUMULATING' | 'NEUTRAL' | 'DISTRIBUTING';
  volumeTrend: 'ACCELERATING' | 'STABLE' | 'DECAYING';
  liquidityTrend: 'GROWING' | 'STABLE' | 'SHRINKING';
  devSellDetected?: boolean;
  smartWalletMassExit?: boolean; // 3+ smart wallets exiting
  liquidityDrain?: boolean; // LP removed > 15%
}

const STATE_EMOJI: Record<DistributionState, string> = {
  QUIET: '😴',
  HEALTHY_ACCUMULATION: '✅',
  WATCH_FOR_ROTATION: '👀',
  EARLY_DISTRIBUTION: '⚠️',
  ACTIVE_DISTRIBUTION: '🔴',
  HIGH_DUMP_RISK: '🚨',
  BROKEN_STRUCTURE: '💀',
};

const STATE_LABEL: Record<DistributionState, string> = {
  QUIET: 'Quiet',
  HEALTHY_ACCUMULATION: 'Healthy Accumulation',
  WATCH_FOR_ROTATION: 'Watch for Rotation',
  EARLY_DISTRIBUTION: 'Early Distribution',
  ACTIVE_DISTRIBUTION: 'Active Distribution',
  HIGH_DUMP_RISK: 'High Dump Risk',
  BROKEN_STRUCTURE: 'Broken Structure',
};

function determineState(input: DistributionInput): { state: DistributionState; confidence: number; explanation: string } {
  // BROKEN_STRUCTURE: volume collapsed > 80% from peak + sell dominance
  if (input.peakVolume && input.peakVolume > 0) {
    const volRatio = input.volume24h / input.peakVolume;
    if (volRatio < 0.20 && input.buySellRatio < 0.35) {
      return {
        state: 'BROKEN_STRUCTURE',
        confidence: 90,
        explanation: `Volume collapsed ${((1 - volRatio) * 100).toFixed(0)}% from peak with strong sell dominance`,
      };
    }
  }

  // HIGH_DUMP_RISK: dev sell OR smart wallet mass exit OR liquidity drain + distribution
  if (
    input.devSellDetected ||
    input.smartWalletMassExit ||
    (input.liquidityDrain && input.topHolderNetFlow === 'DISTRIBUTING')
  ) {
    const reasons: string[] = [];
    if (input.devSellDetected) reasons.push('dev sell detected');
    if (input.smartWalletMassExit) reasons.push('smart wallet mass exit');
    if (input.liquidityDrain) reasons.push('liquidity drain');
    return {
      state: 'HIGH_DUMP_RISK',
      confidence: 85,
      explanation: `High dump probability: ${reasons.join(', ')}`,
    };
  }

  // ACTIVE_DISTRIBUTION: clear net selling from top holders + buy/sell < 0.5 + distribution volume pattern
  if (
    input.topHolderNetFlow === 'DISTRIBUTING' &&
    input.buySellRatio < 0.5 &&
    input.volumeTrend !== 'ACCELERATING'
  ) {
    return {
      state: 'ACTIVE_DISTRIBUTION',
      confidence: 80,
      explanation: `Top holders distributing with buy/sell ratio at ${input.buySellRatio.toFixed(2)} — classic exit pattern`,
    };
  }

  // EARLY_DISTRIBUTION: top holders slightly reducing + buy/sell dropping below 0.7
  if (input.topHolderNetFlow === 'DISTRIBUTING' && input.buySellRatio < 0.7) {
    return {
      state: 'EARLY_DISTRIBUTION',
      confidence: 70,
      explanation: `Early distribution signals: top holders reducing while buy pressure weakens`,
    };
  }

  // WATCH_FOR_ROTATION: mixed signals — some selling but buy pressure still present
  if (
    (input.topHolderNetFlow === 'DISTRIBUTING' || input.smartWalletNetFlow === 'DISTRIBUTING') &&
    input.buySellRatio >= 0.5
  ) {
    return {
      state: 'WATCH_FOR_ROTATION',
      confidence: 65,
      explanation: 'Mixed signals: some large holders selling but buy pressure still present',
    };
  }

  // HEALTHY_ACCUMULATION: rising holders + smart wallets buying + positive buy/sell
  if (
    (input.holderGrowth1h ?? 0) > 5 &&
    input.smartWalletNetFlow === 'ACCUMULATING' &&
    input.buySellRatio > 0.6
  ) {
    return {
      state: 'HEALTHY_ACCUMULATION',
      confidence: 80,
      explanation: `Quality accumulation: ${input.holderGrowth1h} new holders/hr, smart money buying`,
    };
  }

  // QUIET: low activity, stable
  if (input.volume24h < 10000 || input.volumeTrend === 'DECAYING') {
    return {
      state: 'QUIET',
      confidence: 75,
      explanation: 'Low volume and stable holder base — no significant activity',
    };
  }

  // Default
  return {
    state: 'WATCH_FOR_ROTATION',
    confidence: 50,
    explanation: 'Ambiguous signals — monitoring recommended',
  };
}

export class DistributionStateEngine {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async analyze(input: DistributionInput): Promise<DistributionAnalysis> {
    try {
      const { state, confidence, explanation } = determineState(input);

      // Load previous state from Redis
      const prevKey = `dist_state:${input.tokenAddress}`;
      let previousState: DistributionState | undefined;
      let stateChangedAt: Date | undefined;
      let timeInCurrentState = 0;

      try {
        const cached = await this.redis.get(prevKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          previousState = parsed.state as DistributionState;
          const changedAt = parsed.changedAt ? new Date(parsed.changedAt) : new Date();
          stateChangedAt = changedAt;
          timeInCurrentState = Math.floor((Date.now() - changedAt.getTime()) / 60000);

          // If state changed, update cached entry
          if (previousState !== state) {
            await this.redis.setex(prevKey, 86400, JSON.stringify({ state, changedAt: new Date().toISOString() }));
            stateChangedAt = new Date();
            timeInCurrentState = 0;
          }
        } else {
          await this.redis.setex(prevKey, 86400, JSON.stringify({ state, changedAt: new Date().toISOString() }));
        }
      } catch {
        // Redis error — continue without persistence
      }

      // Price/flow divergence: price positive but wallets distributing
      const priceFlowDivergence =
        input.priceChange1h > 0 &&
        (input.topHolderNetFlow === 'DISTRIBUTING' || input.smartWalletNetFlow === 'DISTRIBUTING');

      const analysis: DistributionAnalysis = {
        tokenAddress: input.tokenAddress,
        state,
        stateEmoji: STATE_EMOJI[state],
        stateLabel: STATE_LABEL[state],
        confidence,
        explanation: priceFlowDivergence
          ? `⚠️ DIVERGENCE: ${explanation} — price rising while wallets are distributing (exit liquidity setup)`
          : explanation,
        priceFlowDivergence,
        timeInCurrentState,
        previousState,
        stateChangedAt,
        factors: {
          topHolderNetFlow: input.topHolderNetFlow,
          smartWalletNetFlow: input.smartWalletNetFlow,
          volumeTrend: input.volumeTrend,
          buySellRatio: input.buySellRatio,
          liquidityTrend: input.liquidityTrend,
        },
      };

      return analysis;
    } catch (err) {
      console.error('[DistributionStateEngine] analyze error:', err);
      // Return safe default
      return {
        tokenAddress: input.tokenAddress,
        state: 'QUIET',
        stateEmoji: '😴',
        stateLabel: 'Quiet',
        confidence: 0,
        explanation: 'Analysis unavailable',
        priceFlowDivergence: false,
        timeInCurrentState: 0,
        factors: {
          topHolderNetFlow: 'NEUTRAL',
          smartWalletNetFlow: 'NEUTRAL',
          volumeTrend: 'STABLE',
          buySellRatio: input.buySellRatio ?? 0.5,
          liquidityTrend: 'STABLE',
        },
      };
    }
  }
}

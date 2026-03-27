// Alert Rule Engine - Weighted rule-based high-quality alert generation
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

export type AlertCategory =
  | 'EARLY_ENTRY'
  | 'WATCH'
  | 'DISTRIBUTION_WARNING'
  | 'EXIT_RISK'
  | 'HIGH_RISK_STRUCTURE';

export type AlertSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ConfidenceTier =
  | 'LOW_CONFIDENCE'
  | 'MODERATE_CONFIDENCE'
  | 'HIGH_CONFIDENCE'
  | 'VERY_HIGH_CONFIDENCE';

export type SuggestedAction = 'Monitor' | 'Consider Entry' | 'Tighten Risk' | 'Consider Exit' | 'Avoid';

export interface PreciseAlert {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  chain: string;
  category: AlertCategory;
  severity: AlertSeverity;
  confidence: number; // 0-100
  confidenceTier: ConfidenceTier;
  headline: string;
  explanation: string;
  reasons: string[];
  affectedWallets?: string[];
  suggestedAction: SuggestedAction;
  emoji: string;
  triggeredAt: Date;
  expiresAt: Date;
  suppressUntil?: Date;
  metadata: {
    alphaScore?: number;
    dumpScore?: number;
    volumeChange?: number;
    holderChange?: number;
    smartWalletCount?: number;
    devSellAmount?: number;
    whaleReduction?: number;
    liquidityChange?: number;
  };
}

// ---- Input context passed to rule evaluation ----
export interface AlertContext {
  tokenAddress: string;
  tokenSymbol: string;
  chain: string;

  // Scores
  alphaScore: number;
  alphaScoreDelta30m?: number; // how much alpha rose in last 30 min
  dumpScore: number;

  // Volume
  volumeChange1h?: number; // percent change
  volumeVsPeak?: number; // current volume as % of peak

  // Holders
  holderGrowth1h?: number; // new holders added in 1h
  topHoldersReduced?: number; // % reduction in 24h
  sniperCohortReducing?: number; // % reduction in 6h

  // Wallet signals
  smartWalletEntries30m?: number; // count of smart wallets entered last 30min
  smartWalletExiting?: boolean; // a smart wallet score>70 is exiting
  affectedWallets?: string[];
  bundleWalletsExiting?: number; // count in 4h

  // Dev
  devSellAmount?: number; // USD

  // Liquidity
  liquidityRemovedPercent?: number;
  liquidityVsMcap?: number; // percent

  // Token structure
  top10Concentration?: number; // percent
  sniperConcentration?: number; // percent
  devWalletTransferCount?: number;
  walletClusteringDetected?: boolean;

  // Market
  buyToSellRatio?: number;
  tokenAgeLt6h?: boolean;

  // Distribution
  distributionWarningFiring?: boolean;
}

interface AlertSuppressionConfig {
  cooldownMinutes: number;
  duplicateWindowMs: number;
  hysteresisBuffer: number;
}

const SUPPRESSION: Record<AlertCategory, AlertSuppressionConfig> = {
  EARLY_ENTRY: { cooldownMinutes: 60, duplicateWindowMs: 5 * 60 * 1000, hysteresisBuffer: 10 },
  WATCH: { cooldownMinutes: 30, duplicateWindowMs: 10 * 60 * 1000, hysteresisBuffer: 8 },
  DISTRIBUTION_WARNING: { cooldownMinutes: 45, duplicateWindowMs: 5 * 60 * 1000, hysteresisBuffer: 12 },
  EXIT_RISK: { cooldownMinutes: 20, duplicateWindowMs: 2 * 60 * 1000, hysteresisBuffer: 5 },
  HIGH_RISK_STRUCTURE: { cooldownMinutes: 120, duplicateWindowMs: 30 * 60 * 1000, hysteresisBuffer: 15 },
};

// ---- Rule evaluation helpers ----

interface RuleResult {
  triggered: boolean;
  weight: number;
  reason?: string;
}

function rule(condition: boolean, weight: number, reason: string): RuleResult {
  return { triggered: condition, weight: condition ? weight : 0, reason: condition ? reason : undefined };
}

function totalWeight(results: RuleResult[]): number {
  return results.filter(r => r.triggered).reduce((sum, r) => sum + r.weight, 0);
}

function triggeredReasons(results: RuleResult[]): string[] {
  return results.filter(r => r.triggered && r.reason).map(r => r.reason!);
}

// ---- Confidence helpers ----

function toConfidenceTier(weight: number): ConfidenceTier {
  if (weight > 75) return 'VERY_HIGH_CONFIDENCE';
  if (weight > 55) return 'HIGH_CONFIDENCE';
  if (weight >= 35) return 'MODERATE_CONFIDENCE';
  return 'LOW_CONFIDENCE';
}

function toSeverityByWeight(weight: number, min: AlertSeverity = 'LOW'): AlertSeverity {
  const levels: AlertSeverity[] = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  let idx = 1;
  if (weight >= 80) idx = 4;
  else if (weight >= 65) idx = 3;
  else if (weight >= 50) idx = 2;
  else if (weight >= 35) idx = 1;
  const minIdx = levels.indexOf(min);
  return levels[Math.max(idx, minIdx)];
}

// ---- Category evaluators ----

function evalEarlyEntry(ctx: AlertContext): { weight: number; reasons: string[] } {
  const rules: RuleResult[] = [
    rule(ctx.alphaScore > 70, 25, `Alpha score high at ${ctx.alphaScore}`),
    rule((ctx.alphaScoreDelta30m ?? 0) > 15, 20, `Alpha score rose ${ctx.alphaScoreDelta30m} pts in 30min`),
    rule((ctx.volumeChange1h ?? 0) > 200, 20, `Volume up ${ctx.volumeChange1h?.toFixed(0)}% in 1h`),
    rule((ctx.holderGrowth1h ?? 0) > 20, 15, `${ctx.holderGrowth1h} new holders in 1h`),
    rule((ctx.smartWalletEntries30m ?? 0) >= 2, 25, `${ctx.smartWalletEntries30m} smart wallets entered in last 30min`),
    rule(ctx.dumpScore < 40, 15, `Low dump risk score (${ctx.dumpScore})`),
    rule(ctx.tokenAgeLt6h === true, 10, 'Token is under 6 hours old'),
  ];
  // Penalty: if dumpScore >= 40 reduce by 10
  const bonus = ctx.dumpScore < 40 ? 0 : -10;
  return { weight: Math.max(0, totalWeight(rules) + bonus), reasons: triggeredReasons(rules) };
}

function evalDistributionWarning(ctx: AlertContext): { weight: number; reasons: string[] } {
  const rules: RuleResult[] = [
    rule((ctx.topHoldersReduced ?? 0) > 10, 30, `Top holders reduced by ${ctx.topHoldersReduced?.toFixed(1)}% in 24h`),
    rule((ctx.bundleWalletsExiting ?? 0) >= 2, 25, `${ctx.bundleWalletsExiting} bundle wallets exiting in 4h`),
    rule((ctx.sniperCohortReducing ?? 0) > 5, 20, `Sniper cohort reduced ${ctx.sniperCohortReducing?.toFixed(1)}% in 6h`),
    rule((ctx.buyToSellRatio ?? 1) < 0.5, 15, `Buy/sell ratio low at ${ctx.buyToSellRatio?.toFixed(2)}`),
    rule((ctx.volumeVsPeak ?? 100) < 40, 10, `Volume at ${ctx.volumeVsPeak?.toFixed(0)}% of peak`),
  ];
  return { weight: totalWeight(rules), reasons: triggeredReasons(rules) };
}

function evalExitRisk(ctx: AlertContext, distributionFiring: boolean): { weight: number; reasons: string[] } {
  const rules: RuleResult[] = [
    rule(ctx.dumpScore > 70, 30, `Dump score critical at ${ctx.dumpScore}`),
    rule((ctx.devSellAmount ?? 0) > 5000, 35, `Dev sold $${((ctx.devSellAmount ?? 0) / 1000).toFixed(1)}k`),
    rule(ctx.smartWalletExiting === true, 25, 'High-ranked smart wallet(s) exiting'),
    rule((ctx.liquidityRemovedPercent ?? 0) > 15, 30, `Liquidity removed: ${ctx.liquidityRemovedPercent?.toFixed(1)}%`),
    rule(distributionFiring, 20, 'Distribution warning already active'),
  ];
  return { weight: totalWeight(rules), reasons: triggeredReasons(rules) };
}

function evalHighRiskStructure(ctx: AlertContext): { weight: number; reasons: string[] } {
  const rules: RuleResult[] = [
    rule((ctx.top10Concentration ?? 0) > 60, 25, `Top 10 hold ${ctx.top10Concentration?.toFixed(1)}% of supply`),
    rule((ctx.sniperConcentration ?? 0) > 35, 30, `Sniper wallets hold ${ctx.sniperConcentration?.toFixed(1)}%`),
    rule((ctx.liquidityVsMcap ?? 100) < 3, 25, `Liquidity only ${ctx.liquidityVsMcap?.toFixed(1)}% of market cap`),
    rule((ctx.devWalletTransferCount ?? 0) > 3, 20, `Dev wallet made ${ctx.devWalletTransferCount} transfers out`),
    rule(ctx.walletClusteringDetected === true, 20, 'Wallet clustering detected — coordinated actors'),
  ];
  return { weight: totalWeight(rules), reasons: triggeredReasons(rules) };
}

function evalWatch(ctx: AlertContext): { weight: number; reasons: string[] } {
  const rules: RuleResult[] = [
    rule(ctx.alphaScore >= 50 && ctx.alphaScore <= 70, 20, `Alpha score moderate at ${ctx.alphaScore}`),
    rule((ctx.volumeChange1h ?? 0) >= 50 && (ctx.volumeChange1h ?? 0) <= 200, 15, `Volume up ${ctx.volumeChange1h?.toFixed(0)}% in 1h`),
    rule(ctx.smartWalletEntries30m === 1, 20, '1 smart wallet entered in last 30min'),
    rule(ctx.dumpScore >= 40 && ctx.dumpScore <= 65, -10, undefined), // penalty — no reason emitted
  ];
  return { weight: Math.max(0, totalWeight(rules)), reasons: triggeredReasons(rules) };
}

// ---- Headline / explanation generators ----

function buildHeadline(category: AlertCategory, ctx: AlertContext, reasons: string[]): string {
  switch (category) {
    case 'EARLY_ENTRY': {
      if ((ctx.smartWalletEntries30m ?? 0) >= 2 && (ctx.volumeChange1h ?? 0) > 100) {
        return `${ctx.smartWalletEntries30m} high-ranked wallets entered while volume accelerated ${ctx.volumeChange1h?.toFixed(0)}%`;
      }
      if ((ctx.alphaScoreDelta30m ?? 0) > 15) {
        return `Alpha score jumped ${ctx.alphaScoreDelta30m} points — token still early${ctx.tokenAgeLt6h ? ' (under 6h)' : ''}`;
      }
      return 'Strong early entry setup detected';
    }
    case 'DISTRIBUTION_WARNING': {
      if ((ctx.topHoldersReduced ?? 0) > 10 && (ctx.bundleWalletsExiting ?? 0) >= 2) {
        return `Top holders reducing while ${ctx.bundleWalletsExiting} bundle wallets distributed in past hours`;
      }
      if ((ctx.sniperCohortReducing ?? 0) > 5) {
        return `Sniper cohort showing net selling — ${ctx.bundleWalletsExiting ?? 0} bundle wallets distributed`;
      }
      return 'Distribution pattern forming — buy pressure weakening';
    }
    case 'EXIT_RISK': {
      if ((ctx.devSellAmount ?? 0) > 5000) {
        return `Dev sold $${((ctx.devSellAmount ?? 0) / 1000).toFixed(0)}k — multiple exit signals confirming`;
      }
      return 'Multiple confirming exit signals: whale reduction, LP weakening';
    }
    case 'HIGH_RISK_STRUCTURE': {
      if ((ctx.sniperConcentration ?? 0) > 35) {
        return `High sniper concentration (${ctx.sniperConcentration?.toFixed(0)}%) — exit liquidity risk`;
      }
      return 'Dangerous token structure: concentration or liquidity concern';
    }
    case 'WATCH': {
      return 'Promising setup — awaiting confirmation';
    }
  }
}

function buildExplanation(category: AlertCategory, ctx: AlertContext): string {
  switch (category) {
    case 'EARLY_ENTRY':
      return `${ctx.smartWalletEntries30m ?? 0} high-ranked wallet(s) bought in last 30min while holder growth accelerated${ctx.alphaScore ? ` — alpha score: ${ctx.alphaScore}` : ''}`;
    case 'DISTRIBUTION_WARNING':
      return `Top holders combined reducing positions while buy pressure weakens${ctx.buyToSellRatio ? ` (buy/sell ratio: ${ctx.buyToSellRatio.toFixed(2)})` : ''}`;
    case 'EXIT_RISK':
      return `High dump score (${ctx.dumpScore}) with${ctx.devSellAmount && ctx.devSellAmount > 0 ? ` dev sell $${(ctx.devSellAmount / 1000).toFixed(0)}k and` : ''} smart wallet exits detected`;
    case 'HIGH_RISK_STRUCTURE':
      return `Token concentration or liquidity structure poses elevated risk — price could collapse rapidly`;
    case 'WATCH':
      return `Moderate alpha score (${ctx.alphaScore}) with limited confirming signals — monitor for follow-through`;
  }
}

function categoryEmoji(category: AlertCategory): string {
  const map: Record<AlertCategory, string> = {
    EARLY_ENTRY: '🔥',
    WATCH: '👀',
    DISTRIBUTION_WARNING: '⚠️',
    EXIT_RISK: '🚨',
    HIGH_RISK_STRUCTURE: '⛔',
  };
  return map[category];
}

function categoryAction(category: AlertCategory): SuggestedAction {
  const map: Record<AlertCategory, SuggestedAction> = {
    EARLY_ENTRY: 'Consider Entry',
    WATCH: 'Monitor',
    DISTRIBUTION_WARNING: 'Tighten Risk',
    EXIT_RISK: 'Consider Exit',
    HIGH_RISK_STRUCTURE: 'Avoid',
  };
  return map[category];
}

function expiryFor(category: AlertCategory): Date {
  const minutes: Record<AlertCategory, number> = {
    EARLY_ENTRY: 60,
    WATCH: 30,
    DISTRIBUTION_WARNING: 90,
    EXIT_RISK: 30,
    HIGH_RISK_STRUCTURE: 240,
  };
  return new Date(Date.now() + minutes[category] * 60 * 1000);
}

// ---- Main class ----

export class AlertRuleEngine {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async evaluate(ctx: AlertContext): Promise<PreciseAlert[]> {
    const alerts: PreciseAlert[] = [];

    try {
      // --- EARLY_ENTRY ---
      const ee = evalEarlyEntry(ctx);
      if (ee.weight >= 50) {
        const alert = await this.buildAlert('EARLY_ENTRY', ee.weight, ee.reasons, ctx);
        if (alert) alerts.push(alert);
      }

      // --- DISTRIBUTION_WARNING ---
      const dw = evalDistributionWarning(ctx);
      const distFiring = dw.weight >= 40;
      if (distFiring) {
        const alert = await this.buildAlert('DISTRIBUTION_WARNING', dw.weight, dw.reasons, ctx);
        if (alert) alerts.push(alert);
      }

      // --- EXIT_RISK ---
      const er = evalExitRisk(ctx, distFiring);
      if (er.weight >= 45) {
        const alert = await this.buildAlert('EXIT_RISK', er.weight, er.reasons, ctx);
        if (alert) alerts.push(alert);
      }

      // --- HIGH_RISK_STRUCTURE ---
      const hrs = evalHighRiskStructure(ctx);
      if (hrs.weight >= 40) {
        const alert = await this.buildAlert('HIGH_RISK_STRUCTURE', hrs.weight, hrs.reasons, ctx);
        if (alert) alerts.push(alert);
      }

      // --- WATCH (only if no EARLY_ENTRY) ---
      const earlyEntryFired = alerts.some(a => a.category === 'EARLY_ENTRY');
      if (!earlyEntryFired) {
        const wa = evalWatch(ctx);
        if (wa.weight >= 25) {
          const alert = await this.buildAlert('WATCH', wa.weight, wa.reasons, ctx);
          if (alert) alerts.push(alert);
        }
      }
    } catch (err) {
      console.error('[AlertRuleEngine] evaluate error:', err);
    }

    return alerts;
  }

  private async buildAlert(
    category: AlertCategory,
    weight: number,
    reasons: string[],
    ctx: AlertContext
  ): Promise<PreciseAlert | null> {
    try {
      // Suppression check
      const suppressed = await this.isSuppressed(ctx.tokenAddress, category);
      if (suppressed) return null;

      const now = new Date();
      const cfg = SUPPRESSION[category];

      const severity: AlertSeverity =
        category === 'EXIT_RISK'
          ? weight >= 75 ? 'CRITICAL' : 'HIGH'
          : toSeverityByWeight(weight);

      const alert: PreciseAlert = {
        id: uuidv4(),
        tokenAddress: ctx.tokenAddress,
        tokenSymbol: ctx.tokenSymbol,
        chain: ctx.chain,
        category,
        severity,
        confidence: Math.min(100, weight),
        confidenceTier: toConfidenceTier(weight),
        headline: buildHeadline(category, ctx, reasons),
        explanation: buildExplanation(category, ctx),
        reasons,
        affectedWallets: ctx.affectedWallets,
        suggestedAction: categoryAction(category),
        emoji: categoryEmoji(category),
        triggeredAt: now,
        expiresAt: expiryFor(category),
        suppressUntil: new Date(now.getTime() + cfg.cooldownMinutes * 60 * 1000),
        metadata: {
          alphaScore: ctx.alphaScore,
          dumpScore: ctx.dumpScore,
          volumeChange: ctx.volumeChange1h,
          holderChange: ctx.holderGrowth1h,
          smartWalletCount: ctx.smartWalletEntries30m,
          devSellAmount: ctx.devSellAmount,
          whaleReduction: ctx.topHoldersReduced,
          liquidityChange: ctx.liquidityRemovedPercent,
        },
      };

      // Set suppression key
      await this.redis.setex(
        `alert_cooldown:${ctx.tokenAddress}:${category}`,
        cfg.cooldownMinutes * 60,
        '1'
      );

      return alert;
    } catch (err) {
      console.error('[AlertRuleEngine] buildAlert error:', err);
      return null;
    }
  }

  private async isSuppressed(tokenAddress: string, category: AlertCategory): Promise<boolean> {
    try {
      const key = `alert_cooldown:${tokenAddress}:${category}`;
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch {
      return false; // Don't suppress on Redis error
    }
  }

  /** Force-clear suppression for a token/category (for testing or admin override) */
  async clearSuppression(tokenAddress: string, category: AlertCategory): Promise<void> {
    await this.redis.del(`alert_cooldown:${tokenAddress}:${category}`);
  }
}

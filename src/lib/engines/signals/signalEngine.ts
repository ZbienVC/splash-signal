// Signal Engine - Real-time Alert Generation
import { PrismaClient, AlertType, AlertSeverity, AlertCategory, AlertStatus } from '@prisma/client';
import { Redis } from 'ioredis';
import { Queue, Worker } from 'bullmq';
import { AlphaScorer } from '../analysis/alphaScorer';
import { RugScorer } from '../analysis/rugScorer';
import { DumpScorer } from '../analysis/dumpScorer';
import { SmartWalletEngine } from '../wallets/smartWalletEngine';
import { AlertRuleEngine, AlertContext, PreciseAlert } from './alertRuleEngine';

// ============= NEW SIGNAL TYPES =============

export type SignalType =
  | 'ENTRY_OPPORTUNITY'
  | 'EXIT_WARNING'
  | 'RISK_ALERT'
  // New types:
  | 'DUMP_RISK_INCREASING'    // Risk score went up 15+ points in 1h
  | 'ACTIVE_DISTRIBUTION'     // Multiple top holders reducing simultaneously
  | 'EXIT_LIKELY'             // Smart wallets exiting + volume dropping
  | 'SMART_MONEY_ENTRY'       // 2+ smart wallets entered in last 30min
  | 'BUNDLE_EXIT_DETECTED';   // Coordinated sell detected

export interface Signal {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  type: SignalType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  emoji: string;           // 🔥 | ⚠️ | 🚨 | ✅
  title: string;           // "Early Entry Signal"
  description: string;     // "Smart money entering + volume accelerating"
  action: 'BUY' | 'HOLD' | 'SELL' | 'WATCH';
  confidence: number;      // 0-1
  expiresAt: Date;         // Signal expires after X minutes
  triggeredAt: Date;
  metadata: Record<string, any>;
}

interface AlertTrigger {
  tokenAddress: string;
  triggerType: string;
  severity: AlertSeverity;
  data: any;
  timestamp: Date;
}

interface SignalConditions {
  // Entry Signal Thresholds
  alphaScoreIncrease: number; // Points increase needed
  volumeSpike: number; // Percentage increase
  holderGrowthRate: number; // New holders per minute
  smartMoneyThreshold: number; // Number of smart wallets
  
  // Exit Signal Thresholds
  devSellThreshold: number; // USD amount
  whaleReductionThreshold: number; // Percentage reduction
  volumeDeclineThreshold: number; // Percentage decline
  liquidityReductionThreshold: number; // Percentage reduction
  
  // Risk Alert Thresholds
  sniperConcentrationThreshold: number; // Percentage
  rugScoreThreshold: number; // Rug score level
}

export class SignalEngine {
  private prisma: PrismaClient;
  private redis: Redis;
  private alphaScorer: AlphaScorer;
  private rugScorer: RugScorer;
  private dumpScorer: DumpScorer;
  private smartWalletEngine: SmartWalletEngine;
  private signalQueue: Queue;
  private alertProcessorQueue: Queue;
  private alertRuleEngine: AlertRuleEngine;
  
  // Configurable signal conditions
  private conditions: SignalConditions = {
    // Entry thresholds
    alphaScoreIncrease: 20, // 20 point increase
    volumeSpike: 300, // 300% increase
    holderGrowthRate: 10, // 10 new holders/minute
    smartMoneyThreshold: 2, // 2+ smart wallets
    
    // Exit thresholds
    devSellThreshold: 5000, // $5k+ dev sell
    whaleReductionThreshold: 20, // 20% reduction
    volumeDeclineThreshold: 50, // 50% decline
    liquidityReductionThreshold: 30, // 30% reduction
    
    // Risk thresholds
    sniperConcentrationThreshold: 40, // 40%+ sniper control
    rugScoreThreshold: 70, // Rug score >= 70
  };

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL!);
    this.alphaScorer = new AlphaScorer(this.prisma, this.redis);
    this.rugScorer = new RugScorer(this.prisma, this.redis);
    this.dumpScorer = new DumpScorer(this.prisma, this.redis);
    this.smartWalletEngine = new SmartWalletEngine(this.prisma, this.redis);
    
    // Initialize job queues
    this.signalQueue = new Queue('signal-processing', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 }
      }
    });
    
    this.alertProcessorQueue = new Queue('alert-processing', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 200,
        removeOnFail: 100,
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 }
      }
    });
    
    this.setupWorkers();
    this.alertRuleEngine = new AlertRuleEngine(this.redis);
  }

  private setupWorkers() {
    // Signal processing worker
    new Worker('signal-processing', async (job) => {
      return await this.processSignalJob(job.data);
    }, { connection: this.redis, concurrency: 5 });

    // Alert delivery worker
    new Worker('alert-processing', async (job) => {
      return await this.processAlertJob(job.data);
    }, { connection: this.redis, concurrency: 10 });
  }

  // ============= ENTRY SIGNALS =============

  async detectEntrySignals(tokenAddress: string): Promise<void> {
    try {
      const token = await this.getTokenData(tokenAddress);
      if (!token) return;

      // 1. Alpha Score Spike Detection
      await this.checkAlphaSpike(token);
      
      // 2. Volume Surge Detection  
      await this.checkVolumeSurge(token);
      
      // 3. Smart Money Entry Detection
      await this.checkSmartMoneyEntry(token);
      
      // 4. Holder Growth Surge
      await this.checkHolderGrowth(token);
      
      // 5. Narrative Momentum
      await this.checkNarrativeMomentum(token);

      // 6. NEW: Combined entry signal (alpha + volume + smart money + low dump risk)
      await this.checkCombinedEntrySignal(token);

      // 7. Run precise weighted rule engine
      await this.runPreciseAlertEngine(token.address);

    } catch (error) {
      console.error(`Error detecting entry signals for ${tokenAddress}:`, error);
    }
  }

  // NEW: Combined entry condition using DumpScorer + SmartWalletEngine
  // ENTRY fires when ALL of:
  // - Alpha score > 65
  // - Volume up > 200% in 1h
  // - At least 1 smart wallet entered in last 30min
  // - Dump risk score < 50
  private async checkCombinedEntrySignal(token: any): Promise<void> {
    try {
      const [alphaResult, dumpResult] = await Promise.all([
        this.alphaScorer.calculateAlphaScore(token.address),
        this.dumpScorer.calculateDumpScore(token.address),
      ]);

      const smartEntries = await this.smartWalletEngine.detectNewEntries(30);
      const tokenSmartEntries = smartEntries.filter(a => a.tokenAddress === token.address);

      const volumeGrowth1h = alphaResult.components.volumeGrowth?.signals?.includes('SUSTAINED_GROWTH_1H') ||
        (alphaResult.components.volumeGrowth?.score || 0) >= 45;

      const meetsAllConditions =
        alphaResult.finalScore > 65 &&
        volumeGrowth1h &&
        tokenSmartEntries.length >= 1 &&
        dumpResult.finalScore < 50;

      if (meetsAllConditions) {
        await this.generateAlert({
          tokenAddress: token.address,
          type: AlertType.ENTRY_SIGNAL,
          severity: AlertSeverity.HIGH,
          category: AlertCategory.ALPHA_SPIKE,
          title: '🔥 Early Entry Signal',
          message: `Smart money entering + volume accelerating (Alpha: ${alphaResult.finalScore}, Risk: ${dumpResult.finalScore})`,
          data: {
            alphaScore: alphaResult.finalScore,
            dumpScore: dumpResult.finalScore,
            smartWalletEntries: tokenSmartEntries.length,
            signalType: 'SMART_MONEY_ENTRY',
            action: 'BUY',
          },
          triggeredBy: 'combined_entry_signal_detector',
          confidence: Math.min(0.95, alphaResult.confidence + 0.1),
        });
      }
    } catch (err) {
      console.warn('[SignalEngine] checkCombinedEntrySignal error:', err);
    }
  }

  private async checkAlphaSpike(token: any): Promise<void> {
    const currentAlpha = await this.alphaScorer.calculateAlphaScore(token.address);
    const previousAlpha = await this.getPreviousAlphaScore(token.address);
    
    if (!previousAlpha) return;
    
    const increase = currentAlpha.finalScore - previousAlpha.score;
    
    if (increase >= this.conditions.alphaScoreIncrease) {
      const severity = increase >= 40 ? AlertSeverity.CRITICAL : 
                     increase >= 25 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM;
      
      await this.generateAlert({
        tokenAddress: token.address,
        type: AlertType.ENTRY_SIGNAL,
        severity,
        category: AlertCategory.ALPHA_SPIKE,
        title: "🔥 Alpha Score Spike Detected",
        message: `Alpha score increased by ${increase} points to ${currentAlpha.finalScore}/100`,
        data: {
          previousScore: previousAlpha.score,
          currentScore: currentAlpha.finalScore,
          increase,
          confidence: currentAlpha.confidence,
          signals: currentAlpha.earlySignals
        },
        triggeredBy: "alpha_spike_detector",
        confidence: currentAlpha.confidence
      });
    }
  }

  private async checkVolumeSurge(token: any): Promise<void> {
    const currentVolume = await this.getCurrentVolume(token.address, 5); // 5 minute window
    const baselineVolume = await this.getBaselineVolume(token.address, 5); // Previous 5 minutes
    
    if (baselineVolume === 0 && currentVolume > 10000) {
      // New token with instant volume
      await this.generateAlert({
        tokenAddress: token.address,
        type: AlertType.ENTRY_SIGNAL,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.VOLUME_SURGE,
        title: "🚀 Volume Explosion",
        message: `Instant volume surge: $${(currentVolume / 1000).toFixed(0)}k in 5 minutes`,
        data: { volume: currentVolume, timeframe: '5m' },
        triggeredBy: "volume_surge_detector",
        confidence: 0.8
      });
      return;
    }
    
    const volumeIncrease = baselineVolume > 0 ? 
      ((currentVolume - baselineVolume) / baselineVolume) * 100 : 0;
    
    if (volumeIncrease >= this.conditions.volumeSpike) {
      const severity = volumeIncrease >= 1000 ? AlertSeverity.CRITICAL :
                      volumeIncrease >= 500 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM;
      
      await this.generateAlert({
        tokenAddress: token.address,
        type: AlertType.ENTRY_SIGNAL,
        severity,
        category: AlertCategory.VOLUME_SURGE,
        title: "📈 Volume Surge Alert",
        message: `Volume increased ${volumeIncrease.toFixed(0)}% to $${(currentVolume / 1000).toFixed(0)}k`,
        data: {
          currentVolume,
          baselineVolume,
          increase: volumeIncrease,
          timeframe: '5m'
        },
        triggeredBy: "volume_surge_detector",
        confidence: 0.7
      });
    }
  }

  private async checkSmartMoneyEntry(token: any): Promise<void> {
    const recentTxs = await this.getRecentTransactions(token.address, 15); // Last 15 minutes
    const smartMoneyBuys = recentTxs.filter(tx => 
      tx.type === 'BUY' && this.isSmartMoneyWallet(tx.wallet?.address)
    );
    
    if (smartMoneyBuys.length >= this.conditions.smartMoneyThreshold) {
      const totalValue = smartMoneyBuys.reduce((sum, tx) => sum + (tx.value || 0), 0);
      
      await this.generateAlert({
        tokenAddress: token.address,
        type: AlertType.ENTRY_SIGNAL,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.SMART_MONEY_ENTRY,
        title: "🧠 Smart Money Alert",
        message: `${smartMoneyBuys.length} smart wallets buying ($${(totalValue / 1000).toFixed(0)}k total)`,
        data: {
          smartWalletCount: smartMoneyBuys.length,
          totalValue,
          wallets: smartMoneyBuys.map(tx => ({
            address: tx.wallet?.address,
            value: tx.value,
            timestamp: tx.timestamp
          }))
        },
        triggeredBy: "smart_money_detector",
        confidence: 0.85
      });
    }
  }

  private async checkHolderGrowth(token: any): Promise<void> {
    const newHoldersLastMinute = await this.getNewHoldersInTimeframe(
      token.address, Date.now() - 60000, Date.now()
    );
    
    if (newHoldersLastMinute >= this.conditions.holderGrowthRate) {
      const severity = newHoldersLastMinute >= 30 ? AlertSeverity.CRITICAL :
                      newHoldersLastMinute >= 20 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM;
      
      await this.generateAlert({
        tokenAddress: token.address,
        type: AlertType.ENTRY_SIGNAL,
        severity,
        category: AlertCategory.HOLDER_GROWTH,
        title: "👥 Rapid Adoption",
        message: `${newHoldersLastMinute} new holders in last minute`,
        data: {
          newHolders: newHoldersLastMinute,
          timeframe: '1m',
          growthRate: newHoldersLastMinute * 60 // Per hour projection
        },
        triggeredBy: "holder_growth_detector", 
        confidence: 0.7
      });
    }
  }

  private async checkNarrativeMomentum(token: any): Promise<void> {
    const alphaResult = await this.alphaScorer.calculateAlphaScore(token.address);
    
    // Check if token has strong narrative + is very new
    const hasHotNarrative = alphaResult.components.narrativeStrength.signals.includes('HOT_NARRATIVE');
    const isUltraEarly = alphaResult.components.narrativeStrength.signals.includes('ULTRA_EARLY');
    
    if (hasHotNarrative && isUltraEarly && alphaResult.components.narrativeStrength.score >= 80) {
      await this.generateAlert({
        tokenAddress: token.address,
        type: AlertType.ENTRY_SIGNAL,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.NARRATIVE_MOMENTUM,
        title: "🎯 Hot Narrative + Ultra Early",
        message: "Perfect storm: trending narrative meets brand new token",
        data: {
          narrativeScore: alphaResult.components.narrativeStrength.score,
          signals: alphaResult.components.narrativeStrength.signals,
          reasoning: alphaResult.components.narrativeStrength.reasoning
        },
        triggeredBy: "narrative_momentum_detector",
        confidence: alphaResult.components.narrativeStrength.confidence
      });
    }
  }

  // ============= EXIT SIGNALS =============

  async detectExitSignals(tokenAddress: string): Promise<void> {
    try {
      const token = await this.getTokenData(tokenAddress);
      if (!token) return;

      // 1. Dev Wallet Sells
      await this.checkDevSells(token);
      
      // 2. Whale Dumping
      await this.checkWhaleDumps(token);
      
      // 3. Volume Decline
      await this.checkVolumeDecline(token);
      
      // 4. Liquidity Drain
      await this.checkLiquidityDrain(token);
      
      // 5. Bot Selling Patterns
      await this.checkBotSelling(token);

      // 6. NEW: Dump Score Rising
      await this.checkDumpRiskRising(token);

      // 7. NEW: Smart wallet exits
      await this.checkSmartWalletExits(token);

    } catch (error) {
      console.error(`Error detecting exit signals for ${tokenAddress}:`, error);
    }
  }

  // NEW: EXIT fires when dump score > 75 and INCREASING
  private async checkDumpRiskRising(token: any): Promise<void> {
    try {
      const dumpResult = await this.dumpScorer.calculateDumpScore(token.address);

      // Check if risk score increased significantly (trend = INCREASING)
      if (dumpResult.finalScore > 75 && dumpResult.trend === 'INCREASING') {
        await this.generateAlert({
          tokenAddress: token.address,
          type: AlertType.EXIT_SIGNAL,
          severity: AlertSeverity.CRITICAL,
          category: AlertCategory.RUG_WARNING,
          title: '🚨 Dump Risk Critical & Rising',
          message: dumpResult.humanReadable,
          data: {
            dumpScore: dumpResult.finalScore,
            riskLevel: dumpResult.riskLevel,
            trend: dumpResult.trend,
            primaryRisk: dumpResult.primaryRisk,
            signals: dumpResult.signals,
            signalType: 'DUMP_RISK_INCREASING',
            action: 'SELL',
          },
          triggeredBy: 'dump_risk_detector',
          confidence: 0.88,
        });
      } else if (dumpResult.finalScore > 55 && dumpResult.trend === 'INCREASING') {
        await this.generateAlert({
          tokenAddress: token.address,
          type: AlertType.RISK_WARNING,
          severity: AlertSeverity.HIGH,
          category: AlertCategory.RUG_WARNING,
          title: '⚠️ Dump Risk Increasing',
          message: `Risk score rising to ${dumpResult.finalScore}/100 — ${dumpResult.primaryRisk}`,
          data: {
            dumpScore: dumpResult.finalScore,
            trend: dumpResult.trend,
            primaryRisk: dumpResult.primaryRisk,
            signalType: 'DUMP_RISK_INCREASING',
            action: 'WATCH',
          },
          triggeredBy: 'dump_risk_detector',
          confidence: 0.75,
        });
      }

      // Active distribution signal
      const hasActiveDistribution = dumpResult.signals.some(s =>
        s.type === 'WHALE_DISTRIBUTION' && (s.severity === 'HIGH' || s.severity === 'CRITICAL')
      );
      if (hasActiveDistribution) {
        await this.generateAlert({
          tokenAddress: token.address,
          type: AlertType.EXIT_SIGNAL,
          severity: AlertSeverity.HIGH,
          category: AlertCategory.WHALE_DUMP,
          title: '⚠️ Active Distribution Detected',
          message: 'Multiple top holders reducing positions simultaneously',
          data: {
            signals: dumpResult.signals.filter(s => s.type === 'WHALE_DISTRIBUTION'),
            signalType: 'ACTIVE_DISTRIBUTION',
            action: 'SELL',
          },
          triggeredBy: 'distribution_detector',
          confidence: 0.8,
        });
      }

      // Bundle exit
      const hasBundleExit = dumpResult.signals.some(s => s.type === 'BUNDLE_SELLING');
      if (hasBundleExit) {
        await this.generateAlert({
          tokenAddress: token.address,
          type: AlertType.EXIT_SIGNAL,
          severity: AlertSeverity.HIGH,
          category: AlertCategory.BOT_SELLING,
          title: '🚨 Bundle Exit Detected',
          message: 'Coordinated sell by wallets that bought together',
          data: {
            signals: dumpResult.signals.filter(s => s.type === 'BUNDLE_SELLING'),
            signalType: 'BUNDLE_EXIT_DETECTED',
            action: 'SELL',
          },
          triggeredBy: 'bundle_exit_detector',
          confidence: 0.85,
        });
      }
    } catch (err) {
      console.warn('[SignalEngine] checkDumpRiskRising error:', err);
    }
  }

  // NEW: EXIT fires when 2+ smart wallets exiting same token
  private async checkSmartWalletExits(token: any): Promise<void> {
    try {
      const exits = await this.smartWalletEngine.detectExits(token.address);
      if (exits.length >= 2) {
        const totalExitValue = exits.reduce((sum, e) => sum + (e.activity.amount || 0), 0);
        await this.generateAlert({
          tokenAddress: token.address,
          type: AlertType.EXIT_SIGNAL,
          severity: exits.length >= 3 ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
          category: AlertCategory.WHALE_DUMP,
          title: `🧠 Smart Money Exiting (${exits.length} wallets)`,
          message: `${exits.length} smart wallets exiting — $${(totalExitValue / 1000).toFixed(0)}k leaving`,
          data: {
            walletCount: exits.length,
            totalExitValue,
            wallets: exits.map(e => ({
              address: e.wallet.address,
              score: e.wallet.score,
              amount: e.activity.amount,
            })),
            signalType: 'EXIT_LIKELY',
            action: 'SELL',
          },
          triggeredBy: 'smart_wallet_exit_detector',
          confidence: 0.9,
        });
      }
    } catch (err) {
      console.warn('[SignalEngine] checkSmartWalletExits error:', err);
    }
  }

  private async checkDevSells(token: any): Promise<void> {
    const devWallets = await this.getDevWallets(token.address);
    const recentTxs = await this.getRecentTransactions(token.address, 30); // Last 30 minutes
    
    for (const devWallet of devWallets) {
      const devSells = recentTxs.filter(tx => 
        tx.type === 'SELL' && tx.walletId === devWallet.id
      );
      
      const totalSellValue = devSells.reduce((sum, tx) => sum + (tx.value || 0), 0);
      
      if (totalSellValue >= this.conditions.devSellThreshold) {
        await this.generateAlert({
          tokenAddress: token.address,
          type: AlertType.EXIT_SIGNAL,
          severity: AlertSeverity.CRITICAL,
          category: AlertCategory.DEV_SELL,
          title: "🚨 Dev Wallet Selling",
          message: `Dev sold $${(totalSellValue / 1000).toFixed(0)}k worth of tokens`,
          data: {
            devWallet: devWallet.address,
            sellValue: totalSellValue,
            sellCount: devSells.length,
            transactions: devSells.map(tx => ({
              amount: tx.amount,
              value: tx.value,
              timestamp: tx.timestamp
            }))
          },
          triggeredBy: "dev_sell_detector",
          confidence: 0.95
        });
      }
    }
  }

  private async checkWhaleDumps(token: any): Promise<void> {
    const recentTxs = await this.getRecentTransactions(token.address, 15);
    const largeSells = recentTxs.filter(tx => 
      tx.type === 'SELL' && (tx.value || 0) > 25000 // $25k+ sells
    );
    
    if (largeSells.length >= 3) {
      const totalDumpValue = largeSells.reduce((sum, tx) => sum + (tx.value || 0), 0);
      
      await this.generateAlert({
        tokenAddress: token.address,
        type: AlertType.EXIT_SIGNAL,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.WHALE_DUMP,
        title: "🐋 Whale Dump Alert",
        message: `${largeSells.length} large sells totaling $${(totalDumpValue / 1000).toFixed(0)}k`,
        data: {
          sellCount: largeSells.length,
          totalValue: totalDumpValue,
          averageSize: totalDumpValue / largeSells.length,
          timeframe: '15m'
        },
        triggeredBy: "whale_dump_detector",
        confidence: 0.8
      });
    }
  }

  private async checkVolumeDecline(token: any): Promise<void> {
    const currentVolume = await this.getCurrentVolume(token.address, 10); // 10 minute window
    const previousVolume = await this.getPreviousVolume(token.address, 10); // Previous 10 minutes
    
    if (previousVolume > 50000) { // Only check if there was significant volume before
      const decline = previousVolume > 0 ? ((previousVolume - currentVolume) / previousVolume) * 100 : 0;
      
      if (decline >= this.conditions.volumeDeclineThreshold) {
        const severity = decline >= 80 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM;
        
        await this.generateAlert({
          tokenAddress: token.address,
          type: AlertType.EXIT_SIGNAL,
          severity,
          category: AlertCategory.VOLUME_DECLINE,
          title: "📉 Volume Collapse",
          message: `Volume dropped ${decline.toFixed(0)}% to $${(currentVolume / 1000).toFixed(0)}k`,
          data: {
            currentVolume,
            previousVolume,
            decline,
            timeframe: '10m'
          },
          triggeredBy: "volume_decline_detector",
          confidence: 0.7
        });
      }
    }
  }

  private async checkLiquidityDrain(token: any): Promise<void> {
    const currentLiquidity = token.liquidity || 0;
    const previousLiquidity = await this.getPreviousLiquidity(token.address);
    
    if (previousLiquidity && previousLiquidity > 0) {
      const reduction = ((previousLiquidity - currentLiquidity) / previousLiquidity) * 100;
      
      if (reduction >= this.conditions.liquidityReductionThreshold) {
        const severity = reduction >= 70 ? AlertSeverity.EMERGENCY : 
                        reduction >= 50 ? AlertSeverity.CRITICAL : AlertSeverity.HIGH;
        
        await this.generateAlert({
          tokenAddress: token.address,
          type: AlertType.EXIT_SIGNAL,
          severity,
          category: AlertCategory.LIQUIDITY_DRAIN,
          title: "💧 Liquidity Drain Alert",
          message: `Liquidity reduced ${reduction.toFixed(0)}% to $${(currentLiquidity / 1000).toFixed(0)}k`,
          data: {
            currentLiquidity,
            previousLiquidity,
            reduction,
            remainingLiquidity: currentLiquidity
          },
          triggeredBy: "liquidity_drain_detector",
          confidence: 0.9
        });
      }
    }
  }

  private async checkBotSelling(token: any): Promise<void> {
    const recentTxs = await this.getRecentTransactions(token.address, 10);
    const sellTxs = recentTxs.filter(tx => tx.type === 'SELL');
    
    if (sellTxs.length >= 20) {
      // Check for bot-like patterns: similar amounts, rapid succession
      const amounts = sellTxs.map(tx => tx.amount);
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      
      const similarAmounts = amounts.filter(amount => 
        Math.abs(amount - avgAmount) / avgAmount < 0.1 // Within 10% of average
      ).length;
      
      if (similarAmounts >= sellTxs.length * 0.7) { // 70% similar amounts
        await this.generateAlert({
          tokenAddress: token.address,
          type: AlertType.EXIT_SIGNAL,
          severity: AlertSeverity.HIGH,
          category: AlertCategory.BOT_SELLING,
          title: "🤖 Bot Selling Detected",
          message: `${sellTxs.length} similar-sized sells in 10 minutes`,
          data: {
            sellCount: sellTxs.length,
            similarAmountPercentage: (similarAmounts / sellTxs.length) * 100,
            avgSellAmount: avgAmount,
            timeframe: '10m'
          },
          triggeredBy: "bot_selling_detector",
          confidence: 0.75
        });
      }
    }
  }

  // ============= RISK ALERTS =============

  async detectRiskAlerts(tokenAddress: string): Promise<void> {
    try {
      const token = await this.getTokenData(tokenAddress);
      if (!token) return;

      // 1. Sniper Concentration
      await this.checkSniperConcentration(token);
      
      // 2. Liquidity Risk
      await this.checkLiquidityRisk(token);
      
      // 3. Contract Risk  
      await this.checkContractRisk(token);
      
      // 4. Rug Pull Warning
      await this.checkRugRisk(token);

    } catch (error) {
      console.error(`Error detecting risk alerts for ${tokenAddress}:`, error);
    }
  }

  private async checkSniperConcentration(token: any): Promise<void> {
    const holdings = token.wallets || [];
    const sniperHoldings = holdings.filter((h: any) => h.wallet?.isSniper);
    const sniperPercentage = sniperHoldings.reduce((sum: number, h: any) => sum + h.percentage, 0);
    
    if (sniperPercentage >= this.conditions.sniperConcentrationThreshold) {
      await this.generateAlert({
        tokenAddress: token.address,
        type: AlertType.RISK_WARNING,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.SNIPER_CONCENTRATION,
        title: "⚠️ Sniper Wallet Risk",
        message: `${sniperPercentage.toFixed(1)}% of supply controlled by sniper wallets`,
        data: {
          sniperPercentage,
          sniperCount: sniperHoldings.length,
          avgSniperHolding: sniperPercentage / sniperHoldings.length
        },
        triggeredBy: "sniper_concentration_detector",
        confidence: 0.8
      });
    }
  }

  private async checkLiquidityRisk(token: any): Promise<void> {
    const liquidityPools = token.liquidityPools || [];
    const mainPool = liquidityPools[0];
    
    if (mainPool && !mainPool.isLocked) {
      await this.generateAlert({
        tokenAddress: token.address,
        type: AlertType.RISK_WARNING,
        severity: AlertSeverity.MEDIUM,
        category: AlertCategory.UNLOCKED_LIQUIDITY,
        title: "🔓 Unlocked Liquidity Risk",
        message: `$${(mainPool.totalLiquidity / 1000).toFixed(0)}k liquidity is not locked`,
        data: {
          liquidityAmount: mainPool.totalLiquidity,
          poolAddress: mainPool.address,
          dex: mainPool.dex
        },
        triggeredBy: "liquidity_risk_detector",
        confidence: 0.9
      });
    }
  }

  private async checkContractRisk(token: any): Promise<void> {
    const risks: string[] = [];
    let severity = AlertSeverity.LOW;
    
    if (!token.verified) {
      risks.push("Unverified contract");
      severity = AlertSeverity.MEDIUM;
    }
    
    if (!token.ownershipRenounced) {
      risks.push("Ownership not renounced");
      severity = AlertSeverity.MEDIUM;
    }
    
    if (token.isProxy) {
      risks.push("Upgradeable proxy contract");
      severity = AlertSeverity.HIGH;
    }
    
    const avgTax = ((token.buyTax || 0) + (token.sellTax || 0)) / 2;
    if (avgTax > 10) {
      risks.push(`High transaction tax: ${avgTax.toFixed(1)}%`);
      severity = AlertSeverity.HIGH;
    }
    
    if (risks.length >= 2) {
      await this.generateAlert({
        tokenAddress: token.address,
        type: AlertType.RISK_WARNING,
        severity,
        category: AlertCategory.CONTRACT_RISK,
        title: "⚠️ Contract Risk Detected",
        message: `${risks.length} risk factors: ${risks.join(', ')}`,
        data: {
          riskCount: risks.length,
          risks,
          verified: token.verified,
          ownershipRenounced: token.ownershipRenounced,
          isProxy: token.isProxy,
          avgTax
        },
        triggeredBy: "contract_risk_detector",
        confidence: 0.85
      });
    }
  }

  private async checkRugRisk(token: any): Promise<void> {
    const rugResult = await this.rugScorer.calculateRugScore(token.address);
    const dumpResult = await this.dumpScorer.calculateDumpScore(token.address);
    
    if (rugResult.finalScore >= this.conditions.rugScoreThreshold) {
      const severity = rugResult.finalScore >= 85 ? AlertSeverity.EMERGENCY : AlertSeverity.CRITICAL;
      
      await this.generateAlert({
        tokenAddress: token.address,
        type: AlertType.RISK_WARNING,
        severity,
        category: AlertCategory.RUG_WARNING,
        title: "🚨 High Rug Risk",
        message: `Rug score: ${rugResult.finalScore}/100 (${rugResult.riskLevel})`,
        data: {
          rugScore: rugResult.finalScore,
          riskLevel: rugResult.riskLevel,
          dumpScore: dumpResult.finalScore,
          dumpRiskLevel: dumpResult.riskLevel,
          primaryRisk: dumpResult.primaryRisk,
          primaryFlags: Object.values(rugResult.components)
            .flatMap(component => component.flags)
            .slice(0, 5),
          summary: rugResult.summary
        },
        triggeredBy: "rug_risk_detector",
        confidence: 0.9
      });
    } else if (dumpResult.finalScore >= 65) {
      // Also alert on high dump risk even if rug score is OK
      await this.generateAlert({
        tokenAddress: token.address,
        type: AlertType.RISK_WARNING,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.RUG_WARNING,
        title: '⚠️ High Dump Risk Detected',
        message: dumpResult.humanReadable,
        data: {
          dumpScore: dumpResult.finalScore,
          riskLevel: dumpResult.riskLevel,
          primaryRisk: dumpResult.primaryRisk,
          signals: dumpResult.signals,
        },
        triggeredBy: 'dump_score_risk_detector',
        confidence: 0.85,
      });
    }
  }

  // ============= CORE ALERT METHODS =============

  private async generateAlert(alertData: {
    tokenAddress: string;
    type: AlertType;
    severity: AlertSeverity;
    category: AlertCategory;
    title: string;
    message: string;
    data?: any;
    triggeredBy: string;
    confidence: number;
  }): Promise<void> {
    try {
      // Check for duplicate alerts (avoid spam)
      const isDuplicate = await this.checkDuplicateAlert(
        alertData.tokenAddress,
        alertData.category,
        5 * 60 * 1000 // 5 minute window
      );
      
      if (isDuplicate) {
        console.log(`Duplicate alert suppressed: ${alertData.category} for ${alertData.tokenAddress}`);
        return;
      }

      // Get token info
      const token = await this.prisma.token.findUnique({
        where: { address: alertData.tokenAddress },
        select: { id: true, symbol: true, name: true }
      });
      
      if (!token) return;

      // Create alert in database
      const alert = await this.prisma.alert.create({
        data: {
          type: alertData.type,
          severity: alertData.severity,
          category: alertData.category,
          tokenId: token.id,
          title: alertData.title,
          message: alertData.message,
          data: alertData.data || {},
          triggeredBy: alertData.triggeredBy,
          confidence: alertData.confidence,
          conditions: {
            tokenAddress: alertData.tokenAddress,
            tokenSymbol: token.symbol,
            timestamp: new Date()
          },
          expiresAt: this.getAlertExpiry(alertData.severity),
          status: AlertStatus.ACTIVE
        }
      });

      // Queue alert for processing/delivery
      await this.alertProcessorQueue.add('deliver-alert', {
        alertId: alert.id,
        alertData: {
          ...alertData,
          id: alert.id,
          tokenSymbol: token.symbol,
          tokenName: token.name,
          createdAt: alert.createdAt
        }
      });

      // Cache alert for real-time streaming
      await this.cacheAlert(alert.id, {
        ...alertData,
        id: alert.id,
        tokenSymbol: token.symbol,
        tokenName: token.name,
        createdAt: alert.createdAt
      });

      console.log(`🚨 Alert generated: ${alertData.title} for ${token.symbol}`);

    } catch (error) {
      console.error('Error generating alert:', error);
    }
  }

  private async processSignalJob(data: AlertTrigger): Promise<void> {
    // Process different types of signal triggers
    switch (data.triggerType) {
      case 'entry_scan':
        await this.detectEntrySignals(data.tokenAddress);
        break;
      case 'exit_scan':
        await this.detectExitSignals(data.tokenAddress);
        break;
      case 'risk_scan':
        await this.detectRiskAlerts(data.tokenAddress);
        break;
      default:
        console.log(`Unknown trigger type: ${data.triggerType}`);
    }
  }

  private async processAlertJob(data: any): Promise<void> {
    // Handle alert delivery to various channels
    try {
      const alert = data.alertData;
      
      // Mark as sent
      await this.prisma.alert.update({
        where: { id: alert.id },
        data: { isSent: true }
      });

      // Send to notification channels
      await this.deliverAlert(alert);

    } catch (error) {
      console.error('Error processing alert job:', error);
    }
  }

  private async deliverAlert(alert: any): Promise<void> {
    // Deliver to various channels based on alert severity
    console.log(`📢 Delivering ${alert.severity} alert: ${alert.title}`);
    
    // Future: Implement delivery to:
    // - WebSocket clients
    // - Telegram bot
    // - Discord webhook  
    // - Email notifications
    // - Push notifications
  }

  // ============= UTILITY METHODS =============

  private async checkDuplicateAlert(
    tokenAddress: string, 
    category: AlertCategory, 
    timeWindow: number
  ): Promise<boolean> {
    const cutoff = new Date(Date.now() - timeWindow);
    
    const existing = await this.prisma.alert.findFirst({
      where: {
        token: { address: tokenAddress },
        category,
        createdAt: { gte: cutoff },
        status: AlertStatus.ACTIVE
      }
    });
    
    return !!existing;
  }

  private getAlertExpiry(severity: AlertSeverity): Date {
    const hours = {
      [AlertSeverity.EMERGENCY]: 1,
      [AlertSeverity.CRITICAL]: 2,
      [AlertSeverity.HIGH]: 4,
      [AlertSeverity.MEDIUM]: 8,
      [AlertSeverity.LOW]: 24
    };
    
    return new Date(Date.now() + hours[severity] * 60 * 60 * 1000);
  }

  private async cacheAlert(alertId: string, alertData: any): Promise<void> {
    // Cache for real-time streaming
    await this.redis.lpush('recent_alerts', JSON.stringify(alertData));
    await this.redis.ltrim('recent_alerts', 0, 99); // Keep last 100 alerts
    await this.redis.expire('recent_alerts', 3600); // 1 hour expiry
    
    // Cache by token for targeted streaming
    await this.redis.setex(
      `alert:${alertData.tokenAddress}:latest`,
      1800, // 30 minutes
      JSON.stringify(alertData)
    );
  }

  // Trigger methods for external use
  async triggerTokenScan(tokenAddress: string): Promise<void> {
    // Queue all scan types for a token
    await this.signalQueue.add('entry_scan', {
      tokenAddress,
      triggerType: 'entry_scan',
      severity: AlertSeverity.MEDIUM,
      data: {},
      timestamp: new Date()
    });

    await this.signalQueue.add('exit_scan', {
      tokenAddress,
      triggerType: 'exit_scan',
      severity: AlertSeverity.MEDIUM,
      data: {},
      timestamp: new Date()
    });

    await this.signalQueue.add('risk_scan', {
      tokenAddress,
      triggerType: 'risk_scan',
      severity: AlertSeverity.MEDIUM,
      data: {},
      timestamp: new Date()
    });
  }

  // ============= PRECISE ALERT RULE ENGINE =============

  /**
   * Evaluates the AlertRuleEngine against current token scores and stores
   * the resulting PreciseAlerts in Redis for the alerts API to serve.
   */
  async runPreciseAlertEngine(tokenAddress: string): Promise<PreciseAlert[]> {
    try {
      const [alphaResult, dumpResult] = await Promise.all([
        this.alphaScorer.calculateAlphaScore(tokenAddress).catch(() => null),
        this.dumpScorer.calculateDumpScore(tokenAddress).catch(() => null),
      ]);

      if (!alphaResult || !dumpResult) return [];

      const token = await this.prisma.token.findUnique({
        where: { address: tokenAddress },
        select: { symbol: true, chain: true, marketCap: true, createdAt: true },
      });

      const smartEntries = await this.smartWalletEngine.detectNewEntries(30).catch(() => []);
      const tokenSmartEntries = smartEntries.filter((a: any) => a.tokenAddress === tokenAddress);
      const smartExits = await this.smartWalletEngine.detectExits(tokenAddress).catch(() => []);

      // Build context from available data
      const ageMinutes = token?.createdAt
        ? Math.floor((Date.now() - new Date(token.createdAt).getTime()) / 60000)
        : 9999;

      const ctx: AlertContext = {
        tokenAddress,
        tokenSymbol: token?.symbol ?? '',
        chain: (token?.chain as any) ?? 'SOL',
        alphaScore: alphaResult.finalScore,
        dumpScore: dumpResult.finalScore,
        tokenAgeLt6h: ageMinutes < 360,
        smartWalletEntries30m: tokenSmartEntries.length,
        smartWalletExiting: smartExits.length > 0,
        affectedWallets: [
          ...tokenSmartEntries.map((e: any) => e.walletAddress ?? e.wallet?.address).filter(Boolean),
          ...smartExits.map((e: any) => e.wallet?.address).filter(Boolean),
        ],
        devSellAmount: dumpResult.signals
          .filter((s: any) => s.type === 'DEV_SELL')
          .reduce((sum: number, s: any) => sum + (s.amountUsd ?? 0), 0),
      };

      const alerts = await this.alertRuleEngine.evaluate(ctx);

      if (alerts.length > 0) {
        // Store in Redis for real-time consumption
        const key = `precise_alerts:${tokenAddress}`;
        await this.redis.setex(key, 3600, JSON.stringify(alerts));

        // Also push to global stream
        for (const alert of alerts) {
          await this.redis.lpush('precise_alerts_stream', JSON.stringify(alert));
        }
        await this.redis.ltrim('precise_alerts_stream', 0, 199);
      }

      return alerts;
    } catch (err) {
      console.warn('[SignalEngine] runPreciseAlertEngine error:', err);
      return [];
    }
  }

  // Real-time alert streaming
  async getRecentAlerts(limit: number = 20): Promise<any[]> {
    const alerts = await this.redis.lrange('recent_alerts', 0, limit - 1);
    return alerts.map(alert => JSON.parse(alert));
  }

  // Get alerts formatted as the new Signal interface
  async getRecentSignals(limit: number = 20): Promise<Signal[]> {
    const raw = await this.getRecentAlerts(limit);
    return raw.map(a => this.alertToSignal(a));
  }

  private alertToSignal(alert: any): Signal {
    const severityMap: Record<string, Signal['severity']> = {
      EMERGENCY: 'CRITICAL',
      CRITICAL: 'CRITICAL',
      HIGH: 'WARNING',
      MEDIUM: 'WARNING',
      LOW: 'INFO',
    };

    const actionMap: Record<string, Signal['action']> = {
      ENTRY_SIGNAL: 'BUY',
      EXIT_SIGNAL: 'SELL',
      RISK_WARNING: 'WATCH',
    };

    const emojiMap: Record<string, string> = {
      CRITICAL: '🚨',
      WARNING: '⚠️',
      INFO: '✅',
    };

    const severity = severityMap[alert.severity] || 'INFO';
    const action = (alert.data?.action as Signal['action']) || actionMap[alert.type] || 'WATCH';
    const signalType = (alert.data?.signalType as SignalType) || 'RISK_ALERT';

    return {
      id: alert.id || `signal_${Date.now()}`,
      tokenAddress: alert.tokenAddress || '',
      tokenSymbol: alert.tokenSymbol || '',
      type: signalType,
      severity,
      emoji: emojiMap[severity] || '✅',
      title: alert.title || 'Signal',
      description: alert.message || '',
      action,
      confidence: alert.confidence || 0.5,
      expiresAt: alert.expiresAt ? new Date(alert.expiresAt) : new Date(Date.now() + 4 * 60 * 60 * 1000),
      triggeredAt: alert.createdAt ? new Date(alert.createdAt) : new Date(),
      metadata: alert.data || {},
    };
  }

  async getTokenAlerts(tokenAddress: string, hours: number = 24): Promise<any[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return await this.prisma.alert.findMany({
      where: {
        token: { address: tokenAddress },
        createdAt: { gte: cutoff },
        status: AlertStatus.ACTIVE
      },
      include: {
        token: {
          select: { symbol: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Helper methods (implementations would use existing data structures)
  private async getTokenData(address: string) { /* ... */ }
  private async getPreviousAlphaScore(address: string) { /* ... */ }
  private async getCurrentVolume(address: string, minutes: number) { /* ... */ }
  private async getBaselineVolume(address: string, minutes: number) { /* ... */ }
  private async getPreviousVolume(address: string, minutes: number) { /* ... */ }
  private async getRecentTransactions(address: string, minutes: number) { /* ... */ }
  private async getNewHoldersInTimeframe(address: string, start: number, end: number) { /* ... */ }
  private async getDevWallets(address: string) { /* ... */ }
  private async getPreviousLiquidity(address: string) { /* ... */ }
  private isSmartMoneyWallet(address: string): boolean { return false; /* ... */ }
}
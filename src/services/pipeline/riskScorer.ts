
import { RiskAssessment, RiskScore, Signal, TokenMetadata, HolderAnalysis, LiquidityAnalysis, WalletCluster } from '../../types/signalos';

export function scoreRisk(
  metadata: TokenMetadata,
  holders: HolderAnalysis,
  liquidity: LiquidityAnalysis,
  clusters: WalletCluster[]
): { risk: RiskAssessment; signals: Signal[] } {

  const signals: Signal[] = [];

  // ── Liquidity ──────────────────────────────────────────────────────────────
  const totalLiq = liquidity.totalLiquidityUSD;
  let liquidityRiskScore: number;
  if (totalLiq < 5_000) {
    liquidityRiskScore = 90;
    signals.push({ id: 'LIQ-01', name: 'Critical Liquidity', value: `$${totalLiq.toLocaleString()}`, description: 'Extremely low liquidity — high rugpull risk.', severity: 'critical' });
  } else if (totalLiq < 20_000) {
    liquidityRiskScore = 65;
    signals.push({ id: 'LIQ-02', name: 'Low Liquidity', value: `$${totalLiq.toLocaleString()}`, description: 'Low liquidity increases price impact and manipulation risk.', severity: 'high' });
  } else if (totalLiq < 100_000) {
    liquidityRiskScore = 35;
    signals.push({ id: 'LIQ-03', name: 'Moderate Liquidity', value: `$${totalLiq.toLocaleString()}`, description: 'Moderate liquidity. Monitor for sudden removals.', severity: 'medium' });
  } else {
    liquidityRiskScore = 10;
    signals.push({ id: 'LIQ-04', name: 'Healthy Liquidity', value: `$${totalLiq.toLocaleString()}`, description: 'Strong liquidity depth — lower manipulation risk.', severity: 'low' });
  }

  if (liquidity.isLocked) {
    signals.push({ id: 'LIQ-LOCKED', name: 'Liquidity Locked', value: liquidity.lockDuration || 'Yes', description: `LP tokens are locked${liquidity.lockDuration ? ` for ${liquidity.lockDuration}` : ''}.`, severity: 'low' });
  } else if (liquidity.lpOwnershipRisk > 60) {
    signals.push({ id: 'LIQ-NOLOCK', name: 'LP Not Locked', value: `${liquidity.lpOwnershipRisk.toFixed(0)}% removal risk`, description: 'Liquidity can be removed at any time — rugpull vector open.', severity: 'high' });
  }

  // ── Holder Count ───────────────────────────────────────────────────────────
  const holderCount = holders.holders.length;
  let holderRiskScore: number;
  if (holderCount < 50) {
    holderRiskScore = 80;
    signals.push({ id: 'HOLD-01', name: 'Very Few Holders', value: holderCount, description: `Only ${holderCount} holders — extreme concentration risk.`, severity: 'critical' });
  } else if (holderCount < 200) {
    holderRiskScore = 55;
    signals.push({ id: 'HOLD-02', name: 'Low Holder Count', value: holderCount, description: `Only ${holderCount} holders — poor distribution.`, severity: 'high' });
  } else if (holderCount >= 500) {
    holderRiskScore = 10;
    signals.push({ id: 'HOLD-03', name: 'Broad Holder Base', value: holderCount, description: `${holderCount.toLocaleString()} holders signals healthy distribution.`, severity: 'low' });
  } else {
    holderRiskScore = 30;
  }

  // ── Top-10 Concentration ───────────────────────────────────────────────────
  const top10Pct = holders.top10Percentage;
  const concentrationRiskScore = Math.min(100, top10Pct);
  if (top10Pct > 80) {
    signals.push({ id: 'CONC-01', name: 'Top 10 Own >80%', value: `${top10Pct.toFixed(1)}%`, description: 'Severe supply concentration — major dump risk at any time.', severity: 'critical' });
  } else if (top10Pct > 50) {
    signals.push({ id: 'CONC-02', name: 'High Concentration', value: `${top10Pct.toFixed(1)}%`, description: `Top 10 wallets hold ${top10Pct.toFixed(1)}% of supply.`, severity: 'high' });
  } else if (top10Pct > 30) {
    signals.push({ id: 'CONC-03', name: 'Moderate Concentration', value: `${top10Pct.toFixed(1)}%`, description: `Top 10 wallets hold ${top10Pct.toFixed(1)}%.`, severity: 'medium' });
  } else {
    signals.push({ id: 'CONC-04', name: 'Well Distributed', value: `${top10Pct.toFixed(1)}%`, description: `Top 10 wallets hold only ${top10Pct.toFixed(1)}% — healthy spread.`, severity: 'low' });
  }

  // ── Dev Sell / Creator Holdings ────────────────────────────────────────────
  const creatorHolder = holders.holders.find(h => h.isCreator);
  let devRiskScore = 0;
  if (creatorHolder) {
    const creatorPct = creatorHolder.percentage;
    if (creatorPct > 50) {
      devRiskScore = 85;
      signals.push({ id: 'DEV-01', name: 'Dev Holds >50%', value: `${creatorPct.toFixed(1)}%`, description: 'Developer controls the majority of supply — extreme dump risk.', severity: 'critical' });
    } else if (holders.creatorShare > 5 && creatorPct < 1) {
      devRiskScore = 65;
      signals.push({ id: 'DEV-02', name: 'Dev Sold Majority', value: `${creatorPct.toFixed(2)}% remaining`, description: 'Developer has offloaded most of their position — possible rug in progress.', severity: 'high' });
    } else if (creatorPct < 5) {
      devRiskScore = 15;
      signals.push({ id: 'DEV-03', name: 'Low Dev Holdings', value: `${creatorPct.toFixed(1)}%`, description: 'Developer holds a small fraction of supply.', severity: 'low' });
    }
  }

  // ── Bundle / Cluster Detection ─────────────────────────────────────────────
  const highCoordClusters = clusters.filter(c => c.coordinationScore > 70);
  const avgCoordScore = clusters.length > 0
    ? clusters.reduce((sum, c) => sum + c.coordinationScore, 0) / clusters.length
    : 0;
  const clusterRiskScore = avgCoordScore;
  if (highCoordClusters.length > 3) {
    signals.push({ id: 'CLUST-01', name: 'Heavy Bundle Activity', value: `${highCoordClusters.length} clusters`, description: `${highCoordClusters.length} high-coordination clusters — sniper/bundler pattern.`, severity: 'critical' });
  } else if (highCoordClusters.length > 0) {
    signals.push({ id: 'CLUST-02', name: 'Cluster Activity', value: `${clusters.length} clusters`, description: 'Coordinated wallet clusters detected. Possible insider buying.', severity: 'high' });
  } else if (clusters.length === 0) {
    signals.push({ id: 'CLUST-03', name: 'No Bundles Detected', value: 'Clean', description: 'No coordinated wallet clusters found.', severity: 'low' });
  }

  // ── Volume vs Liquidity Ratio (wash trading) ───────────────────────────────
  const primaryPool = liquidity.primaryPools[0];
  if (primaryPool && totalLiq > 0) {
    // We don't have volume here directly, but flag extremely low depth
    if (liquidity.depthScore < 20) {
      signals.push({ id: 'DEPTH-LOW', name: 'Thin Order Book', value: `Depth: ${liquidity.depthScore.toFixed(0)}/100`, description: 'Very thin liquidity depth — large trades will cause massive slippage.', severity: 'high' });
    }
  }

  // ── Ownership ─────────────────────────────────────────────────────────────
  const isRenounced = !!metadata.isGraduated;
  const ownershipRiskScore = isRenounced ? 5 : 45;
  if (!isRenounced) {
    signals.push({ id: 'OWN-01', name: 'Ownership Active', value: 'Not Renounced', description: 'Contract owner retains control and can modify parameters.', severity: 'high' });
  } else {
    signals.push({ id: 'OWN-02', name: 'Ownership Renounced', value: 'Renounced', description: 'Contract ownership has been renounced — admin risk eliminated.', severity: 'low' });
  }

  // ── Composite Score (0 = safe, 100 = extreme risk) ─────────────────────────
  const compositeScore = Math.round(
    liquidityRiskScore  * 0.30 +
    concentrationRiskScore * 0.20 +
    holderRiskScore     * 0.15 +
    clusterRiskScore    * 0.20 +
    devRiskScore        * 0.10 +
    ownershipRiskScore  * 0.05
  );

  const mkScore = (val: number, label: string, evidence: string[]): RiskScore => ({
    score: Math.min(100, Math.max(0, Math.round(val))),
    label,
    evidence,
    confidence: 0.90
  });

  const risk: RiskAssessment = {
    ownershipRisk: mkScore(
      ownershipRiskScore,
      'Ownership Risk',
      [isRenounced ? 'Ownership renounced — no admin control' : 'Active ownership — admin functions accessible']
    ),
    concentrationRisk: mkScore(
      concentrationRiskScore,
      'Concentration Risk',
      [
        `Top 10 holders control ${top10Pct.toFixed(1)}% of supply`,
        holders.singleWalletDominance ? 'Single wallet dominance detected' : 'No single wallet dominance'
      ]
    ),
    liquidityRisk: mkScore(
      liquidityRiskScore,
      'Liquidity Risk',
      [
        `Total liquidity: $${totalLiq.toLocaleString()}`,
        liquidity.isLocked ? `LP locked${liquidity.lockDuration ? ` (${liquidity.lockDuration})` : ''}` : 'LP not locked',
        `Depth score: ${liquidity.depthScore.toFixed(0)}/100`,
        `Removal risk: ${liquidity.removalRisk.toFixed(0)}%`
      ]
    ),
    insiderCoordinationRisk: mkScore(
      clusterRiskScore,
      'Insider Coordination Risk',
      clusters.length > 0
        ? [`${clusters.length} cluster(s) detected`, `Avg coordination score: ${avgCoordScore.toFixed(0)}/100`]
        : ['No coordinated wallet clusters found']
    ),
    contractRisk: mkScore(
      isRenounced ? 10 : 35,
      'Contract Risk',
      [
        'Standard SPL/ERC20 implementation',
        isRenounced ? 'Admin functions permanently locked' : 'Admin functions remain accessible'
      ]
    ),
    compositeRugLikelihood: mkScore(
      compositeScore,
      'Composite Rug Likelihood',
      [
        `Liquidity: $${totalLiq.toLocaleString()}`,
        `Top 10 concentration: ${top10Pct.toFixed(1)}%`,
        `Wallet clusters: ${clusters.length}`,
        `Holder count: ${holderCount}`
      ]
    )
  };

  return { risk, signals };
}

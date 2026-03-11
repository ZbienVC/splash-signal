
import { RiskAssessment, AnalysisResult } from '../../types/signalos';

export function generateVerdict(risk: RiskAssessment): { summary: string; explanation: string; confidence: number } {
  const composite = risk.compositeRugLikelihood.score;
  
  let summary = '';
  let explanation = '';

  if (composite < 20) {
    summary = 'No strong manipulation signals';
    explanation = 'The token exhibits organic growth patterns with decentralized ownership and stable liquidity. Risk of engineered manipulation is low.';
  } else if (composite < 50) {
    summary = 'Mixed signals';
    explanation = 'While liquidity is stable, we detected some coordinated wallet clusters. Exercise caution as these entities may influence price action.';
  } else if (composite < 80) {
    summary = 'Coordinated structure detected';
    explanation = 'High probability of insider coordination. Multiple wallet clusters share funding sources and trade in sync. Structural weakness in liquidity detected.';
  } else {
    summary = 'High probability engineered token';
    explanation = 'Extremely high risk. The token structure is heavily centralized with clear evidence of bot-driven coordination and predatory liquidity settings.';
  }

  return {
    summary,
    explanation,
    confidence: risk.compositeRugLikelihood.confidence
  };
}

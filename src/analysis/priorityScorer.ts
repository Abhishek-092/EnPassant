export interface PriorityFactors {
  isUserMove: boolean;
  isTheoryExit: boolean;
  isMajorBlunder: boolean; // eval loss > 150
  isLargeEvalSwing: boolean; // eval loss > 80
  isTacticalOpportunity: boolean;
  isRecurringWeakness: boolean;
  activeTrainingRelevance: number; // 0 to 20
}

/**
 * Calculates a candidate position's analysis priority score (0 to 100).
 * High priority items (blunders, theory exits) get analyzed first by Stockfish worker queue.
 */
export function calculatePositionPriority(factors: PriorityFactors): number {
  let score = 20; // Baseline priority

  if (factors.isMajorBlunder) score += 40;
  else if (factors.isLargeEvalSwing) score += 25;

  if (factors.isTheoryExit) score += 25;
  if (factors.isUserMove) score += 15;
  if (factors.isTacticalOpportunity) score += 10;
  if (factors.isRecurringWeakness) score += 20;

  score += Math.min(Math.max(factors.activeTrainingRelevance, 0), 20);

  return Math.min(Math.round(score), 100);
}


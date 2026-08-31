/**
 * Opponent strength model.
 *
 * Strength is set by Stockfish's native `Skill Level` option plus a depth limit, rather than by
 * picking deliberately worse moves from a candidate list. Skill Level is what Lichess uses for
 * its levelled bots: the engine searches properly and then introduces controlled error, which
 * plays coherently instead of randomly. It is also far faster, because it needs only MultiPV 1.
 */
export const ENGINE_LEVELS = {
  800: { skill: 2, depth: 7 },
  1000: { skill: 4, depth: 9 },
  1200: { skill: 6, depth: 11 },
  1400: { skill: 8, depth: 13 },
  1600: { skill: 10, depth: 15 },
  1800: { skill: 12, depth: 18 },
  2000: { skill: 15, depth: 20 },
  2200: { skill: 17, depth: 23 },
  2500: { skill: 19, depth: 26 },
  3200: { skill: 20, depth: 30 },
} as const;

export const ELO_TIERS: number[] = Object.keys(ENGINE_LEVELS)
  .map(Number)
  .sort((a, b) => a - b);

export const MIN_ELO = ELO_TIERS[0];
export const MAX_ELO = ELO_TIERS[ELO_TIERS.length - 1];

/**
 * Per-tier thinking budget. The deep tiers ask for depth 23-30, which a browser WASM build
 * cannot reach in a playable amount of time. `go depth D movetime M` stops at whichever limit
 * arrives first, so the budget keeps every move responsive while the depth cap still governs
 * strength at the levels that can actually reach it.
 */
const MOVETIME_BY_TIER_MS: Record<number, number> = {
  800: 120,
  1000: 150,
  1200: 200,
  1400: 280,
  1600: 400,
  1800: 600,
  2000: 850,
  2200: 1200,
  2500: 1600,
  3200: 2200,
};

export interface ResolvedEngineLevel {
  /** The tier this Elo snapped down to. */
  tierElo: number;
  skill: number;
  depth: number;
  movetime: number;
}

/** Snaps an arbitrary Elo down onto the nearest defined tier. */
export function resolveEngineLevel(elo: number): ResolvedEngineLevel {
  const clamped = Math.max(MIN_ELO, Math.min(MAX_ELO, Math.round(elo)));
  const tierElo = ELO_TIERS.reduce((active, tier) => (clamped >= tier ? tier : active), MIN_ELO);
  const level = ENGINE_LEVELS[tierElo as keyof typeof ENGINE_LEVELS];

  return {
    tierElo,
    skill: level.skill,
    depth: level.depth,
    movetime: MOVETIME_BY_TIER_MS[tierElo] ?? 400,
  };
}

export function nextEloTier(elo: number): number | null {
  const current = resolveEngineLevel(elo).tierElo;
  const index = ELO_TIERS.indexOf(current);
  return index >= 0 && index < ELO_TIERS.length - 1 ? ELO_TIERS[index + 1] : null;
}

export function previousEloTier(elo: number): number | null {
  const current = resolveEngineLevel(elo).tierElo;
  const index = ELO_TIERS.indexOf(current);
  return index > 0 ? ELO_TIERS[index - 1] : null;
}

// --- Game phase ---

export type GamePhase = 'OPENING' | 'MIDDLEGAME' | 'ENDGAME';

/**
 * Phase from the FEN alone, by piece-placement scan rather than a chess.js replay, so it stays
 * cheap enough to call on every move.
 */
export function detectGamePhase(fen: string): GamePhase {
  const fields = fen.trim().split(/\s+/);
  const placement = fields[0] ?? '';
  const fullmove = Number(fields[5] ?? '1') || 1;

  // Standard phase weights: queen 4, rook 2, minor 1. A full board scores 24.
  let material = 0;
  for (const char of placement) {
    const piece = char.toLowerCase();
    if (piece === 'q') material += 4;
    else if (piece === 'r') material += 2;
    else if (piece === 'b' || piece === 'n') material += 1;
  }

  if (material <= 6) return 'ENDGAME';
  if (fullmove <= 10) return 'OPENING';
  return 'MIDDLEGAME';
}

/**
 * How much stronger the opponent plays inside the opening than in the middlegame.
 *
 * A beginner-level opponent should still handle the opening competently — that is the material
 * being taught, and an opponent that flounders on move 4 teaches nothing. So at the 800 floor it
 * plays the opening around 1200. The bonus tapers to zero by 2000, where a rated opponent should
 * simply play at its rating everywhere.
 */
const OPENING_BONUS_AT_FLOOR = 400;
const OPENING_BONUS_VANISHES_AT = 2000;

export function getPhaseElo(baseElo: number, phase: GamePhase): number {
  if (phase !== 'OPENING') return baseElo;

  const span = OPENING_BONUS_VANISHES_AT - MIN_ELO;
  const decay = Math.max(0, Math.min(1, (baseElo - MIN_ELO) / span));
  const bonus = Math.round(OPENING_BONUS_AT_FLOOR * (1 - decay));

  return Math.min(MAX_ELO, baseElo + bonus);
}

export interface PhaseAdjustedLevel extends ResolvedEngineLevel {
  phase: GamePhase;
  /** Elo actually used for this move, after the phase adjustment. */
  effectiveElo: number;
  baseElo: number;
}

export function engineLevelForPosition(baseElo: number, fen: string): PhaseAdjustedLevel {
  const phase = detectGamePhase(fen);
  const effectiveElo = getPhaseElo(baseElo, phase);

  return {
    ...resolveEngineLevel(effectiveElo),
    phase,
    effectiveElo,
    baseElo,
  };
}

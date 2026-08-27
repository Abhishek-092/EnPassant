export interface PositionFingerprint {
  normalizedFen: string;
  boardHash: string;
  sideToMove: 'w' | 'b';
  transpositionKey: string;
  castlingRights: string;
  enPassantTarget: string | null;
}

/**
 * Creates a stable position fingerprint by normalizing a standard FEN string.
 * Strips non-positional counters (halfmove clock & fullmove number) so that
 * equivalent board states reached at different move numbers evaluate as identical transpositions.
 */
export function getPositionFingerprint(fen: string): PositionFingerprint {
  const parts = fen.trim().split(/\s+/);
  const piecePlacement = parts[0] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
  const sideToMove = (parts[1] || 'w') as 'w' | 'b';
  const castlingRights = parts[2] || '-';
  const enPassantTarget = parts[3] && parts[3] !== '-' ? parts[3] : null;

  // Normalized FEN omits halfmove and fullmove counters
  const normalizedFen = `${piecePlacement} ${sideToMove} ${castlingRights} ${enPassantTarget || '-'}`;

  // Simple, deterministic string hash for rapid indexed lookup
  let hash = 0;
  for (let i = 0; i < normalizedFen.length; i++) {
    const char = normalizedFen.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const boardHash = Math.abs(hash).toString(36);
  const transpositionKey = `${piecePlacement}:${sideToMove}:${castlingRights}`;

  return {
    normalizedFen,
    boardHash,
    sideToMove,
    transpositionKey,
    castlingRights,
    enPassantTarget,
  };
}

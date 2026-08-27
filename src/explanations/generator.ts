import { Chess } from 'chess.js';

export interface PositionFeatures {
  isOpeningPhase: boolean;
  whiteSpaceAdvantage: boolean;
  blackSpaceAdvantage: boolean;
  centralPawnChains: boolean;
  openFiles: string[];
  castledKingSide: boolean;
  castledQueenSide: boolean;
  underdevelopedMinorPieces: string[];
}

export function extractPositionFeatures(fen: string): PositionFeatures {
  const chess = new Chess(fen);
  const board = chess.board();

  let whiteMinorCount = 0;
  let blackMinorCount = 0;
  const openFiles: string[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        if ((piece.type === 'n' || piece.type === 'b')) {
          if (piece.color === 'w' && r === 7) whiteMinorCount++;
          if (piece.color === 'b' && r === 0) blackMinorCount++;
        }
      }
    }
  }

  return {
    isOpeningPhase: chess.history().length < 15,
    whiteSpaceAdvantage: board[4][3]?.type === 'p' || board[4][4]?.type === 'p',
    blackSpaceAdvantage: board[3][3]?.type === 'p' || board[3][4]?.type === 'p',
    centralPawnChains: true,
    openFiles,
    castledKingSide: true,
    castledQueenSide: false,
    underdevelopedMinorPieces: whiteMinorCount > 1 ? ['Nf1', 'Bc1'] : [],
  };
}

export interface GeneratedExplanation {
  whyThisMove: string;
  whatItAchieves: string;
  whyBetterThanAlternatives: string;
  whatToRemember: string;
}

export function generateHumanExplanation(
  userMoveSan: string,
  topEngineMoveSan: string,
  alternativeMoveSan: string | null,
  openingName: string = 'the opening',
  fen: string
): GeneratedExplanation {
  const isTopMove = userMoveSan === topEngineMoveSan;
  const move = isTopMove ? userMoveSan : topEngineMoveSan;

  let whyThisMove = `${move} immediately challenges control of the central squares and fights for board space.`;
  let whatItAchieves = `It prepares natural piece development while restricting your opponent's pawn structure in ${openingName}.`;
  let whyBetterThanAlternatives = alternativeMoveSan
    ? `${alternativeMoveSan} is playable, but it is less direct and allows the opponent time to consolidate their pawn chain.`
    : `Passive development allows your opponent to secure space without facing immediate counterplay.`;
  let whatToRemember = `Against a strong central pawn chain, look for the timely pawn break rather than making purely passive piece moves.`;

  if (move.includes('c5') || move.includes('c4')) {
    whyThisMove = `${move} strikes directly at the base of the central pawn structure.`;
    whatItAchieves = `By undermining the center, you force your opponent to defend their central pawns or give up space.`;
    whatToRemember = `Pawn breaks on the c-file are the standard weapon to dismantle central space advantages.`;
  } else if (move.includes('Nf3') || move.includes('Nf6')) {
    whyThisMove = `${move} develops the knight to its most active natural square while controlling key central squares.`;
    whatItAchieves = `It supports piece coordination and keeps options open for castling and central breaks.`;
    whatToRemember = `Develop knights before bishops in opening structures to keep piece placement flexible.`;
  } else if (move.includes('e4') || move.includes('d4') || move.includes('e5') || move.includes('d5')) {
    whyThisMove = `${move} claims a share of the center and opens diagonals for your bishops.`;
    whatItAchieves = `Establishing central pawns forces the opponent to respond rather than execute their own setup undisturbed.`;
    whatToRemember = `Central pawn placement is the foundation of active piece mobility.`;
  }

  return {
    whyThisMove,
    whatItAchieves,
    whyBetterThanAlternatives,
    whatToRemember,
  };
}

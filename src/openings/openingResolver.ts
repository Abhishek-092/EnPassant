import { OPENINGS_DATABASE } from './database';
import { EcoSearchEngine } from './eco/search';

/**
 * Everything the training board needs to run a game for one opening. The colour you play is
 * derived from the opening itself: the London System is a White scheme so you play White, the
 * Caro-Kann is a Black defence so you play Black, and the opponent takes the other side.
 */
export interface TrainingOpening {
  id: string;
  name: string;
  eco: string;
  variationName?: string;
  userColor: 'white' | 'black';
  /** The theory line the opponent follows while the game is still in book. */
  bookMoves: string[];
  description: string;
  keyPlans: string[];
  commonMistakes: string[];
  pawnBreaks: string[];
}

const DEFAULT_OPENING_ID = 'london-system';

export interface TrainingOpeningSummary {
  id: string;
  name: string;
  eco: string;
  userColor: 'white' | 'black';
}

export function listTrainingOpenings(): TrainingOpeningSummary[] {
  return OPENINGS_DATABASE.map(opening => ({
    id: opening.id,
    name: opening.name,
    eco: opening.eco,
    userColor: opening.side,
  }));
}

function fromCurated(openingId: string): TrainingOpening | null {
  const opening = OPENINGS_DATABASE.find(o => o.id === openingId);
  if (!opening) return null;

  // The first listed variation is the main line, and carries the teaching content.
  const variation = opening.variations[0];

  return {
    id: opening.id,
    name: opening.name,
    eco: variation?.eco || opening.eco,
    variationName: variation?.name,
    userColor: opening.side,
    bookMoves: variation?.moves ?? opening.startingMoves,
    description: variation?.description || opening.description,
    keyPlans: variation?.keyPlans ?? opening.mainIdeas,
    commonMistakes: variation?.commonMistakes ?? [],
    pawnBreaks: variation?.pawnBreaks ?? [],
  };
}

function fromEco(eco: string): TrainingOpening | null {
  const record = EcoSearchEngine.getByEco(eco);
  if (!record) return null;

  // Prefer curated content when the ECO code maps onto a curated opening — it has plans and
  // known mistakes that a bare ECO record does not.
  const curated = OPENINGS_DATABASE.find(
    o => o.eco === record.eco || o.variations.some(v => v.eco === record.eco)
  );
  if (curated) {
    const resolved = fromCurated(curated.id);
    if (resolved) return resolved;
  }

  return {
    id: `eco-${record.eco}`,
    name: record.name,
    eco: record.eco,
    variationName: record.variation,
    userColor: record.color === 'BLACK' ? 'black' : 'white',
    bookMoves: record.moves,
    description: `${record.name} (${record.eco}) — ${record.category}.`,
    keyPlans: [],
    commonMistakes: [],
    pawnBreaks: [],
  };
}

export function resolveTrainingOpening(params: {
  openingId?: string | null;
  eco?: string | null;
}): TrainingOpening {
  if (params.openingId) {
    const curated = fromCurated(params.openingId);
    if (curated) return curated;
  }

  if (params.eco) {
    const byEco = fromEco(params.eco);
    if (byEco) return byEco;
  }

  return fromCurated(DEFAULT_OPENING_ID) ?? fromCurated(OPENINGS_DATABASE[0].id)!;
}

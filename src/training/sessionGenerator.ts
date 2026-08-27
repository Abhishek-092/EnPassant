import { indexedDBStorage, UserMistakeRecord } from '../storage/indexedDB';
import { OPENINGS_DATABASE } from '../openings/database';

export interface DailyTrainingItem {
  id: string;
  type: 'DUE_REVIEW' | 'WEAK_OPENING' | 'PERSONAL_MISTAKE' | 'ENGINE_CHALLENGE';
  fen: string;
  title: string;
  openingName: string;
  variationName?: string;
  prompt: string;
  userColor: 'white' | 'black';
  expectedMove?: string;
  mistakeRecord?: UserMistakeRecord;
}

export interface DailySession {
  date: string;
  items: DailyTrainingItem[];
  estimatedMinutes: number;
  focusArea: string;
}

export class SessionGenerator {
  public static async generateDailySession(): Promise<DailySession> {
    const mistakes = await indexedDBStorage.getMistakes();
    const now = Date.now();

    const items: DailyTrainingItem[] = [];

    // 1. Add Due Personal Game Mistakes
    const dueMistakes = mistakes
      .filter(m => m.nextReviewAt <= now)
      .slice(0, 3);

    dueMistakes.forEach(m => {
      items.push({
        id: `tr_${m.id}`,
        type: 'PERSONAL_MISTAKE',
        fen: m.fen,
        title: 'Replay & Correct Personal Mistake',
        openingName: m.openingName,
        variationName: m.variationName,
        prompt: `You played ${m.userMove} in a real game. What is the top engine recommendation here?`,
        userColor: 'white',
        expectedMove: m.recommendedMove,
        mistakeRecord: m,
      });
    });

    // 2. Add Curated Opening Theory Positions (Italian Game & Caro-Kann)
    const italianGame = OPENINGS_DATABASE.find(o => o.id === 'italian-game');
    if (italianGame) {
      items.push({
        id: 'tr_italian_c3',
        type: 'WEAK_OPENING',
        fen: 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        title: 'Italian Game: Classical Pawn Center',
        openingName: 'Italian Game',
        variationName: 'Giuoco Piano',
        prompt: 'White wants to build a dominant two-pawn center. What is the key move?',
        userColor: 'white',
        expectedMove: 'c3',
      });
    }

    const caroKann = OPENINGS_DATABASE.find(o => o.id === 'caro-kann');
    if (caroKann) {
      items.push({
        id: 'tr_caro_c5',
        type: 'ENGINE_CHALLENGE',
        fen: 'rn1qkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 4',
        title: 'Caro-Kann Advance: Central Pawn Break',
        openingName: 'Caro-Kann Defense',
        variationName: 'Advance Variation',
        prompt: "Black needs to challenge White's central space advantage. Find the strongest engine move.",
        userColor: 'black',
        expectedMove: 'c5',
      });
    }

    return {
      date: new Date().toISOString().split('T')[0],
      items,
      estimatedMinutes: Math.max(items.length * 2, 5),
      focusArea: dueMistakes.length > 0 ? 'Personal Game Blunders & Pawn Break Timing' : 'Caro-Kann & Italian Core Theory',
    };
  }
}

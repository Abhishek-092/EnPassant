import { Chess } from 'chess.js';

export interface OpeningVariation {
  id: string;
  name: string;
  eco: string;
  moves: string[];
  description: string;
  keyPlans: string[];
  commonMistakes: string[];
  pawnBreaks: string[];
}

export interface OpeningDefinition {
  id: string;
  name: string;
  side: 'white' | 'black';
  eco: string;
  description: string;
  mainIdeas: string[];
  variations: OpeningVariation[];
  initialFen: string;
  startingMoves: string[];
}

export const OPENINGS_DATABASE: OpeningDefinition[] = [
  {
    id: 'italian-game',
    name: 'Italian Game',
    side: 'white',
    eco: 'C50',
    description: 'A classic 1.e4 opening focusing on rapid kingside development and immediate pressure on Black’s vulnerable f7 square.',
    mainIdeas: [
      'Control the d4 and e5 central squares',
      'Target Black’s weak f7 pawn with Bc4',
      'Prepare c3 and d4 pawn push for total center dominance',
    ],
    initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    startingMoves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'],
    variations: [
      {
        id: 'italian-giuoco-piano',
        name: 'Giuoco Piano',
        eco: 'C53',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd4'],
        description: 'The Quiet Game where White builds a strong classical pawn center with c3 and d4.',
        keyPlans: ['Build a two-pawn center with c3 and d4', 'Castle early', 'Maintain bishop on c4 or b3'],
        commonMistakes: ['Delaying d4 allowing Black easy equality', 'Allowing ...d5 break unhindered'],
        pawnBreaks: ['d4', 'c3'],
      },
      {
        id: 'italian-evans-gambit',
        name: 'Evans Gambit',
        eco: 'C51',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4', 'Bxb4', 'c3', 'Ba5', 'd4'],
        description: 'An aggressive pawn sacrifice to open central lines and gain rapid development advantages.',
        keyPlans: ['Sacrifice b4 pawn to gain time', 'Build immediate c3-d4 center', 'Create dark-squared diagonal threats with Qb3'],
        commonMistakes: ['Playing passively after b4', 'Failing to maintain initiative'],
        pawnBreaks: ['d4', 'b4'],
      },
    ],
  },
  {
    id: 'caro-kann',
    name: 'Caro-Kann Defense',
    side: 'black',
    eco: 'B12',
    description: 'A rock-solid response to 1.e4 preparing the ...d5 pawn break while keeping Black’s light-squared bishop unblocked.',
    mainIdeas: [
      'Prepare ...d5 break with 1...c6',
      'Develop light-squared bishop Bf5 or Bg4 before playing ...e6',
      'Challenge White’s central space with ...c5 break in Advance lines',
    ],
    initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    startingMoves: ['e4', 'c6', 'd4', 'd5'],
    variations: [
      {
        id: 'caro-kann-advance',
        name: 'Advance Variation',
        eco: 'B12',
        moves: ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5'],
        description: 'White gains space with 5.e5. Black responds by placing the bishop outside the pawn chain on f5.',
        keyPlans: ['Develop Bf5 before ...e6', 'Counterattack White’s d4 pawn with ...c5 break', 'Target the base of White’s pawn chain'],
        commonMistakes: ['Playing ...e6 before developing Bf5', 'Delaying the ...c5 central pawn break'],
        pawnBreaks: ['c5', 'f6'],
      },
      {
        id: 'caro-kann-classical',
        name: 'Classical Variation',
        eco: 'B18',
        moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'],
        description: 'Black liquidates White’s central pawn and develops the bishop cleanly to f5.',
        keyPlans: ['Trade off central pawn on e4', 'Structure light-square defense with ...e6 and ...h6', 'Castle queenside or kingside solidly'],
        commonMistakes: ['Allowing Ng3 to trap the f5 bishop', 'Weakening the e6 pawn structure'],
        pawnBreaks: ['c5'],
      },
    ],
  },
  {
    id: 'london-system',
    name: 'London System',
    side: 'white',
    eco: 'D02',
    description: 'A scheme-based opening for White with Bf4, e3, c3, and Nf3 providing solid positional foundations.',
    mainIdeas: ['Establish early Bf4 control', 'Build c3-d4-e3 pyramid structure', 'Prepare Ne5 outpost'],
    initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    startingMoves: ['d4', 'd5', 'Nf3', 'Nf6', 'Bf4'],
    variations: [
      {
        id: 'london-main',
        name: 'Main Line London',
        eco: 'D02',
        moves: ['d4', 'd5', 'Nf3', 'Nf6', 'Bf4', 'e6', 'e3', 'c5', 'c3'],
        description: 'The rock-solid pyramid structure defending against Black’s c5 pressure.',
        keyPlans: ['Maintain dark-squared bishop on f4/bg3', 'Anchor Ne5', 'Launch kingside attack with h4-g4 if Black castles early'],
        commonMistakes: ['Allowing Black Qb6 to trap b2 pawn without c3', 'Losing the f4 bishop for nothing'],
        pawnBreaks: ['e4', 'c4'],
      },
    ],
  },
  {
    id: 'sicilian-defense',
    name: 'Sicilian Defense',
    side: 'black',
    eco: 'B20',
    description: 'The most popular and combative counter to 1.e4, fighting for asymmetry and c-file counterplay.',
    mainIdeas: ['Trade c-pawn for White’s central d-pawn', 'Use semi-open c-file for queenside counterplay', 'Control d5 square'],
    initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    startingMoves: ['e4', 'c5'],
    variations: [
      {
        id: 'sicilian-najdorf',
        name: 'Najdorf Variation',
        eco: 'B90',
        moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'],
        description: 'Flexible 5...a6 preventing Nb5 and preparing b5 queenside expansion.',
        keyPlans: ['Expand on queenside with ...b5', 'Control d5 square', 'Prepare ...e5 or ...e6 central pawn strike'],
        commonMistakes: ['Neglecting kingside defense', 'Delaying castling under heavy White attack'],
        pawnBreaks: ['d5', 'b5'],
      },
    ],
  },
];

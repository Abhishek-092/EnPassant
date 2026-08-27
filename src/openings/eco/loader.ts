import { EcoOpeningRecord } from './types';
import { EcoNormalizer } from './normalizer';

const RAW_ECO_DATASET: Array<Partial<EcoOpeningRecord>> = [
  // A00 - A99 (Flank Openings & King's Indian Systems)
  { eco: 'A00', name: 'Irregular Openings', moves: ['g3'], category: 'Flank Openings' },
  { eco: 'A04', name: 'Reti Opening', aliases: ['Reti System'], moves: ['Nf3', 'd5', 'c4'], category: 'Flank Openings' },
  { eco: 'A10', name: 'English Opening', aliases: ['English'], moves: ['c4'], category: 'Flank Openings' },
  { eco: 'A20', name: 'English Opening: King\'s English', moves: ['c4', 'e5'], category: 'Flank Openings' },
  { eco: 'A45', name: 'Trompowsky Attack', moves: ['d4', 'Nf6', 'Bg5'], category: 'Queen\'s Pawn' },
  { eco: 'A48', name: 'King\'s Indian Attack', moves: ['Nf3', 'Nf6', 'g3'], category: 'Flank Openings' },
  { eco: 'A80', name: 'Dutch Defense', aliases: ['Dutch'], moves: ['d4', 'f5'], category: 'Queen\'s Pawn' },

  // B00 - B99 (Semi-Open Games: Caro-Kann, Sicilian, French)
  { eco: 'B01', name: 'Scandinavian Defense', aliases: ['Center Counter'], moves: ['e4', 'd5'], category: 'Semi-Open Games' },
  { eco: 'B07', name: 'Pirc Defense', aliases: ['Pirc'], moves: ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6'], category: 'Semi-Open Games' },
  { eco: 'B10', name: 'Caro-Kann Defense', aliases: ['Caro Kann', 'Caro'], moves: ['e4', 'c6'], category: 'Semi-Open Games' },
  { eco: 'B12', name: 'Caro-Kann Defense: Advance Variation', variation: 'Advance Variation', moves: ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5'], category: 'Semi-Open Games' },
  { eco: 'B18', name: 'Caro-Kann Defense: Classical Variation', variation: 'Classical Variation', moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'], category: 'Semi-Open Games' },
  { eco: 'B20', name: 'Sicilian Defense', aliases: ['Sicilian'], moves: ['e4', 'c5'], category: 'Semi-Open Games' },
  { eco: 'B22', name: 'Sicilian Defense: Alapin Variation', variation: 'Alapin Variation', moves: ['e4', 'c5', 'c3'], category: 'Semi-Open Games' },
  { eco: 'B30', name: 'Sicilian Defense: Old Sicilian', moves: ['e4', 'c5', 'Nf3', 'Nc6'], category: 'Semi-Open Games' },
  { eco: 'B90', name: 'Sicilian Defense: Najdorf Variation', aliases: ['Najdorf'], variation: 'Najdorf Variation', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'], category: 'Semi-Open Games' },
  { eco: 'B40', name: 'French Defense', aliases: ['French'], moves: ['e4', 'e6'], category: 'Semi-Open Games' },
  { eco: 'B42', name: 'French Defense: Advance Variation', variation: 'Advance Variation', moves: ['e4', 'e6', 'd4', 'd5', 'e5'], category: 'Semi-Open Games' },
  { eco: 'B43', name: 'French Defense: Exchange Variation', variation: 'Exchange Variation', moves: ['e4', 'e6', 'd4', 'd5', 'exd5', 'exd5'], category: 'Semi-Open Games' },
  { eco: 'B44', name: 'French Defense: Winawer Variation', variation: 'Winawer Variation', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4'], category: 'Semi-Open Games' },

  // C00 - C99 (Open Games: Ruy Lopez, Italian, Vienna, Scotch)
  { eco: 'C20', name: 'King\'s Pawn Game', moves: ['e4', 'e5'], category: 'Open Games' },
  { eco: 'C22', name: 'Vienna Game', aliases: ['Vienna'], moves: ['e4', 'e5', 'Nc3'], category: 'Open Games' },
  { eco: 'C45', name: 'Scotch Game', aliases: ['Scotch'], moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'], category: 'Open Games' },
  { eco: 'C50', name: 'Italian Game', aliases: ['Italian'], moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'], category: 'Open Games' },
  { eco: 'C53', name: 'Italian Game: Giuoco Piano', variation: 'Giuoco Piano', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd4'], category: 'Open Games' },
  { eco: 'C51', name: 'Italian Game: Evans Gambit', variation: 'Evans Gambit', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4'], category: 'Open Games' },
  { eco: 'C60', name: 'Ruy Lopez', aliases: ['Spanish Opening', 'Spanish'], moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'], category: 'Open Games' },
  { eco: 'C65', name: 'Ruy Lopez: Berlin Defense', variation: 'Berlin Defense', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6'], category: 'Open Games' },
  { eco: 'C88', name: 'Ruy Lopez: Closed Variation', variation: 'Closed Variation', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7'], category: 'Open Games' },

  // D00 - D99 (Closed Games: Queen's Gambit, London System, Slav)
  { eco: 'D00', name: 'Queen\'s Pawn Game', moves: ['d4', 'd5'], category: 'Closed Games' },
  { eco: 'D02', name: 'London System', aliases: ['London'], moves: ['d4', 'd5', 'Nf3', 'Nf6', 'Bf4'], category: 'Closed Games' },
  { eco: 'D06', name: 'Queen\'s Gambit', aliases: ['Queens Gambit'], moves: ['d4', 'd5', 'c4'], category: 'Closed Games' },
  { eco: 'D30', name: 'Queen\'s Gambit Declined', aliases: ['QGD'], moves: ['d4', 'd5', 'c4', 'e6'], category: 'Closed Games' },
  { eco: 'D10', name: 'Slav Defense', aliases: ['Slav'], moves: ['d4', 'd5', 'c4', 'c6'], category: 'Closed Games' },

  // E00 - E99 (Indian Defenses: King's Indian, Nimzo-Indian)
  { eco: 'E20', name: 'Nimzo-Indian Defense', aliases: ['Nimzo Indian', 'Nimzo'], moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'], category: 'Indian Defenses' },
  { eco: 'E60', name: 'King\'s Indian Defense', aliases: ['Kings Indian', 'KID'], moves: ['d4', 'Nf6', 'c4', 'g6'], category: 'Indian Defenses' },
  { eco: 'E61', name: 'King\'s Indian Defense: Classical Variation', variation: 'Classical Variation', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O'], category: 'Indian Defenses' },
  { eco: 'E76', name: 'King\'s Indian Defense: Four Pawns Attack', variation: 'Four Pawns Attack', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'f4'], category: 'Indian Defenses' },
];

export class EcoLoader {
  private static cachedRecords: EcoOpeningRecord[] | null = null;

  public static loadNormalizedRecords(): EcoOpeningRecord[] {
    if (this.cachedRecords) return this.cachedRecords;

    const validated: EcoOpeningRecord[] = [];
    for (const raw of RAW_ECO_DATASET) {
      const normalized = EcoNormalizer.normalizeRecord(raw);
      if (normalized) {
        validated.push(normalized);
      }
    }

    this.cachedRecords = validated;
    return validated;
  }
}

import { Chess } from 'chess.js';
import { EcoOpeningRecord } from '../eco/types';
import { GeneratedCourse, CourseModule, CoursePosition } from './types';

export class CourseGenerator {
  public static generateCourseForOpening(
    record: EcoOpeningRecord,
    userRating: number = 1500
  ): GeneratedCourse {
    const level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' =
      userRating < 1100 ? 'BEGINNER' : userRating < 1600 ? 'INTERMEDIATE' : 'ADVANCED';

    const chess = new Chess();
    const positions: CoursePosition[] = [];

    // Replay opening move sequence to generate curriculum positions
    for (let i = 0; i < record.moves.length; i++) {
      const move = record.moves[i];
      const fenBefore = chess.fen();
      chess.move(move);

      // Determine position classification
      let posType: CoursePosition['positionType'] = 'CORE';
      let prompt = `Find the key move '${move}' in ${record.name}.`;
      let hint = `Focus on controlling key squares in the center.`;

      if (move.includes('c5') || move.includes('d5') || move.includes('c4') || move.includes('d4')) {
        posType = 'PAWN_BREAK';
        prompt = `Execute the central pawn break '${move}' to challenge White's space.`;
        hint = `Pawn breaks on the central files undermine your opponent's pawn structure.`;
      } else if (i === record.moves.length - 1) {
        posType = 'MIDDLEGAME_TRANSITION';
        prompt = `Complete opening setup with '${move}' and transition into middlegame planning.`;
        hint = `Coordinate your minor pieces before launching central strikes.`;
      }

      const importanceScore = Math.max(100 - i * 5, 40);

      positions.push({
        id: `pos_${record.eco}_${i}`,
        fen: fenBefore,
        moveSan: move,
        importanceScore,
        positionType: posType,
        prompt,
        hint,
        moveIndex: i,
      });
    }

    // Filter depth based on user rating level
    const maxPositions = level === 'BEGINNER' ? 4 : level === 'INTERMEDIATE' ? 8 : 12;
    const selectedPositions = positions.slice(0, maxPositions);

    const modules: CourseModule[] = [
      {
        id: `mod_core_${record.eco}`,
        title: 'Module 1: Core Setup & Starting Moves',
        description: `Learn the main moves and initial setup for ${record.name}.`,
        positions: selectedPositions.filter(p => p.positionType === 'CORE'),
      },
      {
        id: `mod_breaks_${record.eco}`,
        title: 'Module 2: Essential Pawn Breaks & Transitions',
        description: `Master pawn breaks and transition smoothly into middlegame planning.`,
        positions: selectedPositions.filter(p => p.positionType !== 'CORE'),
      },
    ];

    return {
      id: `course_${record.eco}_${record.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      eco: record.eco,
      title: `${record.name} Mastery Course`,
      description: `Comprehensive opening course for ${record.name} (${record.eco}). Master core plans, traps, and top Stockfish engine lines.`,
      targetRatingLevel: level,
      modules: modules.filter(m => m.positions.length > 0),
      totalPositionsCount: selectedPositions.length,
      color: record.color,
    };
  }
}

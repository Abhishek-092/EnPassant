export interface CoursePosition {
  id: string;
  fen: string;
  moveSan: string;
  importanceScore: number;
  positionType:
    | 'CORE'
    | 'COMMON_RESPONSE'
    | 'CRITICAL_RESPONSE'
    | 'TRAP'
    | 'PAWN_BREAK'
    | 'MIDDLEGAME_TRANSITION'
    | 'PERSONAL_WEAKNESS';
  prompt: string;
  hint: string;
  moveIndex: number;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  positions: CoursePosition[];
}

export interface GeneratedCourse {
  id: string;
  eco: string;
  title: string;
  description: string;
  targetRatingLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  modules: CourseModule[];
  totalPositionsCount: number;
  color: 'WHITE' | 'BLACK' | 'BOTH';
}

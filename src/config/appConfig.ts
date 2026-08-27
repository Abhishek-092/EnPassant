export interface AppConfig {
  engine: {
    defaultProfile: 'TRAINING';
    defaultMultiPv: number;
    workerScriptPath: string;
    engineName: string;
    engineVersion: string;
  };
  spacedRepetition: {
    initialIntervalDays: number;
    defaultEaseFactor: number;
    minimumEaseFactor: number;
  };
  sync: {
    maxGamesPerSync: number;
    supportedPlatforms: ('chesscom' | 'lichess' | 'pgn')[];
  };
  training: {
    defaultRating: number;
    maxDailyPositions: number;
  };
}

export const APP_CONFIG: AppConfig = {
  engine: {
    defaultProfile: 'TRAINING',
    defaultMultiPv: 3,
    workerScriptPath: '/stockfish.js',
    engineName: 'Stockfish 18',
    engineVersion: '18.0-stable',
  },
  spacedRepetition: {
    initialIntervalDays: 1,
    defaultEaseFactor: 2.5,
    minimumEaseFactor: 1.3,
  },
  sync: {
    maxGamesPerSync: 15,
    supportedPlatforms: ['chesscom', 'lichess', 'pgn'],
  },
  training: {
    defaultRating: 1500,
    maxDailyPositions: 10,
  },
};

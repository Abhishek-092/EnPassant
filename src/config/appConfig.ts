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
    /** Games pulled on a fresh sync. */
    initialGamesPerSync: number;
    /** Games pulled per "load more" page. */
    loadMoreBatchSize: number;
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
    initialGamesPerSync: 50,
    loadMoreBatchSize: 25,
    supportedPlatforms: ['chesscom', 'lichess', 'pgn'],
  },
  training: {
    defaultRating: 1500,
    maxDailyPositions: 10,
  },
};

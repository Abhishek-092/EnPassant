import { EngineConfiguration, SearchProfileName } from './types';

export function getDeviceHardwareConcurrency(): number {
  if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
    return Math.max(1, navigator.hardwareConcurrency);
  }
  return 2; // Safe default
}

/**
 * Every profile carries a wall-clock ceiling alongside its depth target. Depth alone makes search
 * time unpredictable — the same depth can take 80ms in a quiet position and 4 seconds in a sharp
 * one — and an interactive board cannot afford that variance.
 */
export function getSearchProfileConfiguration(
  profile: SearchProfileName,
  customMultiPv?: number
): EngineConfiguration {
  const cores = getDeviceHardwareConcurrency();
  const safeThreads = Math.min(Math.max(1, cores - 1), 4);

  switch (profile) {
    case 'FAST':
      return {
        searchMode: 'FAST',
        depth: 10,
        movetime: 200,
        multiPv: customMultiPv || 1,
        threads: 1,
        hash: 16,
        skillLevel: 20,
      };
    case 'TRAINING':
      return {
        searchMode: 'TRAINING',
        depth: 14,
        movetime: 700,
        multiPv: customMultiPv || 3,
        threads: safeThreads,
        hash: 32,
        skillLevel: 20,
      };
    case 'DEEP':
      return {
        searchMode: 'DEEP',
        depth: 18,
        movetime: 2500,
        multiPv: customMultiPv || 3,
        threads: safeThreads,
        hash: 64,
        skillLevel: 20,
      };
    case 'MAXIMUM':
      return {
        searchMode: 'MAXIMUM',
        depth: 22,
        movetime: 6000,
        multiPv: customMultiPv || 3,
        threads: safeThreads,
        hash: 128,
        skillLevel: 20,
      };
  }
}

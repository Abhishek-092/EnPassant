import { EngineConfiguration, SearchProfileName } from './types';

export function getDeviceHardwareConcurrency(): number {
  if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
    return Math.max(1, navigator.hardwareConcurrency);
  }
  return 2; // Safe default
}

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
        depth: 12,
        multiPv: customMultiPv || 1,
        threads: 1,
        hash: 16,
      };
    case 'TRAINING':
      return {
        searchMode: 'TRAINING',
        depth: 16,
        multiPv: customMultiPv || 3,
        threads: safeThreads,
        hash: 32,
      };
    case 'DEEP':
      return {
        searchMode: 'DEEP',
        depth: 20,
        multiPv: customMultiPv || 3,
        threads: safeThreads,
        hash: 64,
      };
    case 'MAXIMUM':
      return {
        searchMode: 'MAXIMUM',
        depth: 24,
        multiPv: customMultiPv || 3,
        threads: safeThreads,
        hash: 128,
      };
  }
}

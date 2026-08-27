import { stockfishClient } from './stockfishClient';
import { EngineVerificationState } from './types';

export class EngineVerifier {
  public static async verifyRuntimeState(): Promise<EngineVerificationState> {
    const status = stockfishClient.getVerificationStatus();
    return {
      loaded: status.loaded,
      uciInitialized: status.uciInitialized,
      ready: status.ready,
      analyzedPosition: status.engineVerified,
      engineVerified: status.engineVerified,
      engineName: status.engineName,
      engineVersion: status.engineVersion,
    };
  }
}

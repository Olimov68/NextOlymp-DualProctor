import { useEffect, useRef } from 'react';
import { useContestStore } from '../store/useContestStore';
import { ExamGuard } from '../services/examGuardService';

export interface UseAntiCheatOptions {
  olympiadId?: string;
  sessionId?: string;
  olympiadTitle?: string;
  maxViolations?: number;
  requireFullscreen?: boolean;
  blockTabSwitch?: boolean;
  blockCopyPaste?: boolean;
  blockDevTools?: boolean;
  heartbeatEnabled?: boolean;
  heartbeatIntervalSec?: number;
  onCaptureSnapshot?: () => string | undefined;
}

export function useAntiCheat(isActive: boolean, options: UseAntiCheatOptions = {}) {
  const recordGuardViolation = useContestStore((state) => state.recordGuardViolation);
  const disqualifyContest = useContestStore((state) => state.disqualifyContest);
  const guardRef = useRef<ExamGuard | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (guardRef.current) {
        guardRef.current.destroy();
        guardRef.current = null;
      }
      return;
    }

    const guard = new ExamGuard({
      maxViolations: options.maxViolations || 3,
      olympiadId: options.olympiadId,
      sessionId: options.sessionId,
      olympiadTitle: options.olympiadTitle,
      requireFullscreen: options.requireFullscreen ?? true,
      blockTabSwitch: options.blockTabSwitch ?? true,
      blockCopyPaste: options.blockCopyPaste ?? true,
      blockDevTools: options.blockDevTools ?? true,
      heartbeatEnabled: options.heartbeatEnabled ?? true,
      heartbeatIntervalSec: options.heartbeatIntervalSec ?? 10,
      onViolation: (type, data) => {
        const snap = options.onCaptureSnapshot ? options.onCaptureSnapshot() : undefined;
        // ExamGuard already persisted this event; never send/count it a second time.
        useContestStore.setState({ violationCount: data.count, maxViolations: data.max,
          latestViolationType: type, latestViolationMessage: data.message, showAntiCheatModal: true });
      },
      onDisqualify: (reason) => {
        disqualifyContest(reason);
      },
    });

    guardRef.current = guard;

    return () => {
      guard.destroy();
      guardRef.current = null;
    };
  }, [
    isActive,
    options.olympiadId,
    options.sessionId,
    options.heartbeatEnabled,
    options.heartbeatIntervalSec,
    options.olympiadTitle,
    options.maxViolations,
    options.requireFullscreen,
    options.blockTabSwitch,
    options.blockCopyPaste,
    options.blockDevTools,
    options.onCaptureSnapshot,
    recordGuardViolation,
    disqualifyContest
  ]);
}


import { useEffect, useRef } from 'react';
import { useContestStore } from '../store/useContestStore';
import { ExamGuard } from '../services/examGuardService';

export interface UseAntiCheatOptions {
  olympiadId?: string;
  olympiadTitle?: string;
  maxViolations?: number;
  requireFullscreen?: boolean;
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
      olympiadTitle: options.olympiadTitle,
      requireFullscreen: options.requireFullscreen ?? true,
      onViolation: (type, data) => {
        const snap = options.onCaptureSnapshot ? options.onCaptureSnapshot() : undefined;
        recordGuardViolation(type, data.message, data.max, snap);
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
  }, [isActive, options.olympiadId, options.olympiadTitle, options.maxViolations, options.requireFullscreen, options.onCaptureSnapshot, recordGuardViolation, disqualifyContest]);
}


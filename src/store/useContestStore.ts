import { create } from 'zustand';
import { Question } from '../types';
import { useProctoringStore } from './useProctoringStore';
import { useAuthStore } from './useAuthStore';
import { submissionService } from '../services/submissionService';
import { apiClient } from '../services/api';

export interface IncidentLog {
  id: string;
  type: string;
  detail: string;
  timestamp: string;
  snapshotUrl?: string;
  count: number;
  severity: 'O\'rta' | 'Yuqori' | 'Kritik';
  status: 'pending' | 'warned' | 'penalized' | 'disqualified';
}

interface ContestState {
  olympiadId: string | null;
  sessionId: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string | string[]>;
  tabSwitchCount: number;
  violationCount: number;
  maxViolations: number;
  latestViolationMessage: string;
  latestViolationType: string;
  showAntiCheatModal: boolean;
  isDisqualified: boolean;
  disqualifyReason: string;
  timeRemainingSeconds: number;
  serverExpiresAt: number;
  serverOffsetMs: number;
  isTimerRunning: boolean;
  isSubmitted: boolean;
  capturedIncidents: IncidentLog[];

  startContest: (olympiadId: string, questions: Question[], session: { sessionId: string; expiresAt: number; serverTime: number; timeRemainingSeconds: number; answers?: Record<string, string> }) => void;
  setAnswer: (questionId: string, answer: string | string[]) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  incrementTabSwitch: (snapshotUrl?: string) => void;
  recordGuardViolation: (type: string, message: string, max?: number, snapshotUrl?: string) => void;
  disqualifyContest: (reason: string) => void;
  closeAntiCheatModal: () => void;
  tickTimer: () => void;
  submitContest: () => void;
  resetContest: () => void;
}

export const useContestStore = create<ContestState>((set, get) => ({
  olympiadId: null,
  sessionId: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  tabSwitchCount: 0,
  violationCount: 0,
  maxViolations: 3,
  latestViolationMessage: '',
  latestViolationType: '',
  showAntiCheatModal: false,
  isDisqualified: false,
  disqualifyReason: '',
  timeRemainingSeconds: 0,
  serverExpiresAt: 0,
  serverOffsetMs: 0,
  isTimerRunning: false,
  isSubmitted: false,
  capturedIncidents: [],

  startContest: (olympiadId, questions, session) => {
    set({
      olympiadId, questions, sessionId: session.sessionId, currentQuestionIndex: 0,
      answers: session.answers ?? {}, tabSwitchCount: 0, violationCount: 0,
      showAntiCheatModal: false, isDisqualified: false, disqualifyReason: '',
      timeRemainingSeconds: session.timeRemainingSeconds, serverExpiresAt: session.expiresAt,
      serverOffsetMs: Date.now() - session.serverTime, isTimerRunning: true,
      isSubmitted: false, capturedIncidents: [],
    });
  },

  setAnswer: (questionId, answer) => {
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    }));
  },

  nextQuestion: () => {
    set((state) => ({
      currentQuestionIndex: Math.min(state.questions.length - 1, state.currentQuestionIndex + 1),
    }));
  },

  prevQuestion: () => {
    set((state) => ({
      currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1),
    }));
  },

  goToQuestion: (index) => {
    set({ currentQuestionIndex: index });
  },

  incrementTabSwitch: () => get().recordGuardViolation('TAB_SWITCH', 'Brauzer oynasi almashtirildi'),
  recordGuardViolation: (type, message, max = 3, snapshotUrl?: string) => {
    const { sessionId, olympiadId } = get();
    if (!sessionId || !olympiadId) return;
    const eventType = ({ NO_FACE_DETECTED: 'NO_FACE', MULTIPLE_FACES_DETECTED: 'MULTIPLE_FACES',
      LOOKING_AWAY: 'GAZE_AWAY', MULTIPLE_SPEAKERS_DETECTED: 'MULTIPLE_SPEAKERS' } as Record<string, string>)[type] ?? type;
    const eventId = crypto.randomUUID();
    const sendEvidence = async () => {
      if (!snapshotUrl || !['NO_FACE', 'MULTIPLE_FACES'].includes(eventType)) return;
      try {
        await apiClient.post('/exams/' + encodeURIComponent(olympiadId) + '/snapshot', {
          sessionId, eventType, imageBase64: snapshotUrl,
        });
      } catch { console.warn('Snapshot serverda saqlanmadi; hodisa alohida yuboriladi.'); }
    };
    void sendEvidence().then(() => apiClient.post('/exams/' + encodeURIComponent(olympiadId) + '/proctor-events', {
      eventId, sessionId, eventType, details: message,
    })).then(response => {
      if (get().sessionId !== sessionId) return;
      set(state => ({
        violationCount: response.violationCount, maxViolations: response.maxViolationsAllowed ?? max,
        latestViolationMessage: message, latestViolationType: type, showAntiCheatModal: response.ruleEnabled,
        capturedIncidents: [{ id: eventId, type, detail: message, timestamp: new Date().toISOString(),
          count: response.violationCount, severity: "O'rta" as const, status: 'pending' as const },
          ...state.capturedIncidents].slice(0, 100),
      }));
      if (response.isDisqualified) get().disqualifyContest(response.message);
    }).catch(error => {
      set({ latestViolationMessage: 'Hodisa serverga yetib bormadi. Internetni tekshiring.', showAntiCheatModal: true });
    });
  },

  disqualifyContest: (reason) => {
    set({
      isDisqualified: true,
      disqualifyReason: reason,
      isTimerRunning: false,
      isSubmitted: true,
    });
  },

  closeAntiCheatModal: () => {
    set({ showAntiCheatModal: false });
  },

  tickTimer: () => {
    const { serverExpiresAt, serverOffsetMs, isSubmitted } = get();
    if (isSubmitted) return;

    if (serverExpiresAt > 0) {
      const serverNow = Date.now() - serverOffsetMs;
      const remainingSec = Math.max(0, Math.floor((serverExpiresAt - serverNow) / 1000));

      if (remainingSec <= 0) {
        set({ timeRemainingSeconds: 0, isTimerRunning: false });
        const { sessionId, olympiadId } = get();
        if (sessionId && olympiadId) void apiClient.post('/exams/' + encodeURIComponent(olympiadId) + '/finish', { sessionId })
          .then(() => { if (get().sessionId === sessionId) get().submitContest(); })
          .catch(() => set({ latestViolationMessage: 'Vaqt tugadi. Natijani serverdan olish uchun Yakunlash tugmasini qayta bosing.', showAntiCheatModal: true }));
      } else {
        set({ timeRemainingSeconds: remainingSec });
      }
    } else {
      const current = get().timeRemainingSeconds;
      if (current <= 1) {
        set({ timeRemainingSeconds: 0, isTimerRunning: false });
        get().submitContest();
      } else {
        set({ timeRemainingSeconds: current - 1 });
      }
    }
  },

  submitContest: () => {
    set({ isTimerRunning: false, isSubmitted: true });
  },

  resetContest: () => {
    set({
      olympiadId: null,
      sessionId: null,
      serverExpiresAt: 0,
      serverOffsetMs: 0,
      capturedIncidents: [],
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      tabSwitchCount: 0,
      violationCount: 0,
      maxViolations: 3,
      latestViolationMessage: '',
      latestViolationType: '',
      showAntiCheatModal: false,
      isDisqualified: false,
      disqualifyReason: '',
      timeRemainingSeconds: 0,
      isTimerRunning: false,
      isSubmitted: false,
    });
  }
}));

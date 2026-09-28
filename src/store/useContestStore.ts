import { create } from 'zustand';
import { Question } from '../types';
import { useProctoringStore } from './useProctoringStore';
import { useNotificationStore } from './useNotificationStore';
import { useAuthStore } from './useAuthStore';
import { ServerExamEngine, ServerSyncResponse } from '../services/serverExamEngine';
import { submissionService } from '../services/submissionService';

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

  startContest: (olympiadId: string, questions: Question[], durationMinutes: number) => void;
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

  startContest: (olympiadId, questions, durationMinutes) => {
    const user = useAuthStore.getState().user;
    const userId = user?.id || 'usr-student';
    
    
    const syncRes: ServerSyncResponse = ServerExamEngine.startSession(userId, olympiadId, durationMinutes);
    const clientNow = Date.now();
    const serverOffset = clientNow - syncRes.server_time;

    set({
      olympiadId,
      sessionId: syncRes.session_id,
      questions,
      currentQuestionIndex: 0,
      answers: {},
      tabSwitchCount: 0,
      violationCount: 0,
      showAntiCheatModal: false,
      isDisqualified: false,
      disqualifyReason: '',
      timeRemainingSeconds: syncRes.time_remaining_sec,
      serverExpiresAt: syncRes.expires_at,
      serverOffsetMs: serverOffset,
      isTimerRunning: true,
      isSubmitted: false,
      capturedIncidents: [],
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

  incrementTabSwitch: (snapshotUrl?: string) => {
    const nextCount = get().tabSwitchCount + 1;
    const newIncident: IncidentLog = {
      id: `INC-TAB-${Date.now()}`,
      type: 'TAB_SWITCH',
      detail: `Brauzer oynasi almashtirildi (${nextCount}-marta)`,
      timestamp: new Date().toLocaleTimeString(),
      snapshotUrl,
      count: nextCount,
      severity: nextCount >= 3 ? 'Kritik' : nextCount === 2 ? 'Yuqori' : 'O\'rta',
      status: nextCount >= 3 ? 'penalized' : 'warned',
    };

    set((state) => ({
      tabSwitchCount: nextCount,
      violationCount: state.violationCount + 1,
      latestViolationMessage: `Brauzer oynasi almashtirildi (${nextCount}-marta)`,
      latestViolationType: 'TAB_SWITCH',
      showAntiCheatModal: true,
      capturedIncidents: [newIncident, ...state.capturedIncidents],
    }));

    const currentUser = useAuthStore.getState().user;
    const olympiadId = get().olympiadId || 'olymp-math-2026';

    useProctoringStore.getState().addFlag({
      user: currentUser?.fullName || 'Ishtirokchi',
      userEmail: currentUser?.email || '',
      olympiad: olympiadId === 'olymp-math-2026' ? 'Respublika Matematika II Bosqich' : 'Musobaqa',
      category: 'Oyna & Brauzer',
      type: 'Tab switching',
      detail: `Brauzer oynasi almashtirildi (${nextCount}-marta)`,
      severity: nextCount >= 3 ? 'Kritik' : nextCount === 2 ? 'Yuqori' : 'O\'rta',
    });

    useNotificationStore.getState().addNotification({
      title: `${currentUser?.fullName || 'Ishtirokchi'}: Tab switching`,
      desc: `Musobaqada ${nextCount}-marta oyna almashtirildi`,
      type: 'warning',
    });
  },

  recordGuardViolation: (type, message, max = 3, snapshotUrl?: string) => {
    const isTabOrFocus = type === 'TAB_SWITCH' || type === 'WINDOW_BLUR' || type === 'EXIT_FULLSCREEN';
    const nextTabCount = isTabOrFocus ? get().tabSwitchCount + 1 : Math.max(1, get().tabSwitchCount);
    const nextCount = get().violationCount + 1;

    const newIncident: IncidentLog = {
      id: `INC-${type}-${Date.now()}`,
      type,
      detail: message,
      timestamp: new Date().toLocaleTimeString(),
      snapshotUrl,
      count: nextCount,
      severity: nextCount >= max ? 'Kritik' : nextCount === 2 ? 'Yuqori' : 'O\'rta',
      status: nextCount >= max ? 'penalized' : 'pending',
    };

    set((state) => ({
      tabSwitchCount: nextTabCount,
      violationCount: nextCount,
      maxViolations: max,
      latestViolationType: type,
      latestViolationMessage: message,
      showAntiCheatModal: true,
      capturedIncidents: [newIncident, ...state.capturedIncidents],
    }));

    const currentUser = useAuthStore.getState().user;
    const olympiadId = get().olympiadId || 'olymp-current';

    
    try {
      const typeLabel =
        type === 'TAB_SWITCH' ? 'Brauzer oynasi almashtirildi (Tab Switch)' :
        type === 'WINDOW_BLUR' ? 'Oyna faolligi yo\'qoldi (Window Blur)' :
        type === 'EXIT_FULLSCREEN' ? 'To\'liq ekrandan chiqildi (Fullscreen Exit)' :
        type === 'NO_FACE_DETECTED' ? 'Kamera oldida yuz ko\'rinmadi (No Face)' :
        type === 'MULTIPLE_FACES_DETECTED' ? 'Kadrda begona shaxs aniqlandi' :
        type === 'LOOKING_AWAY' ? 'Monitordan chetga qarash holati' :
        type === 'CLIPBOARD_ACTION' ? 'Nusxa olish taqiqlandi' :
        type.includes('DEVTOOLS') ? 'Dasturchi paneli (DevTools) ochildi' : type;

      const formattedLog = {
        id: newIncident.id,
        studentId: currentUser?.id || 'usr-student',
        name: currentUser?.fullName || 'Ishtirokchi',
        phone: currentUser?.phone || '+998 90 123 45 67',
        ipAddress: '195.158.12.45',
        region: currentUser?.region || 'Toshkent sh.',
        school: currentUser?.school || 'Maktab',
        type: typeLabel,
        detail: message,
        count: nextCount,
        severity: newIncident.severity,
        timestamp: new Date().toLocaleString(),
        isOnline: true,
        snapshotUrl: snapshotUrl,
        status: 'pending'
      };

      
      submissionService.saveLiveCheatLog(olympiadId, formattedLog);

      
      fetch('/api/anticheat.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newIncident.id,
          studentId: currentUser?.id || 'usr-student',
          studentName: currentUser?.fullName || 'Ishtirokchi',
          studentEmail: currentUser?.email || '',
          studentPhone: currentUser?.phone || '',
          olympiadId,
          olympiadTitle: 'Olimpiada',
          eventType: typeLabel,
          details: message,
          severity: newIncident.severity,
          snapshotUrl: snapshotUrl,
          timestamp: new Date().toISOString()
        })
      }).catch((e) => console.warn('Anti-cheat API sync warning:', e));
    } catch (e) {
      console.error('Error saving live anticheat log:', e);
    }

    
    useProctoringStore.getState().addFlag({
      user: currentUser?.fullName || 'Ishtirokchi',
      userEmail: currentUser?.email || '',
      olympiad: olympiadId,
      category: isTabOrFocus ? 'Oyna & Brauzer' : 'Xavfsizlik & Anti-Cheat',
      type: type,
      detail: message,
      severity: nextCount >= max ? 'Kritik' : nextCount === 2 ? 'Yuqori' : 'O\'rta',
    });

    useNotificationStore.getState().addNotification({
      title: `${currentUser?.fullName || 'Ishtirokchi'}: ${type}`,
      desc: `${message} (${nextCount}/${max})`,
      type: 'warning',
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
        get().submitContest();
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

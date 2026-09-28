
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ProctorStudentSession,
  ProctorAlert,
  AntiCheatRules,
  INITIAL_PROCTOR_SESSIONS,
  INITIAL_PROCTOR_ALERTS,
  DEFAULT_ANTICHEAT_RULES,
} from '../data/initialProctoring';
import { useLeaderboardStore } from './useLeaderboardStore';

export interface AntiCheatFlag {
  id: string;
  user: string;
  userEmail?: string;
  olympiad: string;
  category: string;
  type: string;
  detail: string;
  severity: 'Kritik' | 'Yuqori' | 'O\'rta' | 'Past' | string;
  timestamp: string;
  status: 'pending' | 'resolved' | 'dismissed' | 'Approved' | 'Disqualified' | string;
}

interface ProctoringState {
  sessions: ProctorStudentSession[];
  alerts: ProctorAlert[];
  rules: AntiCheatRules;
  selectedSessionId: string | null;
  isLiveProctoringActive: boolean;
  listeningStudentId: string | null;
  audioVolumeMeter: number;
  autoProctorAi: boolean;

  
  flags: AntiCheatFlag[];
  addFlag: (flag: Omit<AntiCheatFlag, 'id' | 'timestamp' | 'status'>) => void;
  updateFlagStatus: (id: string, status: string) => void;

  setSelectedSessionId: (id: string | null) => void;
  setLiveProctoring: (v: boolean) => void;
  setAutoProctorAi: (v: boolean) => void;
  
  
  toggleListenAudio: (sessionId: string) => void;
  stopListeningAudio: () => void;
  setAudioVolumeMeter: (vol: number) => void;

  
  sendWarning: (sessionId: string, message: string) => void;
  applyPenalty: (sessionId: string, penaltyXP: number, reason: string) => void;
  pauseExam: (sessionId: string) => void;
  resumeExam: (sessionId: string) => void;
  disqualifyStudent: (sessionId: string, reason: string) => void;

  
  addLiveAlert: (alert: Omit<ProctorAlert, 'id' | 'timestamp'>) => void;
  resolveAlert: (alertId: string, action: ProctorAlert['status'], penaltyXP?: number) => void;
  clearAlerts: () => void;
  updateRules: (partial: Partial<AntiCheatRules>) => void;
  resetToDefaults: () => void;
}

const STORAGE_KEY = 'next_olymp_proctoring_v2';

export const useProctoringStore = create<ProctoringState>()(
  persist(
    (set, get) => ({
      sessions: INITIAL_PROCTOR_SESSIONS,
      alerts: INITIAL_PROCTOR_ALERTS,
      rules: DEFAULT_ANTICHEAT_RULES,
      selectedSessionId: INITIAL_PROCTOR_SESSIONS[0]?.id || null,
      isLiveProctoringActive: true,
      listeningStudentId: null,
      audioVolumeMeter: 0,
      autoProctorAi: true,

      flags: [],
      addFlag: (flag) => {
        const newFlag: AntiCheatFlag = {
          ...flag,
          id: `flag-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: new Date().toLocaleTimeString(),
          status: 'pending',
        };
        set((state) => ({ flags: [newFlag, ...state.flags] }));
      },
      updateFlagStatus: (id, status) => {
        set((state) => ({
          flags: state.flags.map((f) => (f.id === id ? { ...f, status } : f)),
        }));
      },

      setSelectedSessionId: (id) => set({ selectedSessionId: id }),

      setLiveProctoring: (v) => set({ isLiveProctoringActive: v }),

      setAutoProctorAi: (v) => set({ autoProctorAi: v }),

      toggleListenAudio: (sessionId) => {
        const current = get().listeningStudentId;
        if (current === sessionId) {
          set({ listeningStudentId: null, audioVolumeMeter: 0 });
        } else {
          set({ listeningStudentId: sessionId, audioVolumeMeter: Math.floor(Math.random() * 40) + 20 });
        }
      },

      stopListeningAudio: () => set({ listeningStudentId: null, audioVolumeMeter: 0 }),

      setAudioVolumeMeter: (vol) => set({ audioVolumeMeter: vol }),

      sendWarning: (sessionId, message) => {
        const now = new Date().toLocaleTimeString();
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id === sessionId) {
              const newWarnCount = s.warningCount + 1;
              const newStatus = newWarnCount >= state.rules.maxWarningsBeforeDisqualify ? 'disqualified' : 'warning';
              return {
                ...s,
                warningCount: newWarnCount,
                status: newStatus,
                latestViolation: message,
                latestViolationTime: now,
              };
            }
            return s;
          }),
        }));
      },

      applyPenalty: (sessionId, penaltyXP, reason) => {
        const now = new Date().toLocaleTimeString();
        const session = get().sessions.find((s) => s.id === sessionId);
        if (session) {
          
          useLeaderboardStore.getState().applyCheatingPenalty(session.userId, penaltyXP, reason);

          
          set((state) => ({
            sessions: state.sessions.map((s) => {
              if (s.id === sessionId) {
                return {
                  ...s,
                  scoreXP: Math.max(0, s.scoreXP - penaltyXP),
                  penaltyXP: s.penaltyXP + penaltyXP,
                  status: 'warning',
                  latestViolation: `Jarima: -${penaltyXP} XP (${reason})`,
                  latestViolationTime: now,
                };
              }
              return s;
            }),
          }));
        }
      },

      pauseExam: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, status: 'paused' } : s)),
        }));
      },

      resumeExam: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, status: 'active' } : s)),
        }));
      },

      disqualifyStudent: (sessionId, reason) => {
        const now = new Date().toLocaleTimeString();
        const session = get().sessions.find((s) => s.id === sessionId);
        if (session) {
          useLeaderboardStore.getState().applyCheatingPenalty(session.userId, 1000, `Diskvalifikatsiya: ${reason}`);
        }
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  status: 'disqualified',
                  latestViolation: `DISKVALIFIKATSIYA: ${reason}`,
                  latestViolationTime: now,
                }
              : s
          ),
        }));
      },

      addLiveAlert: (newAlert) => {
        const now = new Date().toLocaleTimeString();
        const alert: ProctorAlert = {
          ...newAlert,
          id: `alert-live-${Date.now()}`,
          timestamp: now,
        };
        set((state) => ({ alerts: [alert, ...state.alerts].slice(0, 100) }));
      },

      resolveAlert: (alertId, action, penaltyXP) => {
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === alertId
              ? {
                  ...a,
                  status: action,
                  penaltyApplied: penaltyXP || a.penaltyApplied,
                }
              : a
          ),
        }));
      },

      clearAlerts: () => set({ alerts: [] }),

      updateRules: (partial) => {
        set((state) => ({ rules: { ...state.rules, ...partial } }));
      },

      resetToDefaults: () => {
        set({
          sessions: INITIAL_PROCTOR_SESSIONS,
          alerts: INITIAL_PROCTOR_ALERTS,
          rules: DEFAULT_ANTICHEAT_RULES,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        rules: s.rules,
        autoProctorAi: s.autoProctorAi,
      }),
    }
  )
);

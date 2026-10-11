import { Submission, Question, Certificate, CertificateType } from '../types';
import { olympiadService } from './olympiadService';
import { useOlympiadStore } from '../store/useOlympiadStore';
import { useNationalExamStore } from '../store/useNationalExamStore';
import { useContestStore } from '../store/useContestStore';
import { useLeaderboardStore } from '../store/useLeaderboardStore';
import { useAuthStore } from '../store/useAuthStore';
import { useUserStore } from '../store/useUserStore';
import { apiClient } from './api';

export interface SubmitAnswerParams {
  userId: string;
  olympiadId: string;
  questionId: string;
  answer: string | string[];
}

export interface ParticipantAdminResult {
  id: string;
  name: string;
  phone: string;
  region: string;
  school: string;
  grade: number;
  status?: 'registered' | 'in_progress' | 'completed' | 'disqualified';
  correctAnswers?: number;
  totalQuestions?: number;
  percentage?: number;
  score?: number;
  timeSpentMinutes?: number;
  submittedAt?: string;
  registeredAt?: string;
  currentQuestion?: number;
  certificateType?: 'I darajali Diplom' | 'II darajali Diplom' | 'III darajali Diplom' | 'Sertifikat' | string;
  rank?: number;
  isPassed?: boolean;
  antiCheatViolations?: {
    tabSwitches: number;
    faceAbsence: number;
    rapidAnswers: number;
    totalViolations: number;
  };
  wrongQuestionsList?: {
    questionNum: number;
    topic: string;
    userAns: string;
    correctAns: string;
    aiExplanation: string;
  }[];
}

const draftAnswersMap = new Map<string, any>();
const userSubmissionsCache: any[] = [];
const olympiadSubmissionsCache = new Map<string, ParticipantAdminResult[]>();
const attemptCountsMap = new Map<string, number>();

export const submissionService = {
  async refresh() {
    const response = await apiClient.get<{ data: typeof userSubmissionsCache }>('/submissions');
    if (!Array.isArray(response.data)) throw new Error('Natijalar formati noto‘g‘ri');
    userSubmissionsCache.splice(0, userSubmissionsCache.length, ...response.data.filter(s => s.mode !== 'practice').map(s => ({
      ...s, olympiadId: s.examId, olympiadTitle: s.examTitle, questionsAnalysis: s.analysis,
      submitted_at: s.submittedAt,
    })));
    olympiadSubmissionsCache.clear();
  },
  clearCache() {
    userSubmissionsCache.length = 0;
    draftAnswersMap.clear();
    olympiadSubmissionsCache.clear();
    attemptCountsMap.clear();
  },
  async saveDraftAnswer(params: SubmitAnswerParams): Promise<boolean> {
    const sessionId = useContestStore.getState().sessionId;
    if (!sessionId) throw new Error('Server sessiyasi mavjud emas');
    await apiClient.post(`/exams/${encodeURIComponent(params.olympiadId)}/answer`, {
      sessionId, questionId: params.questionId, selectedOption: params.answer,
    });
    draftAnswersMap.set(`draft_ans_${params.userId}_${params.olympiadId}_${params.questionId}`, params.answer);
    return true;
  },

  getDraftAnswer(userId: string, olympiadId: string, questionId: string): string | string[] | null {
    const key = `draft_ans_${userId}_${olympiadId}_${questionId}`;
    return draftAnswersMap.get(key) || null;
  },

  getAttemptCount(userId: string, olympiadId: string): number {
    const key = `${userId}_${olympiadId}`;
    return attemptCountsMap.get(key) || (userSubmissionsCache.some((s) => (s.userId === userId || s.user_id === userId) && (s.olympiadId === olympiadId || s.olympiad_id === olympiadId)) ? 1 : 0);
  },

  async finalizeSubmission(userId: string, olympiadId: string, answers: Record<string, string | string[]>, _signature?: string) {
    const sessionId = useContestStore.getState().sessionId;
    if (!sessionId) throw new Error('Server sessiyasi mavjud emas');
    const response = await apiClient.post(`/exams/${encodeURIComponent(olympiadId)}/finish`, { sessionId, answers });
    const submission = response.data;
    if (!submission || typeof submission.score !== 'number' || submission.status !== 'completed') {
      throw new Error('Server natijani tasdiqlamadi');
    }
    userSubmissionsCache.unshift({ ...submission, olympiadId: submission.examId,
      olympiadTitle: submission.examTitle, submitted_at: submission.submittedAt,
      questionsAnalysis: submission.analysis });
    attemptCountsMap.set(`${userId}_${olympiadId}`, 1);
    return {
      score: submission.score as number, maxScore: submission.maxScore as number,
      totalQuestions: submission.analysis?.length ?? 0,
      correctAnswersCount: submission.analysis?.filter((item: { isCorrect: boolean }) => item.isCorrect).length ?? 0,
      status: 'completed' as const,
    };
  },

  getUserSubmissions(userId: string): any[] {
    const seen = new Set<string>();
    return userSubmissionsCache.filter((s) => {
      const sUser = s.userId || s.user_id;
      const sId = s.id || `${sUser}_${s.olympiadId || s.olympiad_id}_${s.submitted_at}`;
      if (sUser !== userId) return false;
      if (seen.has(sId)) return false;
      seen.add(sId);
      return true;
    });
  },

  getUserExamResults(userId: string) {
    return this.getUserSubmissions(userId).map(s => {
      const analysis = Array.isArray(s.analysis) ? s.analysis : (s.questionsAnalysis ?? []);
      const seconds = Math.round((s.timeSpentMinutes ?? 0) * 60);
      return { ...s, olympiadId: s.examId, olympiadTitle: s.examTitle,
        completedAt: s.submittedAt, format: 'online' as const,
        rank: s.rank ?? null, totalParticipants: s.totalParticipants ?? null,
        timeSpentSeconds: seconds, timeSpentFormatted: Math.floor(seconds / 60) + ' daq',
        totalQuestions: analysis.length,
        correctAnswersCount: analysis.filter((q: { isCorrect: boolean }) => q.isCorrect).length,
        wrongAnswersCount: analysis.filter((q: { isCorrect: boolean }) => !q.isCorrect).length,
        questionsAnalysis: analysis };
    });
  },

  getOlympiadSubmissions(olympiadId: string): ParticipantAdminResult[] {
    return userSubmissionsCache.filter(s => s.examId === olympiadId).map(s => ({
      id: s.userId, name: s.userName, phone: s.phone ?? '', region: s.region ?? '',
      school: s.school ?? '', grade: s.grade ?? 0, status: s.status,
      correctAnswers: s.analysis?.filter((q: { isCorrect: boolean }) => q.isCorrect).length,
      totalQuestions: s.analysis?.length, percentage: s.percentage, score: s.score,
      timeSpentMinutes: s.timeSpentMinutes, submittedAt: s.submittedAt,
      certificateType: s.certificateType,
    }));
  },

  deleteOlympiadData(olympiadId: string): void {
    
    olympiadSubmissionsCache.delete(olympiadId);

    
    for (let i = userSubmissionsCache.length - 1; i >= 0; i--) {
      const s = userSubmissionsCache[i];
      if (s && (s.olympiadId === olympiadId || s.olympiad_id === olympiadId)) {
        userSubmissionsCache.splice(i, 1);
      }
    }

  },

  async saveLiveCheatLog(olympiadId: string, log: any): Promise<void> {
    await apiClient.post(`/exams/${encodeURIComponent(olympiadId)}/proctor-event`, {
      examId: olympiadId,
      userId: log.studentId || log.userId,
      eventType: log.type || 'TAB_SWITCH',
      details: log.detail || log.message || '',
      severity: log.severity || 'medium'
    });
  },

  async getOlympiadCheatLogs(olympiadId: string): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>(`/admin/exams/${encodeURIComponent(olympiadId)}/proctor-events`);
    return (Array.isArray(response?.data) ? response.data : []).map((event: any) => ({
      id: event.id, sessionId: event.sessionId, studentId: event.userId, type: event.eventType,
      detail: event.details, timestamp: event.timestamp, ipAddress: event.ipAddress,
      severity: event.severity, status: event.eventType === 'ADMIN_DISQUALIFY' ? 'disqualified' : 'pending',
    }));
  },

  async updateCheatLogStatus(olympiadId: string, logId: string, newStatus: 'pending' | 'warned' | 'penalized' | 'disqualified' | 'dismissed'): Promise<void> {
    if (newStatus !== 'disqualified') throw new Error('Faqat server tasdiqlagan diskvalifikatsiya qo‘llanadi');
    const logs = await this.getOlympiadCheatLogs(olympiadId);
    const target = logs.find(item => item.id === logId);
    if (!target?.sessionId) throw new Error('Proktor sessiyasi topilmadi');
    await apiClient.post(`/admin/exams/${encodeURIComponent(olympiadId)}/proctor-disqualify`, { sessionId: target.sessionId, reason: target.detail || target.type });
  },

  getOlympiadAllParticipants(olympiadId: string): ParticipantAdminResult[] {
    const olympiad = useOlympiadStore.getState().olympiads.find((o) => o.id === olympiadId);
    const existingSubs = this.getOlympiadSubmissions(olympiadId);
    const userStoreUsers = useUserStore.getState().users || [];
    const minScore = olympiad?.certificateConfig?.minScoreLimit || 60;

    
    const subsMap = new Map<string, ParticipantAdminResult>();
    existingSubs.forEach((s) => {
      subsMap.set(s.id, s);
    });

    const participants: ParticipantAdminResult[] = [];

    
    existingSubs.forEach((sub, idx) => {
      const isDisqualified = this.isParticipantDisqualified(sub.id, olympiadId);
      participants.push({
        ...sub,
        status: isDisqualified ? 'disqualified' : 'completed',
        rank: idx + 1,
        isPassed: (sub.percentage || 0) >= minScore || (sub.score || 0) >= minScore,
        registeredAt: sub.submittedAt,
      } as any);
    });


    
    const completedList = participants
      .filter((p) => p.status === 'completed')
      .sort((a, b) => ((b.score || 0) - (a.score || 0)) || ((a.timeSpentMinutes || 0) - (b.timeSpentMinutes || 0)));

    completedList.forEach((p, idx) => {
      p.rank = idx + 1;
      p.isPassed = (p.percentage || 0) >= minScore || (p.score || 0) >= minScore;
    });

    return participants;
  },

  disqualifiedMap: new Map<string, boolean>(),

  disqualifyParticipant(userId: string, olympiadId: string, _reason?: string): void {
    const key = `${userId}_${olympiadId}`;
    this.disqualifiedMap.set(key, true);
  },

  unDisqualifyParticipant(userId: string, olympiadId: string): void {
    const key = `${userId}_${olympiadId}`;
    this.disqualifiedMap.delete(key);
  },

  isParticipantDisqualified(userId: string, olympiadId: string): boolean {
    const key = `${userId}_${olympiadId}`;
    return this.disqualifiedMap.get(key) === true;
  }
};

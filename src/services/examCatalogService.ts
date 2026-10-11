import { apiClient } from './api';
import type { AdminExamDto } from './adminExamAdapter';

export type ExamKind = 'olympiad' | 'level_test' | 'national_certificate';
export const examKindLabels: Record<ExamKind, string> = {
  olympiad: 'Olimpiadalar', level_test: 'Daraja testlari', national_certificate: 'Milliy sertifikat sinovlari',
};
export interface RaschConfig {
  version: string; source: string; model: '1PL'; estimator: 'EAP';
  priorMean: number; priorSd: number; itemDifficulties: Record<string, number>;
}
export type CatalogExam = AdminExamDto & {
  kind: ExamKind; practiceEnabled?: boolean; practiceAvailable?: boolean; sourceYear?: number;
  raschConfig?: RaschConfig | null; calibrationStatus?: string;
};
export interface ServerQuestion {
  id: string; content: string; imageUrl?: string; options: Array<{ id: string; text: string; imageUrl?: string }>; points: number;
}
export interface AssessmentResult {
  userName?: string;
  id: string; examId: string; examTitle: string; mode?: 'practice' | 'competitive';
  examKind?: ExamKind; score: number; maxScore: number; percentage: number; submittedAt: string;
  rasch?: { status: 'estimated' | 'pending_calibration'; theta: number | null; posteriorSd: number | null;
    calibrationVersion: string | null; officialEquivalent: false };
  analysis?: Array<{ questionId: string; questionText: string; userAnswer: string; correctAnswer: string;
    isCorrect: boolean; explanation?: string }>;
}
export interface PracticeSession {
  sessionId: string; expiresAt: number; serverTime: number; answers: Record<string, string>;
  completed?: false;
}
export const examCatalogService = {
  async list(kind?: ExamKind): Promise<CatalogExam[]> {
    return (await apiClient.get<{ data: CatalogExam[] }>('/exams' + (kind ? `?kind=${kind}` : ''))).data;
  },
  async adminExam(id: string): Promise<CatalogExam> {
    return (await apiClient.get<{ data: CatalogExam }>(`/admin/exams/${encodeURIComponent(id)}`)).data;
  },
  async create(data: Record<string, unknown>): Promise<CatalogExam> {
    return (await apiClient.post<{ data: CatalogExam }>('/exams', data)).data;
  },
  async update(id: string, data: Record<string, unknown>): Promise<CatalogExam> {
    return (await apiClient.put<{ data: CatalogExam }>(`/exams/${encodeURIComponent(id)}`, data)).data;
  },
  async remove(id: string): Promise<void> { await apiClient.delete(`/exams/${encodeURIComponent(id)}`); },
  async startPractice(id: string): Promise<PracticeSession | { completed: true; data: AssessmentResult }> {
    return apiClient.post(`/exams/${encodeURIComponent(id)}/start`, { mode: 'practice' });
  },
  async questions(id: string, sessionId: string): Promise<ServerQuestion[]> {
    return (await apiClient.get<{ questions: ServerQuestion[] }>(
      `/exams/${encodeURIComponent(id)}/questions?sessionId=${encodeURIComponent(sessionId)}`)).questions;
  },
  async answer(id: string, sessionId: string, questionId: string, selectedOption: string): Promise<void> {
    await apiClient.post(`/exams/${encodeURIComponent(id)}/answer`, { sessionId, questionId, selectedOption });
  },
  async finish(id: string, sessionId: string): Promise<AssessmentResult> {
    // Only previously acknowledged server answers are graded. No browser-generated score.
    return (await apiClient.post<{ data: AssessmentResult }>(`/exams/${encodeURIComponent(id)}/finish`, { sessionId })).data;
  },
  async history(): Promise<AssessmentResult[]> {
    return (await apiClient.get<{ data: AssessmentResult[] }>('/submissions')).data;
  },
  async examResults(id: string): Promise<AssessmentResult[]> {
    return (await apiClient.get<{ data: AssessmentResult[] }>(`/submissions?exam_id=${encodeURIComponent(id)}`)).data;
  },
  async result(id: string): Promise<AssessmentResult> {
    return (await apiClient.get<{ data: AssessmentResult }>(`/submissions/${encodeURIComponent(id)}`)).data;
  },
};

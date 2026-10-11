import type { OlympiadItem } from '../data/initialOlympiads';
import type { Question } from '../types';
import { apiClient } from './api';

export type AdminExamDto = Omit<OlympiadItem, 'startDate' | 'endDate' | 'status'> & {
  startTime: string; endTime: string; status: string;
};
export function toAdminExam(exam: AdminExamDto): OlympiadItem {
  if (!exam || typeof exam.id !== 'string') throw new Error('Server imtihonni tasdiqlamadi');
  return { ...exam, startDate: exam.startTime, endDate: exam.endTime,
    status: exam.status === 'active' || exam.status === 'ochiq' || exam.status === 'upcoming' ? 'ochiq' : 'yopiq',
    price: 0, isPinned: exam.isPinned ?? false };
}
export async function loadAdminQuestions(examId: string): Promise<Question[]> {
  const response = await apiClient.get<{ questions: Array<{ id: string; content: string; correctAnswer: string;
    points: number; orderNum: number; explanation?: string; imageUrl?: string; options: Array<{ id: string; text: string; imageUrl?: string }> }> }>(
    '/exams/' + encodeURIComponent(examId) + '/questions');
  return response.questions.map(q => ({ id: q.id, olympiadId: examId, roundId: '',
    content: q.content, correctAnswer: q.correctAnswer, explanation: q.explanation, imageUrl: q.imageUrl,
    optionImages: q.options.map(o => o.imageUrl ?? ''), points: q.points, order: q.orderNum,
    type: q.options.length ? 'multiple_choice' : 'open_text',
    options: q.options.map(o => o.text), optionIds: q.options.map(o => o.id) }));
}

import type { Olympiad, Question, LeaderboardEntry, Subject, OlympiadStatus } from '../types';
import { apiClient, ApiError } from './api';

export interface OlympiadFilter {
  subject?: Subject | 'all';
  grade?: number | 'all';
  status?: OlympiadStatus | 'all';
  search?: string;
}
interface ExamDto {
  id: string; title: string; description: string; subject: string;
  status: string; startTime: string; endTime: string; durationMinutes: number;
  totalQuestions: number; maxScore: number; registeredCount: number;
  targetGrades?: number[]; organizer: string; image?: string; isAlwaysOpen?: boolean;
  antiCheatConfig?: Olympiad['antiCheatConfig'];
}
function fromExam(item: ExamDto): Olympiad {
  const name = item.subject.toLowerCase();
  const subject: Subject = name.includes('matematik') || name === 'math' ? 'math'
    : name.includes('fizik') || name === 'physics' ? 'physics'
    : name.includes('kimyo') || name === 'chemistry' ? 'chemistry'
    : name.includes('biolog') || name === 'biology' ? 'biology'
    : name.includes('informat') ? 'informatics' : 'other';
  return {
    id: item.id, title: item.title, description: item.description, subject,
    status: item.status === 'active' || item.status === 'ochiq' ? 'active'
      : item.status === 'upcoming' ? 'upcoming' : 'finished',
    startDate: item.startTime, endDate: item.endTime, durationMinutes: item.durationMinutes,
    totalQuestions: item.totalQuestions, maxScore: item.maxScore,
    participantsCount: item.registeredCount, eligibility: { grades: item.targetGrades ?? [] },
    targetGrades: item.targetGrades, rounds: [], prizes: [], organizer: item.organizer,
    imageUrl: item.image, isAlwaysOpen: item.isAlwaysOpen, antiCheatConfig: item.antiCheatConfig,
  };
}
export const olympiadService = {
  async getOlympiads(filter?: OlympiadFilter): Promise<Olympiad[]> {
    const response = await apiClient.get<{ data: ExamDto[] }>('/exams?kind=olympiad');
    return response.data.map(fromExam).filter(o =>
      (!filter?.subject || filter.subject === 'all' || o.subject === filter.subject) &&
      (!filter?.status || filter.status === 'all' || o.status === filter.status) &&
      (!filter?.grade || filter.grade === 'all' || o.eligibility.grades.length === 0 || o.eligibility.grades.includes(filter.grade)) &&
      (!filter?.search || (o.title + ' ' + o.description).toLowerCase().includes(filter.search.toLowerCase()))
    );
  },
  async getOlympiadById(id: string): Promise<Olympiad | null> {
    try { return fromExam((await apiClient.get<{ data: ExamDto }>(`/exams/${encodeURIComponent(id)}`)).data); }
    catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error; }
  },
  async getQuestionsByOlympiadId(id: string): Promise<Question[]> {
    const response = await apiClient.get<{ questions: Array<{ id: string; examId: string; content: string;
      imageUrl?: string; options: Array<{ id: string; text: string; imageUrl?: string }>; points: number; orderNum: number }> }>(`/exams/${encodeURIComponent(id)}/questions`);
    return response.questions.map(q => ({ id: q.id, olympiadId: q.examId, roundId: '',
      type: q.options.length ? 'multiple_choice' : 'open_text', content: q.content,
      imageUrl: q.imageUrl, optionImages: q.options.map(o => o.imageUrl ?? ''),
      options: q.options.map(option => option.text), optionIds: q.options.map(option => option.id),
      points: q.points, order: q.orderNum }));
  },
  async getLeaderboard(examId?: string): Promise<LeaderboardEntry[]> {
    return (await apiClient.get<{ data: LeaderboardEntry[] }>(
      '/leaderboard' + (examId ? `?exam_id=${encodeURIComponent(examId)}` : ''),
    )).data;
  },
  async createOlympiad(data: Partial<Olympiad>): Promise<Olympiad> {
    return fromExam((await apiClient.post<{ data: ExamDto }>('/exams', {
      ...data, startTime: data.startDate, endTime: data.endDate,
    })).data);
  },
};

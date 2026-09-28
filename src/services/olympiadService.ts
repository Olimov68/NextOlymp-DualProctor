import { Olympiad, Question, LeaderboardEntry, Subject, OlympiadStatus } from '../types';
import { MOCK_OLYMPIADS, MOCK_QUESTIONS, DEFAULT_SAMPLE_QUESTIONS } from './mockData';
import { useLeaderboardStore } from '../store/useLeaderboardStore';
import { useOlympiadStore } from '../store/useOlympiadStore';
import { useNationalExamStore } from '../store/useNationalExamStore';

export interface OlympiadFilter {
  subject?: Subject | 'all';
  grade?: number | 'all';
  status?: OlympiadStatus | 'all';
  search?: string;
}

export const olympiadService = {
  async getOlympiads(filter?: OlympiadFilter): Promise<Olympiad[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const storeOlympiads = useOlympiadStore.getState().olympiads || [];

    let list: Olympiad[] = storeOlympiads.map((item) => {
      const sLower = (item.subject || '').toLowerCase();
      const subject: Subject = sLower.includes('matematik') ? 'math' :
        sLower.includes('fizik') ? 'physics' :
        sLower.includes('kimyo') ? 'chemistry' :
        sLower.includes('biolog') ? 'biology' :
        sLower.includes('informat') ? 'informatics' : 'other';

      const status: OlympiadStatus = (item.status === 'ochiq' ? 'active' : 'finished');
      const totalQ = item.questions && item.questions.length > 0 ? item.questions.length : ((item as any).totalQuestions || (item as any).total_questions || 25);

      return {
        ...item,
        id: item.id,
        title: item.title,
        description: item.description || '',
        subject,
        status,
        isAlwaysOpen: item.isAlwaysOpen || (item as any).isAlwaysOpen,
        startDate: item.startDate || new Date().toISOString(),
        endDate: item.endDate || new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: (item as any).durationMinutes || (item as any).duration_minutes || 60,
        totalQuestions: totalQ,
        maxScore: (item as any).maxScore || (item as any).max_score || 100,
        participantsCount: item.registeredCount || 0,
        retakeAllowed: item.retakeAllowed ?? false,
        maxRetakeAttempts: item.maxRetakeAttempts || 2,
        targetGrades: item.targetGrades || [5, 6, 7, 8, 9, 10, 11],
        allowedLanguages: item.allowedLanguages || ["O'zbek tili", "Rus tili", "Ingliz tili"],
        eligibility: { grades: item.targetGrades || [5, 6, 7, 8, 9, 10, 11], regions: ['All'] },
        rounds: [],
        prizes: [],
        organizer: item.organizer || "Next Olymp Hakamlar Hay'ati",
      };
    });

    if (filter) {
      if (filter.subject && filter.subject !== 'all') {
        list = list.filter((o) => o.subject === filter.subject);
      }
      if (filter.status && filter.status !== 'all') {
        list = list.filter((o) => o.status === filter.status);
      }
      if (filter.grade && filter.grade !== 'all') {
        const gradeNum = Number(filter.grade);
        list = list.filter((o) => o.eligibility.grades.includes(gradeNum));
      }
      if (filter.search && filter.search.trim() !== '') {
        const query = filter.search.toLowerCase();
        list = list.filter((o) =>
          o.title.toLowerCase().includes(query) ||
          o.description.toLowerCase().includes(query)
        );
      }
    }
    return list;
  },

  async getOlympiadById(id: string): Promise<Olympiad | null> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    
    try {
      const storeItem = useOlympiadStore.getState().olympiads?.find((o) => o.id === id);
      if (storeItem) {
        const sLower = (storeItem.subject || '').toLowerCase();
        const subject: Subject = sLower.includes('matematik') ? 'math' :
          sLower.includes('fizik') ? 'physics' :
          sLower.includes('kimyo') ? 'chemistry' :
          sLower.includes('biolog') ? 'biology' :
          sLower.includes('informat') ? 'informatics' : 'other';

        const status: OlympiadStatus = (storeItem.status === 'ochiq' ? 'active' : 'finished');
        const totalQ = storeItem.questions && storeItem.questions.length > 0 ? storeItem.questions.length : ((storeItem as any).totalQuestions || (storeItem as any).total_questions || 25);

        return {
          ...storeItem,
          id: storeItem.id,
          title: storeItem.title,
          description: storeItem.description || '',
          subject,
          status,
          isAlwaysOpen: storeItem.isAlwaysOpen || (storeItem as any).isAlwaysOpen,
          startDate: storeItem.startDate || new Date().toISOString(),
          endDate: storeItem.endDate || new Date(Date.now() + 86400000).toISOString(),
          durationMinutes: (storeItem as any).durationMinutes || (storeItem as any).duration_minutes || 60,
          totalQuestions: totalQ,
          maxScore: (storeItem as any).maxScore || (storeItem as any).max_score || 100,
          participantsCount: storeItem.registeredCount || 0,
          retakeAllowed: storeItem.retakeAllowed ?? false,
          maxRetakeAttempts: storeItem.maxRetakeAttempts || 2,
          targetGrades: storeItem.targetGrades || [5, 6, 7, 8, 9, 10, 11],
          allowedLanguages: storeItem.allowedLanguages || ["O'zbek tili", "Rus tili", "Ingliz tili"],
          eligibility: { grades: storeItem.targetGrades || [5, 6, 7, 8, 9, 10, 11], regions: ['All'] },
          rounds: [],
          prizes: [],
          organizer: storeItem.organizer || "Next Olymp Hakamlar Hay'ati",
        };
      }
    } catch {
      
    }

    try {
      const examItem = useNationalExamStore.getState().exams?.find((e) => e.id === id);
      if (examItem) {
        return {
          ...examItem,
          id: examItem.id,
          title: examItem.title,
          description: examItem.description || '',
          subject: 'math',
          status: examItem.status === 'ochiq' ? 'active' : 'finished',
          startDate: examItem.startDate || new Date().toISOString(),
          endDate: examItem.endDate || new Date(Date.now() + 86400000).toISOString(),
          durationMinutes: examItem.durationMinutes || 120,
          totalQuestions: examItem.questions?.length || examItem.totalQuestions || 40,
          maxScore: examItem.maxScore || 75,
          participantsCount: examItem.registeredCount || 0,
          retakeAllowed: examItem.retakeAllowed ?? false,
          maxRetakeAttempts: examItem.maxRetakeAttempts || 2,
          targetGrades: examItem.targetGrades || [5, 6, 7, 8, 9, 10, 11],
          allowedLanguages: examItem.allowedLanguages || ["O'zbek tili", "Rus tili", "Qoraqalpoq tili"],
          eligibility: { grades: examItem.targetGrades || [5, 6, 7, 8, 9, 10, 11], regions: ['All'] },
          rounds: [],
          prizes: [],
          organizer: examItem.organizer || 'Davlat Test Markazi (Milliy Sertifikat)',
        };
      }
    } catch {
      
    }

    const found = MOCK_OLYMPIADS.find((o) => o.id === id);
    if (found) return found;

    
    return {
      id: id || 'OLY-101',
      title: 'Respublika Fan Olimpiadasi',
      description: 'Respublika o\'quvchilari o\'rtasidagi mantiqiy va akademik musobaqa.',
      subject: 'math',
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      durationMinutes: 60,
      totalQuestions: 25,
      maxScore: 100,
      participantsCount: 350,
      eligibility: { grades: [5, 6, 7, 8, 9, 10, 11], regions: ['All'] },
      rounds: [],
      prizes: [],
      organizer: 'Next Olymp Hakamlar Hay\'ati',
    };
  },

  async getQuestionsByOlympiadId(olympiadId: string): Promise<Question[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    try {
      const storeItem = useOlympiadStore.getState().olympiads?.find((o) => o.id === olympiadId);
      if (storeItem?.questions && storeItem.questions.length > 0) {
        return storeItem.questions;
      }
      const examItem = useNationalExamStore.getState().exams?.find((e) => e.id === olympiadId);
      if (examItem?.questions && examItem.questions.length > 0) {
        return examItem.questions;
      }
    } catch {
      
    }

    if (MOCK_QUESTIONS[olympiadId] && MOCK_QUESTIONS[olympiadId].length > 0) {
      return MOCK_QUESTIONS[olympiadId];
    }

    return (
      MOCK_QUESTIONS['OLY-101'] ||
      DEFAULT_SAMPLE_QUESTIONS
    );
  },

  async getLeaderboard(_olympiadId?: string): Promise<LeaderboardEntry[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const entries = useLeaderboardStore.getState().entries;
    return entries.map((e, idx) => ({
      id: e.id,
      rank: e.nationalRank || idx + 1,
      userId: e.userId,
      userName: e.userName,
      avatarUrl: e.avatarUrl,
      grade: e.grade,
      region: e.region,
      school: e.school,
      score: e.totalXP,
      penaltyTime: 120,
      submittedAt: e.lastActive,
      status: 'verified' as const
    }));
  },

  async createOlympiad(olympiadData: Partial<Olympiad>): Promise<Olympiad> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const created: Olympiad = {
      id: `olymp-${Date.now()}`,
      title: olympiadData.title || 'Yangi Musobaqa',
      subject: olympiadData.subject || 'math',
      description: olympiadData.description || '',
      startDate: olympiadData.startDate || new Date().toISOString(),
      endDate: olympiadData.endDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      status: 'upcoming',
      durationMinutes: olympiadData.durationMinutes || 90,
      totalQuestions: 10,
      maxScore: 100,
      rounds: [],
      eligibility: { grades: [5, 6, 7, 8, 9, 10, 11] },
      prizes: [],
      participantsCount: 0,
      organizer: 'Next Olymp Admin',
    };
    MOCK_OLYMPIADS.unshift(created);
    return created;
  }
};

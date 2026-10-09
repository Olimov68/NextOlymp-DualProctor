import { create } from 'zustand';
import { NationalExamItem } from '../data/initialNationalExams';
import { apiClient } from '../services/api';

const STORAGE_KEY = 'next_olymp_national_exams';

const getStoredExams = (): NationalExamItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('LocalStorage load error for national exams:', e);
  }
  return [];
};

const persistExams = (items: NationalExamItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('LocalStorage save error for national exams:', e);
  }
};

interface NationalExamStore {
  exams: NationalExamItem[];
  loading: boolean;
  fetchFromApi: () => Promise<void>;
  addExam: (item: Omit<NationalExamItem, 'id' | 'registeredCount' | 'submittedCount' | 'paidCount' | 'totalRevenue'>) => NationalExamItem;
  updateExam: (id: string, updated: Partial<NationalExamItem>) => void;
  deleteExam: (id: string) => void;
  togglePinExam: (id: string) => void;
  toggleExamStatus: (id: string) => void;
  resetExams: () => void;
}

export const useNationalExamStore = create<NationalExamStore>((set, get) => ({
  exams: getStoredExams(),
  loading: false,

  fetchFromApi: async () => {
    set({ loading: true });
    try {
      const json = await apiClient.get('/exams');
      const data = Array.isArray(json) ? json : (json?.data || []);
      if (Array.isArray(data) && data.length > 0) {
        persistExams(data);
        set({ exams: data, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      set({ loading: false });
    }
  },

  addExam: (newItem) => {
    const current = get().exams;
    const nextIdNum = 100 + current.length + 1;
    const id = `NC-${nextIdNum}`;

    const exam: NationalExamItem = {
      ...newItem,
      id,
      questions: newItem.questions || [],
      registeredCount: 0,
      submittedCount: 0,
      paidCount: 0,
      totalRevenue: 0,
      calculationMethod: 'rasch',
      maxScore: newItem.maxScore || 75,
      aThreshold: newItem.aThreshold || 65,
      specType: newItem.specType || 'spec_1',
      durationMinutes: newItem.durationMinutes || 150,
      totalQuestions: newItem.questions ? newItem.questions.length : 0,
    };

    const updated = [exam, ...current];
    persistExams(updated);
    set({ exams: updated });

    apiClient.post('/exams', exam).catch((e) => console.warn('National Exam API sync error:', e));

    return exam;
  },

  updateExam: (id, updatedFields) => {
    const updated = get().exams.map((e) => (e.id === id ? { ...e, ...updatedFields } : e));
    persistExams(updated);
    set({ exams: updated });

    const target = updated.find((e) => e.id === id);
    if (target) {
      apiClient.put(`/exams/${encodeURIComponent(id)}`, target).catch((e) => console.warn('National Exam API sync error:', e));
    }
  },

  deleteExam: (id) => {
    const updated = get().exams.filter((e) => e.id !== id);
    persistExams(updated);
    set({ exams: updated });

    apiClient.delete(`/exams/${encodeURIComponent(id)}`).catch((e) =>
      console.warn('National Exam API delete error:', e)
    );
  },

  togglePinExam: (id) => {
    const updated = get().exams.map((e) => (e.id === id ? { ...e, isPinned: !e.isPinned } : e));
    persistExams(updated);
    set({ exams: updated });

    const target = updated.find((e) => e.id === id);
    if (target) {
      apiClient.put(`/exams/${encodeURIComponent(id)}`, target).catch((e) => console.warn('National Exam API sync error:', e));
    }
  },

  toggleExamStatus: (id) => {
    const updated = get().exams.map((e) =>
      e.id === id ? { ...e, status: (e.status === 'ochiq' ? 'yopiq' : 'ochiq') as 'ochiq' | 'yopiq' } : e
    );
    persistExams(updated);
    set({ exams: updated });

    const target = updated.find((e) => e.id === id);
    if (target) {
      apiClient.put(`/exams/${encodeURIComponent(id)}`, target).catch((e) => console.warn('National Exam API sync error:', e));
    }
  },

  resetExams: () => {
    persistExams([]);
    set({ exams: [] });
  },
}));

if (typeof window !== 'undefined') {
  setTimeout(() => {
    useNationalExamStore.getState().fetchFromApi();
  }, 100);
}

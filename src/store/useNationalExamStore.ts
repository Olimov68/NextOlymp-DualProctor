import { create } from 'zustand';
import { NationalExamItem } from '../data/initialNationalExams';
import { apiClient } from '../services/api';

// Clean up stale localStorage cache
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('next_olymp_national_exams');
  } catch {}
}

interface NationalExamStore {
  exams: NationalExamItem[];
  loading: boolean;
  fetchFromApi: () => Promise<void>;
  addExam: (item: Omit<NationalExamItem, 'id' | 'registeredCount' | 'submittedCount' | 'paidCount' | 'totalRevenue'>) => Promise<NationalExamItem>;
  updateExam: (id: string, updated: Partial<NationalExamItem>) => Promise<any>;
  deleteExam: (id: string) => Promise<void>;
  togglePinExam: (id: string) => Promise<void>;
  toggleExamStatus: (id: string) => Promise<void>;
  resetExams: () => void;
}

export const useNationalExamStore = create<NationalExamStore>((set, get) => ({
  exams: [],
  loading: false,

  fetchFromApi: async () => {
    set({ loading: true });
    try {
      const json = await apiClient.get('/exams');
      const data = Array.isArray(json) ? json : (json?.data ?? []);
      set({ exams: Array.isArray(data) ? data : [], loading: false });
    } catch (err) {
      console.error('API fetch error for national exams:', err);
      set({ loading: false });
    }
  },

  addExam: async (newItem) => {
    set({ loading: true });
    try {
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

      const res = await apiClient.post('/exams', exam);
      const saved: NationalExamItem = res?.data || exam;
      set((state) => ({
        exams: [saved, ...state.exams.filter((e) => e.id !== saved.id)],
        loading: false,
      }));
      return saved;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  updateExam: async (id, updatedFields) => {
    set({ loading: true });
    try {
      const res = await apiClient.put(`/exams/${encodeURIComponent(id)}`, updatedFields);
      const saved = res?.data || { ...get().exams.find((e) => e.id === id), ...updatedFields, id };
      set((state) => ({
        exams: state.exams.map((e) => (e.id === id ? saved : e)),
        loading: false,
      }));
      return saved;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  deleteExam: async (id) => {
    set({ loading: true });
    try {
      await apiClient.delete(`/exams/${encodeURIComponent(id)}`);
      set((state) => ({
        exams: state.exams.filter((e) => e.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  togglePinExam: async (id) => {
    const current = get().exams.find((e) => e.id === id);
    if (!current) return;
    const newPinned = !current.isPinned;
    try {
      await apiClient.put(`/exams/${encodeURIComponent(id)}`, { isPinned: newPinned });
      set((state) => ({
        exams: state.exams.map((e) => (e.id === id ? { ...e, isPinned: newPinned } : e)),
      }));
    } catch (e) {
      console.error('API togglePin error for national exam:', e);
    }
  },

  toggleExamStatus: async (id) => {
    const current = get().exams.find((e) => e.id === id);
    if (!current) return;
    const nextStatus: 'ochiq' | 'yopiq' = current.status === 'ochiq' ? 'yopiq' : 'ochiq';
    try {
      await apiClient.put(`/exams/${encodeURIComponent(id)}`, { status: nextStatus });
      set((state) => ({
        exams: state.exams.map((e) => (e.id === id ? { ...e, status: nextStatus } : e)),
      }));
    } catch (e) {
      console.error('API toggleStatus error for national exam:', e);
    }
  },

  resetExams: () => {
    set({ exams: [] });
  },
}));

if (typeof window !== 'undefined') {
  setTimeout(() => {
    useNationalExamStore.getState().fetchFromApi();
  }, 100);
}

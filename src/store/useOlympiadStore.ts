import { create } from 'zustand';
import { OlympiadItem } from '../data/initialOlympiads';
import { apiClient } from '../services/api';
import { toAdminExam } from '../services/adminExamAdapter';
import { submissionService } from '../services/submissionService';

// CRITICAL ARCHITECTURE RULE:
// LocalStorage must NOT be used for exams, questions, results, or user roles.
// Server REST API is the single source of truth.
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('ibn_sino_exams');
  } catch {}
}

interface OlympiadStore {
  olympiads: OlympiadItem[];
  loading: boolean;
  fetchFromApi: () => Promise<void>;
  fetchOlympiads: () => Promise<void>;
  addOlympiad: (item: Omit<OlympiadItem, 'id' | 'registeredCount' | 'submittedCount'>) => Promise<OlympiadItem>;
  updateOlympiad: (id: string, updated: Partial<OlympiadItem>) => Promise<any>;
  deleteOlympiad: (id: string) => Promise<void>;
  togglePinOlympiad: (id: string) => Promise<void>;
  toggleOlympiadStatus: (id: string) => Promise<void>;
  resetOlympiads: () => void;
}

export const useOlympiadStore = create<OlympiadStore>((set, get) => ({
  olympiads: [],
  loading: false,

  fetchFromApi: async () => {
    set({ loading: true });
    try {
      const json = await apiClient.get('/exams?kind=olympiad');
      const list = Array.isArray(json) ? json : (json?.data ?? []);
      set({ olympiads: Array.isArray(list) ? list.map(toAdminExam) : [], loading: false });
    } catch (err) {
      console.error('API fetch error for exams:', err);
      set({ loading: false });
    }
  },

  fetchOlympiads: async () => {
    set({ loading: true });
    try {
      const json = await apiClient.get('/exams?kind=olympiad');
      const list = Array.isArray(json) ? json : (json?.data ?? []);
      set({ olympiads: Array.isArray(list) ? list.map(toAdminExam) : [], loading: false });
    } catch (err) {
      console.error('API fetch error for exams:', err);
      set({ loading: false });
    }
  },

  createOlympiad: async (data: any) => {
    set({ loading: true });
    try {
      const response = await apiClient.post('/exams', data);
      const saved = toAdminExam(response.data);
      set((state) => ({
        olympiads: [saved, ...state.olympiads.filter((o) => o.id !== saved.id)],
        loading: false,
      }));
      return saved;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  addOlympiad: async (newItem) => {
    set({ loading: true });
    try {
      const current = get().olympiads;
      const nextIdNum = 100 + current.length + 1;
      const id = `OLY-${nextIdNum}`;

      const payload: OlympiadItem = {
        ...newItem,
        id,
        questions: newItem.questions || [],
        registeredCount: 0,
        submittedCount: 0,
      };

      const response = await apiClient.post('/exams', payload);
      const saved = toAdminExam(response.data);
      set((state) => ({
        olympiads: [saved, ...state.olympiads.filter((o) => o.id !== saved.id)],
        loading: false,
      }));
      return saved;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  updateOlympiad: async (id, updatedFields) => {
    set({ loading: true });
    try {
      const response = await apiClient.put(`/exams/${encodeURIComponent(id)}`, updatedFields);
      const saved = toAdminExam(response.data);
      set((state) => ({
        olympiads: state.olympiads.map((item) => (item.id === id ? saved : item)),
        loading: false,
      }));
      return saved;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  deleteOlympiad: async (id) => {
    set({ loading: true });
    try {
      await apiClient.delete(`/exams/${encodeURIComponent(id)}`);
      set((state) => ({
        olympiads: state.olympiads.filter((item) => item.id !== id),
        loading: false,
      }));
      submissionService.deleteOlympiadData(id);
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  togglePinOlympiad: async (id) => {
    const current = get().olympiads.find((o) => o.id === id);
    if (!current) return;
    const newPinned = !current.isPinned;
    try {
      await apiClient.put(`/exams/${encodeURIComponent(id)}`, { isPinned: newPinned });
      set((state) => ({
        olympiads: state.olympiads.map((o) => (o.id === id ? { ...o, isPinned: newPinned } : o)),
      }));
    } catch (e) {
      console.error('API togglePin error:', e);
    }
  },

  toggleOlympiadStatus: async (id) => {
    const current = get().olympiads.find((o) => o.id === id);
    if (!current) return;
    const nextStatus: 'ochiq' | 'yopiq' = current.status === 'ochiq' ? 'yopiq' : 'ochiq';
    try {
      await apiClient.put(`/exams/${encodeURIComponent(id)}`, { status: nextStatus });
      set((state) => ({
        olympiads: state.olympiads.map((o) => (o.id === id ? { ...o, status: nextStatus } : o)),
      }));
    } catch (e) {
      console.error('API toggleStatus error:', e);
    }
  },

  resetOlympiads: () => {
    set({ olympiads: [] });
  },
}));

if (typeof window !== 'undefined') {
  setTimeout(() => {
    useOlympiadStore.getState().fetchFromApi();
  }, 100);
}

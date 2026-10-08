import { create } from 'zustand';
import { OlympiadItem } from '../data/initialOlympiads';
import { apiClient } from '../services/api';
import { submissionService } from '../services/submissionService';

const STORAGE_KEY = 'ibn_sino_exams';

const getStoredOlympiads = (): OlympiadItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('LocalStorage load error for olympiads:', e);
  }
  return [];
};

const persistOlympiads = (items: OlympiadItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('LocalStorage save error for olympiads:', e);
  }
};

interface OlympiadStore {
  olympiads: OlympiadItem[];
  loading: boolean;
  fetchFromApi: () => Promise<void>;
  fetchOlympiads: () => Promise<void>;
  createOlympiad: (data: any) => Promise<void>;
  addOlympiad: (item: Omit<OlympiadItem, 'id' | 'registeredCount' | 'submittedCount' | 'paidCount' | 'totalRevenue'>) => OlympiadItem;
  updateOlympiad: (id: string, updated: Partial<OlympiadItem>) => void;
  deleteOlympiad: (id: string) => void;
  togglePinOlympiad: (id: string) => void;
  toggleOlympiadStatus: (id: string) => void;
  resetOlympiads: () => void;
}

export const useOlympiadStore = create<OlympiadStore>((set, get) => ({
  olympiads: getStoredOlympiads(),
  loading: false,

  fetchFromApi: async () => {
    set({ loading: true });
    try {
      const json = await apiClient.get('/exams');
      const data = Array.isArray(json) ? json : (json?.data || []);
      if (Array.isArray(data) && data.length > 0) {
        persistOlympiads(data);
        set({ olympiads: data, loading: false });
      } else {
        
        set({ loading: false });
      }
    } catch (err) {
      
      set({ loading: false });
    }
  },

  fetchOlympiads: async () => {
    set({ loading: true });
    try {
      const data = await apiClient.get('/exams');
      const list = Array.isArray(data) ? data : (data?.data || []);
      if (Array.isArray(list) && list.length > 0) {
        persistOlympiads(list);
        set({ olympiads: list, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (e) {
      set({ loading: false });
    }
  },

  createOlympiad: async (data: any) => {
    const current = get().olympiads;
    const updated = [data, ...current.filter((o) => o.id !== data.id)];
    persistOlympiads(updated);
    set({ olympiads: updated });

    try {
      await apiClient.post('/exams', data);
      const res = await apiClient.get('/exams');
      const list = Array.isArray(res) ? res : (res?.data || []);
      if (Array.isArray(list) && list.length > 0) {
        persistOlympiads(list);
        set({ olympiads: list });
      }
    } catch (e) {
      console.warn('API sync fallback to localStorage:', e);
    }
  },

  addOlympiad: (newItem) => {
    const current = get().olympiads;
    const nextIdNum = 100 + current.length + 1;
    const id = `OLY-${nextIdNum}`;

    const olympiad: OlympiadItem = {
      ...newItem,
      id,
      questions: newItem.questions || [],
      registeredCount: (newItem as any).registeredCount || 0,
      submittedCount: (newItem as any).submittedCount || 0,
      paidCount: (newItem as any).paidCount || 0,
      totalRevenue: (newItem as any).totalRevenue || 0,
    };

    const updated = [olympiad, ...current];
    persistOlympiads(updated);
    set({ olympiads: updated });

    
    apiClient.post('/exams', olympiad).catch((e) => console.warn('API sync warning:', e));

    return olympiad;
  },

  updateOlympiad: (id, updatedFields) => {
    const updated = get().olympiads.map((o) => (o.id === id ? { ...o, ...updatedFields } : o));
    persistOlympiads(updated);
    set({ olympiads: updated });

    const itemToSync = updated.find((o) => o.id === id);
    if (itemToSync) {
      apiClient.post('/exams', itemToSync).catch((e) => console.warn('API sync warning:', e));
    }
  },

  deleteOlympiad: (id) => {
    const updated = get().olympiads.filter((o) => o.id !== id);
    persistOlympiads(updated);
    set({ olympiads: updated });

    
    submissionService.deleteOlympiadData(id);

    
    apiClient.delete(`/exams?id=${encodeURIComponent(id)}`).catch((e) => console.warn('API delete warning:', e));
  },

  togglePinOlympiad: (id) => {
    const updated = get().olympiads.map((o) => (o.id === id ? { ...o, isPinned: !o.isPinned } : o));
    persistOlympiads(updated);
    set({ olympiads: updated });

    const itemToSync = updated.find((o) => o.id === id);
    if (itemToSync) {
      apiClient.post('/exams', itemToSync).catch((e) => console.warn('API sync warning:', e));
    }
  },

  toggleOlympiadStatus: (id) => {
    const updated = get().olympiads.map((o) => {
      if (o.id === id) {
        const nextStatus: 'ochiq' | 'yopiq' = o.status === 'ochiq' ? 'yopiq' : 'ochiq';
        return { ...o, status: nextStatus };
      }
      return o;
    });

    persistOlympiads(updated);
    set({ olympiads: updated });

    const itemToSync = updated.find((o) => o.id === id);
    if (itemToSync) {
      apiClient.post('/exams', itemToSync).catch((e) => console.warn('API sync warning:', e));
    }
  },

  resetOlympiads: () => {
    persistOlympiads([]);
    set({ olympiads: [] });
  },
}));

if (typeof window !== 'undefined') {
  setTimeout(() => {
    useOlympiadStore.getState().fetchFromApi();
  }, 100);
}

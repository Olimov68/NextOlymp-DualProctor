import { create } from 'zustand';
import { UserItem, INITIAL_USERS } from '../data/initialUsers';
import { useLeaderboardStore } from './useLeaderboardStore';
import { apiClient } from '../services/api';

// CRITICAL SECURITY RULE:
// User accounts and roles must NOT be stored in localStorage.
// Server REST API is the single source of truth.
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('next_olymp_users');
  } catch {}
}

interface UserState {
  users: UserItem[];
  loading: boolean;
  fetchFromApi: () => Promise<void>;
  addUser: (user: Omit<UserItem, 'id' | 'createdAt' | 'participationCount'>) => Promise<void>;
  updateUser: (id: string, user: Partial<Omit<UserItem, 'id' | 'createdAt'>>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;
  resetToDefaults: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: false,

  fetchFromApi: async () => {
    set({ loading: true });
    try {
      const json = await apiClient.get('/users');
      const usersList = Array.isArray(json)
        ? json
        : (json?.success || json?.status === 'success') && Array.isArray(json.data)
        ? json.data
        : null;

      if (usersList && Array.isArray(usersList)) {
        const cleanUsers: UserItem[] = usersList
          .filter((u: any) => u && u.id)
          .map((u: any) => ({
            id: String(u.id),
            fullName: u.fullName || u.full_name || u.name || 'Ishtirokchi',
            gender: u.gender || 'male',
            phone: u.phone || '+998 90 123 45 67',
            role: u.role || 'student',
            package: u.package || 'Bepul',
            status: u.status || 'active',
            region: u.region || 'Toshkent shahri',
            district: u.district || 'Yunusobod tumani',
            school: u.school || 'Prezident maktabi',
            grade: Number(u.grade) || 9,
            createdAt: u.createdAt ? String(u.createdAt).split(' ')[0] : (u.created_at ? String(u.created_at).split(' ')[0] : new Date().toISOString().split('T')[0]),
            participationCount: Number(u.participationCount) || 0,
          }));

        set({ users: cleanUsers, loading: false });
      } else {
        set({ users: [], loading: false });
      }
    } catch (e) {
      console.error('API fetch error for users:', e);
      set({ loading: false });
    }
  },

  addUser: async (userData) => {
    set({ loading: true });
    try {
      const { users } = get();
      const newUser: UserItem = {
        ...userData,
        id: `USR-${1000 + users.length + 1}`,
        createdAt: new Date().toISOString().split('T')[0],
        participationCount: 0,
        status: userData.status || 'active',
      };
      const res = await apiClient.post('/users', newUser);
      const saved = res?.data || newUser;
      set({ users: [saved, ...users], loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  updateUser: async (id, userData) => {
    set({ loading: true });
    try {
      await apiClient.put(`/users/${encodeURIComponent(id)}`, userData);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, ...userData } : u)),
        loading: false,
      }));
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  deleteUser: async (id) => {
    set({ loading: true });
    try {
      await apiClient.delete(`/users/${encodeURIComponent(id)}`);
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
        loading: false,
      }));
      try {
        useLeaderboardStore.getState().removeUser(id);
      } catch {}
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  toggleUserStatus: async (id) => {
    const current = get().users.find((u) => u.id === id);
    if (!current) return;
    const nextStatus = current.status === 'active' ? ('blocked' as const) : ('active' as const);
    try {
      await apiClient.put(`/users/${encodeURIComponent(id)}`, { status: nextStatus });
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, status: nextStatus } : u)),
      }));
    } catch (e) {
      console.error('Failed to toggle user status:', e);
    }
  },

  resetToDefaults: () => {
    set({ users: [] });
  },
}));

// Protected user data is loaded by admin screens after authentication, not on module import.

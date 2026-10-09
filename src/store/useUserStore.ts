import { create } from 'zustand';
import { UserItem, INITIAL_USERS } from '../data/initialUsers';
import { useLeaderboardStore } from './useLeaderboardStore';
import { apiClient } from '../services/api';

const STORAGE_KEY = 'next_olymp_users';

const getStoredUsers = (): UserItem[] => {
  if (typeof window === 'undefined') return INITIAL_USERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('LocalStorage load error for users:', e);
  }
  return INITIAL_USERS;
};

const persistUsers = (items: UserItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('LocalStorage save error for users:', e);
  }
};

interface UserState {
  users: UserItem[];
  loading: boolean;
  fetchFromApi: () => Promise<void>;
  addUser: (user: Omit<UserItem, 'id' | 'createdAt' | 'participationCount'>) => void;
  updateUser: (id: string, user: Partial<Omit<UserItem, 'id' | 'createdAt'>>) => void;
  deleteUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;
  resetToDefaults: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: getStoredUsers(),
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

      if (usersList && usersList.length > 0) {
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

        persistUsers(cleanUsers);
        set({ users: cleanUsers, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (e) {
      set({ loading: false });
    }
  },

  addUser: (userData) => {
    const { users } = get();
    const newUser: UserItem = {
      ...userData,
      id: `USR-${1000 + users.length + 1}`,
      createdAt: new Date().toISOString().split('T')[0],
      participationCount: 0,
      status: userData.status || 'active',
    };
    const updated = [newUser, ...users];
    persistUsers(updated);
    set({ users: updated });

    apiClient.post('/users', newUser).catch((e) => console.warn('User API sync warning:', e));
  },

  updateUser: (id, userData) => {
    const { users } = get();
    const updated = users.map((u) => (u.id === id ? { ...u, ...userData } : u));
    persistUsers(updated);
    set({ users: updated });

    apiClient.put(`/users/${encodeURIComponent(id)}`, userData).catch((e) => console.warn('User API sync warning:', e));
  },

  deleteUser: (id) => {
    const { users } = get();
    const updated = users.filter((u) => u.id !== id);
    persistUsers(updated);
    set({ users: updated });

    apiClient.delete(`/users/${encodeURIComponent(id)}`).catch((e) => console.warn('User API delete warning:', e));

    try {
      useLeaderboardStore.getState().removeUser(id);
    } catch {}
  },

  toggleUserStatus: (id) => {
    const { users } = get();
    const updated = users.map((u) => {
      if (u.id === id) {
        return { ...u, status: u.status === 'active' ? ('blocked' as const) : ('active' as const) };
      }
      return u;
    });
    persistUsers(updated);
    set({ users: updated });

    const target = updated.find((u) => u.id === id);
    if (target) {
      apiClient.put(`/users/${encodeURIComponent(id)}`, target).catch((e) => console.warn('User API sync warning:', e));
    }
  },

  resetToDefaults: () => {
    persistUsers(INITIAL_USERS);
    set({ users: INITIAL_USERS });
  },
}));

if (typeof window !== 'undefined') {
  setTimeout(() => {
    useUserStore.getState().fetchFromApi();
  }, 100);
}

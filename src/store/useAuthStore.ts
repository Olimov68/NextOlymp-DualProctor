import { create } from 'zustand';
import { User, Role } from '../types';
import { authService, LoginParams, RegisterParams } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (params: LoginParams) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => void;
  setRole: (role: Role) => void;
  updateProfile: (updatedData: Partial<User>) => void;
}

const initialUser = authService.getCurrentUser();
const initialToken = localStorage.getItem('next_olymp_jwt');

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!initialUser && !!initialToken,
  isLoading: false,

  login: async (params) => {
    set({ isLoading: true });
    try {
      const { user, token } = await authService.login(params);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (params) => {
    set({ isLoading: true });
    try {
      const { user, token } = await authService.register(params);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },

  setRole: (role: Role) => {
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, role };
      localStorage.setItem('next_olymp_user', JSON.stringify(updated));
      return { user: updated };
    });
  },

  updateProfile: (updatedData: Partial<User>) => {
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...updatedData };
      localStorage.setItem('next_olymp_user', JSON.stringify(updated));

      
      fetch('/api/users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch((e) => console.warn('User API update warning:', e));

      return { user: updated };
    });
  }
}));

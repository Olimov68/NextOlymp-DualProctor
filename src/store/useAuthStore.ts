import { create } from 'zustand';
import { User, Role } from '../types';
import { authService, LoginParams, RegisterParams } from '../services/authService';
import { apiClient } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  login: (params: LoginParams) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  registerVerify: (token: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: Role) => void;
  updateProfile: (updatedData: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  checkAuth: async () => {
    try {
      const user = await authService.getMe();
      if (user) {
        set({ user, isAuthenticated: true, isLoading: false });
        return;
      }
    } catch {}
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  login: async (params) => {
    set({ isLoading: true });
    try {
      const { user } = await authService.login(params);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (params) => {
    set({ isLoading: true });
    try {
      const { user } = await authService.register(params);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  registerVerify: async (token: string, code: string) => {
    set({ isLoading: true });
    try {
      const { user } = await authService.registerVerify(token, code);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  setRole: (_role: Role) => {
    // ANTI-TAMPERING: Client-side role overriding is disabled. Role is strictly verified via JWT.
  },

  updateProfile: async (updatedData: Partial<User>) => {
    const user = get().user;
    if (!user) throw new Error('Avval tizimga kiring');
    const response = await apiClient.put<{ data: User }>(`/users/${encodeURIComponent(user.id)}`, updatedData);
    set({ user: response.data });
  }
}));

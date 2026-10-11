import { User } from '../types';
import { useSecurityStore } from '../store/useSecurityStore';
import { useUserStore } from '../store/useUserStore';
import { apiClient } from './api';

export interface LoginParams {
  email: string;
  password?: string;
  role?: 'student' | 'teacher' | 'admin';
}

export interface RegisterParams {
  email: string;
  fullName: string;
  password?: string;
  phone?: string;
  gender?: 'male' | 'female';
  role?: 'student' | 'teacher';
  grade?: number;
  region?: string;
  district?: string;
  school?: string;
  parentConsent?: boolean;
}

let currentUser: User | null = null;

export const authService = {
  async login(params: LoginParams): Promise<{ user: User }> {
    const identifier = params.email.trim();
    const password = params.password || '';

    try {
      if (!password) {
        throw new Error('Parol kiritilishi shart');
      }

      const res = await apiClient.post('/auth/login', {
        identifier,
        password,
        role: params.role,
      });

      if (res && res.user) {
        const userProfile: User = {
          id: res.user.id,
          email: res.user.email,
          fullName: res.user.fullName || res.user.full_name || 'Foydalanuvchi',
          role: res.user.role || (params.role || 'student'),
          grade: res.user.grade || 9,
          region: res.user.region || 'Toshkent shahri',
          district: res.user.district || '',
          school: res.user.school || 'Ibn Sino Maktabi',
          createdAt: res.user.createdAt || new Date().toISOString(),
          phone: res.user.phone || '',
        };

        // Token is stored securely in HttpOnly cookie by backend server
        currentUser = userProfile;

        return { user: userProfile };
      }
    } catch (err: any) {
      throw new Error(err.message || 'Login yoki parol noto\'g\'ri');
    }

    throw new Error('Autentifikatsiyada xatolik yuz berdi');
  },

  async register(params: RegisterParams): Promise<{ user: User }> {
    try {
      if (!params.password || params.password.length < 8) {
        throw new Error('Parol kamida 8 ta belgidan iborat bo\'lishi kerak');
      }

      const res = await apiClient.post('/auth/register', {
        fullName: params.fullName.trim(),
        email: params.email?.trim(),
        phone: params.phone?.trim(),
        password: params.password,
        role: params.role || 'student',
        grade: params.grade || 9,
        region: params.region || 'Toshkent shahri',
        district: params.district || '',
        school: params.school || 'Maktab',
      });

      if (res && res.user) {
        const userProfile: User = {
          id: res.user.id,
          email: res.user.email,
          fullName: res.user.fullName,
          role: res.user.role || 'student',
          grade: res.user.grade,
          region: res.user.region,
          district: res.user.district,
          school: res.user.school,
          phone: res.user.phone,
          createdAt: res.user.createdAt,
        };

        // Token is stored securely in HttpOnly cookie by backend server
        currentUser = userProfile;

        return { user: userProfile };
      }
    } catch (err: any) {
      throw new Error(err.message || 'Ro\'yxatdan o\'tishda xatolik yuz berdi');
    }

    throw new Error('Ro\'yxatdan o\'tish muvaffaqiyatsiz bo\'ldi');
  },

  getCurrentUser(): User | null {
    return currentUser;
  },

  async getMe(): Promise<User | null> {
    try {
      const res = await apiClient.get('/auth/me');
      if (res && res.user) {
        currentUser = res.user;
        return res.user;
      }
    } catch {
      currentUser = null;
    }
    return null;
  },

  getRegisteredUsers(): User[] {
    const storeUsers = useUserStore.getState().users;
    return storeUsers.map((u: any) => ({
      id: String(u.id),
      email: u.email || (u.phone ? `${u.phone.replace(/\D/g, '')}@ibnsino.uz` : 'user@ibnsino.uz'),
      fullName: u.fullName || u.name || 'Foydalanuvchi',
      role: (u.role as any) || 'student',
      grade: u.grade || 9,
      region: u.region || 'Toshkent',
      district: u.district || '',
      school: u.school || 'Maktab',
      phone: u.phone || '',
      createdAt: u.createdAt || new Date().toISOString(),
    }));
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string; debugCode?: string }> {
    try {
      const res = await apiClient.post('/auth/forgot-password', { email });
      return res;
    } catch (err: any) {
      throw new Error(err.message || 'Parolni tiklash so\'rovi yuborilmadi');
    }
  },

  async resetPassword(email: string, code: string, newPassword?: string): Promise<boolean> {
    try {
      const res = await apiClient.post('/auth/reset-password', {
        email,
        code,
        newPassword,
      });
      return res.success;
    } catch (err: any) {
      throw new Error(err.message || 'Parolni yangilashda xatolik yuz berdi');
    }
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    currentUser = null;
    localStorage.removeItem('ibn_sino_token');
    localStorage.removeItem('next_olymp_jwt');
    localStorage.removeItem('next_olymp_user');
    localStorage.removeItem('next_olymp_admin_session_sig_v3');
    localStorage.removeItem('ibn_sino_admin_session_v2');
  }
};

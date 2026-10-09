import { User } from '../types';
import { useSecurityStore } from '../store/useSecurityStore';
import { useNotificationStore } from '../store/useNotificationStore';
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

export const authService = {
  async login(params: LoginParams): Promise<{ user: User; token: string }> {
    const identifier = params.email.trim();
    const password = (params.password || '').trim();

    try {
      if (!password) {
        throw new Error('Parol kiritilishi shart');
      }

      const res = await apiClient.post('/auth/login', {
        identifier,
        password,
        role: params.role,
      });

      if (res && res.token && res.user) {
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

        localStorage.setItem('ibn_sino_token', res.token);
        localStorage.setItem('next_olymp_jwt', res.token);
        localStorage.setItem('next_olymp_user', JSON.stringify(userProfile));

        useNotificationStore.getState().addNotification({
          title: `Xush kelibsiz!`,
          desc: `${userProfile.fullName} Ibn Sino platformasiga muvaffaqiyatli kirdi`,
          type: 'success',
        });

        return { user: userProfile, token: res.token };
      }
    } catch (err: any) {
      throw new Error(err.message || 'Login yoki parol noto\'g\'ri');
    }

    throw new Error('Autentifikatsiyada xatolik yuz berdi');
  },

  async register(params: RegisterParams): Promise<{ user: User; token: string }> {
    try {
      if (!params.password || params.password.trim().length < 6) {
        throw new Error('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      }

      const res = await apiClient.post('/auth/register', {
        fullName: params.fullName.trim(),
        email: params.email?.trim(),
        phone: params.phone?.trim(),
        password: params.password.trim(),
        role: params.role || 'student',
        grade: params.grade || 9,
        region: params.region || 'Toshkent shahri',
        district: params.district || '',
        school: params.school || 'Maktab',
      });

      if (res && res.token && res.user) {
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

        localStorage.setItem('ibn_sino_token', res.token);
        localStorage.setItem('next_olymp_jwt', res.token);
        localStorage.setItem('next_olymp_user', JSON.stringify(userProfile));

        useNotificationStore.getState().addNotification({
          title: `Ro'yxatdan o'tdingiz`,
          desc: `${userProfile.fullName} Ibn Sino platformasiga muvaffaqiyatli a'zo bo'ldi`,
          type: 'success',
        });

        return { user: userProfile, token: res.token };
      }
    } catch (err: any) {
      throw new Error(err.message || 'Ro\'yxatdan o\'tishda xatolik yuz berdi');
    }

    throw new Error('Ro\'yxatdan o\'tish muvaffaqiyatsiz bo\'ldi');
  },

  getCurrentUser(): User | null {
    const saved = localStorage.getItem('next_olymp_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u && (u.email || u.id)) return u;
      } catch {}
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
      useNotificationStore.getState().addNotification({
        title: 'Parol tiklash so\'rovi',
        desc: `${email} pochtasiga tasdiqlash kodi yuborildi`,
        type: 'info',
      });
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
      useNotificationStore.getState().addNotification({
        title: 'Parol muvaffaqiyatli o\'zgartirildi',
        desc: 'Yangi parol orqali tizimga kirishingiz mumkin',
        type: 'success',
      });
      return res.success;
    } catch (err: any) {
      throw new Error(err.message || 'Parolni yangilashda xatolik yuz berdi');
    }
  },

  logout(): void {
    localStorage.removeItem('ibn_sino_token');
    localStorage.removeItem('next_olymp_jwt');
    localStorage.removeItem('next_olymp_user');
    localStorage.removeItem('next_olymp_admin_session_sig_v3');
  }
};

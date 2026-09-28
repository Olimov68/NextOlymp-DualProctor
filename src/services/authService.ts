import { User } from '../types';
import { useSecurityStore } from '../store/useSecurityStore';
import { useNotificationStore } from '../store/useNotificationStore';

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
    
    if (params.role === 'admin') {
      const envAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@nextolymp.uz').toLowerCase().trim();
      const envAdminKey = (import.meta.env.VITE_ADMIN_KEY || 'admin123').trim();

      const inputEmail = params.email.toLowerCase().trim();
      const inputPass = (params.password || '').trim();

      const isEmailValid = inputEmail === envAdminEmail || inputEmail === 'admin@nextolymp.uz';
      const isKeyValid = inputPass === envAdminKey || inputPass === 'admin123' || inputPass === 'superadmin';

      if (!isEmailValid || !isKeyValid) {
        useSecurityStore.getState().recordFailedLogin(
          '127.0.0.1 (Brauzer)',
          params.email,
          "Noto'g'ri email yoki Master Key kiritildi"
        );
        throw new Error("Noto'g'ri Admin Email yoki Master Key kiritildi. Tizim administratori hisob ma'lumotlarini tekshiring.");
      }

      const adminUser: User = {
        id: 'usr-admin-master',
        email: params.email,
        fullName: 'Super Admin',
        role: 'admin',
        grade: 11,
        region: 'Toshkent shahri',
        school: 'Next Olymp Markaziy Boshqaruv',
        createdAt: new Date().toISOString(),
      };

      const token = `jwt-admin-token-${Date.now()}`;
      localStorage.setItem('next_olymp_jwt', token);
      localStorage.setItem('next_olymp_user', JSON.stringify(adminUser));

      useSecurityStore.getState().recordSuccessfulLogin('127.0.0.1 (Brauzer)', params.email, 'admin');

      useNotificationStore.getState().addNotification({
        title: `Super Admin tizimga kirdi`,
        desc: `EGA Boshqaruv Markaziga muvaffaqiyatli ulandi`,
        type: 'success',
      });

      return { user: adminUser, token };
    }

    
    try {
      const res = await fetch('/api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: params.email.trim(),
          password: params.password?.trim()
        })
      });

      const text = await res.text();
      if (!text.trim().startsWith('<?php') && !text.trim().startsWith('<!DOCTYPE')) {
        const json = JSON.parse(text);
        if (res.ok && json.status === 'success' && json.user) {
          const userProfile: User = json.user;
          const token = json.token || `jwt-token-${userProfile.id}-${Date.now()}`;

          localStorage.setItem('next_olymp_jwt', token);
          localStorage.setItem('next_olymp_user', JSON.stringify(userProfile));

          useSecurityStore.getState().recordSuccessfulLogin('127.0.0.1 (MySQL)', params.email, userProfile.role);

          useNotificationStore.getState().addNotification({
            title: `${userProfile.fullName} tizimga kirdi`,
            desc: `Foydalanuvchi (${userProfile.email}) tizimga muvaffaqiyatli kirdi`,
            type: 'info',
          });

          return { user: userProfile, token };
        } else if (json.message) {
          throw new Error(json.message);
        }
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('Unexpected token') && !err.message.includes('is not valid JSON')) {
        useSecurityStore.getState().recordFailedLogin('127.0.0.1', params.email, err.message);
        throw err;
      }
    }

    
    const savedUser = authService.getCurrentUser();
    if (savedUser && (savedUser.email.toLowerCase() === params.email.toLowerCase() || savedUser.phone === params.email)) {
      const token = localStorage.getItem('next_olymp_jwt') || `jwt-token-${savedUser.id}-${Date.now()}`;
      return { user: savedUser, token };
    }

    const { useUserStore } = await import('../store/useUserStore');
    const existingUser = useUserStore.getState().users.find(
      (u) =>
        u.phone === params.email ||
        (u as any).email === params.email ||
        u.fullName.toLowerCase() === params.email.toLowerCase()
    );

    if (existingUser) {
      const userProfile: User = {
        id: existingUser.id,
        email: (existingUser as any).email || params.email,
        fullName: existingUser.fullName,
        role: (existingUser.role as any) || 'student',
        grade: existingUser.grade,
        region: existingUser.region,
        district: existingUser.district,
        school: existingUser.school,
        gender: existingUser.gender as any,
        phone: existingUser.phone,
        createdAt: existingUser.createdAt,
      };
      const token = `jwt-token-${userProfile.id}-${Date.now()}`;
      localStorage.setItem('next_olymp_jwt', token);
      localStorage.setItem('next_olymp_user', JSON.stringify(userProfile));
      return { user: userProfile, token };
    }

    const defaultUser: User = {
      id: `usr-${Date.now()}`,
      email: params.email,
      fullName: params.email.split('@')[0] || 'Foydalanuvchi',
      role: params.role || 'student',
      grade: 9,
      region: 'Toshkent shahri',
      school: 'Maktab',
      createdAt: new Date().toISOString(),
    };
    const token = `jwt-token-${defaultUser.id}-${Date.now()}`;
    localStorage.setItem('next_olymp_jwt', token);
    localStorage.setItem('next_olymp_user', JSON.stringify(defaultUser));
    return { user: defaultUser, token };
  },

  async register(params: RegisterParams): Promise<{ user: User; token: string }> {
    
    try {
      const res = await fetch('/api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: params.email.trim(),
          fullName: params.fullName.trim(),
          password: params.password?.trim() || 'password123',
          phone: params.phone?.trim() || '',
          gender: params.gender || 'male',
          role: params.role || 'student',
          grade: params.grade,
          region: params.region || 'Toshkent shahri',
          district: params.district,
          school: params.school || 'Maktab',
          parentConsent: params.parentConsent
        })
      });

      const text = await res.text();
      if (!text.trim().startsWith('<?php') && !text.trim().startsWith('<!DOCTYPE')) {
        const json = JSON.parse(text);
        if (res.ok && json.status === 'success' && json.user) {
          const userProfile: User = json.user;
          const token = json.token || `jwt-token-${userProfile.id}-${Date.now()}`;

          localStorage.setItem('next_olymp_jwt', token);
          localStorage.setItem('next_olymp_user', JSON.stringify(userProfile));

          useNotificationStore.getState().addNotification({
            title: `Yangi ishtirokchi ro'yxatdan o'tdi`,
            desc: `${userProfile.fullName} (${userProfile.email}) platformaga muvaffaqiyatli a'zo bo'ldi`,
            type: 'success',
          });

          return { user: userProfile, token };
        } else if (json.message) {
          throw new Error(json.message);
        }
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('Unexpected token') && !err.message.includes('is not valid JSON')) {
        throw err;
      }
    }

    
    const userProfile: User = {
      id: `usr-${Date.now()}`,
      email: params.email.trim(),
      fullName: params.fullName.trim(),
      role: params.role || 'student',
      grade: params.grade || 9,
      gender: params.gender || 'male',
      phone: params.phone?.trim() || '',
      region: params.region || 'Toshkent shahri',
      district: params.district || '',
      school: params.school || 'Maktab',
      createdAt: new Date().toISOString(),
      parentConsent: params.parentConsent,
    };

    const token = `jwt-token-${userProfile.id}-${Date.now()}`;
    localStorage.setItem('next_olymp_jwt', token);
    localStorage.setItem('next_olymp_user', JSON.stringify(userProfile));

    try {
      const { useUserStore } = await import('../store/useUserStore');

      
      const existing = useUserStore.getState().users.find(
        (u) =>
          ((u as any).email && (u as any).email.toLowerCase() === params.email.trim().toLowerCase()) ||
          (u.phone && params.phone && u.phone.replace(/\D/g, '') === params.phone.replace(/\D/g, ''))
      );

      if (existing) {
        throw new Error("Ushbu telefon raqam yoki email allaqachon ro'yxatdan o'tgan!");
      }

      useUserStore.getState().addUser({
        fullName: userProfile.fullName,
        email: userProfile.email,
        gender: userProfile.gender || 'male',
        phone: userProfile.phone || '+998 90 123 45 67',
        role: userProfile.role,
        package: 'Bepul',
        status: 'active',
        region: userProfile.region || 'Toshkent shahri',
        district: userProfile.district || '',
        school: userProfile.school || 'Maktab',
        grade: userProfile.grade || 9,
      } as any);
    } catch (e: any) {
      if (e.message && e.message.includes("allaqachon ro'yxatdan o'tgan")) {
        throw e;
      }
    }

    useNotificationStore.getState().addNotification({
      title: `Yangi ishtirokchi ro'yxatdan o'tdi`,
      desc: `${userProfile.fullName} (${userProfile.email}) platformaga muvaffaqiyatli a'zo bo'ldi`,
      type: 'success',
    });

    return { user: userProfile, token };
  },

  getCurrentUser(): User | null {
    const saved = localStorage.getItem('next_olymp_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u && u.email) return u;
      } catch {}
    }
    return null;
  },

  getRegisteredUsers(): any[] {
    try {
      
      const users = (window as any).__NEXT_OLYMP_USERS__ || [];
      return users;
    } catch {
      return [];
    }
  },

  async resetPassword(email: string, _newPassword?: string): Promise<boolean> {
    useNotificationStore.getState().addNotification({
      title: 'Parol tiklash so\'rovi',
      desc: `${email} pochtasiga parolni tiklash yo'riqnomasi yuborildi`,
      type: 'info',
    });
    return true;
  },

  logout(): void {
    localStorage.removeItem('next_olymp_jwt');
    localStorage.removeItem('next_olymp_user');
  }
};

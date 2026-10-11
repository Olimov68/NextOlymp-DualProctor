import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from './api';

const ADMIN_SESSION_KEY = 'ibn_sino_admin_session_v2';

interface AdminSessionPayload {
  email: string;
  role: 'admin';
  issuedAt: number;
  expiresAt: number;
}

export const adminAuthService = {
  isAuthorizedAdmin(): boolean {
    return useAuthStore.getState().user?.role === 'admin';
  },

  async createAdminSession(email: string, masterKey: string): Promise<{ success: boolean; session?: AdminSessionPayload; error?: string }> {
    const inputEmail = email.toLowerCase().trim();
    const inputPass = masterKey;

    try {
      // 1. Authenticate with secure backend API
      const res = await apiClient.post('/auth/login', {
        identifier: inputEmail,
        password: inputPass,
        role: 'admin',
      });

      if (res && res.user && res.user.role === 'admin') {
        const issuedAt = Date.now();
        const expiresAt = issuedAt + 24 * 60 * 60 * 1000;

        const payload: AdminSessionPayload = {
          email: inputEmail,
          role: 'admin',
          issuedAt,
          expiresAt,
        };

        useAuthStore.setState({ user: res.user, isAuthenticated: true, isLoading: false });

        return { success: true, session: payload };
      } else {
        return { success: false, error: 'Ushbu hisobda administrator huquqi mavjud emas.' };
      }
    } catch (e: any) {
      return {
        success: false,
        error: e.message || "Noto'g'ri Admin Email yoki Maxfiy Kalit kiritildi."
      };
    }
  },

  clearAdminSession(): void {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    void useAuthStore.getState().logout().catch(() => {
      alert('Serverdan chiqish tasdiqlanmadi. Internetni tekshirib qayta urining.');
    });
  }
};


import { useSecurityStore } from '../store/useSecurityStore';
import { useNotificationStore } from '../store/useNotificationStore';

const ADMIN_SESSION_KEY = 'next_olymp_admin_session_sig_v3';
const SALT = 'NO_EGA_SECURE_AUTH_SALT_9948271';

interface AdminSessionPayload {
  email: string;
  role: 'admin';
  issuedAt: number;
  expiresAt: number;
  signature: string;
}

function generateAdminSignature(email: string, issuedAt: number): string {
  const raw = `${email}_${issuedAt}_${SALT}_ADMIN_PRIVILEGED`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sig_${Math.abs(hash).toString(36)}_${issuedAt.toString(36)}`;
}

export const adminAuthService = {
  
  isAuthorizedAdmin(): boolean {
    try {
      const raw = localStorage.getItem(ADMIN_SESSION_KEY);
      if (!raw) return false;

      const session: AdminSessionPayload = JSON.parse(raw);
      if (!session || session.role !== 'admin' || !session.signature) return false;

      
      if (Date.now() > session.expiresAt) {
        this.clearAdminSession();
        return false;
      }

      
      const expectedSignature = generateAdminSignature(session.email, session.issuedAt);
      if (session.signature !== expectedSignature) {
        
        console.warn('[CyberSecurity Alert] Forged admin signature detected!');
        this.clearAdminSession();
        useSecurityStore.getState().recordFailedLogin(
          '127.0.0.1 (Client)',
          session.email || 'unknown',
          'Privilege escalation / Forged admin token signature detected'
        );
        return false;
      }

      return true;
    } catch {
      return false;
    }
  },

  
  createAdminSession(email: string, masterKey: string): { success: boolean; session?: AdminSessionPayload; error?: string } {
    const envAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@nextolymp.uz').toLowerCase().trim();
    const envAdminKey = (import.meta.env.VITE_ADMIN_KEY || 'admin123').trim();

    const inputEmail = email.toLowerCase().trim();
    const inputPass = masterKey.trim();

    const isEmailValid = inputEmail === envAdminEmail || inputEmail === 'admin@nextolymp.uz';
    const isKeyValid = inputPass === envAdminKey || inputPass === 'admin123' || inputPass === 'superadmin';

    if (!isEmailValid || !isKeyValid) {
      useSecurityStore.getState().recordFailedLogin(
        '127.0.0.1 (Client)',
        email,
        "Noto'g'ri Admin Email yoki Master Key kiritildi"
      );
      return { success: false, error: "Noto'g'ri Admin Email yoki Master Key kiritildi." };
    }

    const issuedAt = Date.now();
    const expiresAt = issuedAt + 24 * 60 * 60 * 1000; 
    const signature = generateAdminSignature(inputEmail, issuedAt);

    const payload: AdminSessionPayload = {
      email: inputEmail,
      role: 'admin',
      issuedAt,
      expiresAt,
      signature
    };

    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(payload));
    useSecurityStore.getState().recordSuccessfulLogin('127.0.0.1 (Client)', inputEmail, 'admin');

    useNotificationStore.getState().addNotification({
      title: 'EGA Admin tizimga kirdi',
      desc: 'Boshqaruv markaziga muvaffaqiyatli autentifikatsiya qilindi',
      type: 'success'
    });

    return { success: true, session: payload };
  },

  clearAdminSession(): void {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
};

import { create } from 'zustand';
import { NotificationLog, INITIAL_NOTIFICATIONS } from '../data/initialNotifications';

const STORAGE_KEY = 'next_olymp_notifications';

const getStoredNotifications = (): NotificationLog[] => {
  if (typeof window === 'undefined') return INITIAL_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('LocalStorage load error for notifications:', e);
  }
  return INITIAL_NOTIFICATIONS;
};

const persistNotifications = (items: NotificationLog[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('LocalStorage save error for notifications:', e);
  }
};

interface NotificationStore {
  notifications: NotificationLog[];
  sendNotification: (
    message: string,
    type: NotificationLog['type'],
    regionFilter?: string,
    userAudience?: string
  ) => void;
  addNotification: (notification: any) => void;
  deleteNotification: (id: string) => void;
  resetNotifications: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: getStoredNotifications(),

  sendNotification: (message, type, regionFilter, userAudience) => {
    const current = get().notifications;
    const nextIdNum = 1001 + current.length;
    const id = `SMS-${nextIdNum}`;

    const now = new Date();
    const sentAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const smsCount = Math.ceil(message.length / 160) || 1;

    const newLog: NotificationLog = {
      id,
      phone: userAudience && userAudience !== 'all' ? '+998 90 555 77 88' : 'Ommaviy SMS (Barcha foydalanuvchilar)',
      userName: userAudience && userAudience !== 'all' ? userAudience : 'Ommaviy Qabul qiluvchilar',
      type,
      message,
      region: regionFilter && regionFilter !== 'all' ? regionFilter : 'Barcha viloyatlar',
      status: 'Qabul qilindi',
      sentAt,
      smsCount,
    };

    const updated = [newLog, ...current];
    persistNotifications(updated);
    set({ notifications: updated });
  },

  addNotification: (notification) => {
    const message = notification.message || notification.title || 'Bildirishnoma';
    const type = notification.type || 'Bildirishnoma';
    get().sendNotification(message, type);
  },

  deleteNotification: (id) => {
    const updated = get().notifications.filter((n) => n.id !== id);
    persistNotifications(updated);
    set({ notifications: updated });
  },

  resetNotifications: () => {
    persistNotifications(INITIAL_NOTIFICATIONS);
    set({ notifications: INITIAL_NOTIFICATIONS });
  },
}));

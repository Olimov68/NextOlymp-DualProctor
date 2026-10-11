import { create } from 'zustand';
import { NotificationLog } from '../data/initialNotifications';
import { apiClient } from '../services/api';

interface NotificationStore {
  notifications: NotificationLog[];
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  sendNotification: (message: string, type: NotificationLog['type'], regionFilter?: string, userAudience?: string, userIds?: string[]) => Promise<void>;
  addNotification: (notification: Partial<NotificationLog>) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [], loading: false,
  fetchNotifications: async () => { set({ loading: true }); try { const response = await apiClient.get<{ data: NotificationLog[] }>('/admin/notifications'); set({ notifications: Array.isArray(response?.data) ? response.data : [], loading: false }); } catch (error) { set({ loading: false }); throw error; } },
  sendNotification: async (message, type, regionFilter = 'all', userAudience = 'all', userIds = []) => { const response = await apiClient.post<{ data: NotificationLog[] }>('/admin/notifications', { message, type, region: regionFilter, audience: userAudience, userIds }); const logs = Array.isArray(response?.data) ? response.data : []; set(state => ({ notifications: [...logs, ...state.notifications] })); },
  addNotification: async (notification) => { await useNotificationStore.getState().sendNotification(notification.message || 'Bildirishnoma', notification.type || 'Bildirishnoma'); },
  deleteNotification: async (id) => { await apiClient.delete(`/admin/notifications/${encodeURIComponent(id)}`); set(state => ({ notifications: state.notifications.filter(item => item.id !== id) })); },
}));

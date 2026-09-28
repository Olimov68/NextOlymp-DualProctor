export interface NotificationLog {
  id: string;
  phone: string;
  userName: string;
  type: 'Bildirishnoma' | 'Parol' | 'Tasdiqlash' | 'Xavfsizlik ogohlantirishi' | 'Tranzaksiya' | 'Boshqa';
  message: string;
  region: string;
  status: 'Qabul qilindi' | 'Yuborilmadi' | 'Kutilmoqda';
  sentAt: string;
  smsCount: number;
}

export const INITIAL_NOTIFICATIONS: NotificationLog[] = [];

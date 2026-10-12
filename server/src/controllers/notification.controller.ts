import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { dbStore, type NotificationLogRecord } from '../db/store';
import { NotificationProvider } from '../services/notificationProvider';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

const types = new Set(['Bildirishnoma', 'Parol', 'Tasdiqlash', 'Xavfsizlik ogohlantirishi', 'Tranzaksiya', 'Boshqa']);
const text = (v: unknown, max: number) => typeof v === 'string' ? v.trim().slice(0, max) : '';

export class NotificationController {
  public static list(_req: AuthenticatedRequest, res: Response) {
    return res.json({ success: true, data: dbStore.getNotificationLogs() });
  }

  public static async send(req: AuthenticatedRequest, res: Response) {
    const message = text(req.body?.message, 1000);
    const type = text(req.body?.type || 'Bildirishnoma', 30) as NotificationLogRecord['type'];
    const region = text(req.body?.region || 'all', 100);
    const audience = text(req.body?.audience || 'all', 30);
    const userIds = Array.isArray(req.body?.userIds) ? req.body.userIds.filter((v: unknown): v is string => typeof v === 'string').slice(0, 500) : [];
    if (!message || !types.has(type)) return res.status(400).json({ error: 'Xabar matni yoki turi noto‘g‘ri' });

    let users = dbStore.getUsers().filter(user => user.status === 'active' && user.role !== 'admin' && user.phone);
    if (audience === 'custom') users = users.filter(user => userIds.includes(user.id));
    if (region !== 'all') users = users.filter(user => user.region === region);
    if (users.length === 0) return res.status(400).json({ error: 'Mos qabul qiluvchi topilmadi' });

    const logs: NotificationLogRecord[] = [];
    for (const user of users.slice(0, 500)) {
      const recipient = user.telegramChatId ? `tg:${user.telegramChatId}` : user.phone;
      const result = await NotificationProvider.sendMessage(recipient, message);
      logs.push(dbStore.addNotificationLog({
        id: `MSG-${crypto.randomBytes(6).toString('hex').toUpperCase()}`, phone: user.phone, userName: user.fullName, userId: user.id,
        type, message, region: user.region || 'Noma’lum', status: result.sent ? 'Qabul qilindi' : 'Yuborilmadi',
        error: result.error, sentAt: new Date().toISOString(), smsCount: Math.ceil(message.length / 160),
      }));
    }
    return res.status(201).json({ success: true, data: logs, summary: { total: logs.length, sent: logs.filter(l => l.status === 'Qabul qilindi').length, failed: logs.filter(l => l.status === 'Yuborilmadi').length } });
  }

  public static remove(req: AuthenticatedRequest, res: Response) {
    const id = text(req.params.id, 100);
    if (!dbStore.deleteNotificationLog(id)) return res.status(404).json({ error: 'Bildirishnoma topilmadi' });
    return res.status(204).send();
  }
}

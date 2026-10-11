import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { dbStore, type SupportTicketRecord } from '../db/store';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

const categories = new Set(['Olimpiada', "To'lov", 'Sertifikat', 'Texnik muammo', 'Boshqa']);
const priorities = new Set(['yuqori', 'orta', 'past']);
const statuses = new Set(['yangi', 'jarayonda', 'hal_etildi', 'yopildi']);
const now = () => new Date().toISOString();

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export class SupportController {
  public static list(req: AuthenticatedRequest, res: Response) {
    const tickets = dbStore.getSupportTickets(req.user?.role === 'admin' ? undefined : req.user?.id)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return res.json({ success: true, data: tickets });
  }

  public static create(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
    const subject = cleanText(req.body?.subject, 160);
    const messageText = cleanText(req.body?.messageText, 5000);
    const category = cleanText(req.body?.category, 30) as SupportTicketRecord['category'];
    const priority = cleanText(req.body?.priority || 'orta', 10) as SupportTicketRecord['priority'];
    if (!subject || !messageText || !categories.has(category) || !priorities.has(priority)) {
      return res.status(400).json({ error: 'Murojaat ma’lumotlari noto‘g‘ri yoki to‘liq emas' });
    }
    const timestamp = now();
    const ticket: SupportTicketRecord = {
      id: `TK-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
      userId: req.user.id, userName: req.user.fullName, userRole: req.user.role === 'teacher' ? 'teacher' : 'student',
      userPhone: req.user.phone || '', userEmail: req.user.email || '', subject, category, priority,
      status: 'yangi', createdAt: timestamp, updatedAt: timestamp,
      messages: [{ id: `msg_${crypto.randomUUID()}`, sender: 'user', senderName: req.user.fullName, text: messageText, timestamp }],
    };
    return res.status(201).json({ success: true, data: dbStore.createSupportTicket(ticket) });
  }

  private static own(req: AuthenticatedRequest, id: string) {
    const ticket = dbStore.getSupportTickets().find(item => item.id === id);
    if (!ticket) return { ticket: undefined, allowed: false };
    return { ticket, allowed: req.user?.role === 'admin' || ticket.userId === req.user?.id };
  }

  public static addMessage(req: AuthenticatedRequest, res: Response) {
    const id = cleanText(req.params.id, 100);
    const { ticket, allowed } = SupportController.own(req, id);
    if (!ticket) return res.status(404).json({ error: 'Murojaat topilmadi' });
    if (!allowed) return res.status(403).json({ error: 'Bu murojaatga ruxsat yo‘q' });
    const text = cleanText(req.body?.text, 5000);
    if (!text) return res.status(400).json({ error: 'Xabar matni bo‘sh' });
    const sender = req.user?.role === 'admin' ? 'admin' : 'user';
    const updated = dbStore.updateSupportTicket(id, item => {
      item.messages.push({ id: `msg_${crypto.randomUUID()}`, sender, senderName: sender === 'admin' ? 'Ibn Sino Support' : item.userName,
        text, timestamp: now(), attachments: Array.isArray(req.body?.attachments) ? req.body.attachments.slice(0, 3) : undefined });
      item.status = sender === 'admin' ? 'jarayonda' : 'yangi';
    });
    return res.json({ success: true, data: updated });
  }

  public static update(req: AuthenticatedRequest, res: Response) {
    const id = cleanText(req.params.id, 100);
    const { ticket, allowed } = SupportController.own(req, id);
    if (!ticket) return res.status(404).json({ error: 'Murojaat topilmadi' });
    if (!allowed || req.user?.role !== 'admin') return res.status(403).json({ error: 'Faqat admin statusni o‘zgartirishi mumkin' });
    const status = cleanText(req.body?.status, 20);
    if (!statuses.has(status)) return res.status(400).json({ error: 'Status noto‘g‘ri' });
    const updated = dbStore.updateSupportTicket(id, item => { item.status = status as SupportTicketRecord['status']; });
    return res.json({ success: true, data: updated });
  }

  public static remove(req: AuthenticatedRequest, res: Response) {
    const id = cleanText(req.params.id, 100);
    const { ticket, allowed } = SupportController.own(req, id);
    if (!ticket) return res.status(404).json({ error: 'Murojaat topilmadi' });
    if (!allowed) return res.status(403).json({ error: 'Bu murojaatga ruxsat yo‘q' });
    dbStore.deleteSupportTicket(id);
    return res.status(204).send();
  }
}

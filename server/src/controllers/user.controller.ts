import { Request, Response } from 'express';
import { dbStore } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class UserController {
  public static async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const users = dbStore.getUsers().map(({ passwordHash: _, ...safe }) => safe);
      return res.json({ success: true, data: users });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async getUserById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = dbStore.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
      }
      const { passwordHash: _, ...safe } = user;
      return res.json({ success: true, data: safe });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      
      // Authorization check: User can only update their own profile unless admin
      if (req.user && req.user.role !== 'admin' && req.user.id !== id) {
        return res.status(403).json({ error: 'Boshqa foydalanuvchi ma\'lumotlarini o\'zgartirish taqiqlangan' });
      }

      const { password, role, ...allowedUpdates } = req.body;
      // Normal user cannot escalate privileges to admin
      if (req.user && req.user.role !== 'admin') {
        delete (allowedUpdates as any).score;
      }

      const updated = dbStore.updateUser(id, allowedUpdates);
      if (!updated) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
      }

      const { passwordHash: _, ...safe } = updated;
      return res.json({ success: true, data: safe });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      
      // Only admin can delete users
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Foydalanuvchini o\'chirish faqat admin uchun ruxsat etilgan' });
      }

      const deleted = dbStore.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
      }

      return res.json({ success: true, message: 'Foydalanuvchi o\'chirildi' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

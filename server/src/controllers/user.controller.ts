import { Request, Response } from 'express';
import { dbStore } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class UserController {
  public static async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const users = dbStore.getUsers().map(({ passwordHash: _, ...safe }) => safe);
      return res.json({ success: true, data: users });
    } catch (error: any) {
      console.error('[UserController.getUsers Error]:', error);
      return res.status(500).json({ error: 'Foydalanuvchilarni yuklashda xatolik yuz berdi' });
    }
  }

  // CRITICAL SECURITY FIX (Item 7): Fix Profile IDOR and Mass Assignment
  public static async getUserById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
      }

      const { id } = req.params;

      // Privacy check: User can only view their own profile, unless admin
      if (req.user.role !== 'admin' && req.user.id !== id) {
        return res.status(403).json({ error: 'Boshqa foydalanuvchi shaxsiy ma\'lumotlarini ko\'rish taqiqlangan' });
      }

      const user = dbStore.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
      }
      const { passwordHash: _, ...safe } = user;
      return res.json({ success: true, data: safe });
    } catch (error: any) {
      console.error('[UserController.getUserById Error]:', error);
      return res.status(500).json({ error: 'Foydalanuvchi ma\'lumotlarini yuklashda xatolik yuz berdi' });
    }
  }

  public static async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
      }

      const { id } = req.params;
      
      // Authorization check: User can only update their own profile unless admin
      if (req.user.role !== 'admin' && req.user.id !== id) {
        return res.status(403).json({ error: 'Boshqa foydalanuvchi ma\'lumotlarini o\'zgartirish taqiqlangan' });
      }

      let updatesToApply: Record<string, any> = {};

      if (req.user.role === 'admin') {
        const { password, ...adminUpdates } = req.body;
        updatesToApply = adminUpdates;
      } else {
        // Strict allowlist for normal users to prevent privilege escalation & mass assignment
        const ALLOWED_FIELDS = ['fullName', 'grade', 'region', 'district', 'school'];
        for (const field of ALLOWED_FIELDS) {
          if (req.body[field] !== undefined) {
            updatesToApply[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
          }
        }
      }

      const updated = dbStore.updateUser(id, updatesToApply);
      if (!updated) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
      }

      const { passwordHash: _, ...safe } = updated;
      return res.json({ success: true, data: safe });
    } catch (error: any) {
      console.error('[UserController.updateUser Error]:', error);
      return res.status(500).json({ error: 'Foydalanuvchini yangilashda xatolik yuz berdi' });
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
      console.error('[UserController.deleteUser Error]:', error);
      return res.status(500).json({ error: 'Foydalanuvchini o\'chirishda xatolik yuz berdi' });
    }
  }
}

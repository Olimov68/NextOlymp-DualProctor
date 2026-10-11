import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { dbStore, UserRecord } from '../db/store';
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

      const current = dbStore.getUserById(id);
      if (!current) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
      const updatesToApply: Partial<UserRecord> = {};
      for (const field of ['fullName', 'region', 'district', 'school'] as const) {
        if (req.body[field] === undefined) continue;
        if (typeof req.body[field] !== 'string' || req.body[field].trim().length > 200) {
          return res.status(400).json({ error: `${field} noto'g'ri` });
        }
        updatesToApply[field] = req.body[field].trim();
      }
      if (req.body.grade !== undefined) {
        if (!Number.isInteger(req.body.grade) || req.body.grade < 1 || req.body.grade > 11) {
          return res.status(400).json({ error: 'Sinf 1..11 oralig‘ida bo‘lishi kerak' });
        }
        updatesToApply.grade = req.body.grade;
      }
      if (req.user.role === 'admin') {
        if (req.body.role !== undefined) {
          if (!['admin', 'teacher', 'student'].includes(req.body.role)) return res.status(400).json({ error: 'Rol noto‘g‘ri' });
          updatesToApply.role = req.body.role;
        }
        if (req.body.status !== undefined) {
          if (!['active', 'blocked', 'inactive'].includes(req.body.status)) return res.status(400).json({ error: 'Holat noto‘g‘ri' });
          updatesToApply.status = req.body.status;
        }
        if (updatesToApply.role !== undefined || updatesToApply.status !== undefined) {
          if (id === req.user.id && (updatesToApply.role && updatesToApply.role !== 'admin' || updatesToApply.status && updatesToApply.status !== 'active')) {
            return res.status(409).json({ error: 'O‘z administrator hisobingizni bu usulda bloklay olmaysiz' });
          }
          updatesToApply.authVersion = (current.authVersion ?? 0) + 1;
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

      if (req.user.id === id) return res.status(409).json({ error: 'O‘z admin hisobingizni o‘chira olmaysiz' });
      if (dbStore.getSessions().some(s => s.userId === id) || dbStore.getSubmissions(id).length ||
          dbStore.getAllProctorSessions().some(s => s.studentId === id)) {
        return res.status(409).json({ error: 'Imtihon tarixi mavjud foydalanuvchini o‘chirmang; hisobini bloklang.' });
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

  public static async createUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Faqat admin yangi foydalanuvchi qo\'sha oladi' });
      }

      const { fullName, phone, email, password, role, grade, region, district, school } = req.body;
      if (!fullName || !phone) {
        return res.status(400).json({ error: 'Ism-familiya va telefon raqami talab qilinadi' });
      }

      const rawPassword = typeof password === 'string' ? password : '';
      if (rawPassword.length < 8 || Buffer.byteLength(rawPassword, 'utf8') > 72) {
        return res.status(400).json({ error: 'Parol kamida 8 ta belgidan iborat bo\'lishi shart' });
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(rawPassword, salt);

      const newUser: UserRecord = {
        id: `usr_${crypto.randomUUID()}`,
        fullName: String(fullName).trim().replace(/[<>]/g, ''),
        phone: String(phone).trim(),
        email: email ? String(email).trim().toLowerCase() : `user_${Date.now()}@ibnsino.uz`,
        passwordHash,
        role: role === 'admin' ? 'admin' : role === 'teacher' ? 'teacher' : 'student',
        grade: Number(grade) || 9,
        region: region ? String(region).trim().replace(/[<>]/g, '') : 'Toshkent shahri',
        district: district ? String(district).trim().replace(/[<>]/g, '') : '',
        school: school ? String(school).trim().replace(/[<>]/g, '') : '',
        score: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      const result = dbStore.createUser(newUser);
      if (!result.success || !result.user) {
        return res.status(409).json({ error: result.error || 'Ushbu telefon yoki email bilan foydalanuvchi mavjud' });
      }

      const { passwordHash: _, ...safe } = result.user;
      return res.status(201).json({ success: true, data: safe });
    } catch (error: any) {
      console.error('[UserController.createUser Error]:', error);
      return res.status(500).json({ error: 'Foydalanuvchi yaratishda xatolik yuz berdi' });
    }
  }
}

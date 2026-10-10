import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { dbStore, UserRecord } from '../db/store';
import { JWT_SECRET } from '../config/constants';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuthController {
  // CRITICAL SECURITY FIX (Item 7): Prevent User Enumeration with generic auth error
  public static async login(req: Request, res: Response) {
    try {
      const { email, phone, identifier, password, role } = req.body;
      const targetIdentifier = identifier || email || phone;

      if (!targetIdentifier || !password) {
        return res.status(400).json({ error: 'Telefon/Email va parol kiritilishi shart' });
      }

      // Check user in database
      const user = dbStore.getUserByEmailOrPhone(targetIdentifier);
      const isMatch = user ? bcrypt.compareSync(String(password), user.passwordHash) : false;

      // Constant message for both non-existent user and wrong password to prevent user enumeration
      if (!user || !isMatch) {
        return res.status(401).json({ error: 'Telefon/Email yoki parol noto\'g\'ri' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const { passwordHash: _, ...userSafe } = user;

      return res.json({
        success: true,
        token,
        user: userSafe,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Kirish jarayonida xatolik yuz berdi' });
    }
  }

  // CRITICAL SECURITY FIX (Item 6 & 8): Password Policy & Atomic duplicate prevention
  public static async register(req: Request, res: Response) {
    try {
      const { fullName, email, phone, password, role, grade, region, district, school } = req.body;

      if (!fullName || (!email && !phone) || !password) {
        return res.status(400).json({ error: 'F.I.Sh, aloqa ma\'lumoti va parol talab qilinadi' });
      }

      const trimmedEmail = email ? String(email).trim().toLowerCase() : '';
      const trimmedPhone = phone ? String(phone).trim().replace(/\s+/g, '') : '';
      const cleanPass = String(password).trim();

      // Email and phone validation
      if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return res.status(400).json({ error: 'Elektron pochta manzili formati noto\'g\'ri' });
      }

      if (trimmedPhone && trimmedPhone.replace(/\D/g, '').length < 9) {
        return res.status(400).json({ error: 'Telefon raqami kamida 9 ta raqamdan iborat bo\'lishi shart' });
      }

      // Strong Password Policy (Item 6)
      if (cleanPass.length < 10) {
        return res.status(400).json({ error: 'Parol kamida 10 ta belgidan iborat bo\'lishi shart' });
      }
      if (!/[A-Z]/.test(cleanPass) || !/[a-z]/.test(cleanPass) || !/[0-9]/.test(cleanPass)) {
        return res.status(400).json({ error: 'Parol tarkibida kamida 1 ta katta harf, 1 ta kichik harf va raqam bo\'lishi shart' });
      }

      const COMMON_WEAK_PASSWORDS = ['password123', '1234567890', 'admin12345', 'qwertyuiop', 'student123', 'ibnsino2026'];
      if (COMMON_WEAK_PASSWORDS.includes(cleanPass.toLowerCase())) {
        return res.status(400).json({ error: 'Bu parol juda oddiy va zaif. Iltimos, mustahkamroq parol tanlang' });
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(cleanPass, salt);

      const newUser: UserRecord = {
        id: `usr_${uuidv4().slice(0, 8)}`,
        fullName: String(fullName).trim().replace(/[<>]/g, ''),
        email: trimmedEmail || `${trimmedPhone.replace(/\D/g, '')}@ibnsino.uz`,
        phone: trimmedPhone,
        passwordHash,
        role: 'student', // SECURITY FIX: Forced student role, prevents privilege escalation
        grade: Number(grade) || 9,
        region: String(region || 'Toshkent shahri').trim().replace(/[<>]/g, ''),
        district: String(district || '').trim().replace(/[<>]/g, ''),
        school: String(school || 'Maktab').trim().replace(/[<>]/g, ''),
        score: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      // Atomic create with duplicate check (Item 8)
      const createResult = dbStore.createUser(newUser);
      if (!createResult.success) {
        return res.status(409).json({ error: createResult.error || 'Ushbu email yoki telefon bilan foydalanuvchi allaqachon mavjud' });
      }

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role, fullName: newUser.fullName },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const { passwordHash: _, ...userSafe } = newUser;

      return res.status(201).json({
        success: true,
        token,
        user: userSafe,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Ro\'yxatdan o\'tishda xatolik yuz berdi' });
    }
  }

  public static async me(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
    }
    const { passwordHash: _, ...userSafe } = req.user;
    return res.json({ success: true, user: userSafe });
  }

  // --- Secure Password Reset Handlers ---
  private static resetTokens = new Map<string, { codeHash: string; expiresAt: number }>();

  public static async forgotPassword(req: Request, res: Response) {
    try {
      const email = req.body.email ? String(req.body.email).trim().toLowerCase() : '';
      if (!email) {
        return res.status(400).json({ error: 'Elektron pochta manzili kiritilishi shart' });
      }

      const user = dbStore.getUserByEmailOrPhone(email);
      if (!user) {
        return res.status(404).json({ error: 'Ushbu pochta bilan foydalanuvchi topilmadi' });
      }

      // Generate a 6-digit numeric verification code using crypto
      const code = crypto.randomInt(100000, 999999).toString();
      const salt = bcrypt.genSaltSync(8);
      const codeHash = bcrypt.hashSync(code, salt);

      // 15 minutes expiration
      const expiresAt = Date.now() + 15 * 60 * 1000;
      AuthController.resetTokens.set(email, { codeHash, expiresAt });

      console.log(`[Security Alert] Parol tiklash kodi (${email}): ${code}`);

      return res.json({
        success: true,
        message: "Tasdiqlash kodi elektron pochtangizga yuborildi",
        // In non-production, return debugCode so user testing can continue
        debugCode: process.env.NODE_ENV === 'production' ? undefined : code,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
    }
  }

  public static async resetPassword(req: Request, res: Response) {
    try {
      const email = req.body.email ? String(req.body.email).trim().toLowerCase() : '';
      const code = req.body.code ? String(req.body.code).trim() : '';
      const newPassword = req.body.newPassword ? String(req.body.newPassword).trim() : '';

      if (!email || !code || !newPassword) {
        return res.status(400).json({ error: 'Email, tasdiqlash kodi va yangi parol talab qilinadi' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Yangi parol kamida 8 ta belgidan iborat bo\'lishi shart' });
      }

      const tokenRecord = AuthController.resetTokens.get(email);
      if (!tokenRecord) {
        return res.status(400).json({ error: 'Tasdiqlash kodi yaroqsiz yoki muddati o\'tgan' });
      }

      if (Date.now() > tokenRecord.expiresAt) {
        AuthController.resetTokens.delete(email);
        return res.status(400).json({ error: 'Tasdiqlash kodi muddati o\'tib ketgan' });
      }

      const isCodeValid = bcrypt.compareSync(code, tokenRecord.codeHash);
      if (!isCodeValid) {
        return res.status(400).json({ error: 'Noto\'g\'ri tasdiqlash kodi kiritildi' });
      }

      const user = dbStore.getUserByEmailOrPhone(email);
      if (!user) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
      }

      const salt = bcrypt.genSaltSync(10);
      const newPasswordHash = bcrypt.hashSync(newPassword, salt);

      dbStore.updateUser(user.id, { passwordHash: newPasswordHash });
      AuthController.resetTokens.delete(email);

      return res.json({
        success: true,
        message: 'Parol muvaffaqiyatli o\'zgartirildi',
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
    }
  }
}

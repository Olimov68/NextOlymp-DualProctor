import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { dbStore, UserRecord } from '../db/store';
import { JWT_SECRET } from '../config/constants';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuthController {
  public static async login(req: Request, res: Response) {
    try {
      const { email, phone, identifier, password, role } = req.body;
      const targetIdentifier = identifier || email || phone;

      if (!targetIdentifier || !password) {
        return res.status(400).json({ error: 'Telefon/Email va parol kiritilishi shart' });
      }

      // Check user in database
      const user = dbStore.getUserByEmailOrPhone(targetIdentifier);

      if (!user) {
        return res.status(401).json({ error: 'Bunday telefon yoki pochta bilan foydalanuvchi topilmadi' });
      }

      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Kiritilgan parol noto\'g\'ri' });
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
      return res.status(500).json({ error: 'Serverda xatolik: ' + error.message });
    }
  }

  public static async register(req: Request, res: Response) {
    try {
      const { fullName, email, phone, password, role, grade, region, district, school } = req.body;

      if (!fullName || (!email && !phone) || !password) {
        return res.status(400).json({ error: 'F.I.Sh, aloqa ma\'lumoti va parol talab qilinadi' });
      }

      // Check duplicates
      if (email && dbStore.getUserByEmailOrPhone(email)) {
        return res.status(409).json({ error: 'Ushbu email bilan foydalanuvchi allaqachon mavjud' });
      }
      if (phone && dbStore.getUserByEmailOrPhone(phone)) {
        return res.status(409).json({ error: 'Ushbu telefon raqami bilan foydalanuvchi allaqachon mavjud' });
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);

      const newUser: UserRecord = {
        id: `usr_${uuidv4().slice(0, 8)}`,
        fullName: fullName.trim(),
        email: email ? email.trim() : `${phone.replace(/\D/g, '')}@ibnsino.uz`,
        phone: phone ? phone.trim() : '',
        passwordHash,
        role: role === 'teacher' ? 'teacher' : 'student',
        grade: Number(grade) || 9,
        region: region || 'Toshkent shahri',
        district: district || '',
        school: school || 'Maktab',
        score: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      dbStore.createUser(newUser);

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
      return res.status(500).json({ error: 'Serverda xatolik: ' + error.message });
    }
  }

  public static async me(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
    }
    const { passwordHash: _, ...userSafe } = req.user;
    return res.json({ success: true, user: userSafe });
  }
}

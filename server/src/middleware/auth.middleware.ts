import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants';
import { dbStore, UserRecord } from '../db/store';

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Avtorizatsiyadan o\'tilmagan (Token talab qilinadi)' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const user = dbStore.getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Foydalanuvchi topilmadi yoki token eskirgan' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Yaroqsiz yoki muddati o\'tgan token' });
  }
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
      const user = dbStore.getUserById(decoded.id);
      if (user) {
        req.user = user;
      }
    } catch {}
  }
  next();
}

export function requireRole(roles: Array<'student' | 'teacher' | 'admin'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Ushbu amalni bajarish uchun huquq yetarli emas (403 Forbidden)' });
    }
    next();
  };
}

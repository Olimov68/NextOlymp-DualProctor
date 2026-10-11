import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants';
import { dbStore, UserRecord } from '../db/store';
import { readCookie } from '../security/requestSecurity';

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

export function extractToken(req: Request): string | null {
  // 1. Check cookies (HttpOnly auth cookie)
  const cookieToken = (req as any).cookies?.token;
  if (cookieToken) {
    return cookieToken;
  }
  const rawCookie = req.headers.cookie;
  if (rawCookie) {
    const match = rawCookie.match(/(?:^|;\s*)token=([^;]+)/);
    if (match && match[1]) {
      return readCookie(req, 'token');
    }
  }

  // 2. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return null;
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Avtorizatsiyadan o\'tilmagan (Token talab qilinadi)' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as { id: string; role: string; email?: string; fullName?: string; authVersion?: number };
    const user = dbStore.getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Foydalanuvchi topilmadi yoki hisob o\'chirilgan (Unauthorized)' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Ushbu hisob faol emas yoki bloklangan (Forbidden)' });
    }
    if ((decoded.authVersion ?? 0) !== (user.authVersion ?? 0)) {
      return res.status(401).json({ error: 'Sessiya bekor qilingan. Qayta kiring.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Yaroqsiz yoki muddati o\'tgan token' });
  }
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as { id: string; authVersion?: number };
      const user = dbStore.getUserById(decoded.id);
      if (user?.status === 'active' && (decoded.authVersion ?? 0) === (user.authVersion ?? 0)) {
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

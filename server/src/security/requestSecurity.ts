import type { Request, Response, NextFunction } from 'express';
import { isOriginAllowed } from '../config/constants';

export function readCookie(req: Request, name: string): string | null {
  for (const item of (req.headers.cookie ?? '').split(';')) {
    const index = item.indexOf('=');
    if (index < 0 || item.slice(0, index).trim() !== name) continue;
    try { return decodeURIComponent(item.slice(index + 1).trim()); }
    catch { return null; }
  }
  return null;
}

// Exact Origin allowlist covers login CSRF as well as authenticated mutations.
// Non-browser clients must send an explicitly allowed Origin too.
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  let origin = req.get('origin');
  if (!origin && req.get('referer')) {
    try { origin = new URL(req.get('referer')!).origin; } catch { /* reject below */ }
  }
  if (!origin || !isOriginAllowed(origin)) {
    return res.status(403).json({ code: 'CSRF_ORIGIN', error: 'CSRF: ruxsat etilgan Origin talab qilinadi' });
  }
  next();
}

export function clientIp(req: Request): string {
  return (req.ip || req.socket.remoteAddress || '').replace(/^::ffff:/i, '');
}

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { validatePlacementSnapshot } from '../services/setupProctor.service';
import { JWT_SECRET } from '../config/constants';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

import { dbStore, ProctorSessionRecord } from '../db/store';

// No independent in-memory copy: every process reads the current transaction's records.
export const activeProctorSessions = {
  get: (id: string) => dbStore.getProctorSession(id),
  set: (_id: string, session: ProctorSessionRecord) => dbStore.saveProctorSession(session),
  delete: (id: string) => dbStore.deleteProctorSession(id),
  forEach: (callback: (session: ProctorSessionRecord, id: string) => void) => {
    for (const session of dbStore.getAllProctorSessions()) callback(session, session.sessionId);
  },
};

function sanitizeString(str: any): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>'"]/g, '').trim();
}

// CRITICAL SECURITY FIX (Item 2 & 3): Strict session auth without URL token leak
function verifySessionAuth(req: Request, sessionId: string): boolean {
  const authHeader = req.headers.authorization;
  const bodyToken = req.body && req.body.token;

  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (bodyToken) {
    token = String(bodyToken).trim();
  }

  if (!token || !sessionId) return false;

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    if (!decoded || !decoded.sessionId || decoded.sessionId !== sessionId) {
      return false;
    }
    const session = activeProctorSessions.get(sessionId);
    if (!session) return false;
    if (decoded.deviceRole !== 'primary' && decoded.deviceRole !== 'secondary') return false;
    if (!decoded.jti || decoded.jti !== (decoded.deviceRole === 'primary' ? session.primaryJti : session.secondaryJti)) return false;
    const user = dbStore.getUserById(session.studentId);
    if (user?.status !== 'active' || (user.authVersion ?? 0) !== (session.authVersion ?? 0)) return false;

    // Strict binding: token sessionId, examId, and studentId must all strictly match active session!
    if (!decoded.studentId || decoded.studentId !== session.studentId) {
      return false;
    }
    if (!decoded.examId || decoded.examId !== session.examId) {
      return false;
    }
    // Check if session has expired
    if (Date.now() >= session.examEndTime) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export class ProctorController {
  // CRITICAL SECURITY FIX (Item 4): Proctor session must require authentication
  public static async createSession(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Avtorizatsiyadan o\'tilmagan (Token talab qilinadi)' });
      }

      const examId = sanitizeString(req.body.examId);
      // Derive studentId from verified authenticated user, preventing impersonation!
      const isPrivileged = req.user.role === 'admin' || req.user.role === 'teacher';
      const studentId = isPrivileged && req.body.studentId ? sanitizeString(req.body.studentId) : req.user.id;
      const studentName = isPrivileged && req.body.studentName ? sanitizeString(req.body.studentName) : req.user.fullName;

      if (!examId) {
        return res.status(400).json({ error: "examId majburiy" });
      }

      const sessionId = uuidv4();
      const exam = dbStore.getExamById(examId);
      if (!exam) return res.status(404).json({ error: 'Imtihon topilmadi' });
      const student = dbStore.getUserById(studentId);
      if (student?.status !== 'active') return res.status(403).json({ error: 'Faol o‘quvchi topilmadi' });
      if (dbStore.getAllProctorSessions().filter(s => s.studentId === studentId && s.examEndTime > Date.now()).length >= 10)
        return res.status(429).json({ error: 'Faol ulanish seanslari juda ko‘p' });
      const primaryJti = uuidv4();
      const secondaryJti = uuidv4();
      const pairingCode = crypto.randomBytes(32).toString('base64url');
      const token = jwt.sign(
        { sessionId, examId, studentId, deviceRole: 'primary', jti: primaryJti },
        JWT_SECRET,
        { expiresIn: '2h' }
      );

      const now = Date.now();
      const examStartTime = exam.isAlwaysOpen ? now : new Date(exam.startTime).getTime();
      const examEndTime = Math.min(exam.isAlwaysOpen ? Infinity : new Date(exam.endTime).getTime(), now + 2 * 3600_000);
      if (!Number.isFinite(examStartTime) || !Number.isFinite(examEndTime) || examEndTime <= now)
        return res.status(400).json({ error: 'Imtihon vaqti yaroqsiz yoki tugagan' });

      const sessionRecord: ProctorSessionRecord = {
        authVersion: student.authVersion ?? 0,
        sessionId,
        primaryJti, secondaryJti,
        pairingHash: crypto.createHash('sha256').update(pairingCode).digest('hex'),
        pairingExpiresAt: now + 5 * 60_000,
        token: '',
        examId,
        studentId,
        status: 'WAITING_DEVICE',
        calibrated: false,
        examStartTime,
        examEndTime,
        lastHeartbeat: now,
      };

      activeProctorSessions.set(sessionId, sessionRecord);
      dbStore.saveProctorSession(sessionRecord);

      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol || 'http';
      // CRITICAL FIX (Item 2): Never append confidential JWT token to public URL!
      const streamUrl = `${protocol}://${host}/proctor/stream?sessionId=${sessionId}`;

      return res.status(201).json({
        success: true,
        sessionId,
        token,
        pairingCode,
        streamUrl,
        exam: {
          id: examId,
          startTime: new Date(examStartTime).toISOString(),
          endTime: new Date(examEndTime).toISOString(),
        }
      });
    } catch (error: any) {
      return res.status(500).json({ error: "Ichki server xatoligi yuz berdi" });
    }
  }

  public static async calibrate(req: Request, res: Response) {
    try {
      const sessionId = sanitizeString(req.body.sessionId);
      const imageBase64 = req.body.imageBase64;

      if (!sessionId || !imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({ error: "sessionId va imageBase64 talab qilinadi" });
      }

      // Check maximum snapshot size (approx 7MB base64) to prevent DoS
      if (imageBase64.length > 7 * 1024 * 1024) {
        return res.status(413).json({ error: "Snapshot hajmi juda katta (maksimal 5MB rasm ruxsat etiladi)" });
      }

      if (!verifySessionAuth(req, sessionId)) {
        return res.status(403).json({ error: "Ruxsatsiz murojaat (Yaroqsiz yoki mavjud bo'lmagan sessiya tokeni)" });
      }

      const evaluation = await validatePlacementSnapshot(imageBase64);

      const session = activeProctorSessions.get(sessionId);
      if (session) {
        session.calibrated = evaluation.valid_placement;
        session.status = evaluation.valid_placement ? 'CALIBRATED' : 'DEVICE_CONNECTED';
        session.lastHeartbeat = Date.now();
        dbStore.saveProctorSession(session);
      }

      return res.json({
        success: true,
        sessionId,
        evaluation,
      });
    } catch (error: any) {
      return res.status(500).json({ error: "Tahlil jarayonida xatolik yuz berdi" });
    }
  }

  public static async pair(req: Request, res: Response) {
    const { sessionId, pairingCode } = req.body ?? {};
    if (typeof sessionId !== 'string' || typeof pairingCode !== 'string' || pairingCode.length > 100)
      return res.status(400).json({ error: 'Ulash kodi talab qilinadi' });
    const session = dbStore.getProctorSession(sessionId);
    const student = session && dbStore.getUserById(session.studentId);
    if (!student || student.status !== 'active' || (student.authVersion ?? 0) !== (session?.authVersion ?? 0))
      return res.status(403).json({ error: 'Ulash seansi bekor qilingan' });
    const digest = crypto.createHash('sha256').update(pairingCode).digest('hex');
    if (!session?.pairingHash || session.pairingHash.length !== digest.length || (session.pairingExpiresAt ?? 0) <= Date.now() ||
        session.examEndTime <= Date.now() || !crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(session.pairingHash)))
      return res.status(403).json({ error: 'Ulash kodi yaroqsiz, ishlatilgan yoki eskirgan' });
    delete session.pairingHash;
    delete session.pairingExpiresAt;
    dbStore.saveProctorSession(session);
    const token = jwt.sign({ sessionId, examId: session.examId, studentId: session.studentId,
      deviceRole: 'secondary', jti: session.secondaryJti }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token });
  }

  public static async checkGatekeeper(req: Request, res: Response) {
    try {
      const sessionId = sanitizeString(req.params.sessionId);

      if (!verifySessionAuth(req, sessionId)) {
        return res.status(403).json({ error: "Ruxsatsiz murojaat (Yaroqsiz token)" });
      }

      const session = activeProctorSessions.get(sessionId);

      if (!session) {
        return res.status(404).json({ error: "Seans topilmadi" });
      }

      const currentTime = Date.now();
      const timeRemainingMs = Math.max(0, session.examStartTime - currentTime);
      const isTimePermitted = currentTime >= session.examStartTime && currentTime <= session.examEndTime;
      const isStartPermitted = isTimePermitted && session.calibrated;

      return res.json({
        sessionId,
        isCalibrated: session.calibrated,
        isTimePermitted,
        isStartPermitted,
        timeRemainingMs,
        timeRemainingSeconds: Math.ceil(timeRemainingMs / 1000),
        startTime: new Date(session.examStartTime).toISOString(),
        currentTime: new Date(currentTime).toISOString(),
      });
    } catch (error: any) {
      return res.status(500).json({ error: "Tekshiruvda xatolik" });
    }
  }
}

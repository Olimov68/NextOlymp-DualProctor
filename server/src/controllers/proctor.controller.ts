import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { validatePlacementSnapshot } from '../services/setupProctor.service';
import { JWT_SECRET } from '../config/constants';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

import { dbStore, ProctorSessionRecord } from '../db/store';

export const activeProctorSessions = new Map<string, ProctorSessionRecord>();

// Preload persisted proctor sessions on server start (Item 9)
for (const session of dbStore.getAllProctorSessions()) {
  activeProctorSessions.set(session.sessionId, session);
}

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
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.sessionId || decoded.sessionId !== sessionId) {
      return false;
    }
    const session = activeProctorSessions.get(sessionId);
    if (!session) return false;

    // Strict binding: token sessionId, examId, and studentId must all strictly match active session!
    if (!decoded.studentId || decoded.studentId !== session.studentId) {
      return false;
    }
    if (!decoded.examId || decoded.examId !== session.examId) {
      return false;
    }
    // Check if session has expired
    if (Date.now() > session.examEndTime + 60000) {
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
      const token = jwt.sign(
        { sessionId, examId, studentId, studentName: studentName || "O'quvchi" },
        JWT_SECRET,
        { expiresIn: '4h' }
      );

      const now = Date.now();
      const examStartTime = req.body.examStartTime ? new Date(req.body.examStartTime).getTime() : now;
      const examEndTime = req.body.examEndTime ? new Date(req.body.examEndTime).getTime() : now + (120 * 60 * 1000);

      const sessionRecord: ProctorSessionRecord = {
        sessionId,
        token,
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

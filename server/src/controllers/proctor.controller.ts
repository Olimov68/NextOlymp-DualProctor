import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { validatePlacementSnapshot } from '../services/setupProctor.service';
import { JWT_SECRET } from '../config/constants';

export const activeProctorSessions = new Map<string, {
  sessionId: string;
  token: string;
  examId: string;
  studentId: string;
  status: string;
  calibrated: boolean;
  examStartTime: number;
  examEndTime: number;
  lastHeartbeat: number;
}>();

function sanitizeString(str: any): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>'"]/g, '').trim();
}

function verifySessionAuth(req: Request, sessionId: string): boolean {
  const authHeader = req.headers.authorization;
  const tokenParam = (req.query.token as string) || (req.body && req.body.token);

  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (tokenParam) {
    token = tokenParam;
  }

  // FIXED: Must require valid token!
  if (!token) return false;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.sessionId && decoded.sessionId !== sessionId) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export class ProctorController {
  public static async createSession(req: Request, res: Response) {
    try {
      const examId = sanitizeString(req.body.examId);
      const studentId = sanitizeString(req.body.studentId);
      const studentName = sanitizeString(req.body.studentName);

      if (!examId || !studentId) {
        return res.status(400).json({ error: "examId va studentId majburiy" });
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

      activeProctorSessions.set(sessionId, {
        sessionId,
        token,
        examId,
        studentId,
        status: 'WAITING_DEVICE',
        calibrated: false,
        examStartTime,
        examEndTime,
        lastHeartbeat: now,
      });

      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol || 'http';
      const streamUrl = `${protocol}://${host}/proctor/stream?sessionId=${sessionId}&token=${token}`;

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

      if (!sessionId || !imageBase64) {
        return res.status(400).json({ error: "sessionId va imageBase64 talab qilinadi" });
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

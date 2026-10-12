import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  dbStore,
  ExamRecord,
  getDefaultAntiCheatConfig,
  validateAntiCheatConfig,
  getPublicSafeAntiCheatPolicy,
  SnapshotRecord,
  ExamSessionRecord
} from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { heartbeatWorker } from '../services/heartbeatWorker';
import { clientIp } from '../security/requestSecurity';
import { safeSnapshotPath } from '../services/snapshotRetention';
import { knownEvent } from '../security/eventPolicy';
import { decodeSnapshot, SnapshotImageError } from '../security/snapshotImage';
import { validateExam, normalizeQuestions } from '../security/examValidation';
import { examKind, practiceAvailable, validateRaschConfig } from '../services/assessment';
import { TelegramBotService } from '../services/telegramBot.service';

function getClientIp(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  return clientIp(req);
}

export class ExamController {
  public static async getAdminExam(req: AuthenticatedRequest, res: Response) {
    const exam = dbStore.getExamById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Test topilmadi' });
    return res.json({ data: { ...exam, kind: examKind(exam) } });
  }
  private static publicExam(exam: ExamRecord) {
    const { registeredUserIds, raschConfig, ...safe } = exam;
    return { ...safe, kind: examKind(exam), practiceAvailable: practiceAvailable(exam),
      gradingMethod: examKind(exam) === 'national_certificate' ? 'rasch' : 'points',
      calibrationStatus: raschConfig ? 'configured' : 'pending_calibration',
      antiCheatConfig: getPublicSafeAntiCheatPolicy(dbStore.getExamAntiCheatConfig(exam.id)) };
  }
  public static async registration(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Avval tizimga kiring' });
    const exam = dbStore.getExamById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Imtihon topilmadi' });
    const registered = exam.registeredUserIds?.includes(req.user.id) ?? false;
    if (req.method === 'GET') return res.json({ registered });
    if (!registered) {
      if (exam.status === 'completed' || exam.status === 'yopiq' || (!exam.isAlwaysOpen &&
          Date.now() > Date.parse(exam.registrationEndDate || exam.endTime))) {
        return res.status(409).json({ error: 'Ro‘yxatdan o‘tish yopilgan' });
      }
      if (exam.targetGrades?.length && !exam.targetGrades.includes(req.user.grade)) {
        return res.status(403).json({ error: 'Bu imtihon sizning sinfingiz uchun emas' });
      }
      exam.registeredUserIds = [...(exam.registeredUserIds ?? []), req.user.id];
      exam.registeredCount = exam.registeredUserIds.length;
      dbStore.saveExam(exam);
    }
    return res.json({ registered: true });
  }
  public static async getActiveExams(req: Request, res: Response) {
    try {
      const exams = dbStore.getExams().filter(exam => !req.query.kind || examKind(exam) === req.query.kind)
        .map(exam => ExamController.publicExam(exam));
      return res.json({
        success: true,
        data: exams,
        total: exams.length,
      });
    } catch (error: any) {
      console.error('[ExamController.getActiveExams Error]:', error);
      return res.status(500).json({ error: 'Imtihonlarni yuklashda xatolik yuz berdi' });
    }
  }

  public static async getExamById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const exam = dbStore.getExamById(id);
      if (!exam) {
        return res.status(404).json({ error: 'Imtihon topilmadi' });
      }
      return res.json({ success: true, data: ExamController.publicExam(exam) });
    } catch (error: any) {
      console.error('[ExamController.getExamById Error]:', error);
      return res.status(500).json({ error: 'Imtihon ma\'lumotlarini yuklashda xatolik yuz berdi' });
    }
  }

  /**
   * CRITICAL SECURITY REQUIREMENT:
   * 1. Requires authenticated user
   * 2. Validates ownership and expiry on the server
   * 3. Requires active started session for students
   * 4. Strips correct_answer and explanation before sending questions to the client!
   */
  public static async getExamQuestions(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!req.user) {
        return res.status(401).json({ error: 'Savollarni olish uchun tizimga kirish talab qilinadi (401 Unauthorized)' });
      }

      const exam = dbStore.getExamById(id);
      if (!exam) {
        return res.status(404).json({ error: 'Imtihon topilmadi' });
      }

      // For students, verify that an active session was started
      if (req.user.role !== 'admin') {
        const session = typeof req.query.sessionId === 'string' ? dbStore.getSession(req.query.sessionId) : dbStore.getActiveSession(req.user.id, id);
        if (!session || session.userId !== req.user.id || session.examId !== id || session.status !== 'IN_PROGRESS' || session.expiresAt <= Date.now()) {
          return res.status(403).json({
            error: "Savollarni ko'rish uchun imtihon sessiyasini boshlash talab qilinadi.",
            code: 'SESSION_NOT_STARTED',
          });
        }
      }

      // Admins receive full questions with correctAnswer; students receive strictly sanitized questions
      const questions = req.user.role === 'admin'
        ? dbStore.getRawQuestions(id).map(q => ({
            ...q,
            content: q.question_text,
            correctAnswer: q.correct_answer,
            correct_answer: q.correct_answer,
          }))
        : dbStore.getSanitizedQuestions(id);

      return res.json({
        success: true,
        examId: id,
        totalQuestions: questions.length,
        questions,
        data: questions,
      });
    } catch (error: any) {
      console.error('[ExamController.getExamQuestions Error]:', error);
      return res.status(500).json({ error: 'Savollarni yuklashda xatolik yuz berdi' });
    }
  }

  // CRITICAL SECURITY FIX: Atomic session, schedule check, Single IP and canonical AntiCheatPolicy
  public static async startExam(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!req.user) {
        return res.status(401).json({ error: 'Imtihonni boshlash uchun tizimga kirish talab qilinadi' });
      }
      const userId = req.user.id;

      const exam = dbStore.getExamById(id);
      if (!exam) {
        return res.status(404).json({ error: 'Imtihon topilmadi' });
      }

      const now = Date.now();
      if (req.body.mode !== undefined && !['practice', 'competitive'].includes(req.body.mode)) {
        return res.status(400).json({ error: 'Urinish rejimi noto‘g‘ri' });
      }
      const mode = req.body.mode === 'practice' ? 'practice' : 'competitive';
      const practice = mode === 'practice';
      if (practice && !practiceAvailable(exam)) return res.status(409).json({ error: 'Bu test mashq uchun hali ochilmagan' });
      if (!practice && examKind(exam) === 'level_test') return res.status(400).json({ error: 'Daraja testi mashq rejimida boshlanadi' });
      if (!dbStore.getRawQuestions(id).length) return res.status(409).json({ error: 'Savollar hali kiritilmagan' });
      const examStart = exam.startTime ? new Date(exam.startTime).getTime() : 0;
      const examEnd = exam.endTime ? new Date(exam.endTime).getTime() : Infinity;

      // Schedule verification
      if (!practice && (exam.status === 'completed' || exam.status === 'yopiq')) return res.status(409).json({ error: 'Imtihon yopilgan' });
      if (!practice && !exam.isAlwaysOpen && now < examStart) {
        return res.status(400).json({ error: 'Imtihon hali boshlanmagan. Iltimos, belgilangan vaqtda kiring.' });
      }
      if (!practice && !exam.isAlwaysOpen && now > examEnd) {
        return res.status(400).json({ error: 'Ushbu imtihonning qabul muddati yakunlangan.' });
      }

      // Grade eligibility verification
      if (!practice && exam.targetGrades && Array.isArray(exam.targetGrades) && exam.targetGrades.length > 0) {
        const studentGrade = Number(req.user.grade);
        if (!studentGrade || !exam.targetGrades.includes(studentGrade)) {
          return res.status(403).json({
            error: `Ushbu olimpiada faqat ${exam.targetGrades.join(', ')}-sinflar uchun mo'ljallangan. Sizning sinfingiz: ${studentGrade}-sinf.`
          });
        }
      }

      // Check if user already submitted this exam
      const existingSubmissions = dbStore.getSubmissions(userId);
      const alreadyCompleted = !practice && existingSubmissions.find(s => s.examId === id && s.mode !== 'practice');
      if (alreadyCompleted) {
        return res.status(400).json({
          error: 'Siz ushbu imtihonni allaqachon topshirgansiz. Qayta urinish taqiqlangan.',
          data: alreadyCompleted,
        });
      }

      const clientIp = getClientIp(req);
      const antiCheat = { ...dbStore.getExamAntiCheatConfig(id), ...(practice ? { enabled: false } : {}) };
      if (antiCheat.enabled && antiCheat.requireDualDevice) {
        const calibrated = dbStore.getAllProctorSessions().some(p =>
          p.studentId === userId && p.examId === id && p.calibrated && p.secondarySocketId && p.examEndTime > now);
        if (!calibrated) return res.status(403).json({ code: 'PROCTOR_NOT_READY', error: 'Ikkinchi kamera serverda tasdiqlanmagan' });
      }

      // Check if active session already exists for this authenticated user
      let session = dbStore.getActiveSession(userId, id, mode);
      if (session) {
        if (now > session.expiresAt) {
          const result = dbStore.finishAndGradeExam(session.sessionId);
          return res.json({ success: true, completed: true, data: result });
        }
        if (session.status === 'DISCONNECTED') {
          session.status = 'IN_PROGRESS';
          session.lastHeartbeatAt = now;
          dbStore.addSession(session);
        }
      } else {
        // Atomic Session Creation + Single IP Check
        const remainingToExamEndMinutes = practice || exam.isAlwaysOpen ? Infinity : Math.max(0, (examEnd - now) / 60000);
        const durationMinutes = Math.min(exam.durationMinutes || 60, remainingToExamEndMinutes);
        const expiresAt = now + durationMinutes * 60 * 1000;
        const sessionId = `sess_${uuidv4()}`;

        const newSessionRecord: ExamSessionRecord = {
          mode,
          sessionId,
          userId,
          examId: id,
          startedAt: now,
          expiresAt,
          status: 'IN_PROGRESS',
          answers: {},
          clientIp,
          violationCount: 0,
          lastHeartbeatAt: now,
          processedEventIds: [],
        };

        const atomicResult = dbStore.createSessionAtomic(newSessionRecord, antiCheat);
        if (!atomicResult.success) {
          if (atomicResult.code === 'SINGLE_IP_VIOLATION') {
            return res.status(403).json({
              code: 'DUPLICATE_IP_BLOCKED',
              error: 'Xavfsizlik cheklovi: Ushbu imtihon uchun sizning IP manzilingizdan boshqa faol sessiya mavjud (Single IP qoidasi faol)',
            });
          }
          return res.status(400).json({
            code: atomicResult.code || 'SESSION_CREATION_FAILED',
            error: atomicResult.error || 'Sessiya yaratishda xatolik yuz berdi',
          });
        }
        session = atomicResult.session!;
      }

      const timeRemainingSeconds = Math.max(0, Math.floor((session.expiresAt - now) / 1000));

      return res.json({
        success: true,
        sessionId: session.sessionId,
        mode,
        examId: exam.id,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
        timeRemainingSeconds,
        serverTime: now,
        answers: session.answers,
        durationMinutes: exam.durationMinutes,
        status: session.status,
        antiCheatPolicy: getPublicSafeAntiCheatPolicy(antiCheat),
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Imtihonni boshlashda xatolik yuz berdi' });
    }
  }

  public static async submitAnswer(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!req.user) {
        return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
      }

      const { sessionId, question_id, questionId, selected_option, selectedOption, answer } = req.body;
      const targetSessionId = sessionId || dbStore.getActiveSession(req.user.id, id)?.sessionId;

      if (!targetSessionId) {
        return res.status(400).json({ error: 'Faol imtihon sessiyasi topilmadi' });
      }

      // STRICT OWNERSHIP CHECK: Ensure session belongs to current user
      const session = dbStore.getSession(targetSessionId);
      if (!session) {
        return res.status(404).json({ error: 'Imtihon sessiyasi topilmadi' });
      }

      if (session.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Ruxsat etilmagan: Bu imtihon sessiyasi sizga tegishli emas' });
      }

      if (session.examId !== id) {
        return res.status(400).json({ error: 'Sessiya ushbu imtihonga tegishli emas' });
      }

      // Session status & timing verification (Item 4)
      if (session.status !== 'IN_PROGRESS') {
        return res.status(400).json({ error: 'Imtihon faol holatda emas (yakunlangan yoki muddati o\'tgan)' });
      }

      const now = Date.now();
      if (now > session.expiresAt) {
        return res.status(400).json({ error: 'Imtihon vaqti tugadi' });
      }

      const exam = dbStore.getExamById(session.examId);
      if (session.mode !== 'practice' && exam && !exam.isAlwaysOpen && exam.endTime && now > new Date(exam.endTime).getTime()) {
        return res.status(400).json({ error: 'Imtihon topshirishning umumiy muddati yakunlangan' });
      }

      // Input validation (Item 11)
      const rawQId = question_id || questionId;
      const rawChosen = selected_option ?? selectedOption ?? answer;

      if (typeof rawQId !== 'string' || !rawQId || rawQId.length > 100 || typeof rawChosen !== 'string' || rawChosen.length > 10000) {
        return res.status(400).json({ error: 'Savol ID va tanlangan variant talab qilinadi' });
      }

      const qId = rawQId;
      const chosenOption = rawChosen;

      const result = dbStore.recordAnswer(targetSessionId, qId, chosenOption);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.json({
        success: true,
        message: 'Javob qabul qilindi',
        questionId: qId,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Javobni saqlashda xatolik yuz berdi' });
    }
  }

  public static async finishExam(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!req.user) {
        return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
      }

      const { sessionId, answers } = req.body;
      let targetSessionId = sessionId || dbStore.getActiveSession(req.user.id, id)?.sessionId;

      if (!targetSessionId) {
        return res.status(400).json({ error: 'Faol imtihon sessiyasi topilmadi' });
      }

      // STRICT OWNERSHIP CHECK: Verify session belongs to current user
      const session = dbStore.getSession(targetSessionId);
      if (!session) {
        return res.status(404).json({ error: 'Imtihon sessiyasi topilmadi' });
      }

      if (session.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Ruxsat etilmagan: Bu imtihon sessiyasi sizga tegishli emas' });
      }

      if (session.examId !== id) {
        return res.status(400).json({ error: 'Sessiya ushbu imtihonga tegishli emas' });
      }

      // Race Condition & Multiple Finish Prevention (Item 5)
      if (session.status !== 'IN_PROGRESS') {
        const existingSub = dbStore.getSubmissionBySession(targetSessionId);
        if (existingSub) {
          return res.json({
            success: true,
            message: 'Imtihon allaqachon yakunlangan',
            data: existingSub,
          });
        }
        return res.status(400).json({ error: 'Imtihon allaqachon yakunlangan yoki faol emas' });
      }

      // Late finalization grades only answers received before the server deadline.
      const now = Date.now();
      if (answers !== undefined && (!answers || typeof answers !== 'object' || Array.isArray(answers))) {
        return res.status(400).json({ error: 'Javoblar formati noto‘g‘ri' });
      }
      if (answers && now <= session.expiresAt) {
        const entries = Object.entries(answers);
        const questions = dbStore.getRawQuestions(id);
        if (entries.length > questions.length || entries.some(([qId, opt]) => {
          const q = questions.find(question => question.id === qId);
          return !q || typeof opt !== 'string' || opt.length > 10000 ||
            (q.options?.length && !q.options.some(option => option.id === opt));
        })) {
          return res.status(400).json({ error: 'Imtihonga tegishli bo‘lmagan savol yoki noto‘g‘ri javob' });
        }
        // Validate the whole batch before changing anything, including in development JSON mode.
        Object.assign(session.answers, answers);
      }

      // Transition session state and perform authoritative server-side grading
      const submission = dbStore.finishAndGradeExam(targetSessionId);
      if (!submission) {
        return res.status(400).json({ error: 'Imtihonni baholashda xatolik yuz berdi' });
      }

      // Send Telegram notification if user has linked Telegram
      if (req.user) {
        const student = dbStore.getUserById(req.user.id) || req.user;
        if (student && student.telegramChatId) {
          const examSubs = dbStore.getSubmissions().filter(s => s.examId === submission.examId && s.status === 'completed');
          const higherScores = examSubs.filter(s => s.score > submission.score).length;
          const rank = higherScores + 1;

          void TelegramBotService.sendExamResult(student.telegramChatId, {
            studentName: student.fullName,
            subject: submission.subject || 'Biologiya / Kimyo',
            score: submission.score,
            maxScore: submission.maxScore || 100,
            rank,
            submissionId: submission.id,
          });
        }
      }

      return res.json({
        success: true,
        message: 'Imtihon muvaffaqiyatli yakunlandi va serverda baholandi',
        data: submission,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Imtihonni yakunlashda xatolik yuz berdi' });
    }
  }

  public static async getExamResult(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!req.user) {
        return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
      }

      // If admin, can view requested userId; normal users can ONLY view their own results
      const targetUserId = req.user.role === 'admin' && req.query.userId ? String(req.query.userId) : req.user.id;

      const allSubmissions = dbStore.getSubmissions(targetUserId);
      const match = allSubmissions.find(s => s.examId === id || s.id === id);

      if (!match) {
        return res.status(404).json({ error: 'Imtihon natijasi topilmadi' });
      }

      return res.json({
        success: true,
        data: match,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Natijani olishda xatolik yuz berdi' });
    }
  }

  public static async recordProctorEvent(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!req.user) {
        return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
      }

      const { eventId, sessionId, eventType, occurredAt, details } = req.body;
      if (typeof eventId !== 'string' || eventId.length < 1 || eventId.length > 100 ||
          typeof eventType !== 'string' || !knownEvent(eventType.toUpperCase())) {
        return res.status(400).json({ error: 'Hodisa turi va noyob eventId talab qilinadi' });
      }
      const targetSessionId = sessionId || dbStore.getActiveSession(req.user.id, id)?.sessionId;
      if (!targetSessionId) {
        return res.status(400).json({ error: 'Faol imtihon sessiyasi topilmadi' });
      }

      const session = dbStore.getSession(targetSessionId);
      if (!session) {
        return res.status(404).json({ error: 'Imtihon sessiyasi topilmadi' });
      }

      if (session.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Ruxsat etilmagan: Sessiya sizga tegishli emas' });
      }

      if (session.examId !== id) {
        return res.status(400).json({ error: 'Sessiya ushbu imtihonga tegishli emas' });
      }

      const isDuplicate = typeof eventId === 'string' && !!session.processedEventIds?.includes(eventId);
      if ((session.status !== 'IN_PROGRESS' || session.expiresAt <= Date.now()) && !isDuplicate) {
        return res.status(400).json({
          error: 'Sessiya faol emas (yakunlangan yoki diskvalifikatsiya qilingan)',
          status: session.status,
          isDisqualified: session.status === 'DISQUALIFIED',
        });
      }

      const clientIp = getClientIp(req);
      const result = dbStore.recordSessionProctorEvent(targetSessionId, {
        eventId: eventId ? String(eventId).slice(0, 100) : undefined,
        eventType: String(eventType || 'SECURITY_WARNING').slice(0, 100),
        occurredAt: occurredAt ? String(occurredAt) : new Date().toISOString(),
        details: typeof details === 'string' ? details.replace(/[<>]/g, '').slice(0, 500) : undefined,
        ipAddress: clientIp,
      });

      return res.json({
        success: true,
        isDuplicate,
        violationCount: result.violationCount,
        maxViolationsAllowed: result.maxViolationsAllowed,
        status: result.status,
        isDisqualified: result.isDisqualified,
        ruleEnabled: result.ruleEnabled,
        message: result.isDisqualified
          ? 'Qoidabuzarliklar soni oshdi, sessiya server tomonidan diskvalifikatsiya qilindi'
          : 'Xavfsizlik hodisasi qayd etildi',
      });
    } catch (error: any) {
      console.error('[ExamController.recordProctorEvent Error]:', error);
      return res.status(500).json({ error: 'Hodisani yozishda xatolik yuz berdi' });
    }
  }

  public static async recordHeartbeat(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!req.user) {
        return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
      }

      const { sessionId } = req.body;
      const targetSessionId = sessionId || dbStore.getActiveSession(req.user.id, id)?.sessionId;
      if (!targetSessionId) {
        return res.status(400).json({ error: 'Faol imtihon sessiyasi topilmadi' });
      }

      const session = dbStore.getSession(targetSessionId);
      if (!session) {
        return res.status(404).json({ error: 'Sessiya topilmadi' });
      }

      if (session.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Ruxsat etilmagan: Bu sessiya sizga tegishli emas' });
      }

      if (session.examId !== id) {
        return res.status(400).json({ error: 'Sessiya ushbu imtihonga tegishli emas' });
      }

      const policy = dbStore.getExamAntiCheatConfig(id);
      if (!policy.enabled || !policy.heartbeatEnabled) {
        return res.json({ success: true, heartbeatEnabled: false });
      }

      if (session.status === 'DISCONNECTED') {
        const reconnectResult = heartbeatWorker.handleReconnect(targetSessionId);
        if (!reconnectResult.success) {
          return res.status(400).json({ error: reconnectResult.error });
        }
        return res.json({
          success: true,
          status: reconnectResult.session?.status || 'IN_PROGRESS',
          reconnected: true,
          serverTime: new Date().toISOString(),
        });
      }

      const result = dbStore.recordSessionHeartbeat(targetSessionId);
      if (!result.success) {
        return res.status(session.status === 'DISQUALIFIED' ? 403 : 400).json({ error: result.error, isDisqualified: session.status === 'DISQUALIFIED' });
      }

      return res.json({
        success: true,
        status: session.status,
        serverTime: new Date().toISOString(),
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Heartbeat yozishda xatolik yuz berdi' });
    }
  }

  // --- Admin Anti-Cheat Policy Management ---
  public static async getAntiCheatConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const targetId = req.params.examId || req.params.id;
      const exam = dbStore.getExamById(targetId);
      if (!exam) {
        return res.status(404).json({ error: 'Imtihon topilmadi' });
      }
      const config = dbStore.getExamAntiCheatConfig(targetId);
      return res.json({ success: true, config, data: config });
    } catch (error: any) {
      return res.status(500).json({ error: 'Anti-cheat sozlamalarini olishda xatolik' });
    }
  }

  public static async updateAntiCheatConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const targetId = req.params.examId || req.params.id;
      const exam = dbStore.getExamById(targetId);
      if (!exam) {
        return res.status(404).json({ error: 'Imtihon topilmadi' });
      }

      const validation = validateAntiCheatConfig(req.body);
      if (!validation.valid || !validation.config) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          error: 'Anti-cheat sozlamalarida validatsiya xatoligi',
          details: validation.errors,
        });
      }

      validation.config.updatedBy = req.user?.fullName || req.user?.email || 'admin';
      const updated = dbStore.updateExamAntiCheatConfig(targetId, validation.config);
      return res.json({ success: true, config: updated, data: updated });
    } catch (error: any) {
      return res.status(500).json({ error: 'Anti-cheat sozlamalarini saqlashda xatolik' });
    }
  }

  public static async getProctorEvents(req: AuthenticatedRequest, res: Response) {
    const examId = req.params.examId || req.params.id;
    if (!dbStore.getExamById(examId)) return res.status(404).json({ error: 'Imtihon topilmadi' });
    return res.json({ success: true, data: dbStore.getProctorEvents(examId) });
  }

  public static async adminDisqualifySession(req: AuthenticatedRequest, res: Response) {
    const sessionId = String(req.body?.sessionId || '').trim();
    const reason = String(req.body?.reason || '').trim();
    if (!sessionId || !reason || reason.length > 500) return res.status(400).json({ error: 'Sessiya va sabab majburiy' });
    const session = dbStore.getSession(sessionId);
    if (!session || session.examId !== (req.params.examId || req.params.id)) return res.status(404).json({ error: 'Sessiya topilmadi' });
    const updated = dbStore.adminDisqualifySession(sessionId, reason, req.user?.fullName || 'admin');
    return res.json({ success: true, data: updated });
  }

  // --- Snapshots ---
  public static async uploadSnapshot(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!req.user) {
        return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
      }

      const { sessionId, eventType, imageBase64 } = req.body;
      const targetSessionId = sessionId || dbStore.getActiveSession(req.user.id, id)?.sessionId;
      if (!targetSessionId) {
        return res.status(400).json({ error: 'Faol imtihon sessiyasi topilmadi' });
      }

      const session = dbStore.getSession(targetSessionId);
      if (!session) {
        return res.status(404).json({ error: 'Sessiya topilmadi' });
      }

      // Security check: Only session owner can upload snapshot (admins cannot upload on behalf of student)
      if (session.userId !== req.user.id) {
        return res.status(403).json({ error: 'Faqat sessiya egasi snapshot yuklashi mumkin' });
      }
      if (session.examId !== id || session.status !== 'IN_PROGRESS' || session.expiresAt <= Date.now()) {
        return res.status(403).json({ error: 'Snapshot faqat shu imtihonning faol sessiyasi uchun ruxsat etiladi' });
      }

      const policy = dbStore.getExamAntiCheatConfig(id);
      if (!policy.enabled || !policy.cameraFaceSnapshotEnabled) {
        return res.status(400).json({ error: 'Ushbu imtihon uchun snapshotlar faol emas' });
      }

      const normalizedType = String(eventType || 'SNAPSHOT').toUpperCase();
      if (!['NO_FACE', 'MULTI_FACE', 'MULTIPLE_FACES', 'SNAPSHOT'].includes(normalizedType)) {
        return res.status(400).json({ error: 'Snapshot hodisasi noto‘g‘ri' });
      }
      const previous = dbStore.getExamSnapshots(id).filter(s => s.userId === session.userId);
      if (previous.length >= 100 || previous.some(s => Date.parse(s.createdAt) > Date.now() - 3000)) {
        return res.status(429).json({ error: 'Snapshot yuklash chegarasiga yetildi' });
      }
      if (normalizedType === 'NO_FACE' && !policy.snapshotOnNoFace) {
        return res.status(400).json({ error: "No-face holatida snapshot olish o'chirilgan" });
      }
      if ((normalizedType === 'MULTI_FACE' || normalizedType === 'MULTIPLE_FACES') && !policy.snapshotOnMultipleFaces) {
        return res.status(400).json({ error: "Multiple-face holatida snapshot olish o'chirilgan" });
      }

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({ error: "Rasm ma'lumoti talab qilinadi" });
      }

      let buffer: Buffer;
      try { buffer = await decodeSnapshot(imageBase64); }
      catch (error) {
        if (error instanceof SnapshotImageError) return res.status(error.status).json({ error: error.message });
        throw error;
      }
      const ext = 'jpg';
      const mimeType = 'image/jpeg';
      const snapshotId = `snap_${uuidv4()}`;
      const snapshotsDir = path.resolve(process.env.SNAPSHOT_DIR || 'server/data/snapshots');

      await fs.promises.mkdir(snapshotsDir, { recursive: true });
      const filePath = path.join(snapshotsDir, `${snapshotId}.${ext}`);
      // Asynchronous safe file write
      await fs.promises.writeFile(filePath, buffer, { flag: 'wx', mode: 0o600 });

      const snapshotRecord: SnapshotRecord = {
        id: snapshotId,
        examId: id,
        sessionId: targetSessionId,
        userId: session.userId,
        eventType: normalizedType,
        filePath,
        fileSize: buffer.length,
        sizeBytes: buffer.length,
        mimeType,
        createdAt: new Date().toISOString(),
      };

      dbStore.saveSnapshot(snapshotRecord);

      // Hourly worker removes expired files before removing their metadata.

      return res.status(201).json({
        success: true,
        snapshotId,
        message: 'Snapshot muvaffaqiyatli saqlandi',
      });
    } catch (error: any) {
      console.error('[UploadSnapshot Error]:', error);
      return res.status(500).json({ error: 'Snapshot saqlashda xatolik yuz berdi' });
    }
  }

  public static async getExamSnapshots(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Faqat administrator ko\'rishi mumkin' });
      }

      const { id } = req.params;
      const snapshots = dbStore.getExamSnapshots(id).map(s => ({
        id: s.id,
        examId: s.examId,
        sessionId: s.sessionId,
        userId: s.userId,
        eventType: s.eventType,
        fileSize: s.fileSize,
        mimeType: s.mimeType,
        createdAt: s.createdAt,
      }));
      return res.json({ success: true, snapshots, total: snapshots.length });
    } catch (error: any) {
      return res.status(500).json({ error: 'Snapshotlarni olishda xatolik' });
    }
  }

  public static async getSnapshotFile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Faqat administrator yuklab olishi mumkin' });
      }

      const { snapshotId } = req.params;
      const snapshot = dbStore.getSnapshotById(snapshotId);
      if (!snapshot || !fs.existsSync(snapshot.filePath)) {
        return res.status(404).json({ error: 'Snapshot fayli topilmadi' });
      }
      res.setHeader('Content-Type', snapshot.mimeType);
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      const stream = fs.createReadStream(safeSnapshotPath(snapshot.filePath));
      stream.on('error', () => res.destroy());
      stream.pipe(res);
    } catch (error: any) {
      return res.status(500).json({ error: "Faylni o'qishda xatolik" });
    }
  }

  public static async deleteSnapshot(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Faqat administrator o\'chirishi mumkin' });
      }

      const { snapshotId } = req.params;
      const snapshot = dbStore.getSnapshotById(snapshotId);
      if (!snapshot) {
        return res.status(404).json({ error: 'Snapshot topilmadi' });
      }
      const filePath = safeSnapshotPath(snapshot.filePath);
      try { await fs.promises.unlink(filePath); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      dbStore.deleteSnapshot(snapshotId);
      return res.json({ success: true, message: "Snapshot o'chirildi" });
    } catch (error: any) {
      return res.status(500).json({ error: "Snapshotni o'chirishda xatolik" });
    }
  }

  public static async createExam(req: AuthenticatedRequest, res: Response) {
    try {
      const examData = req.body;
      if (!examData || typeof examData !== 'object') {
        return res.status(400).json({ code: 'VALIDATION_ERROR', error: "Yaroqsiz ma'lumotlar formati" });
      }

      const title = String(examData.title || '').trim().replace(/[<>]/g, '');
      if (!title || title.length < 3) {
        return res.status(400).json({ code: 'VALIDATION_ERROR', error: "Imtihon nomi kamida 3 ta belgidan iborat bo'lishi shart" });
      }

      const id = 'EXAM-' + uuidv4();
      const durationMinutes = Math.max(5, Math.min(300, Number(examData.durationMinutes) || 60));
      const targetGrades = Array.isArray(examData.targetGrades)
        ? examData.targetGrades.map((g: any) => Number(g)).filter((g: number) => !isNaN(g) && g >= 1 && g <= 11)
        : undefined;

      const questionsList = Array.isArray(examData.questions) ? examData.questions : [];

      const startTime = examData.startTime || examData.startDate || new Date().toISOString();
      const endTime = examData.endTime || examData.endDate || new Date(Date.now() + 86400000 * 7).toISOString();

      let validatedAntiCheatConfig = getDefaultAntiCheatConfig({ enabled: false });
      if (examData.antiCheatConfig) {
        const check = validateAntiCheatConfig(examData.antiCheatConfig);
        if (!check.valid || !check.config) {
          return res.status(400).json({
            code: 'VALIDATION_ERROR',
            error: 'Anti-cheat sozlamalarida xatolik',
            details: check.errors,
          });
        }
        validatedAntiCheatConfig = check.config;
      }

      const exam: ExamRecord = {
        kind: examData.kind ?? 'olympiad',
        practiceEnabled: examData.practiceEnabled ?? false,
        sourceYear: examData.sourceYear,
        raschConfig: examData.raschConfig,
        id,
        title,
        subject: String(examData.subject || 'Umumiy').trim().replace(/[<>]/g, ''),
        category: String(examData.category || 'general').trim().replace(/[<>]/g, ''),
        format: examData.format === 'offline' ? 'offline' : 'online',
        description: String(examData.description || '').trim().replace(/[<>]/g, ''),
        image: typeof examData.image === 'string' && examData.image.startsWith('http') ? examData.image : '',
        startTime,
        endTime,
        durationMinutes,
        price: 0, // All exams are free
        status: ['active', 'upcoming', 'completed', 'ochiq', 'yopiq'].includes(examData.status) ? examData.status : 'active',
        maxScore: Math.max(10, Number(examData.maxScore) || 100),
        totalQuestions: questionsList.length > 0 ? questionsList.length : (Number(examData.totalQuestions) || 0),
        registeredCount: 0,
        organizer: String(examData.organizer || 'Ibn Sino Akademiyasi').trim().replace(/[<>]/g, ''),
        targetGrades,
        createdAt: new Date().toISOString(),
        antiCheatConfig: validatedAntiCheatConfig,
      };

      if (examData.certificateConfig) (exam as any).certificateConfig = examData.certificateConfig;
      if (examData.isPinned !== undefined) (exam as any).isPinned = Boolean(examData.isPinned);
      if (examData.isAlwaysOpen !== undefined) (exam as any).isAlwaysOpen = Boolean(examData.isAlwaysOpen);
      if (examData.registrationStartDate) (exam as any).registrationStartDate = examData.registrationStartDate;
      if (examData.registrationEndDate) (exam as any).registrationEndDate = examData.registrationEndDate;

      const validationError = validateExam(exam);
      if (validationError) return res.status(400).json({ error: validationError });
      let questions;
      try { questions = normalizeQuestions(id, questionsList); }
      catch (error) { return res.status(400).json({ error: (error as Error).message }); }
      const raschError = validateRaschConfig(exam.raschConfig, questions.map(q => q.id));
      if (raschError) return res.status(400).json({ error: raschError });
      if (questions.length) exam.maxScore = questions.reduce((sum, q) => sum + q.points, 0);
      dbStore.saveExam({ ...exam, totalQuestions: questions.length });
      dbStore.saveQuestions(id, questions);

      return res.status(201).json({ success: true, data: exam });
    } catch (error: any) {
      console.error('[ExamController.createExam Error]:', error);
      return res.status(500).json({ error: 'Imtihon yaratishda xatolik yuz berdi' });
    }
  }

  public static async updateExam(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id || (req.query.id as string);
      if (!id) {
        return res.status(400).json({ error: 'Imtihon ID talab qilinadi' });
      }

      const existing = dbStore.getExamById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Imtihon topilmadi' });
      }
      if (req.body.retakeAllowed === true) return res.status(400).json({ error: 'Qayta urinish hali qo‘llab-quvvatlanmaydi' });

      const ALLOWED_FIELDS = [
        'title', 'subject', 'category', 'format', 'description',
        'image', 'startTime', 'endTime', 'startDate', 'endDate', 'durationMinutes', 'status',
        'maxScore', 'organizer', 'targetGrades', 'certificateConfig', 'antiCheatConfig',
        'isPinned', 'isAlwaysOpen', 'registrationStartDate', 'registrationEndDate',
        'showResultsToStudent', 'resultsPublishDate', 'retakeAllowed', 'maxRetakeAttempts',
        'allowedLanguages', 'location', 'kind', 'practiceEnabled', 'sourceYear', 'raschConfig'
      ];

      const updates: Partial<ExamRecord> = {};
      for (const field of ALLOWED_FIELDS) {
        if (req.body[field] !== undefined) {
          if (field === 'title' || field === 'subject' || field === 'category' || field === 'organizer' || field === 'description') {
            (updates as any)[field] = String(req.body[field]).trim().replace(/[<>]/g, '');
          } else if (field === 'durationMinutes' || field === 'maxScore') {
            (updates as any)[field] = Number(req.body[field]);
          } else if (field === 'targetGrades' && Array.isArray(req.body[field])) {
            updates.targetGrades = req.body[field].map((g: any) => Number(g)).filter((g: number) => !isNaN(g));
          } else if (field === 'antiCheatConfig') {
            const check = validateAntiCheatConfig(req.body[field]);
            if (!check.valid || !check.config) {
              return res.status(400).json({
                code: 'VALIDATION_ERROR',
                error: 'Anti-cheat sozlamalarida xatolik',
                details: check.errors,
              });
            }
            updates.antiCheatConfig = check.config;
          } else {
            (updates as any)[field] = req.body[field];
          }
        }
      }

      updates.price = 0; // Always free

      if (req.body.startDate && !updates.startTime) {
        updates.startTime = req.body.startDate;
      }
      if (req.body.endDate && !updates.endTime) {
        updates.endTime = req.body.endDate;
      }

      const validationError = validateExam({ ...existing, ...updates });
      if (validationError) return res.status(400).json({ error: validationError });
      const hasHistory = dbStore.getSessions().some(session => session.examId === id);
      if (hasHistory && ['kind', 'raschConfig', 'startTime', 'endTime', 'isAlwaysOpen', 'durationMinutes'].some(key =>
        (updates as Record<string, unknown>)[key] !== undefined &&
        (key === 'startTime' || key === 'endTime' ? Date.parse(updates[key]!) !== Date.parse(existing[key]) :
          key === 'isAlwaysOpen' ? Boolean(updates.isAlwaysOpen) !== Boolean(existing.isAlwaysOpen) :
          key === 'kind' ? updates.kind !== examKind(existing) :
          key === 'raschConfig' ? JSON.stringify(updates.raschConfig ?? null) !== JSON.stringify(existing.raschConfig ?? null) :
          JSON.stringify((updates as Record<string, unknown>)[key]) !== JSON.stringify((existing as unknown as Record<string, unknown>)[key])))) {
        return res.status(409).json({ error: 'Urinishlari bor testning turi, jadvali va baholash parametrlarini o‘zgartirmang; nusxa yarating.' });
      }
      let questions = dbStore.getRawQuestions(id);
      if (req.body.questions !== undefined) {
        if (dbStore.getSessions().some(session => session.examId === id)) {
          return res.status(409).json({ error: 'Boshlangan imtihon savollarini o‘zgartirib bo‘lmaydi. Yangi imtihon yarating.' });
        }
        if (existing.raschConfig && req.body.raschConfig !== null) {
          return res.status(409).json({ error: 'Savollar o‘zgarsa eski kalibrlash yaroqsiz: avval Rasch konfiguratsiyasini bo‘shating, so‘ng yangidan kalibrlang.' });
        }
        try { questions = normalizeQuestions(id, req.body.questions); }
        catch (error) { return res.status(400).json({ error: (error as Error).message }); }
        updates.totalQuestions = questions.length;
      }
      const raschError = validateRaschConfig(updates.raschConfig === undefined ? existing.raschConfig : updates.raschConfig, questions.map(q => q.id));
      if (raschError) return res.status(400).json({ error: raschError });
      if (req.body.questions !== undefined) dbStore.saveQuestions(id, questions);
      if (questions.length) updates.maxScore = questions.reduce((sum, q) => sum + q.points, 0);

      const updated = { ...existing, ...updates, id: existing.id };
      dbStore.saveExam(updated);
      return res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error('[ExamController.updateExam Error]:', error);
      return res.status(500).json({ error: 'Imtihonni yangilashda xatolik yuz berdi' });
    }
  }

  public static async deleteExam(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id || (req.query.id as string);
      if (!id) {
        return res.status(400).json({ error: 'Imtihon ID talab qilinadi' });
      }
      if (dbStore.getSessions().some(s => s.examId === id) ||
          dbStore.getSubmissions().some(s => s.examId === id) ||
          dbStore.getAllProctorSessions().some(s => s.examId === id) ||
          dbStore.getExamSnapshots(id).length) {
        return res.status(409).json({ error: 'Tarixi mavjud imtihonni o‘chirib bo‘lmaydi; holatini yopiq qiling.' });
      }
      if (!dbStore.getExamById(id)) return res.status(404).json({ error: 'Imtihon topilmadi' });
      dbStore.deleteExam(id);
      return res.json({ success: true, message: 'Imtihon o\'chirildi' });
    } catch (error: any) {
      console.error('[ExamController.deleteExam Error]:', error);
      return res.status(500).json({ error: 'Imtihonni o\'chirishda xatolik yuz berdi' });
    }
  }
}

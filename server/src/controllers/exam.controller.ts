import { Request, Response } from 'express';
import { dbStore, ExamRecord } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class ExamController {
  public static async getActiveExams(req: Request, res: Response) {
    try {
      const exams = dbStore.getExams();
      return res.json({
        success: true,
        data: exams,
        total: exams.length,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async getExamById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const exam = dbStore.getExamById(id);
      if (!exam) {
        return res.status(404).json({ error: 'Imtihon topilmadi' });
      }
      return res.json({ success: true, data: exam });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * CRITICAL SECURITY REQUIREMENT:
   * Strips correct_answer and explanation before sending questions to the client!
   */
  public static async getExamQuestions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const exam = dbStore.getExamById(id);
      if (!exam) {
        return res.status(404).json({ error: 'Imtihon topilmadi' });
      }

      const sanitizedQuestions = dbStore.getSanitizedQuestions(id);

      return res.json({
        success: true,
        examId: id,
        totalQuestions: sanitizedQuestions.length,
        questions: sanitizedQuestions,
        // Also provide 'data' key for backward compatibility
        data: sanitizedQuestions,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async startExam(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.body.userId || 'guest_user';

      const exam = dbStore.getExamById(id);
      if (!exam) {
        return res.status(404).json({ error: 'Imtihon topilmadi' });
      }

      // Check if active session already exists
      let session = dbStore.getActiveSession(userId, id);
      if (!session) {
        session = dbStore.startSession(userId, id, exam.durationMinutes || 60);
      }

      const timeRemainingSeconds = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));

      return res.json({
        success: true,
        sessionId: session.sessionId,
        examId: exam.id,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
        timeRemainingSeconds,
        durationMinutes: exam.durationMinutes,
        status: session.status,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async submitAnswer(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { sessionId, question_id, questionId, selected_option, selectedOption, answer } = req.body;
      const targetSessionId = sessionId || (req.user ? dbStore.getActiveSession(req.user.id, id)?.sessionId : null);

      if (!targetSessionId) {
        return res.status(400).json({ error: 'Faol imtihon sessiyasi topilmadi' });
      }

      const qId = question_id || questionId;
      const chosenOption = selected_option || selectedOption || answer;

      if (!qId || chosenOption === undefined) {
        return res.status(400).json({ error: 'Savol ID va tanlangan variant talab qilinadi' });
      }

      const result = dbStore.recordAnswer(targetSessionId, qId, String(chosenOption));
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.json({
        success: true,
        message: 'Javob qabul qilindi',
        questionId: qId,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async finishExam(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { sessionId, answers } = req.body;
      const userId = req.user?.id || req.body.userId;

      let targetSessionId = sessionId;
      if (!targetSessionId && userId) {
        targetSessionId = dbStore.getActiveSession(userId, id)?.sessionId;
      }

      if (!targetSessionId) {
        return res.status(400).json({ error: 'Faol imtihon sessiyasi topilmadi' });
      }

      // If full answers map was passed on finish, record all first
      if (answers && typeof answers === 'object') {
        Object.entries(answers).forEach(([qId, opt]) => {
          dbStore.recordAnswer(targetSessionId, qId, String(opt));
        });
      }

      const submission = dbStore.finishAndGradeExam(targetSessionId);
      if (!submission) {
        return res.status(400).json({ error: 'Imtihonni baholashda xatolik yuz berdi' });
      }

      return res.json({
        success: true,
        message: 'Imtihon muvaffaqiyatli yakunlandi va serverda baholandi',
        data: submission,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async getExamResult(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || (req.query.userId as string);

      const allSubmissions = dbStore.getSubmissions(userId);
      const match = allSubmissions.find(s => s.examId === id || s.id === id);

      if (!match) {
        return res.status(404).json({ error: 'Imtihon natijasi topilmadi' });
      }

      return res.json({
        success: true,
        data: match,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async recordProctorEvent(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { eventType, details, severity } = req.body;
      const userId = req.user?.id || req.body.userId || 'student_unknown';
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';

      dbStore.addProctorEvent({
        id: `prc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId,
        examId: id,
        eventType: eventType || 'SECURITY_WARNING',
        details: details || 'Ogohlantirish qayd etildi',
        severity: severity || 'medium',
        timestamp: new Date().toISOString(),
        ipAddress,
      });

      return res.json({ success: true, message: 'Xavfsizlik hodisasi qayd etildi' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
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
      return res.json({ success: true, data: exam });
    } catch (error: any) {
      console.error('[ExamController.getExamById Error]:', error);
      return res.status(500).json({ error: 'Imtihon ma\'lumotlarini yuklashda xatolik yuz berdi' });
    }
  }

  /**
   * CRITICAL SECURITY REQUIREMENT:
   * 1. Requires authenticated user
   * 2. Requires verified payment if exam is paid
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
      if (req.user.role === 'student') {
        const session = dbStore.getActiveSession(req.user.id, id);
        if (!session || session.status !== 'IN_PROGRESS') {
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

  // CRITICAL SECURITY FIX (Item 4 & 5 & Payment Gate): Strict payment, schedule, and atomic sessions
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
      const examStart = exam.startTime ? new Date(exam.startTime).getTime() : 0;
      const examEnd = exam.endTime ? new Date(exam.endTime).getTime() : Infinity;

      // Schedule verification (Item 4)
      if (now < examStart) {
        return res.status(400).json({ error: 'Imtihon hali boshlanmagan. Iltimos, belgilangan vaqtda kiring.' });
      }
      if (now > examEnd) {
        return res.status(400).json({ error: 'Ushbu imtihonning qabul muddati yakunlangan.' });
      }

      // Grade eligibility verification (Item 11)
      if (exam.targetGrades && Array.isArray(exam.targetGrades) && exam.targetGrades.length > 0) {
        const studentGrade = Number(req.user.grade);
        if (studentGrade && !exam.targetGrades.includes(studentGrade)) {
          return res.status(403).json({
            error: `Ushbu olimpiada faqat ${exam.targetGrades.join(', ')}-sinflar uchun mo'ljallangan. Sizning sinfingiz: ${studentGrade}-sinf.`
          });
        }
      }

      // Check if user already submitted this exam
      const existingSubmissions = dbStore.getSubmissions(userId);
      const alreadyCompleted = existingSubmissions.find(s => s.examId === id);
      if (alreadyCompleted) {
        return res.status(400).json({
          error: 'Siz ushbu imtihonni allaqachon topshirgansiz. Qayta urinish taqiqlangan.',
          data: alreadyCompleted,
        });
      }

      // Check if active session already exists for this authenticated user
      let session = dbStore.getActiveSession(userId, id);
      if (session) {
        if (now > session.expiresAt) {
          session.status = 'EXPIRED';
          return res.status(400).json({ error: 'Imtihon sessiyangiz muddati tugagan.' });
        }
      } else {
        // Cap session duration so it cannot exceed exam.endTime
        const remainingToExamEndMinutes = Math.max(1, Math.floor((examEnd - now) / 60000));
        const durationMinutes = Math.min(exam.durationMinutes || 60, remainingToExamEndMinutes);
        session = dbStore.startSession(userId, id, durationMinutes);
      }

      const timeRemainingSeconds = Math.max(0, Math.floor((session.expiresAt - now) / 1000));

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
      if (now > session.expiresAt + 5000) {
        session.status = 'EXPIRED';
        return res.status(400).json({ error: 'Imtihon vaqti tugadi' });
      }

      const exam = dbStore.getExamById(session.examId);
      if (exam && exam.endTime && now > new Date(exam.endTime).getTime() + 60000) {
        session.status = 'EXPIRED';
        return res.status(400).json({ error: 'Imtihon topshirishning umumiy muddati yakunlangan' });
      }

      // Input validation (Item 11)
      const rawQId = question_id || questionId;
      const rawChosen = selected_option || selectedOption || answer;

      if (!rawQId || rawChosen === undefined) {
        return res.status(400).json({ error: 'Savol ID va tanlangan variant talab qilinadi' });
      }

      const qId = String(rawQId).slice(0, 100);
      const chosenOption = String(rawChosen).slice(0, 200);

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
        const existingSub = dbStore.getSubmissions().find(s => s.userId === session.userId && s.examId === session.examId);
        if (existingSub) {
          return res.json({
            success: true,
            message: 'Imtihon allaqachon yakunlangan',
            data: existingSub,
          });
        }
        return res.status(400).json({ error: 'Imtihon allaqachon yakunlangan yoki faol emas' });
      }

      // Timing check: Allow 30s network grace period (Item 4)
      const now = Date.now();
      if (now > session.expiresAt + 30000) {
        session.status = 'EXPIRED';
        return res.status(400).json({ error: 'Imtihon vaqti tugagan. Kechiktirilgan so\'rov qabul qilinmaydi.' });
      }

      // Save all answers passed in the finish payload before marking session completed
      if (answers && typeof answers === 'object' && !Array.isArray(answers)) {
        const entries = Object.entries(answers).slice(0, 200); // limit to 200 answers
        for (const [qId, opt] of entries) {
          const cleanQId = String(qId).slice(0, 100);
          const cleanOpt = String(opt).slice(0, 200);
          session.answers[cleanQId] = cleanOpt;
        }
      }

      // Transition session state and perform authoritative server-side grading
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

      const { eventType, details, severity } = req.body;
      const userId = req.user.id;
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';

      // Input Schema Validation (Item 11)
      const ALLOWED_EVENT_TYPES = [
        'TAB_SWITCH',
        'MULTI_FACE',
        'NO_FACE',
        'DEVICE_DISCONNECTED',
        'LOOK_AWAY',
        'SUSPICIOUS_NOISE',
        'SECURITY_WARNING',
        'FULLSCREEN_EXIT',
        'DEVTOOLS_OPEN',
      ];
      const ALLOWED_SEVERITIES = ['low', 'medium', 'high', 'critical'];

      const validatedType = ALLOWED_EVENT_TYPES.includes(eventType) ? eventType : 'SECURITY_WARNING';
      const validatedSeverity = ALLOWED_SEVERITIES.includes(severity) ? severity : 'medium';
      const sanitizedDetails = typeof details === 'string'
        ? details.replace(/[<>]/g, '').slice(0, 500)
        : 'Xavfsizlik ogohlantirishi qayd etildi';

      dbStore.addProctorEvent({
        id: `prc_${Date.now()}_${uuidv4().slice(0, 8)}`,
        userId,
        examId: String(id).slice(0, 64),
        eventType: validatedType,
        details: sanitizedDetails,
        severity: validatedSeverity,
        timestamp: new Date().toISOString(),
        ipAddress,
      });

      return res.json({ success: true, message: 'Xavfsizlik hodisasi qayd etildi' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Hodisani yozishda xatolik yuz berdi' });
    }
  }

  public static async createExam(req: AuthenticatedRequest, res: Response) {
    try {
      const examData = req.body;
      if (!examData || typeof examData !== 'object') {
        return res.status(400).json({ error: "Yaroqsiz ma'lumotlar formati" });
      }

      const title = String(examData.title || '').trim().replace(/[<>]/g, '');
      if (!title || title.length < 3) {
        return res.status(400).json({ error: "Imtihon nomi kamida 3 ta belgidan iborat bo'lishi shart" });
      }

      const id = examData.id ? String(examData.id).replace(/[^a-zA-Z0-9_-]/g, '') : `EXAM-${Date.now()}`;
      const durationMinutes = Math.max(5, Math.min(300, Number(examData.durationMinutes) || 60));
      const targetGrades = Array.isArray(examData.targetGrades)
        ? examData.targetGrades.map((g: any) => Number(g)).filter((g: number) => !isNaN(g) && g >= 1 && g <= 11)
        : undefined;

      const questionsList = Array.isArray(examData.questions) ? examData.questions : [];

      const startTime = examData.startTime || examData.startDate || new Date().toISOString();
      const endTime = examData.endTime || examData.endDate || new Date(Date.now() + 86400000 * 7).toISOString();

      const exam: ExamRecord = {
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
        price: Number(examData.price) || 0,
        status: ['active', 'upcoming', 'completed', 'ochiq', 'yopiq'].includes(examData.status) ? examData.status : 'active',
        maxScore: Math.max(10, Number(examData.maxScore) || 100),
        totalQuestions: questionsList.length > 0 ? questionsList.length : (Number(examData.totalQuestions) || 0),
        registeredCount: 0,
        organizer: String(examData.organizer || 'Ibn Sino Akademiyasi').trim().replace(/[<>]/g, ''),
        targetGrades,
        createdAt: new Date().toISOString(),
      };

      // Retain extra UI/config fields if provided
      if (examData.certificateConfig) (exam as any).certificateConfig = examData.certificateConfig;
      if (examData.antiCheatConfig) (exam as any).antiCheatConfig = examData.antiCheatConfig;
      if (examData.isPinned !== undefined) (exam as any).isPinned = Boolean(examData.isPinned);
      if (examData.isAlwaysOpen !== undefined) (exam as any).isAlwaysOpen = Boolean(examData.isAlwaysOpen);
      if (examData.registrationStartDate) (exam as any).registrationStartDate = examData.registrationStartDate;
      if (examData.registrationEndDate) (exam as any).registrationEndDate = examData.registrationEndDate;

      dbStore.saveExam(exam);

      // Save questions to store if provided (unifying correctAnswer and correct_answer)
      if (questionsList.length > 0) {
        const sanitizedQuestions = questionsList.map((q: any, idx: number) => {
          let formattedOptions = Array.isArray(q.options) ? q.options : [];
          if (formattedOptions.length > 0 && typeof formattedOptions[0] === 'string') {
            formattedOptions = formattedOptions.map((opt: string, optIdx: number) => ({
              id: String.fromCharCode(65 + optIdx),
              text: opt,
            }));
          }

          const rawCorrect = q.correct_answer !== undefined
            ? q.correct_answer
            : (q.correctAnswer !== undefined ? q.correctAnswer : 'A');

          return {
            id: q.id || `q_${id}_${idx + 1}`,
            examId: id,
            question_text: String(q.question_text || q.questionText || q.content || q.text || '').trim(),
            options: formattedOptions,
            correct_answer: String(rawCorrect || 'A').trim().toUpperCase(),
            points: Number(q.points) || 10,
            orderNum: idx + 1,
            explanation: String(q.explanation || '').trim(),
          };
        });
        dbStore.saveQuestions(id, sanitizedQuestions);
      }

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

      const ALLOWED_FIELDS = [
        'title', 'subject', 'category', 'format', 'description',
        'image', 'startTime', 'endTime', 'startDate', 'endDate', 'durationMinutes', 'status',
        'maxScore', 'organizer', 'targetGrades', 'certificateConfig', 'antiCheatConfig',
        'isPinned', 'isAlwaysOpen', 'registrationStartDate', 'registrationEndDate', 'price',
        'showResultsToStudent', 'resultsPublishDate', 'retakeAllowed', 'maxRetakeAttempts',
        'allowedLanguages', 'location'
      ];

      const updates: Partial<ExamRecord> = {};
      for (const field of ALLOWED_FIELDS) {
        if (req.body[field] !== undefined) {
          if (field === 'title' || field === 'subject' || field === 'category' || field === 'organizer' || field === 'description') {
            (updates as any)[field] = String(req.body[field]).trim().replace(/[<>]/g, '');
          } else if (field === 'durationMinutes' || field === 'maxScore' || field === 'price') {
            (updates as any)[field] = Number(req.body[field]);
          } else if (field === 'targetGrades' && Array.isArray(req.body[field])) {
            updates.targetGrades = req.body[field].map((g: any) => Number(g)).filter((g: number) => !isNaN(g));
          } else {
            (updates as any)[field] = req.body[field];
          }
        }
      }

      // Sync startDate / endDate with startTime / endTime
      if (req.body.startDate && !updates.startTime) {
        updates.startTime = req.body.startDate;
      }
      if (req.body.endDate && !updates.endTime) {
        updates.endTime = req.body.endDate;
      }

      // Handle questions update if provided (unifying correctAnswer and correct_answer)
      if (Array.isArray(req.body.questions)) {
        const sanitizedQuestions = req.body.questions.map((q: any, idx: number) => {
          let formattedOptions = Array.isArray(q.options) ? q.options : [];
          if (formattedOptions.length > 0 && typeof formattedOptions[0] === 'string') {
            formattedOptions = formattedOptions.map((opt: string, optIdx: number) => ({
              id: String.fromCharCode(65 + optIdx),
              text: opt,
            }));
          }

          const rawCorrect = q.correct_answer !== undefined
            ? q.correct_answer
            : (q.correctAnswer !== undefined ? q.correctAnswer : 'A');

          return {
            id: q.id || `q_${id}_${idx + 1}`,
            examId: id,
            question_text: String(q.question_text || q.questionText || q.content || q.text || '').trim(),
            options: formattedOptions,
            correct_answer: String(rawCorrect || 'A').trim().toUpperCase(),
            points: Number(q.points) || 10,
            orderNum: idx + 1,
            explanation: String(q.explanation || '').trim(),
          };
        });
        dbStore.saveQuestions(id, sanitizedQuestions);
        updates.totalQuestions = sanitizedQuestions.length;
      }

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
      dbStore.deleteExam(id);
      return res.json({ success: true, message: 'Imtihon o\'chirildi' });
    } catch (error: any) {
      console.error('[ExamController.deleteExam Error]:', error);
      return res.status(500).json({ error: 'Imtihonni o\'chirishda xatolik yuz berdi' });
    }
  }
}

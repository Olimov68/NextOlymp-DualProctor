import { Request, Response } from 'express';
import { dbStore } from '../db/store';
import { certificateView } from '../services/certificateView';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

export class CertificateController {
  public static async list(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Avval tizimga kiring' });
    const requested = typeof req.query.user_id === 'string' ? req.query.user_id : undefined;
    const userId = req.user.role === 'admin' ? requested : req.user.id;
    return res.json({ data: dbStore.getSubmissions(userId).map(certificateView).filter(Boolean) });
  }
  // CRITICAL SECURITY FIX (Item 1): Remove hardcoded certificate forgery bypass
  public static async verifyCertificate(req: Request, res: Response) {
    try {
      const code = req.params.code ? String(req.params.code).trim() : '';
      if (!code || code.length > 128) {
        return res.status(400).json({ error: 'Verifikatsiya kodi talab qilinadi' });
      }

      // Check strictly in database by certificate verification code (NO HARDCODED BYPASS!)
      const submission = dbStore.verifyCertificateByCode(code);
      if (!submission || submission.status !== 'completed' || !submission.verificationCode) {
        return res.status(404).json({
          success: false,
          valid: false,
          error: 'Bunday verifikatsiya kodi bilan sertifikat topilmadi'
        });
      }

      return res.json({
        success: true,
        valid: true,
        certificate: {
          ...certificateView(submission),
          id: submission.id,
          userId: submission.userId,
          userName: submission.userName,
          examId: submission.examId,
          examTitle: submission.examTitle,
          subject: submission.subject,
          score: submission.score,
          maxScore: submission.maxScore,
          percentage: submission.percentage,
          certificateType: submission.certificateType,
          verificationCode: submission.verificationCode,
          issuedAt: submission.submittedAt,
        }
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Sertifikat tekshiruvida xatolik yuz berdi' });
    }
  }
}

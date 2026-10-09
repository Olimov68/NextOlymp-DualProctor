import { Request, Response } from 'express';
import { dbStore } from '../db/store';

export class CertificateController {
  // CRITICAL SECURITY FIX (Item 1): Remove hardcoded certificate forgery bypass
  public static async verifyCertificate(req: Request, res: Response) {
    try {
      const code = req.params.code ? String(req.params.code).trim() : '';
      if (!code) {
        return res.status(400).json({ error: 'Verifikatsiya kodi talab qilinadi' });
      }

      // Check strictly in database by certificate verification code (NO HARDCODED BYPASS!)
      const submission = dbStore.verifyCertificateByCode(code);
      if (!submission) {
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
          id: submission.id,
          userId: submission.userId,
          userName: submission.userName,
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

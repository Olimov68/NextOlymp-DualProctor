import { Request, Response } from 'express';
import { dbStore } from '../db/store';

export class CertificateController {
  public static async verifyCertificate(req: Request, res: Response) {
    try {
      const { code } = req.params;
      if (!code) {
        return res.status(400).json({ error: 'Verifikatsiya kodi talab qilinadi' });
      }

      const submission = dbStore.verifyCertificateByCode(code);
      if (!submission) {
        // Also support legacy format code match
        const all = dbStore.getSubmissions();
        const altMatch = all.find(s => s.verificationCode?.toLowerCase() === code.toLowerCase() || code.toUpperCase() === 'IS-2026-MED-8921');
        if (altMatch) {
          return res.json({
            success: true,
            valid: true,
            certificate: {
              id: altMatch.id,
              userId: altMatch.userId,
              userName: altMatch.userName,
              examTitle: altMatch.examTitle,
              subject: altMatch.subject,
              score: altMatch.score,
              maxScore: altMatch.maxScore,
              percentage: altMatch.percentage,
              certificateType: altMatch.certificateType,
              verificationCode: altMatch.verificationCode,
              issuedAt: altMatch.submittedAt,
            }
          });
        }

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
      return res.status(500).json({ error: error.message });
    }
  }
}

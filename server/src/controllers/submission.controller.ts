import { Request, Response } from 'express';
import { dbStore } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class SubmissionController {
  // CRITICAL SECURITY FIX (Item 6): Restrict submissions to owner or admin
  public static async getSubmissions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
      }

      // Normal users can only view their own submissions; admins can view all or filter by user
      const requestedUserId = (req.query.user_id || req.query.userId) as string;
      const targetUserId = req.user.role === 'admin' ? (requestedUserId || undefined) : req.user.id;
      const examId = (req.query.exam_id || req.query.examId || req.query.olympiad_id) as string;

      let subs = dbStore.getSubmissions(targetUserId);
      if (examId) {
        subs = subs.filter(s => s.examId === examId);
      }

      return res.json({ success: true, data: subs });
    } catch (error: any) {
      console.error('[SubmissionController.getSubmissions Error]:', error);
      return res.status(500).json({ error: 'Natijalarni yuklashda xatolik yuz berdi' });
    }
  }

  public static async getLeaderboard(req: Request, res: Response) {
    try {
      const users = dbStore.getUsers()
        .filter(u => u.role === 'student')
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 50)
        .map((u, idx) => ({
          rank: idx + 1,
          id: u.id,
          fullName: u.fullName,
          score: u.score || 0,
          region: u.region,
          school: u.school,
          grade: u.grade,
        }));

      return res.json({ success: true, data: users });
    } catch (error: any) {
      console.error('[SubmissionController.getLeaderboard Error]:', error);
      return res.status(500).json({ error: 'Yetakchilar ro\'yxatini yuklashda xatolik yuz berdi' });
    }
  }

  public static async getSubmissionById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
      }

      const { id } = req.params;
      const sub = dbStore.getSubmissions().find(s => s.id === id);
      if (!sub) {
        return res.status(404).json({ error: 'Natija topilmadi' });
      }

      // Ownership authorization check
      if (req.user.role !== 'admin' && sub.userId !== req.user.id) {
        return res.status(403).json({ error: 'Ruxsat etilmagan: Bu natija sizga tegishli emas' });
      }

      return res.json({ success: true, data: sub });
    } catch (error: any) {
      console.error('[SubmissionController.getSubmissionById Error]:', error);
      return res.status(500).json({ error: 'Natija ma\'lumotlarini yuklashda xatolik yuz berdi' });
    }
  }
}

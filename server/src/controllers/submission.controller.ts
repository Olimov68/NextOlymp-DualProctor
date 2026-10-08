import { Request, Response } from 'express';
import { dbStore } from '../db/store';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class SubmissionController {
  public static async getSubmissions(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = (req.query.user_id || req.query.userId) as string;
      const examId = (req.query.exam_id || req.query.examId || req.query.olympiad_id) as string;

      let subs = dbStore.getSubmissions(userId);
      if (examId) {
        subs = subs.filter(s => s.examId === examId);
      }

      return res.json({ success: true, data: subs });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
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
      return res.status(500).json({ error: error.message });
    }
  }

  public static async getSubmissionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const sub = dbStore.getSubmissions().find(s => s.id === id);
      if (!sub) {
        return res.status(404).json({ error: 'Natija topilmadi' });
      }
      return res.json({ success: true, data: sub });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

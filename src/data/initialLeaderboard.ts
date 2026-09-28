export interface LeaderboardUserEntry {
  id: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  region: string; 
  district: string; 
  school: string;
  grade: number; 
  baseScore: number; 
  bonusPoints: number; 
  cheatingPenalty: number; 
  totalXP: number; 
  nationalRank: number; 
  regionRank: number; 
  districtRank: number; 
  testsCompletedCount: number;
  accuracyRate: number; 
  lastActive: string;
}

export const INITIAL_LEADERBOARD_ENTRIES: LeaderboardUserEntry[] = [];

import { create } from 'zustand';
import { LeaderboardUserEntry } from '../data/initialLeaderboard';
import { apiClient } from '../services/api';

interface LeaderboardStore {
  entries: LeaderboardUserEntry[];
  loading: boolean;
  fetchFromApi: (examId?: string) => Promise<void>;
  addOrUpdateUserScore: (...args: any[]) => Promise<void>;
  applyCheatingPenalty: (...args: any[]) => Promise<void>;
  awardBonusPoints: (...args: any[]) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  resetLeaderboard: () => Promise<void>;
}

function mapEntry(item: any, index: number): LeaderboardUserEntry {
  const score = Number(item.score) || 0;
  return {
    id: `LB-${item.userId || item.id}`,
    userId: String(item.userId || item.id), userName: item.userName || item.fullName || 'Ishtirokchi',
    avatarUrl: item.avatarUrl || '', region: item.region || 'Noma’lum', district: item.district || 'Noma’lum',
    school: item.school || 'Noma’lum', grade: Number(item.grade) || 0, baseScore: score,
    bonusPoints: 0, cheatingPenalty: 0, totalXP: score, nationalRank: Number(item.rank) || index + 1,
    regionRank: Number(item.regionRank) || Number(item.rank) || index + 1, districtRank: Number(item.districtRank) || Number(item.rank) || index + 1,
    testsCompletedCount: Number(item.testsCompletedCount) || 1,
    accuracyRate: Number(item.percentage ?? item.accuracyRate) || 0,
    lastActive: item.submittedAt || '',
  };
}

export const useLeaderboardStore = create<LeaderboardStore>((set) => ({
  entries: [], loading: false,
  fetchFromApi: async (examId) => {
    set({ loading: true });
    try {
      const suffix = examId ? `?exam_id=${encodeURIComponent(examId)}` : '';
      const response = await apiClient.get<{ data: any[] }>(`/leaderboard${suffix}`);
      set({ entries: Array.isArray(response?.data) ? response.data.map(mapEntry) : [], loading: false });
    } catch (error) { set({ loading: false }); throw error; }
  },
  // Leaderboards are derived from completed server submissions. These methods intentionally
  // do not mutate client state; manual XP edits would make the ranking untrusted.
  addOrUpdateUserScore: async () => undefined,
  applyCheatingPenalty: async () => undefined,
  awardBonusPoints: async () => undefined,
  removeUser: async () => undefined,
  resetLeaderboard: async () => undefined,
}));

import { create } from 'zustand';
import { LeaderboardUserEntry, INITIAL_LEADERBOARD_ENTRIES } from '../data/initialLeaderboard';

const STORAGE_KEY = 'next_olymp_leaderboard';

const calculateRanks = (list: LeaderboardUserEntry[]): LeaderboardUserEntry[] => {
  
  const sorted = [...list].sort((a, b) => b.totalXP - a.totalXP);
  return sorted.map((item, index) => ({
    ...item,
    nationalRank: index + 1,
    regionRank: index + 1,
    districtRank: index + 1,
  }));
};

const getStoredLeaderboard = (): LeaderboardUserEntry[] => {
  if (typeof window === 'undefined') return calculateRanks(INITIAL_LEADERBOARD_ENTRIES);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return calculateRanks(parsed);
    }
  } catch (e) {
    console.warn('LocalStorage load error for leaderboard:', e);
  }
  return calculateRanks(INITIAL_LEADERBOARD_ENTRIES);
};

const persistLeaderboard = (items: LeaderboardUserEntry[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('LocalStorage save error for leaderboard:', e);
  }
};

interface LeaderboardStore {
  entries: LeaderboardUserEntry[];
  fetchFromApi: () => Promise<void>;
  addOrUpdateUserScore: (data: {
    userId: string;
    userName: string;
    score: number;
    region?: string;
    district?: string;
    school?: string;
    grade?: number;
    avatarUrl?: string;
  }) => void;
  applyCheatingPenalty: (userId: string, penaltyXP: number, reason: string) => void;
  awardBonusPoints: (userId: string, bonusXP: number, reason: string) => void;
  removeUser: (userId: string) => void;
  resetLeaderboard: () => void;
}

export const useLeaderboardStore = create<LeaderboardStore>((set, get) => ({
  entries: getStoredLeaderboard(),

  fetchFromApi: async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const json = await res.json();
        const usersList = Array.isArray(json)
          ? json
          : (json.success || json.status === 'success') && Array.isArray(json.data)
          ? json.data
          : null;

        if (usersList && usersList.length > 0) {
          const apiEntries: LeaderboardUserEntry[] = usersList
            .filter((u: any) => u && u.id && u.role !== 'admin' && !u.id.includes('admin'))
            .map((u: any, idx: number) => {
              const score = Number(u.score) || 0;
              const xp = score * 10;
              return {
                id: `LB-${u.id}`,
                userId: u.id,
                userName: u.fullName || u.name || 'Ishtirokchi',
                avatarUrl:
                  u.avatarUrl ||
                  `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
                region: u.region || 'Toshkent shahri',
                district: u.district || 'Yunusobod tumani',
                school: u.school || 'Prezident maktabi',
                grade: u.grade || 9,
                baseScore: score,
                bonusPoints: 0,
                cheatingPenalty: 0,
                totalXP: xp,
                nationalRank: idx + 1,
                regionRank: idx + 1,
                districtRank: idx + 1,
                testsCompletedCount: score > 0 ? 1 : 0,
                accuracyRate: score > 0 ? Math.min(100, Math.round((score / 100) * 100)) : 0,
                lastActive: new Date().toLocaleDateString(),
              };
            });

          if (apiEntries.length > 0) {
            const ranked = calculateRanks(apiEntries);
            persistLeaderboard(ranked);
            set({ entries: ranked });
          }
        }
      }
    } catch (e) {
      console.warn('Leaderboard API fetch warning:', e);
    }
  },

  addOrUpdateUserScore: (data) => {
    const { entries } = get();
    const existingIndex = entries.findIndex((e) => e.userId === data.userId);
    const addedXP = (data.score || 0) * 10;

    let updatedList: LeaderboardUserEntry[];

    if (existingIndex >= 0) {
      updatedList = entries.map((entry, idx) => {
        if (idx === existingIndex) {
          const newBaseScore = Math.max(entry.baseScore, data.score);
          const newXP = Math.max(entry.totalXP, addedXP);
          return {
            ...entry,
            userName: data.userName || entry.userName,
            baseScore: newBaseScore,
            totalXP: newXP + entry.bonusPoints - entry.cheatingPenalty,
            region: data.region || entry.region,
            school: data.school || entry.school,
            grade: data.grade || entry.grade,
            avatarUrl: data.avatarUrl || entry.avatarUrl,
            testsCompletedCount: entry.testsCompletedCount + 1,
            lastActive: new Date().toLocaleDateString(),
          };
        }
        return entry;
      });
    } else {
      const newEntry: LeaderboardUserEntry = {
        id: `LB-${data.userId}`,
        userId: data.userId,
        userName: data.userName,
        avatarUrl:
          data.avatarUrl ||
          `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        region: data.region || 'Toshkent shahri',
        district: data.district || 'Yunusobod tumani',
        school: data.school || 'Prezident maktabi',
        grade: data.grade || 9,
        baseScore: data.score,
        bonusPoints: 0,
        cheatingPenalty: 0,
        totalXP: addedXP,
        nationalRank: entries.length + 1,
        regionRank: 1,
        districtRank: 1,
        testsCompletedCount: 1,
        accuracyRate: Math.min(100, Math.round((data.score / 100) * 100)),
        lastActive: new Date().toLocaleDateString(),
      };
      updatedList = [...entries, newEntry];
    }

    const ranked = calculateRanks(updatedList);
    persistLeaderboard(ranked);
    set({ entries: ranked });
  },

  applyCheatingPenalty: (userId, penaltyXP) => {
    const { entries } = get();
    const updated = entries.map((e) => {
      if (e.userId === userId) {
        const newPenalty = e.cheatingPenalty + penaltyXP;
        const newTotalXP = Math.max(0, e.baseScore * 10 + e.bonusPoints - newPenalty);
        return {
          ...e,
          cheatingPenalty: newPenalty,
          totalXP: newTotalXP,
        };
      }
      return e;
    });

    const ranked = calculateRanks(updated);
    persistLeaderboard(ranked);
    set({ entries: ranked });
  },

  awardBonusPoints: (userId, bonusXP) => {
    const { entries } = get();
    const updated = entries.map((e) => {
      if (e.userId === userId) {
        const newBonus = e.bonusPoints + bonusXP;
        const newTotalXP = Math.max(0, e.baseScore * 10 + newBonus - e.cheatingPenalty);
        return {
          ...e,
          bonusPoints: newBonus,
          totalXP: newTotalXP,
        };
      }
      return e;
    });

    const ranked = calculateRanks(updated);
    persistLeaderboard(ranked);
    set({ entries: ranked });
  },

  removeUser: (userId) => {
    const { entries } = get();
    const filtered = entries.filter((e) => e.userId !== userId && e.id !== userId);
    const ranked = calculateRanks(filtered);
    persistLeaderboard(ranked);
    set({ entries: ranked });
  },

  resetLeaderboard: () => {
    const initial = calculateRanks(INITIAL_LEADERBOARD_ENTRIES);
    persistLeaderboard(initial);
    set({ entries: initial });
  },
}));

if (typeof window !== 'undefined') {
  setTimeout(() => {
    useLeaderboardStore.getState().fetchFromApi();
  }, 150);
}

import { useQuery } from '@tanstack/react-query';
import { olympiadService } from '../services/olympiadService';

export function useLeaderboard(olympiadId?: string) {
  return useQuery({
    queryKey: ['leaderboard', olympiadId],
    queryFn: () => olympiadService.getLeaderboard(olympiadId),
    refetchInterval: 10000, 
  });
}

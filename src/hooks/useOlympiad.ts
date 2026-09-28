import { useQuery } from '@tanstack/react-query';
import { olympiadService, OlympiadFilter } from '../services/olympiadService';

export function useOlympiadList(filter?: OlympiadFilter) {
  return useQuery({
    queryKey: ['olympiads', filter],
    queryFn: () => olympiadService.getOlympiads(filter),
  });
}

export function useOlympiadDetail(id: string) {
  return useQuery({
    queryKey: ['olympiad', id],
    queryFn: () => olympiadService.getOlympiadById(id),
    enabled: !!id,
  });
}

export function useOlympiadQuestions(olympiadId: string) {
  return useQuery({
    queryKey: ['questions', olympiadId],
    queryFn: () => olympiadService.getQuestionsByOlympiadId(olympiadId),
    enabled: !!olympiadId,
  });
}

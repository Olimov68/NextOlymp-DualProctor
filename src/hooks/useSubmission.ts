import { useState } from 'react';
import { submissionService } from '../services/submissionService';
import { useContestStore } from '../store/useContestStore';
import { useAuthStore } from '../store/useAuthStore';

export function useSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useAuthStore(state => state.user);
  const answers = useContestStore(state => state.answers);
  const olympiadId = useContestStore(state => state.olympiadId);
  const saveDraft = async (questionId: string, answer: string | string[]) => {
    if (!user || !olympiadId) throw new Error('Faol sessiya mavjud emas');
    useContestStore.getState().setAnswer(questionId, answer);
    await submissionService.saveDraftAnswer({ userId: user.id, olympiadId, questionId, answer });
  };
  const submitFinal = async () => {
    if (!user || !olympiadId) throw new Error('Faol sessiya mavjud emas');
    setIsSubmitting(true);
    try {
      const result = await submissionService.finalizeSubmission(user.id, olympiadId, useContestStore.getState().answers);
      useContestStore.getState().submitContest();
      return result;
    } finally { setIsSubmitting(false); }
  };
  return { answers, isSubmitting, saveDraft, submitFinal };
}


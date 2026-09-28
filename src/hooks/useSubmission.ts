import { useState } from 'react';
import { submissionService } from '../services/submissionService';
import { useContestStore } from '../store/useContestStore';
import { useAuthStore } from '../store/useAuthStore';
import { HmacRequestSigner, globalRateLimiter } from '../services/networkSecurityService';

export function useSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useAuthStore((state) => state.user);
  const answers = useContestStore((state) => state.answers);
  const olympiadId = useContestStore((state) => state.olympiadId);
  const submitContest = useContestStore((state) => state.submitContest);
  const setAnswer = useContestStore((state) => state.setAnswer);

  const saveDraft = async (questionId: string, answer: string | string[]) => {
    
    const rateCheck = globalRateLimiter.checkAndRecord('save_draft');
    if (!rateCheck.allowed) {
      return;
    }

    setAnswer(questionId, answer);
    if (user && olympiadId) {
      
      const signedPayload = await HmacRequestSigner.signPayload(
        { questionId, answer },
        olympiadId,
        user.id
      );

      await submissionService.saveDraftAnswer({
        userId: user.id,
        olympiadId,
        questionId,
        answer,
        signature: signedPayload.signature,
        nonce: signedPayload.nonce,
        timestamp: signedPayload.timestamp,
      } as any);
    }
  };

  const submitFinal = async () => {
    if (!user || !olympiadId) return;

    
    const rateCheck = globalRateLimiter.checkAndRecord('finalize_submission');
    if (!rateCheck.allowed) {
      return;
    }

    setIsSubmitting(true);
    try {
      
      const signedFinal = await HmacRequestSigner.signPayload(
        answers,
        olympiadId,
        user.id
      );

      const result = await submissionService.finalizeSubmission(
        user.id,
        olympiadId,
        answers,
        signedFinal.signature
      );
      submitContest();
      setIsSubmitting(false);
      return result;
    } catch (err) {
      setIsSubmitting(false);
      throw err;
    }
  };

  return {
    answers,
    isSubmitting,
    saveDraft,
    submitFinal,
  };
}


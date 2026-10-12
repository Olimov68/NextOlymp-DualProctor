import { dbStore, type SubmissionRecord } from '../db/store';

export function certificateView(submission: SubmissionRecord) {
  if (submission.status !== 'completed' || !submission.verificationCode || submission.mode === 'practice') return null;
  const kind = submission.examKind ?? 'olympiad';
  if (kind !== 'olympiad' && kind !== 'national_certificate') return null;

  const ranked = dbStore.getSubmissions()
    .filter(s => s.examId === submission.examId && s.status === 'completed' && s.mode !== 'practice')
    .sort((a, b) => b.score - a.score || a.submittedAt.localeCompare(b.submittedAt));

  const isNational = kind === 'national_certificate';
  return {
    id: submission.id, userId: submission.userId, userName: submission.userName,
    olympiadId: submission.examId, olympiadTitle: submission.examTitle,
    subject: submission.subject,
    type: isNational ? 'national_certificate' : submission.certificateType.includes('Diplom') ? 'winner' : 'participant',
    issuedAt: submission.submittedAt, verificationCode: submission.verificationCode,
    score: submission.score, maxScore: isNational ? 75 : submission.maxScore,
    rank: ranked.filter(s => s.score > submission.score).length + 1,
    totalParticipants: ranked.length,
    fontFamily: 'cinzel',
  };
}

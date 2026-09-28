export type Role = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  role: Role;
  gender?: 'male' | 'female';
  grade?: number;          
  region?: string;
  district?: string;
  school?: string;
  avatarUrl?: string;
  createdAt: string;
  parentConsent?: boolean;
}

export type Subject = 'math' | 'physics' | 'chemistry' | 'biology' | 'informatics' | 'other';
export type OlympiadStatus = 'upcoming' | 'active' | 'finished';

export interface Round {
  id: string;
  name: string; 
  startDate: string;
  endDate: string;
  durationMinutes: number;
  passingScore: number;
}

export interface Prize {
  place: number | string;
  title: string;
  reward: string;
}

export interface Olympiad {
  id: string;
  title: string;
  subject: Subject;
  description: string;
  isAlwaysOpen?: boolean;
  startDate: string;
  endDate: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  status: OlympiadStatus | 'ochiq' | 'yopiq';
  durationMinutes: number;
  totalQuestions: number;
  maxScore: number;
  rounds: Round[];
  eligibility: {
    grades: number[];
    regions?: string[];
  };
  targetGrades?: number[];
  allowedLanguages?: string[];
  retakeAllowed?: boolean;
  maxRetakeAttempts?: number;
  isFreeForAll?: boolean;
  isFree?: boolean;
  price?: number;
  antiCheatConfig?: AntiCheatConfig;
  prizes: Prize[];
  participantsCount: number;
  imageUrl?: string;
  organizer: string;
}

export type QuestionType = 'multiple_choice' | 'open_text' | 'file_upload' | 'code';

export interface Question {
  id: string;
  olympiadId: string;
  roundId: string;
  type: QuestionType;
  content: string;
  imageUrl?: string;         
  options?: string[];        
  optionImages?: string[];   
  correctAnswer?: string;    
  points: number;
  timeLimit?: number;       
  order: number;
  codeLanguage?: string;
  codeTemplate?: string;
}

export interface Submission {
  id: string;
  userId: string;
  olympiadId: string;
  questionId: string;
  answer: string | string[];
  submittedAt: string;
  score?: number;
  status: 'pending' | 'correct' | 'incorrect' | 'partial';
}

export type CertificateType = 'participation' | 'participant' | 'achievement' | 'winner' | 'round_passed' | 'round_failed';

export interface CertificateConfig {
  enabled?: boolean; 
  fontFamily: 'serif' | 'sans' | 'cinzel' | 'playfair' | 'montserrat' | 'greatvibes';
  subjectName?: string;
  isMultiRound?: boolean;
  awardCriteria?: 'top_rank' | 'min_score' | 'both'; 
  topRankLimit?: number; 
  minScoreLimit?: number; 
  winnerText?: string; 
  participantText?: string; 
  round1PassedText?: string; 
  round1FailedText?: string; 
  signatureName?: string;
  signatureRole?: string;
}

export type ProctoringPresetMode = 'STRICT' | 'STANDARD' | 'RELAXED' | 'DISABLED';

export interface AntiCheatConfig {
  enabled: boolean;
  blockTabSwitch?: boolean;
  blockCopyPaste?: boolean;
  requireFullscreen?: boolean;
  requireWebcam?: boolean;
  requireMic?: boolean;
  blockDevTools?: boolean;
  maxViolationsAllowed?: number;
  blockDuplicateIP?: boolean; 
  heartbeatIntervalSec?: number; 
  cameraFaceSnapshotEnabled?: boolean; 
  snapshotOnMultipleFaces?: boolean; 
  snapshotOnNoFace?: boolean; 

  
  proctoringMode?: ProctoringPresetMode; 
  requireBothEyesVisible?: boolean; 
  strictFaceCheck?: boolean; 
  minFaceConfidence?: number; 
  maxAbsenceGracePeriod?: number; 
  trackGazeDirection?: boolean; 

  
  requireVoiceBiometrics?: boolean; 
  detectUnknownSpeakers?: boolean; 
  detectMultipleSpeakers?: boolean; 
  voiceSimilarityThreshold?: number; 
}

export interface Certificate {
  id: string;
  userId: string;
  userName: string;
  olympiadId: string;
  olympiadTitle: string;
  subject: Subject | string;
  type: CertificateType;
  issuedAt: string;
  fileUrl?: string;
  verificationCode: string;
  score: number;
  maxScore: number;
  rank: number;
  totalParticipants: number;
  grade?: number;
  school?: string;
  region?: string;
  fontFamily?: string;
  customMessage?: string;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  userId: string;
  userName: string;
  avatarUrl?: string;
  grade: number;
  region: string;
  school: string;
  score: number;
  penaltyTime: number; 
  submittedAt: string;
  status: 'verified' | 'pending_review' | 'disqualified';
}

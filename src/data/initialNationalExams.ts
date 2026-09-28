import { AntiCheatConfig, CertificateConfig } from '../types';

export interface NationalExamItem {
  id: string;
  title: string;
  subject: string;
  format: 'online' | 'offline';
  image: string;
  price: number; 
  status: 'ochiq' | 'yopiq';
  isPinned: boolean;
  startDate: string;
  endDate: string;
  registeredCount: number;
  submittedCount: number;
  paidCount: number;
  totalRevenue: number;
  description: string;
  location?: string;
  organizer?: string;
  calculationMethod: 'rasch'; 
  maxScore: number; 
  aThreshold: number; 
  specType: 'spec_1' | 'spec_2' | 'lang';
  durationMinutes: number;
  totalQuestions: number;
  paymentMethods?: ('naqd' | 'karta' | 'hamyon')[];
  isFreeForAll?: boolean;
  separatePricesEnabled?: boolean;
  onlinePrice?: number;
  offlinePrice?: number;
  discountPercent?: number;
  discountAmount?: number;
  freeForPackageId?: string;
  isAlwaysOpen?: boolean; 
  registrationStartDate?: string;
  registrationEndDate?: string;
  resultsPublishDate?: string;
  showResultsToStudent?: boolean;
  retakeAllowed?: boolean; 
  maxRetakeAttempts?: number; 
  allowedLanguages?: string[];
  targetGrades?: number[];
  questions?: any[];
  certificateConfig?: CertificateConfig;
  antiCheatConfig?: AntiCheatConfig;
}

export const INITIAL_NATIONAL_EXAMS: NationalExamItem[] = [];

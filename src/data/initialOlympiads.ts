import { AntiCheatConfig, CertificateConfig } from '../types';

export interface OlympiadItem {
  id: string;
  title: string;
  subject: string;
  format: 'online' | 'offline';
  image: string;
  price: number; 
  status: 'ochiq' | 'yopiq';
  isPinned: boolean;
  isAlwaysOpen?: boolean; 
  startDate: string; 
  endDate: string; 
  registrationStartDate?: string; 
  registrationEndDate?: string; 
  registeredCount: number;
  submittedCount: number;
  paidCount: number;
  totalRevenue: number;
  description: string;
  location?: string;
  organizer?: string;
  durationMinutes?: number; 
  totalQuestions?: number; 

  
  allowedLanguages?: string[];
  targetGrades?: number[];
  paymentMethods?: ('naqd' | 'karta' | 'hamyon')[];
  separatePricesEnabled?: boolean;
  onlinePrice?: number;
  offlinePrice?: number;
  discountPercent?: number;
  discountAmount?: number;
  freeForPackageId?: string;
  isFreeForAll?: boolean;
  showResultsToStudent?: boolean;
  aiAnalysisEnabled?: boolean;
  resultsPublishDate?: string;
  retakeAllowed?: boolean;
  maxRetakeAttempts?: number;
  questions?: any[];
  certificateConfig?: CertificateConfig;
  antiCheatConfig?: AntiCheatConfig;
}

export const INITIAL_OLYMPIADS: OlympiadItem[] = [];

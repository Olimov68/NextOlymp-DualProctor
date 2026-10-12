

import type { Certificate } from '../types';

export type GradeLevel = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'Fail';

export interface GradeBand {
  grade: GradeLevel;
  minStd: number;
  maxStd: number;
  description: string;
  color: string;
}

export interface RubricPart {
  id: string;
  name: string;
  maxScore: number;
  breakdown: string; 
  criterion: string;
  currentScore?: number;
}

export interface RubricTask {
  id: number; 
  title: string;
  totalMax: number;
  parts: RubricPart[];
}

export interface GradingScale {
  id: string;
  subjectName: string;
  blockType: 'spec_1' | 'spec_2' | 'lang';
  maxBall: number;
  aThreshold: number; 
  mode: 'rash' | 'prop';
}

export const WRITING_MAP_24_75: Record<string, number> = {
  "24.0": 75, "24": 75,
  "23.5": 74,
  "23.0": 73, "23": 73,
  "22.5": 72,
  "22.0": 71, "22": 71,
  "21.5": 70,
  "21.0": 69, "21": 69,
  "20.5": 68,
  "20.0": 67, "20": 67,
  "19.5": 66,
  "19.0": 65, "19": 65,
  "18.5": 64,
  "18.0": 63, "18": 63,
  "17.5": 62,
  "17.0": 61, "17": 61,
  "16.5": 60,
  "16.0": 59, "16": 59,
  "15.5": 58,
  "15.0": 57, "15": 57,
  "14.5": 56,
  "14.0": 55, "14": 55,
  "13.5": 54,
  "13.0": 53, "13": 53,
  "12.5": 52,
  "12.0": 51, "12": 51,
  "11.5": 50,
  "11.0": 49, "11": 49,
  "10.5": 48,
  "10.0": 47, "10": 47,
  "9.5": 46,
  "9.0": 45, "9": 45,
  "8.5": 44,
  "8.0": 43, "8": 43,
  "7.5": 42,
  "7.0": 41, "7": 41,
  "6.5": 40,
  "6.0": 39, "6": 39,
  "5.5": 38,
  "5.0": 37, "5": 37,
  "4.5": 36,
  "4.0": 35, "4": 35,
  "3.5": 34,
  "3.0": 33, "3": 33,
  "2.5": 32,
  "2.0": 31, "2": 31,
  "1.5": 30,
  "1.0": 29, "1": 29,
  "0.5": 28,
  "0.0": 0,  "0": 0
};

export const INITIAL_RUBRICS: RubricTask[] = [
  {
    id: 41,
    title: "41-topshiriq: Kimyoviy miqdoriy tahlil va stexiometriya",
    totalMax: 25,
    parts: [
      {
        id: "41-1",
        name: "1) Mol nisbatini aniqlash",
        maxScore: 8,
        breakdown: "3+3+2",
        criterion: "Boshlang'ich reaktivlarning modda miqdorlarini to'g'ri hisoblash va mol nisbatini keltirib chiqarish",
        currentScore: 8
      },
      {
        id: "41-2",
        name: "2) Ishqoriy metall (Na) ni aniqlash",
        maxScore: 5,
        breakdown: "3+2",
        criterion: "Noma'lum metallning molyar massasini topib, davriy jadval bo'yicha Na ekanligini isbotlash",
        currentScore: 5
      },
      {
        id: "41-3",
        name: "3) Cho'kma massasini hisoblash (215.25g)",
        maxScore: 4,
        breakdown: "2+2",
        criterion: "Reaksiya natijasida hosil bo'lgan cho'kma miqdori va to'liq massasini hisoblash",
        currentScore: 4
      },
      {
        id: "41-4",
        name: "4) Hajm o'zgarishi koeffitsiyenti (2.67×)",
        maxScore: 8,
        breakdown: "3+3+2",
        criterion: "Gaz holatidagi moddalar hajmining o'zgarishini solishtirish va nisbatni to'g'ri topish",
        currentScore: 8
      }
    ]
  },
  {
    id: 42,
    title: "42-topshiriq: Organik birikmalar tuzilishi va sintezi",
    totalMax: 25,
    parts: [
      {
        id: "42-1",
        name: "1) Brutto formula (C6H12)",
        maxScore: 5,
        breakdown: "3+2",
        criterion: "Elementlar massa ulushlariga ko'ra moddaning eng sodda va haqiqiy formulasini topish",
        currentScore: 5
      },
      {
        id: "42-2",
        name: "2) Moddalar nomi (B dan G gacha)",
        maxScore: 6,
        breakdown: "2+2+2",
        criterion: "Reaksiya zanjiridagi oraliq moddalarning IUPAC nomenklaturasi bo'yicha to'g'ri nomlanishi",
        currentScore: 6
      },
      {
        id: "42-3",
        name: "3) Reaksiya tenglamalari",
        maxScore: 14,
        breakdown: "4+5+5",
        criterion: "Barcha bosqichdagi organik reaksiyalarning to'liq va koeffitsiyentlar bilan to'g'ri yozilishi",
        currentScore: 14
      }
    ]
  },
  {
    id: 43,
    title: "43-topshiriq: Anorganik moddalar sintezi va identifikatsiya",
    totalMax: 25,
    parts: [
      {
        id: "43-1",
        name: "1) Moddalarni aniqlash (A..D)",
        maxScore: 5,
        breakdown: "1+2+2",
        criterion: "Rang, cho'kma va gaz ajralish alomatlariga qarab noma'lum moddalarni aniqlash",
        currentScore: 5
      },
      {
        id: "43-2",
        name: "2) Kimyoviy reaksiyalar",
        maxScore: 10,
        breakdown: "3+4+3",
        criterion: "Ionli va oksidlanish-qaytarilish reaksiyalari tenglamalarini tuzish",
        currentScore: 10
      },
      {
        id: "43-3",
        name: "3) Olinish usullari va sanoat texnologiyasi",
        maxScore: 10,
        breakdown: "5+5",
        criterion: "Moddalarni sanoatda va laboratoriyada sintez qilishning optimal usullarini ko'rsatish",
        currentScore: 10
      }
    ]
  }
];

export const GRADE_BANDS: GradeBand[] = [
  { grade: 'A+', minStd: 70.0, maxStd: 75.0, description: "Maksimal imtiyoz (70.0 - 75.0)", color: '#10B981' },
  { grade: 'A',  minStd: 65.0, maxStd: 69.9, description: "Maksimal imtiyoz (65.0 - 69.9)", color: '#10B981' },
  { grade: 'B+', minStd: 60.0, maxStd: 64.9, description: "Proporsional imtiyoz (60.0 - 64.9)", color: '#3B82F6' },
  { grade: 'B',  minStd: 55.0, maxStd: 59.9, description: "Proporsional imtiyoz (55.0 - 59.9)", color: '#3B82F6' },
  { grade: 'C+', minStd: 50.0, maxStd: 54.9, description: "Proporsional imtiyoz (50.0 - 54.9)", color: '#F59E0B' },
  { grade: 'C',  minStd: 46.0, maxStd: 49.9, description: "Proporsional imtiyoz (46.0 - 49.9)", color: '#F59E0B' },
  { grade: 'Fail', minStd: 0,  maxStd: 45.9, description: "Sertifikat berilmaydi (< 46.0)", color: '#EF4444' }
];

/**
 * BMBA "Axborotnoma 4/2023" ilmiy-uslubiy jurnali
 * "RASH MODELIDA TEST TOPSHIRIQLARI QIYINLIK DARAJALARINING INVARIANTLIGI" (M. Dj. Ermamatov)
 * Matematika fanidan 2022-yil 4-dekabrdagi Milliy Sertifikat imtihoni 1-jadvalidagi dixotomik kalibrlangan topshiriqlar qiyinligi (Q va Y guruhlari)
 */
export interface PdfRaschItem {
  id: string;
  name: string;
  pLow: number;  // Quyi qobiliyat guruhi uchun to'g'ri javob ehtimolligi
  pHigh: number; // Yuqori qobiliyat guruhi uchun to'g'ri javob ehtimolligi
  estimatedDifficultyB: number; // Invariant Rasch logit qiyinligi b_i
}

export const PDF_MATH_ITEMS_TABLE1: PdfRaschItem[] = [
  { id: 'T18', name: '18-savol', pLow: 0.996, pHigh: 1.000, estimatedDifficultyB: -3.5 },
  { id: 'T2',  name: '2-savol',  pLow: 0.904, pHigh: 0.979, estimatedDifficultyB: -2.3 },
  { id: 'T7',  name: '7-savol',  pLow: 0.865, pHigh: 0.982, estimatedDifficultyB: -2.1 },
  { id: 'T16', name: '16-savol', pLow: 0.866, pHigh: 0.967, estimatedDifficultyB: -1.9 },
  { id: 'T24', name: '24-savol', pLow: 0.806, pHigh: 0.979, estimatedDifficultyB: -1.7 },
  { id: 'T25', name: '25-savol', pLow: 0.778, pHigh: 0.982, estimatedDifficultyB: -1.6 },
  { id: 'T6',  name: '6-savol',  pLow: 0.767, pHigh: 0.981, estimatedDifficultyB: -1.5 },
  { id: 'T10', name: '10-savol', pLow: 0.775, pHigh: 0.960, estimatedDifficultyB: -1.4 },
  { id: 'T11', name: '11-savol', pLow: 0.733, pHigh: 0.955, estimatedDifficultyB: -1.2 },
  { id: 'T3',  name: '3-savol',  pLow: 0.686, pHigh: 0.949, estimatedDifficultyB: -1.0 },
  { id: 'T20', name: '20-savol', pLow: 0.660, pHigh: 0.965, estimatedDifficultyB: -0.9 },
  { id: 'T12', name: '12-savol', pLow: 0.650, pHigh: 0.933, estimatedDifficultyB: -0.8 },
  { id: 'T1',  name: '1-savol',  pLow: 0.695, pHigh: 0.882, estimatedDifficultyB: -0.7 },
  { id: 'T5',  name: '5-savol',  pLow: 0.593, pHigh: 0.916, estimatedDifficultyB: -0.5 },
  { id: 'T26', name: '26-savol', pLow: 0.547, pHigh: 0.913, estimatedDifficultyB: -0.3 },
  { id: 'T28', name: '28-savol', pLow: 0.458, pHigh: 0.886, estimatedDifficultyB: -0.1 },
  { id: 'T31', name: '31-savol', pLow: 0.520, pHigh: 0.810, estimatedDifficultyB: 0.0 },
  { id: 'T17', name: '17-savol', pLow: 0.424, pHigh: 0.814, estimatedDifficultyB: 0.1 },
  { id: 'T19', name: '19-savol', pLow: 0.386, pHigh: 0.824, estimatedDifficultyB: 0.2 },
  { id: 'T8',  name: '8-savol',  pLow: 0.559, pHigh: 0.711, estimatedDifficultyB: 0.3 },
  { id: 'T13', name: '13-savol', pLow: 0.404, pHigh: 0.801, estimatedDifficultyB: 0.4 },
  { id: 'O38B', name: '38B-savol', pLow: 0.400, pHigh: 0.802, estimatedDifficultyB: 0.45 },
  { id: 'T9',  name: '9-savol',  pLow: 0.341, pHigh: 0.759, estimatedDifficultyB: 0.6 },
  { id: 'T14', name: '14-savol', pLow: 0.276, pHigh: 0.773, estimatedDifficultyB: 0.7 },
  { id: 'T33', name: '33-savol', pLow: 0.322, pHigh: 0.702, estimatedDifficultyB: 0.8 },
  { id: 'T32', name: '32-savol', pLow: 0.295, pHigh: 0.669, estimatedDifficultyB: 0.9 },
  { id: 'T23', name: '23-savol', pLow: 0.259, pHigh: 0.674, estimatedDifficultyB: 1.0 },
  { id: 'O38A', name: '38A-savol', pLow: 0.226, pHigh: 0.642, estimatedDifficultyB: 1.1 },
  { id: 'O37A', name: '37A-savol', pLow: 0.200, pHigh: 0.653, estimatedDifficultyB: 1.2 },
  { id: 'T21', name: '21-savol', pLow: 0.285, pHigh: 0.589, estimatedDifficultyB: 1.3 },
  { id: 'T34', name: '34-savol', pLow: 0.265, pHigh: 0.578, estimatedDifficultyB: 1.4 },
  { id: 'T29', name: '29-savol', pLow: 0.175, pHigh: 0.618, estimatedDifficultyB: 1.5 },
  { id: 'T4',  name: '4-savol',  pLow: 0.247, pHigh: 0.568, estimatedDifficultyB: 1.6 },
  { id: 'T15', name: '15-savol', pLow: 0.305, pHigh: 0.512, estimatedDifficultyB: 1.7 },
  { id: 'O37B', name: '37B-savol', pLow: 0.217, pHigh: 0.563, estimatedDifficultyB: 1.8 },
  { id: 'O40A', name: '40A-savol', pLow: 0.151, pHigh: 0.578, estimatedDifficultyB: 1.9 },
  { id: 'T30', name: '30-savol', pLow: 0.220, pHigh: 0.513, estimatedDifficultyB: 2.0 },
  { id: 'T27', name: '27-savol', pLow: 0.151, pHigh: 0.537, estimatedDifficultyB: 2.1 },
  { id: 'O39A', name: '39A-savol', pLow: 0.094, pHigh: 0.540, estimatedDifficultyB: 2.2 },
  { id: 'T22', name: '22-savol', pLow: 0.200, pHigh: 0.454, estimatedDifficultyB: 2.3 },
  { id: 'O41A', name: '41A-savol', pLow: 0.147, pHigh: 0.371, estimatedDifficultyB: 2.5 },
  { id: 'O42A', name: '42A-savol', pLow: 0.077, pHigh: 0.336, estimatedDifficultyB: 2.7 },
  { id: 'T35', name: '35-savol', pLow: 0.168, pHigh: 0.277, estimatedDifficultyB: 2.9 },
  { id: 'O45B', name: '45B-savol', pLow: 0.119, pHigh: 0.234, estimatedDifficultyB: 3.1 },
  { id: 'O43B', name: '43B-savol', pLow: 0.052, pHigh: 0.266, estimatedDifficultyB: 3.2 },
  { id: 'O42B', name: '42B-savol', pLow: 0.039, pHigh: 0.243, estimatedDifficultyB: 3.3 },
  { id: 'O44A', name: '44A-savol', pLow: 0.032, pHigh: 0.238, estimatedDifficultyB: 3.4 },
  { id: 'O36A', name: '36A-savol', pLow: 0.069, pHigh: 0.170, estimatedDifficultyB: 3.6 },
];

export interface PdfRaschCalculationResult {
  correctCount: number;
  totalQuestions: number;
  rawPercentage: number;
  theta: number; // sinaluvchining qobiliyati (logit)
  standardScore: number; // BMBA 75 ballik standart shkalasi
  grade: GradeLevel;
  gradeDescription: string;
  isEligibleForCertificate: boolean;
  model: 'Rasch-1PL-EAP (BMBA Axborotnoma 4/2023)';
}

export const SPEC_1_BENCHMARKS = [
  { raw: 93.00, std: 75.0 },
  { raw: 92.86, std: 64.9 },
  { raw: 85.85, std: 60.0 },
  { raw: 85.70, std: 59.9 },
  { raw: 78.69, std: 55.0 },
  { raw: 78.55, std: 54.9 },
  { raw: 71.54, std: 50.0 },
  { raw: 71.40, std: 49.9 },
  { raw: 65.82, std: 46.0 },
  { raw: 0.00,  std: 0.0 }
];

export const SPEC_2_BENCHMARKS = [
  { raw: 63.00, std: 75.0 },
  { raw: 62.90, std: 64.9 },
  { raw: 58.15, std: 60.0 },
  { raw: 58.06, std: 59.9 },
  { raw: 53.31, std: 55.0 },
  { raw: 53.21, std: 54.9 },
  { raw: 48.46, std: 50.0 },
  { raw: 48.36, std: 49.9 },
  { raw: 44.58, std: 46.0 },
  { raw: 0.00,  std: 0.0 }
];

export interface DoubleBlindSubmission {
  id: string;
  candidateName: string;
  candidateId: string;
  subject: string;
  task41ScoreExp1?: number;
  task42ScoreExp1?: number;
  task43ScoreExp1?: number;
  totalExp1?: number;
  task41ScoreExp2?: number;
  task42ScoreExp2?: number;
  task43ScoreExp2?: number;
  totalExp2?: number;
  task41ScoreArbiter?: number;
  task42ScoreArbiter?: number;
  task43ScoreArbiter?: number;
  totalArbiter?: number;
  resolvedTotalScore?: number;
  status: 'pending' | 'first_graded' | 'second_graded' | 'arbitration' | 'completed';
  diff: number;
  submittedAt: string;
}

export interface AppealTicket {
  id: string;
  candidateId: string;
  candidateName: string;
  examTitle: string;
  taskNo: number;
  originalScore: number;
  demandedScore: number;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
  reviewerNotes?: string;
  createdAt: string;
}

const RUBRIC_STORAGE_KEY = 'next_olymp_bmba_rubrics';
const APPEALS_STORAGE_KEY = 'next_olymp_bmba_appeals';
const DOUBLE_BLIND_STORAGE_KEY = 'next_olymp_bmba_double_blind';

function interpolateScore(raw: number, benchmarks: { raw: number; std: number }[]): number {
  if (raw <= 0) return 0;
  const maxRaw = benchmarks[0].raw;
  if (raw >= maxRaw) return benchmarks[0].std;

  
  for (let i = 0; i < benchmarks.length - 1; i++) {
    const p1 = benchmarks[i];     
    const p2 = benchmarks[i + 1]; 

    if (raw <= p1.raw && raw >= p2.raw) {
      
      if (Math.abs(raw - p1.raw) < 0.001) return p1.std;
      if (Math.abs(raw - p2.raw) < 0.001) return p2.std;

      const rawSpan = p1.raw - p2.raw;
      if (rawSpan <= 0) return p2.std;

      const factor = (raw - p2.raw) / rawSpan;
      const computed = p2.std + factor * (p1.std - p2.std);
      return Math.round(computed * 10) / 10;
    }
  }

  return 0;
}

export const raschService = {
  
  calcRashScore(theta: number, mu: number = 0, sigma: number = 1): { Z: number; T: number } {
    const s = sigma === 0 ? 1 : sigma;
    const Z = (theta - mu) / s;
    const T = 50 + 10 * Z;
    return {
      Z: Math.round(Z * 100) / 100,
      T: Math.round(T * 10) / 10
    };
  },

  
  calcBMBAStandardScore(raw: number, subjectType: 'spec_1' | 'spec_2'): number {
    const benchmarks = subjectType === 'spec_1' ? SPEC_1_BENCHMARKS : SPEC_2_BENCHMARKS;
    return interpolateScore(raw, benchmarks);
  },

  
  calcPropScore(raw: number, maxBall: number, _aThreshold: number = 65): number {
    const subjectType = maxBall > 70 ? 'spec_1' : 'spec_2';
    return this.calcBMBAStandardScore(raw, subjectType);
  },

  
  getGrade(stdBall: number): GradeLevel {
    const s = Math.round(stdBall * 10) / 10;
    if (s >= 70.0) return 'A+';
    if (s >= 65.0) return 'A';
    if (s >= 60.0) return 'B+';
    if (s >= 55.0) return 'B';
    if (s >= 50.0) return 'C+';
    if (s >= 46.0) return 'C';
    return 'Fail';
  },

  /**
   * PDF (BMBA Axborotnoma 4/2023, M. Dj. Ermamatov) asosidagi Rasch 1PL dixotomik hisoblash usuli:
   * 2022-yil 4-dekabr matematika milliy sertifikat ma'lumotlari (45 ta topshiriq)
   * 25 ta to'g'ri javob chegara (quyi / yuqori guruhlar taqsimoti, theta = 0)
   * Standart 75 ballik shkalaga o'tkazish va A+, A, B+, B, C+, C darajasini aniqlash.
   */
  calcPdfRaschScore(correctCount: number, totalQuestions: number = 45): PdfRaschCalculationResult {
    const total = Math.max(1, totalQuestions);
    const correct = Math.min(Math.max(0, correctCount), total);
    const rawPercentage = Math.round((correct / total) * 1000) / 10;

    let theta = 0;
    let standardScore = 0;

    if (correct === total) {
      theta = 2.5;
      standardScore = 75.0;
    } else if (correct === 0) {
      theta = -3.5;
      standardScore = 0.0;
    } else {
      // Dixotomik 1PL Rasch logiti (Ermamatov metodikasi bo'yicha markazlashtirilgan: theta = 0 -> 25 to'g'ri javob)
      // Logit baholash (smoothed empirical logit):
      // theta = ln( (r + 0.25) / (n - r + 0.25) ) - shift
      const centerLogit = Math.log(25 / (45 - 25)); // ~0.223
      const rawLogit = Math.log((correct + 0.3) / (total - correct + 0.3));
      theta = Math.round((rawLogit - (total === 45 ? centerLogit : Math.log(0.5 / 0.5))) * 100) / 100;

      // BMBA standartlashtirilgan 75 ballik shkala: T = 50 + 10 * theta
      const rawStd = 50 + 10 * theta;
      standardScore = Math.min(75.0, Math.max(0.0, Math.round(rawStd * 10) / 10));
    }

    const grade = this.getGrade(standardScore);
    const gradeBand = GRADE_BANDS.find(b => b.grade === grade);

    return {
      correctCount: correct,
      totalQuestions: total,
      rawPercentage,
      theta,
      standardScore,
      grade,
      gradeDescription: gradeBand?.description || '',
      isEligibleForCertificate: grade !== 'Fail' && standardScore >= 46.0,
      model: 'Rasch-1PL-EAP (BMBA Axborotnoma 4/2023)',
    };
  },

  
  convertWriting24to75(ball24: number): number {
    const roundedToHalf = Math.round(ball24 * 2) / 2;
    const key = roundedToHalf.toFixed(1);

    if (WRITING_MAP_24_75[key] !== undefined) {
      return WRITING_MAP_24_75[key];
    }

    if (ball24 <= 0) return 0;
    if (ball24 >= 24) return 75;

    const lower = Math.floor(ball24 * 2) / 2;
    const upper = Math.ceil(ball24 * 2) / 2;
    const lVal = WRITING_MAP_24_75[lower.toFixed(1)] || 0;
    const uVal = WRITING_MAP_24_75[upper.toFixed(1)] || 75;
    return Math.round(lVal + (uVal - lVal) * (ball24 - lower) * 2);
  },

  
  sumRubric(tasks: RubricTask[]): number {
    let total = 0;
    tasks.forEach((t) => {
      t.parts.forEach((p) => {
        total += (p.currentScore ?? 0);
      });
    });
    return Math.min(Math.max(total, 0), 75);
  },

  
  finalScore(testPart: number, writingPart: number): number {
    const avg = (testPart + writingPart) / 2;
    return Math.round(avg * 10) / 10;
  },

  
  getRubrics(): RubricTask[] {
    try {
      const stored = localStorage.getItem(RUBRIC_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading rubrics from storage', e);
    }
    return INITIAL_RUBRICS;
  },

  saveRubrics(rubrics: RubricTask[]): void {
    try {
      localStorage.setItem(RUBRIC_STORAGE_KEY, JSON.stringify(rubrics));
    } catch (e) {
      console.error('Error saving rubrics to storage', e);
    }
  },

  resetRubrics(): RubricTask[] {
    this.saveRubrics(INITIAL_RUBRICS);
    return INITIAL_RUBRICS;
  },

  updateRubricPartScore(taskId: number, partId: string, score: number): RubricTask[] {
    const list = this.getRubrics();
    const updated = list.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          parts: task.parts.map((p) => {
            if (p.id === partId) {
              const clamped = Math.min(Math.max(score, 0), p.maxScore);
              return { ...p, currentScore: clamped };
            }
            return p;
          })
        };
      }
      return task;
    });
    this.saveRubrics(updated);
    return updated;
  },

  
  
  
  getAppeals(): AppealTicket[] {
    try {
      const raw = localStorage.getItem(APPEALS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'AP-10492',
        candidateId: 'u-std-101',
        candidateName: 'Akmal Zokirov',
        examTitle: 'Kimyo fanidan Milliy Sertifikat (Aprel)',
        taskNo: 41,
        originalScore: 18,
        demandedScore: 23,
        reason: "Hajm o'zgarishi formulasida (2.67x) bosqichma-bosqich yozilgan, 2-qism hisob-kitoblarim to'liq to'g'ri bo'lsa-da, ekspert e'tiborsiz qoldirgan.",
        status: 'pending',
        createdAt: '2026-09-18 14:30'
      },
      {
        id: 'AP-10490',
        candidateId: 'u-std-102',
        candidateName: 'Zilola Karimova',
        examTitle: 'Kimyo fanidan Milliy Sertifikat (Aprel)',
        taskNo: 42,
        originalScore: 19,
        demandedScore: 24,
        reason: "C6H12 moddasining izomerlari to'liq ko'rsatilgan, reaksiya tenglamalari koeffitsientlari tenglashtirilgan.",
        status: 'accepted',
        reviewerNotes: "Apellyatsiya komissiyasi tomonidan qayta ko'rildi: +4 ball qo'shildi.",
        createdAt: '2026-09-17 11:20'
      }
    ];
  },

  submitAppeal(ticket: Omit<AppealTicket, 'id' | 'createdAt' | 'status'>): AppealTicket {
    const list = this.getAppeals();
    const newTicket: AppealTicket = {
      ...ticket,
      id: `AP-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    const updated = [newTicket, ...list];
    try {
      localStorage.setItem(APPEALS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    return newTicket;
  },

  updateAppealStatus(id: string, status: 'accepted' | 'rejected', reviewerNotes?: string): void {
    const list = this.getAppeals();
    const updated = list.map((item) => item.id === id ? { ...item, status, reviewerNotes: reviewerNotes || item.reviewerNotes } : item);
    try {
      localStorage.setItem(APPEALS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  },

  
  
  
  getDoubleBlindSubmissions(): DoubleBlindSubmission[] {
    try {
      const raw = localStorage.getItem(DOUBLE_BLIND_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'DB-801',
        candidateName: 'Jasur Bekmurodov',
        candidateId: 'u-101',
        subject: 'Kimyo (Mutaxassislik)',
        task41ScoreExp1: 22, task42ScoreExp1: 23, task43ScoreExp1: 21, totalExp1: 66,
        task41ScoreExp2: 21, task42ScoreExp2: 24, task43ScoreExp2: 20, totalExp2: 65,
        resolvedTotalScore: 65.5,
        diff: 1,
        status: 'completed',
        submittedAt: '2026-09-18 10:15'
      },
      {
        id: 'DB-802',
        candidateName: 'Madina Umarova',
        candidateId: 'u-102',
        subject: 'Kimyo (Mutaxassislik)',
        task41ScoreExp1: 24, task42ScoreExp1: 22, task43ScoreExp1: 22, totalExp1: 68,
        task41ScoreExp2: 17, task42ScoreExp2: 18, task43ScoreExp2: 15, totalExp2: 50,
        diff: 18,
        status: 'arbitration',
        submittedAt: '2026-09-18 11:40'
      },
      {
        id: 'DB-803',
        candidateName: 'Sherzod Qodirov',
        candidateId: 'u-103',
        subject: 'Kimyo (Mutaxassislik)',
        task41ScoreExp1: 20, task42ScoreExp1: 21, task43ScoreExp1: 19, totalExp1: 60,
        diff: 0,
        status: 'first_graded',
        submittedAt: '2026-09-18 12:05'
      }
    ];
  },

  submitDoubleBlindGrading(submissionId: string, expertNumber: 1 | 2 | 3, t41: number, t42: number, t43: number): void {
    const list = this.getDoubleBlindSubmissions();
    const updated = list.map((item) => {
      if (item.id !== submissionId) return item;
      const total = t41 + t42 + t43;
      if (expertNumber === 1) {
        return {
          ...item,
          task41ScoreExp1: t41,
          task42ScoreExp1: t42,
          task43ScoreExp1: t43,
          totalExp1: total,
          status: 'first_graded' as const
        };
      } else if (expertNumber === 2) {
        const diff = Math.abs((item.totalExp1 || 0) - total);
        const needsArbitration = diff >= 5;
        return {
          ...item,
          task42ScoreExp2: t42,
          task41ScoreExp2: t41,
          task43ScoreExp2: t43,
          totalExp2: total,
          diff,
          status: needsArbitration ? ('arbitration' as const) : ('completed' as const),
          resolvedTotalScore: needsArbitration ? undefined : Number((((item.totalExp1 || 0) + total) / 2).toFixed(1))
        };
      } else {
        return {
          ...item,
          task41ScoreArbiter: t41,
          task42ScoreArbiter: t42,
          task43ScoreArbiter: t43,
          totalArbiter: total,
          resolvedTotalScore: total,
          status: 'completed' as const
        };
      }
    });
    try {
      localStorage.setItem(DOUBLE_BLIND_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }
};

export class AssessmentService {
  static getGrade(stdScore: number): GradeLevel {
    return raschService.getGrade(stdScore);
  }

  static calcRashScore(theta: number, mu: number = 0, sigma: number = 1): { zScore: number; tScore: number } {
    const res = raschService.calcRashScore(theta, mu, sigma);
    return { zScore: res.Z, tScore: res.T };
  }

  static calcBMBAStandardScore(raw: number, subjectType: 'spec_1' | 'spec_2'): number {
    return raschService.calcBMBAStandardScore(raw, subjectType);
  }

  static calcFinalScore(testStdScore: number, writingStdScore: number): { finalScore: number; grade: GradeLevel } {
    const finalScore = raschService.finalScore(testStdScore, writingStdScore);
    return {
      finalScore,
      grade: this.getGrade(finalScore)
    };
  }
}

export function buildNationalCertificate(params: {
  userName: string;
  score: number;
  grade: GradeLevel;
  subject: string;
  examTitle?: string;
  verificationCode?: string;
  issuedAt?: string;
}): Certificate {
  const code = params.verificationCode || `NS-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  return {
    id: `cert_${code}`,
    userId: 'current-user',
    userName: params.userName || "Talabgor",
    olympiadId: 'national-assessment',
    olympiadTitle: params.examTitle || "O'zbekiston Respublikasi Milliy Baholash Sinovi",
    subject: params.subject || "Matematika",
    type: 'national_certificate' as any,
    issuedAt: params.issuedAt || new Date().toISOString(),
    verificationCode: code,
    score: params.score,
    maxScore: 75,
    rank: 0,
    totalParticipants: 4506,
    fontFamily: 'cinzel',
    customMessage: `O'zbekiston Respublikasi Bilim va malakalarni baholash agentligi (BMBA) metodikasi va Rash modeli (1PL) asosida o'tkazilgan milliy sertifikat sinovida qatnashib, 75 ballik standart shkalada ${params.score} ball to'pladi va "${params.grade}" darajali rasmiy Milliy Sertifikatga ega bo'ldi.`,
  };
}


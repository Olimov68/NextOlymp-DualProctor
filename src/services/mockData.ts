import { Olympiad, Question, Certificate, LeaderboardEntry, User } from '../types';

export const MOCK_USERS: Record<string, User> = {
  student: {
    id: 'usr-student-1',
    email: 'student@nextolymp.uz',
    fullName: 'Foydalanuvchi',
    role: 'student',
    grade: 9,
    region: 'Toshkent shahri',
    school: 'Toshkent Maktabi',
    avatarUrl: '',
    createdAt: new Date().toISOString(),
    parentConsent: true,
  },
  teacher: {
    id: 'usr-teacher-1',
    email: 'teacher@nextolymp.uz',
    fullName: 'O\'qituvchi',
    role: 'teacher',
    region: 'Samarqand viloyati',
    school: 'Samarqand Maktabi',
    avatarUrl: '',
    createdAt: new Date().toISOString(),
  },
  admin: {
    id: 'usr-admin-1',
    email: 'admin@nextolymp.uz',
    fullName: 'Super Admin (Ega)',
    role: 'admin',
    avatarUrl: '',
    createdAt: new Date().toISOString(),
  },
};

export const MOCK_OLYMPIADS: Olympiad[] = [];

export const DEFAULT_SAMPLE_QUESTIONS: Question[] = [
  {
    id: 'q-1',
    olympiadId: 'OLY-101',
    roundId: 'r1',
    type: 'multiple_choice',
    content: "Quyidagi ifodaning qiymatini toping: 25 × 4 + 150 ÷ 3",
    options: ['150', '140', '160', '130'],
    correctAnswer: 'A',
    points: 4,
    order: 1,
  },
  {
    id: 'q-2',
    olympiadId: 'OLY-101',
    roundId: 'r1',
    type: 'multiple_choice',
    content: "To'g'ri to'rtburchakning bo'yi 12 sm, eni esa bo'yidan 4 sm qisqa. Uning perimetrini hisoblang.",
    options: ['40 sm', '36 sm', '48 sm', '32 sm'],
    correctAnswer: 'A',
    points: 4,
    order: 2,
  },
  {
    id: 'q-3',
    olympiadId: 'OLY-101',
    roundId: 'r1',
    type: 'multiple_choice',
    content: "Ketma-ket kelgan uchta natural sonning yig'indisi 72 ga teng. Shu sonlarning eng kattasini toping.",
    options: ['23', '24', '25', '26'],
    correctAnswer: 'C',
    points: 4,
    order: 3,
  },
  {
    id: 'q-4',
    olympiadId: 'OLY-101',
    roundId: 'r1',
    type: 'multiple_choice',
    content: "Bir sonning 20% i 45 ga teng. Shu sonning o'zini toping.",
    options: ['225', '200', '250', '180'],
    correctAnswer: 'A',
    points: 4,
    order: 4,
  },
  {
    id: 'q-5',
    olympiadId: 'OLY-101',
    roundId: 'r1',
    type: 'multiple_choice',
    content: "Agar poyezd 360 km masofani 4 soatda bosib o'tsa, uning o'rtacha tezligi qanday?",
    options: ['80 km/soat', '90 km/soat', '85 km/soat', '100 km/soat'],
    correctAnswer: 'B',
    points: 4,
    order: 5,
  }
];

export const MOCK_QUESTIONS: Record<string, Question[]> = {
  'OLY-101': DEFAULT_SAMPLE_QUESTIONS,
  'olymp-math-2026': DEFAULT_SAMPLE_QUESTIONS
};

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [];

export const MOCK_CERTIFICATES: Certificate[] = [];

export interface UserExamResult {
  id: string;
  userId: string;
  olympiadId: string;
  olympiadTitle: string;
  subject: string;
  format: 'online' | 'offline';
  completedAt: string;
  score: number;
  maxScore: number;
  percentage: number;
  rank: number;
  totalParticipants: number;
  certificateType: string;
  certificateCode?: string;
  status: 'published' | 'pending';
  timeSpentMinutes: number;
  totalQuestions: number;
  correctAnswersCount: number;
  wrongAnswersCount: number;
  questionsAnalysis: Array<{
    questionNum: number;
    topic: string;
    questionText: string;
    points: number;
    options: string[];
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    aiExplanation?: string;
  }>;
}

export const MOCK_USER_RESULTS: UserExamResult[] = [];



import { Question } from '../types';

export interface DbQuestion {
  id: string;
  olympiadId: string;
  text: string;
  options: Array<{ id: string; text: string }>;
  correct_option_id: string; 
  score_weight: number;
  explanation?: string;
}

export type SessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'DISQUALIFIED';

export interface DbExamSession {
  id: string;
  userId: string;
  examId: string;
  started_at: number; 
  expires_at: number; 
  status: SessionStatus;
  current_question_id?: string;
  total_duration_minutes: number;
}

export interface DbUserAnswer {
  id: string;
  session_id: string;
  question_id: string;
  selected_option_id: string | string[];
  client_submitted_at?: number;
  server_received_at: number;
  is_valid_time: boolean;
}

export interface ClientSanitizedQuestion {
  id: string;
  olympiadId: string;
  text: string;
  options: Array<{ id: string; text: string }>;
  points: number;
  
}

export interface ServerSyncResponse {
  server_time: number;
  offset_ms: number;
  session_id: string;
  expires_at: number;
  time_remaining_sec: number;
  status: SessionStatus;
}

export interface PostExamGradingResult {
  sessionId: string;
  userId: string;
  examId: string;
  totalScore: number;
  maxScore: number;
  correctAnswersCount: number;
  totalQuestionsCount: number;
  gradedAnswers: Array<{
    questionId: string;
    questionText: string;
    selectedOption: string | string[];
    correctOption: string;
    isCorrect: boolean;
    earnedScore: number;
    maxScore: number;
    explanation?: string;
  }>;
  aiMistakeAnalysis?: string;
}

const DB_QUESTIONS: DbQuestion[] = [
  {
    id: 'q-math-01',
    olympiadId: 'olymp-math-2026',
    text: "Agar f(x) = 3x^2 - 4x + 5 bo'lsa, f'(2) hosilaning qiymatini toping.",
    options: [
      { id: 'opt-a', text: '6' },
      { id: 'opt-b', text: '8' },
      { id: 'opt-c', text: '10' },
      { id: 'opt-d', text: '12' },
    ],
    correct_option_id: 'opt-b',
    score_weight: 10,
    explanation: "f'(x) = 6x - 4. x = 2 bo'lganda: f'(2) = 6*(2) - 4 = 12 - 4 = 8.",
  },
  {
    id: 'q-math-02',
    olympiadId: 'olymp-math-2026',
    text: "To'g'ri burchakli uchburchakning katetlari 5 sm va 12 sm bo'lsa, gipotenuzasini toping.",
    options: [
      { id: 'opt-a', text: '13 sm' },
      { id: 'opt-b', text: '14 sm' },
      { id: 'opt-c', text: '15 sm' },
      { id: 'opt-d', text: '17 sm' },
    ],
    correct_option_id: 'opt-a',
    score_weight: 10,
    explanation: "Pifagor teoremasi: c = sqrt(5^2 + 12^2) = sqrt(25 + 144) = sqrt(169) = 13 sm.",
  },
  {
    id: 'q-math-03',
    olympiadId: 'olymp-math-2026',
    text: "Noma'lum x tenglamani yeching: 2^(x+1) + 2^x = 48.",
    options: [
      { id: 'opt-a', text: 'x = 3' },
      { id: 'opt-b', text: 'x = 4' },
      { id: 'opt-c', text: 'x = 5' },
      { id: 'opt-d', text: 'x = 6' },
    ],
    correct_option_id: 'opt-b',
    score_weight: 15,
    explanation: "2*2^x + 2^x = 48 => 3*2^x = 48 => 2^x = 16 => x = 4.",
  },
  {
    id: 'q-math-04',
    olympiadId: 'olymp-math-2026',
    text: "Quyidagi logarifmik ifodaning qiymatini hisoblang: log_2(32) + log_3(81).",
    options: [
      { id: 'opt-a', text: '7' },
      { id: 'opt-b', text: '8' },
      { id: 'opt-c', text: '9' },
      { id: 'opt-d', text: '10' },
    ],
    correct_option_id: 'opt-c',
    score_weight: 15,
    explanation: "log_2(32) = 5, log_3(81) = 4. 5 + 4 = 9.",
  },
  {
    id: 'q-math-05',
    olympiadId: 'olymp-math-2026',
    text: "Arifmetik progressiyaning a_1 = 3, d = 4 bo'lsa, uning dastlabki 10 ta hadi yig'indisi (S_10) ni toping.",
    options: [
      { id: 'opt-a', text: '190' },
      { id: 'opt-b', text: '210' },
      { id: 'opt-c', text: '230' },
      { id: 'opt-d', text: '250' },
    ],
    correct_option_id: 'opt-b',
    score_weight: 20,
    explanation: "S_n = n/2 * (2a_1 + (n-1)d) = 5 * (6 + 36) = 5 * 42 = 210.",
  },
];

const DB_SESSIONS = new Map<string, DbExamSession>();
const DB_ANSWERS = new Map<string, DbUserAnswer[]>();

const NETWORK_GRACE_PERIOD_MS = 3000; 

export class ServerExamEngine {
  
  public static startSession(userId: string, examId: string, durationMinutes: number = 60): ServerSyncResponse {
    const sessionId = `sess_${userId}_${examId}`;
    const serverNow = Date.now();

    let session = DB_SESSIONS.get(sessionId);
    if (!session || session.status === 'EXPIRED' || session.status === 'COMPLETED') {
      const expiresAt = serverNow + durationMinutes * 60 * 1000;
      session = {
        id: sessionId,
        userId,
        examId,
        started_at: serverNow,
        expires_at: expiresAt,
        status: 'IN_PROGRESS',
        total_duration_minutes: durationMinutes,
      };
      DB_SESSIONS.set(sessionId, session);
      DB_ANSWERS.set(sessionId, []);
    }

    const timeRemainingSec = Math.max(0, Math.floor((session.expires_at - serverNow) / 1000));

    return {
      server_time: serverNow,
      offset_ms: 0, 
      session_id: session.id,
      expires_at: session.expires_at,
      time_remaining_sec: timeRemainingSec,
      status: session.status,
    };
  }

  
  public static getSanitizedQuestions(examId: string): ClientSanitizedQuestion[] {
    const questions = DB_QUESTIONS.filter((q) => q.olympiadId === examId || examId === 'olymp-math-2026');
    return questions.map((q) => ({
      id: q.id,
      olympiadId: q.olympiadId,
      text: q.text,
      options: q.options,
      points: q.score_weight,
    }));
  }

  
  public static submitAnswer(
    sessionId: string,
    questionId: string,
    selectedOptionId: string | string[],
    clientSubmittedAt?: number
  ): { success: boolean; error?: string; status: SessionStatus; timeRemainingSec: number } {
    const serverNow = Date.now();
    const session = DB_SESSIONS.get(sessionId);

    if (!session) {
      return { success: false, error: 'Sessiya topilmadi', status: 'EXPIRED', timeRemainingSec: 0 };
    }

    if (session.status !== 'IN_PROGRESS') {
      return { success: false, error: `Imtihon holati: ${session.status}`, status: session.status, timeRemainingSec: 0 };
    }

    
    const allowedDeadline = session.expires_at + NETWORK_GRACE_PERIOD_MS;
    if (serverNow > allowedDeadline) {
      session.status = 'EXPIRED';
      DB_SESSIONS.set(sessionId, session);
      return {
        success: false,
        error: 'Imtihon vaqti serverda yakunlandi. Javob qabul qilinmadi (408 Request Timeout).',
        status: 'EXPIRED',
        timeRemainingSec: 0,
      };
    }

    
    const existing = DB_ANSWERS.get(sessionId) || [];
    const filtered = existing.filter((a) => a.question_id !== questionId);
    filtered.push({
      id: `ans_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      session_id: sessionId,
      question_id: questionId,
      selected_option_id: selectedOptionId,
      client_submitted_at: clientSubmittedAt,
      server_received_at: serverNow,
      is_valid_time: true,
    });
    DB_ANSWERS.set(sessionId, filtered);

    const timeRemainingSec = Math.max(0, Math.floor((session.expires_at - serverNow) / 1000));
    return { success: true, status: 'IN_PROGRESS', timeRemainingSec };
  }

  
  public static async finalizeAndGradeSession(sessionId: string): Promise<PostExamGradingResult> {
    const session = DB_SESSIONS.get(sessionId);
    const answers = DB_ANSWERS.get(sessionId) || [];

    if (session) {
      session.status = 'COMPLETED';
      DB_SESSIONS.set(sessionId, session);
    }

    const answersMap = new Map(answers.map((a) => [a.question_id, a.selected_option_id]));

    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;
    const gradedAnswers: PostExamGradingResult['gradedAnswers'] = [];
    const mistakesForAi: Array<{ question: string; studentAnswer: string; correctAnswer: string }> = [];

    for (const q of DB_QUESTIONS) {
      maxScore += q.score_weight;
      const userSelected = answersMap.get(q.id);
      const isCorrect = userSelected === q.correct_option_id;

      if (isCorrect) {
        totalScore += q.score_weight;
        correctCount++;
      } else if (userSelected) {
        const studentOptText = q.options.find((o) => o.id === userSelected)?.text || String(userSelected);
        const correctOptText = q.options.find((o) => o.id === q.correct_option_id)?.text || q.correct_option_id;
        mistakesForAi.push({
          question: q.text,
          studentAnswer: studentOptText,
          correctAnswer: correctOptText,
        });
      }

      gradedAnswers.push({
        questionId: q.id,
        questionText: q.text,
        selectedOption: userSelected || 'Belgilanmagan',
        correctOption: q.options.find((o) => o.id === q.correct_option_id)?.text || q.correct_option_id,
        isCorrect,
        earnedScore: isCorrect ? q.score_weight : 0,
        maxScore: q.score_weight,
        explanation: q.explanation,
      });
    }

    
    let aiMistakeAnalysis: string | undefined;
    if (mistakesForAi.length > 0) {
      aiMistakeAnalysis = await this.generateAiMistakeAnalysis(mistakesForAi);
    }

    return {
      sessionId,
      userId: session?.userId || 'usr-local',
      examId: session?.examId || 'olymp-math-2026',
      totalScore,
      maxScore,
      correctAnswersCount: correctCount,
      totalQuestionsCount: DB_QUESTIONS.length,
      gradedAnswers,
      aiMistakeAnalysis,
    };
  }

  private static async generateAiMistakeAnalysis(
    mistakes: Array<{ question: string; studentAnswer: string; correctAnswer: string }>
  ): Promise<string> {
    return `O'quvchi ${mistakes.length} ta savolda xatolikka yo'l qo'ydi. Asosiy e'tiborni formulalarni to'g'ri qo'llashga va hisob-kitoblarni qayta tekshirishga qaratish tavsiya etiladi.`;
  }
}

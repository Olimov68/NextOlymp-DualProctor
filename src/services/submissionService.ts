import { Submission, Question, Certificate, CertificateType } from '../types';
import { ServerExamEngine } from './serverExamEngine';
import { olympiadService } from './olympiadService';
import { useOlympiadStore } from '../store/useOlympiadStore';
import { useNationalExamStore } from '../store/useNationalExamStore';
import { useContestStore } from '../store/useContestStore';
import { useLeaderboardStore } from '../store/useLeaderboardStore';
import { useAuthStore } from '../store/useAuthStore';
import { useUserStore } from '../store/useUserStore';
import { apiClient } from './api';

export interface SubmitAnswerParams {
  userId: string;
  olympiadId: string;
  questionId: string;
  answer: string | string[];
}

export interface ParticipantAdminResult {
  id: string;
  name: string;
  phone: string;
  region: string;
  school: string;
  grade: number;
  status?: 'registered' | 'in_progress' | 'completed' | 'disqualified';
  correctAnswers?: number;
  totalQuestions?: number;
  percentage?: number;
  score?: number;
  timeSpentMinutes?: number;
  submittedAt?: string;
  registeredAt?: string;
  currentQuestion?: number;
  paymentType?: 'Karta' | 'Hamyon' | 'Naqd' | 'VIP Paket (Bepul)' | string;
  paymentStatus?: 'paid' | 'free' | 'pending' | string;
  certificateType?: 'I darajali Diplom' | 'II darajali Diplom' | 'III darajali Diplom' | 'Sertifikat' | string;
  rank?: number;
  isPassed?: boolean;
  antiCheatViolations?: {
    tabSwitches: number;
    faceAbsence: number;
    rapidAnswers: number;
    totalViolations: number;
  };
  wrongQuestionsList?: {
    questionNum: number;
    topic: string;
    userAns: string;
    correctAns: string;
    aiExplanation: string;
  }[];
}

function createMockSnapshotUrl(studentName: string, reason: string, timeStr: string, variant: 'no_face' | 'multiple_face' | 'looking_away' | 'tab_switch'): string {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="50%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#090d16"/>
      </linearGradient>
      <linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.92)"/>
      </linearGradient>
      <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(239, 68, 68, 0.25)"/>
        <stop offset="100%" stop-color="rgba(239, 68, 68, 0.05)"/>
      </linearGradient>
    </defs>
    
    <!-- Background Camera Stream Simulation -->
    <rect width="480" height="320" fill="url(#bgGrad)"/>
    <rect x="10" y="10" width="460" height="300" rx="8" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>

    <!-- Grid / Scanlines -->
    <line x1="10" y1="110" x2="470" y2="110" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    <line x1="10" y1="210" x2="470" y2="210" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    <line x1="160" y1="10" x2="160" y2="310" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    <line x1="320" y1="10" x2="320" y2="310" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>

    <!-- Camera Visual Simulation Based on Incident -->
    ${variant === 'no_face' ? `
      <!-- Empty Chair / Covered Camera Silhouette -->
      <circle cx="240" cy="140" r="50" fill="none" stroke="rgba(239, 68, 68, 0.4)" stroke-dasharray="6,6" stroke-width="2"/>
      <path d="M 170 260 C 170 200, 310 200, 310 260" fill="none" stroke="rgba(239, 68, 68, 0.4)" stroke-dasharray="6,6" stroke-width="2"/>
      <rect x="160" y="70" width="160" height="170" rx="10" fill="url(#boxGrad)" stroke="#ef4444" stroke-width="2" stroke-dasharray="8,4"/>
      <text x="240" y="155" fill="#f87171" font-size="14" font-family="sans-serif" font-weight="bold" text-anchor="middle">❌ YUZ KO'RINMADI</text>
      <text x="240" y="175" fill="#fca5a5" font-size="11" font-family="sans-serif" text-anchor="middle">Qo'l yoki to'siq bilan yopilgan</text>
    ` : variant === 'multiple_face' ? `
      <!-- Main Face -->
      <circle cx="180" cy="140" r="42" fill="#334155" stroke="#38bdf8" stroke-width="2"/>
      <path d="M 120 250 C 120 195, 240 195, 240 250" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      <!-- 2nd Extra Face Detected -->
      <circle cx="340" cy="125" r="36" fill="#450a0a" stroke="#ef4444" stroke-width="2.5"/>
      <path d="M 285 240 C 285 185, 395 185, 395 240" fill="#2d0606" stroke="#ef4444" stroke-width="2.5"/>
      <rect x="295" y="80" width="90" height="110" rx="8" fill="url(#boxGrad)" stroke="#ef4444" stroke-width="2"/>
      <text x="340" y="72" fill="#ef4444" font-size="11" font-family="sans-serif" font-weight="bold" text-anchor="middle">⚠️ 2-SHAXS ANIKLANDI</text>
    ` : variant === 'looking_away' ? `
      <!-- Face looking away -->
      <circle cx="240" cy="135" r="46" fill="#334155" stroke="#f59e0b" stroke-width="2"/>
      <circle cx="215" cy="130" r="6" fill="#f59e0b"/>
      <circle cx="245" cy="130" r="6" fill="#f59e0b"/>
      <path d="M 160 250 C 160 195, 320 195, 320 250" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
      <line x1="215" y1="130" x2="160" y2="120" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="4,3"/>
      <text x="240" y="65" fill="#f59e0b" font-size="12" font-family="sans-serif" font-weight="bold" text-anchor="middle">👀 CHETGA QARASH QAYD ETILDI</text>
    ` : `
      <!-- Tab Switch / Devtools -->
      <rect x="140" y="80" width="200" height="120" rx="10" fill="#1e1b4b" stroke="#818cf8" stroke-width="2"/>
      <text x="240" y="135" fill="#a5b4fc" font-size="14" font-family="sans-serif" font-weight="bold" text-anchor="middle">🖥️ BRAUZER ALMASHTIRILDI</text>
      <text x="240" y="158" fill="#c7d2fe" font-size="11" font-family="sans-serif" text-anchor="middle">Tab switch / DevTools faol</text>
    `}

    <!-- Top Badge: REC & Security Status -->
    <rect x="20" y="20" width="130" height="26" rx="6" fill="rgba(0,0,0,0.7)" stroke="rgba(255,255,255,0.1)"/>
    <circle cx="34" cy="33" r="5" fill="#ef4444"/>
    <text x="46" y="37" fill="#ffffff" font-size="11" font-family="monospace" font-weight="bold">AI PROCTOR LIVE</text>

    <!-- Top Right FPS / Time Badge -->
    <rect x="330" y="20" width="130" height="26" rx="6" fill="rgba(0,0,0,0.7)" stroke="rgba(255,255,255,0.1)"/>
    <text x="395" y="37" fill="#38bdf8" font-size="11" font-family="monospace" font-weight="bold" text-anchor="middle">HD 30FPS · SECURE</text>

    <!-- Bottom Watermark Banner -->
    <rect x="0" y="225" width="480" height="95" fill="url(#barGrad)"/>
    
    <text x="20" y="258" fill="#ffffff" font-size="13" font-family="sans-serif" font-weight="bold">👤 F.I.Sh: ${studentName.replace(/</g, '').replace(/>/g, '')}</text>
    <text x="20" y="278" fill="#94a3b8" font-size="11" font-family="monospace">🕒 Vaqt: ${timeStr} · IP: 195.158.12.45</text>
    <text x="20" y="298" fill="#f87171" font-size="11" font-family="sans-serif" font-weight="bold">🚨 Sabab: ${reason.replace(/</g, '').replace(/>/g, '')}</text>
  </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const STORAGE_CHEAT_LOGS_KEY = 'next_olymp_cheat_logs';

function getInitialSeededCheatLogs(): Record<string, any[]> {
  const now = new Date();
  const time1 = new Date(now.getTime() - 4 * 60 * 1000).toLocaleString();
  const time2 = new Date(now.getTime() - 12 * 60 * 1000).toLocaleString();
  const time3 = new Date(now.getTime() - 25 * 60 * 1000).toLocaleString();
  const time4 = new Date(now.getTime() - 40 * 60 * 1000).toLocaleString();

  const mockLogs = [
    {
      id: 'inc-seed-01',
      studentId: 'USR-203',
      name: 'Jasur Rahimov',
      phone: '+998 97 333 44 55',
      ipAddress: '195.158.12.45',
      region: 'Buxoro viloyati',
      school: "Qorako'l xalqaro matematika maktabi",
      type: "Kamera oldida yuz ko'rinmadi (No Face)",
      detail: "Kamerada 2.5 soniya davomida yuz aniqlanmadi (yuz qo'l bilan to'silgan).",
      count: 2,
      severity: 'Kritik',
      timestamp: time1,
      isOnline: true,
      snapshotUrl: createMockSnapshotUrl('Jasur Rahimov', "Yuz to'silgan yoki aniqlanmadi", time1, 'no_face'),
      status: 'pending'
    },
    {
      id: 'inc-seed-02',
      studentId: 'USR-214',
      name: 'Shaxzod Karimov',
      phone: '+998 99 777 12 34',
      ipAddress: '84.54.78.112',
      region: 'Toshkent viloyati',
      school: 'Olmaliq 5-maktab',
      type: 'Kadrda begona 2-shaxs aniqlandi',
      detail: "Kamerada ikkinchi odam yuzi aniqlandi. Imtihonda yolg'iz bo'lish talabi buzildi.",
      count: 3,
      severity: 'Kritik',
      timestamp: time2,
      isOnline: true,
      snapshotUrl: createMockSnapshotUrl('Shaxzod Karimov', "Kadrda 2-shaxs yuzi aniqlandi", time2, 'multiple_face'),
      status: 'pending'
    },
    {
      id: 'inc-seed-03',
      studentId: 'USR-212',
      name: 'Nilufar Saidova',
      phone: '+998 93 322 44 55',
      ipAddress: '213.230.77.10',
      region: 'Sirdaryo viloyati',
      school: 'Guliston IDUM',
      type: 'Brauzer oynasi almashtirildi (Tab Switch)',
      detail: 'Imtihon sahifasidan chiqib boshqa oyna ochildi.',
      count: 1,
      severity: 'Yuqori',
      timestamp: time3,
      isOnline: true,
      snapshotUrl: createMockSnapshotUrl('Nilufar Saidova', "Boshqa tabga o'tildi", time3, 'tab_switch'),
      status: 'warned'
    },
    {
      id: 'inc-seed-04',
      studentId: 'USR-201',
      name: 'Sardor Alimov',
      phone: '+998 90 111 22 33',
      ipAddress: '195.158.3.18',
      region: 'Toshkent shahri',
      school: '174-sonli ixtisoslashtirilgan maktab',
      type: 'Monitordan chetga qarash holati',
      detail: 'Boshni chetga burib 3 soniyadan ortiq monitordan chetga qaraldi.',
      count: 1,
      severity: "O'rta",
      timestamp: time4,
      isOnline: true,
      snapshotUrl: createMockSnapshotUrl('Sardor Alimov', 'Chetga qarash qayd etildi', time4, 'looking_away'),
      status: 'pending'
    }
  ];

  return {
    'olymp-001': [...mockLogs],
    'olymp-002': [mockLogs[0], mockLogs[2]],
    'olymp-003': [mockLogs[1], mockLogs[3]],
    'nat-001': [...mockLogs],
    'nat-002': [mockLogs[0], mockLogs[1]],
    'olymp-current': [...mockLogs]
  };
}

function loadCheatLogsFromStorage(): Record<string, any[]> {
  if (typeof window === 'undefined') return getInitialSeededCheatLogs();
  try {
    const raw = localStorage.getItem(STORAGE_CHEAT_LOGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {
    console.warn('Error loading cheat logs from storage:', e);
  }
  const initial = getInitialSeededCheatLogs();
  try {
    localStorage.setItem(STORAGE_CHEAT_LOGS_KEY, JSON.stringify(initial));
  } catch {}
  return initial;
}

function saveCheatLogsToStorage(allLogs: Record<string, any[]>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_CHEAT_LOGS_KEY, JSON.stringify(allLogs));
  } catch (e) {
    console.error('Error saving cheat logs to localStorage:', e);
  }
}

const draftAnswersMap = new Map<string, any>();
const userSubmissionsCache: any[] = [];
const olympiadSubmissionsCache = new Map<string, ParticipantAdminResult[]>();
const attemptCountsMap = new Map<string, number>();

if (typeof window !== 'undefined') {
  setTimeout(async () => {
    try {
      const res = await apiClient.get('/submissions');
      const subs = Array.isArray(res) ? res : (res?.data || []);
      if (Array.isArray(subs)) {
        userSubmissionsCache.push(...subs);
      }
    } catch {}
  }, 100);
}

export const submissionService = {
  async saveDraftAnswer(params: SubmitAnswerParams): Promise<boolean> {
    const sessionId = `sess_${params.userId}_${params.olympiadId}`;
    ServerExamEngine.submitAnswer(sessionId, params.questionId, params.answer, Date.now());

    // Send answer asynchronously to the unified server
    apiClient.post(`/exams/${encodeURIComponent(params.olympiadId)}/answer`, {
      questionId: params.questionId,
      question_id: params.questionId,
      selectedOption: params.answer,
      selected_option: params.answer,
      userId: params.userId,
    }).catch(() => {});

    const key = `draft_ans_${params.userId}_${params.olympiadId}_${params.questionId}`;
    draftAnswersMap.set(key, params.answer);
    return true;
  },

  getDraftAnswer(userId: string, olympiadId: string, questionId: string): string | string[] | null {
    const key = `draft_ans_${userId}_${olympiadId}_${questionId}`;
    return draftAnswersMap.get(key) || null;
  },

  getAttemptCount(userId: string, olympiadId: string): number {
    const key = `${userId}_${olympiadId}`;
    return attemptCountsMap.get(key) || (userSubmissionsCache.some((s) => (s.userId === userId || s.user_id === userId) && (s.olympiadId === olympiadId || s.olympiad_id === olympiadId)) ? 1 : 0);
  },

  async finalizeSubmission(
    userId: string,
    olympiadId: string,
    answers: Record<string, string | string[]>,
    _signature?: string
  ): Promise<{
    score: number;
    maxScore?: number;
    totalQuestions: number;
    correctAnswersCount?: number;
    status: 'completed';
    grading?: any;
    certificate?: Certificate;
  }> {
    const sessionId = `sess_${userId}_${olympiadId}`;
    const currentUser = useAuthStore.getState().user;
    const contestState = useContestStore.getState();

    
    Object.entries(answers).forEach(([qId, ans]) => {
      ServerExamEngine.submitAnswer(sessionId, qId, ans, Date.now());
    });

    
    let questions: Question[] = [];
    if (contestState.olympiadId === olympiadId && contestState.questions && contestState.questions.length > 0) {
      questions = contestState.questions;
    } else {
      questions = await olympiadService.getQuestionsByOlympiadId(olympiadId);
    }

    const olympiadItem = useOlympiadStore.getState().olympiads.find((o) => o.id === olympiadId);
    const examItem = useNationalExamStore.getState().exams.find((e) => e.id === olympiadId);
    const subject = olympiadItem?.subject || examItem?.subject || 'Matematika';
    const title = olympiadItem?.title || examItem?.title || 'Next Olymp Musobaqasi';

    let calculatedScore = 0;
    let correctCount = 0;
    let maxCalculatedScore = 0;

    const gradedAnswers = questions.map((q, idx) => {
      const qId = q.id;
      const userAns = answers[qId] || answers[String(q.order)] || answers[String(idx + 1)] || '';
      const points = typeof q.points === 'number' && q.points > 0 ? q.points : 4;
      maxCalculatedScore += points;

      let isCorrect = false;
      const cleanUser = String(userAns || '').trim().toUpperCase();
      const cleanCorrect = String(q.correctAnswer || (q as any).correct_option || 'A').trim().toUpperCase();

      if (cleanUser && cleanCorrect) {
        if (cleanUser === cleanCorrect) {
          isCorrect = true;
        } else if (cleanUser.length === 1 && cleanCorrect.length === 1 && cleanUser === cleanCorrect) {
          isCorrect = true;
        } else if (cleanUser.startsWith('OPTION_') && cleanCorrect.length === 1) {
          const letter = cleanUser.replace('OPTION_', '').toUpperCase();
          if (letter === cleanCorrect) isCorrect = true;
        }
      }

      if (isCorrect) {
        calculatedScore += points;
        correctCount += 1;
      }

      return {
        questionId: q.id,
        questionNum: idx + 1,
        topic: (q as any).topic || `${subject} mavzusi #${idx + 1}`,
        questionText: q.content || `${subject} fanidan #${idx + 1}-sonli test masalasi: Berilgan shart va nazariy qoidalarga muvofiq to'g'ri javobni tanlang.`,
        options: (q.options && q.options.length > 0)
          ? q.options
          : ['A) Nazariy to\'g\'ri yechim va formula', 'B) Taxminiy chalg\'ituvchi variant', 'C) Muqobil hisoblash natijasi', 'D) Noto\'g\'ri yechim usuli'],
        points,
        userAnswer: cleanUser || (isCorrect ? cleanCorrect : 'B'),
        correctAnswer: cleanCorrect,
        isCorrect,
        aiExplanation: isCorrect
          ? `✅ Ekspert tahlili: Barrakalla! Siz ${cleanCorrect} variantini to'g'ri tanladingiz.`
          : `❌ Ekspert tahlili: Ushbu savolda mantiqiy yoki hisoblash xatoligi bor. To'g mezoniy javob: ${cleanCorrect} varianti.`
      };
    });

    const finalScore = calculatedScore;
    const finalMaxScore = maxCalculatedScore > 0 ? maxCalculatedScore : (questions.length > 0 ? questions.length * 4 : 100);
    const percentage = finalMaxScore > 0 ? Math.round((finalScore / finalMaxScore) * 100) : 0;

    const cheatLogs = contestState.capturedIncidents || [];
    const tabSwitches = contestState.tabSwitchCount || 0;
    const totalViolations = contestState.violationCount || 0;

    const initialTotalSec = (contestState.timeRemainingSeconds !== undefined && contestState.timeRemainingSeconds > 0)
      ? Math.max(15, (60 * 60) - contestState.timeRemainingSeconds)
      : Math.max(15, Math.round(questions.length * 1.2 * 60));
    const elapsedSec = initialTotalSec;
    const elapsedMins = Math.floor(elapsedSec / 60);
    const remainingSecs = elapsedSec % 60;
    const timeSpentFormatted = elapsedMins > 0 ? `${elapsedMins} daq ${remainingSecs > 0 ? `${remainingSecs} soniya` : ''}` : `${remainingSecs} soniya`;

    const subId = `sub_${userId}_${olympiadId}_${Date.now()}`;
    const attemptKey = `${userId}_${olympiadId}`;
    attemptCountsMap.set(attemptKey, (attemptCountsMap.get(attemptKey) || 0) + 1);

    const submissionData = {
      id: subId,
      user_id: userId,
      userId: userId,
      user_name: currentUser?.fullName || 'Ishtirokchi',
      userName: currentUser?.fullName || 'Ishtirokchi',
      olympiad_id: olympiadId,
      olympiadId: olympiadId,
      olympiadTitle: title,
      subject: subject,
      score: finalScore,
      maxScore: finalMaxScore,
      total_questions: questions.length,
      correctAnswersCount: correctCount,
      wrongAnswersCount: Math.max(0, questions.length - correctCount),
      percentage,
      answers: answers,
      timeSpentMinutes: Math.max(1, Math.round(elapsedSec / 60)),
      timeSpentSeconds: elapsedSec,
      timeSpentFormatted,
      questionsAnalysis: gradedAnswers,
      status: totalViolations >= 5 ? 'disqualified' : 'completed',
      submitted_at: new Date().toISOString()
    };

    userSubmissionsCache.unshift(submissionData);

    try {
      const existingSubs = JSON.parse(localStorage.getItem('next_olymp_user_submissions') || '[]');
      existingSubs.unshift(submissionData);
      localStorage.setItem('next_olymp_user_submissions', JSON.stringify(existingSubs));
    } catch {}

    
    // 1. Submit to server-side evaluation engine
    let serverGradingResult: any = null;
    try {
      const serverRes = await apiClient.post(`/exams/${encodeURIComponent(olympiadId)}/finish`, {
        userId,
        sessionId,
        answers,
      });
      if (serverRes && serverRes.data) {
        serverGradingResult = serverRes.data;
      }
    } catch (e) {
      console.warn('Backend server-side grading notice:', e);
    }

    // 2. Report proctor incidents to server
    if (cheatLogs.length > 0) {
      cheatLogs.forEach((log: any) => {
        apiClient.post(`/exams/${encodeURIComponent(olympiadId)}/proctor-event`, {
          userId,
          eventType: log.type || 'TAB_SWITCH',
          details: log.detail || log.message || 'Xavfsizlik ogohlantirishi',
          severity: log.severity || 'medium',
        }).catch(() => {});
      });
    }

    const verifiedScore = serverGradingResult ? serverGradingResult.score : finalScore;
    const verifiedMax = serverGradingResult ? serverGradingResult.maxScore : finalMaxScore;
    const verifiedPct = serverGradingResult ? serverGradingResult.percentage : percentage;
    const isWinner = verifiedPct >= 70;
    const certType: CertificateType = isWinner ? 'winner' : 'participant';
    const verifyCode = serverGradingResult?.verificationCode || `IS-2026-MED-${Math.floor(1000 + Math.random() * 9000)}`;

    const cert: Certificate = {
      id: `cert_${Date.now()}`,
      userId,
      userName: currentUser?.fullName || 'Ishtirokchi',
      olympiadId,
      olympiadTitle: title,
      subject,
      type: certType,
      issuedAt: new Date().toISOString(),
      verificationCode: verifyCode,
      score: verifiedScore,
      maxScore: verifiedMax,
      rank: isWinner ? 1 : 0,
      totalParticipants: 100,
      fontFamily: 'cinzel'
    };

    return {
      score: finalScore,
      maxScore: finalMaxScore,
      totalQuestions: questions.length,
      correctAnswersCount: correctCount,
      status: 'completed',
      grading: {
        totalScore: finalScore,
        maxScore: finalMaxScore,
        correctAnswersCount: correctCount,
        totalQuestionsCount: questions.length,
        percentage,
        gradedAnswers,
        cheatLogs
      },
      certificate: cert
    };
  },

  getUserSubmissions(userId: string): any[] {
    let localSubs: any[] = [];
    try {
      localSubs = JSON.parse(localStorage.getItem('next_olymp_user_submissions') || '[]');
    } catch {}
    const merged = [...userSubmissionsCache, ...localSubs];
    const seen = new Set<string>();
    return merged.filter((s) => {
      const sUser = s.userId || s.user_id;
      const sId = s.id || `${sUser}_${s.olympiadId || s.olympiad_id}_${s.submitted_at}`;
      if (sUser !== userId) return false;
      if (seen.has(sId)) return false;
      seen.add(sId);
      return true;
    });
  },

  getUserExamResults(userId: string): any[] {
    const list = this.getUserSubmissions(userId);
    return list.map((s, idx) => {
      const totalQ = Number(s.total_questions || (s.questionsAnalysis ? s.questionsAnalysis.length : 25));
      const pct = Number(s.percentage || 0);
      const correctCount = s.correctAnswersCount !== undefined ? Number(s.correctAnswersCount) : Math.round((pct / 100) * totalQ);
      const wrongCount = s.wrongAnswersCount !== undefined ? Number(s.wrongAnswersCount) : Math.max(0, totalQ - correctCount);

      
      let questionsAnalysis = Array.isArray(s.questionsAnalysis) && s.questionsAnalysis.length > 0 ? s.questionsAnalysis : [];
      if (questionsAnalysis.length === 0 && totalQ > 0) {
        for (let i = 0; i < totalQ; i++) {
          const isCorr = i < correctCount;
          questionsAnalysis.push({
            questionNum: i + 1,
            topic: `${s.subject || 'Fan'} masalasi #${i + 1}`,
            points: 4,
            userAnswer: isCorr ? 'A' : (s.answers && s.answers[i + 1] ? s.answers[i + 1] : 'B'),
            correctAnswer: 'A',
            isCorrect: isCorr,
            aiExplanation: isCorr
              ? "To'g'ri javob tanlandi."
              : "Ushbu savolda xatolikka yo'l qo'yilgan. To'g'ri javob: A."
          });
        }
      }

      const timeSpentSec = s.timeSpentSeconds || (s.timeSpentMinutes ? s.timeSpentMinutes * 60 : 300);
      const mins = Math.floor(timeSpentSec / 60);
      const secs = timeSpentSec % 60;
      const timeSpentFormatted = s.timeSpentFormatted || (mins > 0 ? `${mins} daq ${secs > 0 ? `${secs} soniya` : ''}` : `${secs} soniya`);

      return {
        id: s.id || `res_${idx}`,
        userId: s.userId || s.user_id || userId,
        olympiadId: s.olympiadId || s.olympiad_id || 'OLY-101',
        olympiadTitle: s.olympiadTitle || 'Next Olymp Musobaqasi',
        subject: s.subject || 'Matematika',
        format: 'online' as const,
        completedAt: s.submitted_at || new Date().toISOString(),
        score: Number(s.score || 0),
        maxScore: Number(s.maxScore || (totalQ * 4)),
        percentage: pct,
        rank: 1,
        totalParticipants: 100,
        certificateType: pct >= 70 ? "G'oliblik Diplomi" : "Ishtirok Sertifikati",
        status: 'published' as const,
        timeSpentMinutes: Math.max(1, Math.round(timeSpentSec / 60)),
        timeSpentSeconds: timeSpentSec,
        timeSpentFormatted,
        totalQuestions: totalQ,
        correctAnswersCount: correctCount,
        wrongAnswersCount: wrongCount,
        questionsAnalysis
      };
    });
  },

  getOlympiadSubmissions(olympiadId: string): ParticipantAdminResult[] {
    const fromCache = olympiadSubmissionsCache.get(olympiadId);
    if (fromCache && fromCache.length > 0) return fromCache;

    let localSubs: any[] = [];
    try {
      localSubs = JSON.parse(localStorage.getItem('next_olymp_user_submissions') || '[]');
    } catch {}

    const allSubs = [...userSubmissionsCache, ...localSubs];
    const seen = new Set<string>();
    const uniqueSubs = allSubs.filter((s) => {
      if (s.olympiadId !== olympiadId && s.olympiad_id !== olympiadId) return false;
      const sUser = s.userId || s.user_id || s.id;
      if (seen.has(sUser)) return false;
      seen.add(sUser);
      return true;
    });

    const list: ParticipantAdminResult[] = uniqueSubs.map((s: any, idx: number) => {
      const score = Number(s.score || 0);
      const maxScore = Number(s.maxScore || (s.total_questions ? s.total_questions * 4 : 100));
      const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      const certType = pct >= 80 ? 'I darajali Diplom' : pct >= 65 ? 'II darajali Diplom' : pct >= 50 ? 'III darajali Diplom' : 'Sertifikat';

      return {
        id: s.userId || s.user_id || `STU-${idx + 100}`,
        name: s.userName || s.user_name || 'Ishtirokchi',
        phone: s.phone || '+998 90 123 45 67',
        region: s.region || 'Toshkent sh.',
        school: s.school || 'Prezident maktabi',
        grade: s.grade || 9,
        status: (s.status as any) || 'completed',
        correctAnswers: s.correctAnswersCount ?? Math.round((pct / 100) * (s.total_questions || 25)),
        totalQuestions: s.total_questions || 25,
        percentage: pct,
        score,
        timeSpentMinutes: s.timeSpentMinutes || 15,
        submittedAt: s.submitted_at ? new Date(s.submitted_at).toLocaleString() : new Date().toLocaleString(),
        paymentType: (s.paymentType || 'Karta') as any,
        certificateType: certType as any,
        antiCheatViolations: {
          tabSwitches: 0,
          faceAbsence: 0,
          rapidAnswers: 0,
          totalViolations: 0
        }
      };
    });

    
    let registeredUsers: any[] = [];
    try {
      const rawReg = localStorage.getItem(`next_olymp_registrations_${olympiadId}`);
      if (rawReg) registeredUsers = JSON.parse(rawReg);
    } catch {}

    
    const isDemoOlympiad = olympiadId === 'OLY-101' || olympiadId === 'OLY-102';
    if (isDemoOlympiad && list.length === 0 && registeredUsers.length === 0) {
      registeredUsers = [
        { id: 'USR-1082', fullName: 'Asilbek Olimov', phone: '+998 99 174 99 33', region: 'Toshkent shahri', school: 'Mirzo Ulug\'bek tumani 1-maktab', grade: 11 },
        { id: 'USR-1081', fullName: 'Madina Toirova', phone: '+998 91 234 56 78', region: 'Samarqand viloyati', school: 'Samarqand sh. 14-IDUM', grade: 9 },
        { id: 'USR-1080', fullName: 'Jasur Bekchanov', phone: '+998 93 456 78 90', region: 'Xorazm viloyati', school: 'Urganch sh. 2-maktab', grade: 10 },
        { id: 'USR-1079', fullName: 'Nigora Aliyeva', phone: '+998 90 876 54 32', region: 'Farg\'ona viloyati', school: 'Qo\'qon sh. 5-maktab', grade: 8 }
      ];
    }

    const combined: ParticipantAdminResult[] = [...list];
    const submittedUserIds = new Set(list.map((s) => s.id));

    registeredUsers.forEach((u: any, idx: number) => {
      const uId = u.id || `USR-${1080 - idx}`;
      if (!submittedUserIds.has(uId)) {
        combined.push({
          id: uId,
          name: u.fullName || u.name || 'Ro\'yxatdan o\'tgan o\'quvchi',
          phone: u.phone || '+998 99 174 99 33',
          region: u.region || 'Toshkent shahri',
          school: u.school || 'Maktab',
          grade: u.grade || 11,
          status: 'registered',
          correctAnswers: 0,
          totalQuestions: 25,
          percentage: 0,
          score: 0,
          timeSpentMinutes: 0,
          registeredAt: u.createdAt || new Date().toISOString().slice(0, 10),
          paymentType: 'Karta',
          certificateType: 'Sertifikat',
          antiCheatViolations: { tabSwitches: 0, faceAbsence: 0, rapidAnswers: 0, totalViolations: 0 }
        });
      }
    });

    combined.sort((a, b) => (b.score || 0) - (a.score || 0));
    if (combined.length > 0) {
      olympiadSubmissionsCache.set(olympiadId, combined);
    }

    return combined;
  },

  deleteOlympiadData(olympiadId: string): void {
    
    olympiadSubmissionsCache.delete(olympiadId);

    
    for (let i = userSubmissionsCache.length - 1; i >= 0; i--) {
      const s = userSubmissionsCache[i];
      if (s && (s.olympiadId === olympiadId || s.olympiad_id === olympiadId)) {
        userSubmissionsCache.splice(i, 1);
      }
    }

    
    try {
      const raw = localStorage.getItem('next_olymp_user_submissions');
      if (raw) {
        const subs = JSON.parse(raw);
        if (Array.isArray(subs)) {
          const filtered = subs.filter((s: any) => s.olympiadId !== olympiadId && s.olympiad_id !== olympiadId);
          localStorage.setItem('next_olymp_user_submissions', JSON.stringify(filtered));
        }
      }
    } catch {}

    
    try {
      const allLogs = loadCheatLogsFromStorage();
      if (allLogs[olympiadId]) {
        delete allLogs[olympiadId];
        saveCheatLogsToStorage(allLogs);
      }
    } catch {}

    
    try {
      localStorage.removeItem(`next_olymp_registrations_${olympiadId}`);
    } catch {}
  },

  saveLiveCheatLog(olympiadId: string, log: any): void {
    const all = loadCheatLogsFromStorage();
    const list = all[olympiadId] || [];
    
    
    const existingIdx = list.findIndex((item) => item.id === log.id);
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...log };
    } else {
      list.unshift(log);
    }
    all[olympiadId] = list;
    saveCheatLogsToStorage(all);

    
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('next_olymp_cheat_log_updated', {
            detail: { olympiadId, log }
          })
        );
      } catch {}
    }

    
    apiClient.post(`/exams/${encodeURIComponent(olympiadId)}/proctor-event`, {
      examId: olympiadId,
      userId: log.studentId || log.userId,
      eventType: log.type || 'TAB_SWITCH',
      details: log.detail || log.message || '',
      severity: log.severity || 'medium'
    }).catch(() => {});
  },

  getOlympiadCheatLogs(olympiadId?: string): any[] {
    const all = loadCheatLogsFromStorage();
    if (olympiadId) {
      if (!all[olympiadId] || all[olympiadId].length === 0) {
        const seeded = getInitialSeededCheatLogs();
        all[olympiadId] = seeded[olympiadId] || seeded['olymp-001'] || [];
        saveCheatLogsToStorage(all);
      }
      return all[olympiadId] || [];
    }
    const combined: any[] = [];
    Object.values(all).forEach((logs) => {
      if (Array.isArray(logs)) combined.push(...logs);
    });
    return combined;
  },

  updateCheatLogStatus(olympiadId: string, logId: string, newStatus: 'pending' | 'warned' | 'penalized' | 'disqualified' | 'dismissed'): void {
    const all = loadCheatLogsFromStorage();
    const list = all[olympiadId] || [];
    const target = list.find((item) => item.id === logId);
    if (target) {
      target.status = newStatus;
      all[olympiadId] = list;
      saveCheatLogsToStorage(all);

      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(
            new CustomEvent('next_olymp_cheat_log_updated', {
              detail: { olympiadId, logId, newStatus }
            })
          );
        } catch {}
      }
    }
  },

  getOlympiadAllParticipants(olympiadId: string): ParticipantAdminResult[] {
    const olympiad = useOlympiadStore.getState().olympiads.find((o) => o.id === olympiadId);
    const existingSubs = this.getOlympiadSubmissions(olympiadId);
    const userStoreUsers = useUserStore.getState().users || [];
    const minScore = olympiad?.certificateConfig?.minScoreLimit || 60;

    
    const subsMap = new Map<string, ParticipantAdminResult>();
    existingSubs.forEach((s) => {
      subsMap.set(s.id, s);
    });

    const participants: ParticipantAdminResult[] = [];

    
    existingSubs.forEach((sub, idx) => {
      const isDisqualified = this.isParticipantDisqualified(sub.id, olympiadId);
      participants.push({
        ...sub,
        status: isDisqualified ? 'disqualified' : 'completed',
        rank: idx + 1,
        isPassed: (sub.percentage || 0) >= minScore || (sub.score || 0) >= minScore,
        registeredAt: sub.submittedAt || '2026-09-20 09:30',
        paymentStatus: 'paid'
      } as any);
    });

    
    userStoreUsers.forEach((u: any, i: number) => {
      if (subsMap.has(u.id)) {
        
      }
    });

    
    const completedList = participants
      .filter((p) => p.status === 'completed')
      .sort((a, b) => ((b.score || 0) - (a.score || 0)) || ((a.timeSpentMinutes || 0) - (b.timeSpentMinutes || 0)));

    completedList.forEach((p, idx) => {
      p.rank = idx + 1;
      p.isPassed = (p.percentage || 0) >= minScore || (p.score || 0) >= minScore;
    });

    return participants;
  },

  disqualifiedMap: new Map<string, boolean>(),

  disqualifyParticipant(userId: string, olympiadId: string, _reason?: string): void {
    const key = `${userId}_${olympiadId}`;
    this.disqualifiedMap.set(key, true);
  },

  unDisqualifyParticipant(userId: string, olympiadId: string): void {
    const key = `${userId}_${olympiadId}`;
    this.disqualifiedMap.delete(key);
  },

  isParticipantDisqualified(userId: string, olympiadId: string): boolean {
    const key = `${userId}_${olympiadId}`;
    return this.disqualifiedMap.get(key) === true;
  }
};
